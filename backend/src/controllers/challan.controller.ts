import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const challanItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

export const createChallanSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required'),
  status: z.enum(['DRAFT', 'CONFIRMED']).default('DRAFT'),
});

export const updateChallanStatusSchema = z.object({
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
});

// Helper to generate unique challan number CH-YYYYMMDD-XXXX
async function generateChallanNumber(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `CH-${dateStr}`;

  const countToday = await prisma.challan.count({
    where: {
      challanNumber: {
        startsWith: prefix,
      },
    },
  });

  const seq = (countToday + 1).toString().padStart(4, '0');
  return `${prefix}-${seq}`;
}

// GET /api/challans
export const getChallans = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const customerId = (req.query.customerId as string) || '';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: { id: true, name: true, businessName: true, mobile: true, email: true },
          },
          createdBy: {
            select: { id: true, name: true, role: true },
          },
          items: true,
        },
      }),
      prisma.challan.count({ where: whereClause }),
    ]);

    // Parse customerSnap for convenience if string
    const formatted = challans.map((c) => ({
      ...c,
      customerSnap: typeof c.customerSnap === 'string' ? JSON.parse(c.customerSnap) : c.customerSnap,
    }));

    return res.json({
      challans: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch challans' });
  }
};

// GET /api/challans/:id
export const getChallanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true } },
        items: true,
      },
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    return res.json({
      challan: {
        ...challan,
        customerSnap: typeof challan.customerSnap === 'string' ? JSON.parse(challan.customerSnap) : challan.customerSnap,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch challan details' });
  }
};

// POST /api/challans
export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId, items, status } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 1. Fetch customer details for snapshot
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerSnap = JSON.stringify({
      id: customer.id,
      name: customer.name,
      businessName: customer.businessName,
      email: customer.email,
      mobile: customer.mobile,
      gstNumber: customer.gstNumber,
      address: customer.address,
      type: customer.type,
    });

    // 2. Fetch products & create line items with snapshot data
    const productIds = items.map((i: any) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalQty = 0;
    let totalAmount = 0;
    const challanItemsData: any[] = [];
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product with ID '${item.productId}' not found` });
      }

      // Check stock if status is CONFIRMED
      if (status === 'CONFIRMED') {
        if (product.currentStock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for '${product.name}' (SKU: ${product.sku}). Required: ${item.quantity}, Available: ${product.currentStock}`
          );
        }
      }

      const subtotal = product.unitPrice * item.quantity;
      totalQty += item.quantity;
      totalAmount += subtotal;

      challanItemsData.push({
        productId: product.id,
        productName: product.name, // Snapshot
        productSku: product.sku,   // Snapshot
        unitPrice: product.unitPrice, // Snapshot
        quantity: item.quantity,
        subtotal,
      });
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({
        error: 'Stock Validation Failed',
        details: stockErrors,
      });
    }

    const challanNumber = await generateChallanNumber();

    // 3. Database transaction: Create Challan + Items & update stock if CONFIRMED
    const result = await prisma.$transaction(async (tx) => {
      const createdChallan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          customerSnap,
          totalQty,
          totalAmount,
          status,
          createdById: req.user!.id,
          items: {
            create: challanItemsData,
          },
        },
        include: {
          items: true,
          customer: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      // If status is CONFIRMED, adjust stock for each product & log IN transaction
      if (status === 'CONFIRMED') {
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: {
                decrement: item.quantity,
              },
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              qtyChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan #${createdChallan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }
      }

      return createdChallan;
    });

    return res.status(201).json({
      message: `Challan ${challanNumber} created successfully in ${status} status.`,
      challan: {
        ...result,
        customerSnap: JSON.parse(result.customerSnap),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create sales challan' });
  }
};

// PATCH /api/challans/:id/status
export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ error: 'Challan not found' });
    }

    if (challan.status === status) {
      return res.status(400).json({ error: `Challan is already in '${status}' status.` });
    }

    // Business Logic: If moving from DRAFT to CONFIRMED
    if (challan.status === 'DRAFT' && status === 'CONFIRMED') {
      // 1. Fetch current products stock
      const productIds = challan.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((p) => [p.id, p]));

      const stockErrors: string[] = [];
      for (const item of challan.items) {
        const p = productMap.get(item.productId);
        if (!p) {
          stockErrors.push(`Product '${item.productName}' no longer exists in catalog.`);
        } else if (p.currentStock < item.quantity) {
          stockErrors.push(
            `Insufficient stock for '${p.name}'. Required: ${item.quantity}, Available: ${p.currentStock}`
          );
        }
      }

      if (stockErrors.length > 0) {
        return res.status(400).json({
          error: 'Stock Validation Failed',
          details: stockErrors,
        });
      }

      // Execute stock deduction transaction
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { decrement: item.quantity },
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              qtyChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan Confirmation #${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }

        return tx.challan.update({
          where: { id },
          data: { status: 'CONFIRMED' },
          include: { items: true, customer: true },
        });
      });

      return res.json({
        message: `Challan #${challan.challanNumber} confirmed and inventory stock updated.`,
        challan: {
          ...updated,
          customerSnap: typeof updated.customerSnap === 'string' ? JSON.parse(updated.customerSnap) : updated.customerSnap,
        },
      });
    }

    // If cancelling a CONFIRMED challan, restore stock
    if (challan.status === 'CONFIRMED' && status === 'CANCELLED') {
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { increment: item.quantity },
            },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              qtyChanged: item.quantity,
              movementType: 'IN',
              reason: `Challan Cancellation Reversal #${challan.challanNumber}`,
              createdById: req.user!.id,
            },
          });
        }

        return tx.challan.update({
          where: { id },
          data: { status: 'CANCELLED' },
          include: { items: true, customer: true },
        });
      });

      return res.json({
        message: `Challan #${challan.challanNumber} cancelled and stock restored to inventory.`,
        challan: {
          ...updated,
          customerSnap: typeof updated.customerSnap === 'string' ? JSON.parse(updated.customerSnap) : updated.customerSnap,
        },
      });
    }

    // Default status update (e.g., DRAFT to CANCELLED)
    const updated = await prisma.challan.update({
      where: { id },
      data: { status },
      include: { items: true, customer: true },
    });

    return res.json({
      message: `Challan status updated to ${status}`,
      challan: {
        ...updated,
        customerSnap: typeof updated.customerSnap === 'string' ? JSON.parse(updated.customerSnap) : updated.customerSnap,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update challan status' });
  }
};
