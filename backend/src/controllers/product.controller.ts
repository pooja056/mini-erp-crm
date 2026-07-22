import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  currentStock: z.number().int().min(0, 'Current stock must be non-negative').default(0),
  minStockAlert: z.number().int().min(0, 'Min stock alert must be non-negative').default(5),
  location: z.string().min(1, 'Warehouse/location is required'),
});

export const stockAdjustSchema = z.object({
  qtyChanged: z.number().int().positive('Quantity must be greater than zero'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(1, 'Reason for stock movement is required'),
});

// GET /api/products
export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where: whereClause }),
    ]);

    // Compute low stock status
    const formattedProducts = products.map((p) => ({
      ...p,
      isLowStock: p.currentStock <= p.minStockAlert,
    }));

    const finalProducts = lowStockOnly
      ? formattedProducts.filter((p) => p.isLowStock)
      : formattedProducts;

    return res.json({
      products: finalProducts,
      pagination: {
        page,
        limit,
        total: lowStockOnly ? finalProducts.length : total,
        totalPages: Math.ceil((lowStockOnly ? finalProducts.length : total) / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
};

// GET /api/products/:id
export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdBy: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      product: {
        ...product,
        isLowStock: product.currentStock <= product.minStockAlert,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch product details' });
  }
};

// POST /api/products
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    const existingSku = await prisma.product.findUnique({
      where: { sku: body.sku.toUpperCase() },
    });

    if (existingSku) {
      return res.status(400).json({ error: `Product with SKU '${body.sku.toUpperCase()}' already exists` });
    }

    const newProduct = await prisma.product.create({
      data: {
        name: body.name,
        sku: body.sku.toUpperCase(),
        category: body.category,
        unitPrice: body.unitPrice,
        currentStock: body.currentStock || 0,
        minStockAlert: body.minStockAlert || 5,
        location: body.location,
      },
    });

    // Log initial stock if stock > 0
    if (newProduct.currentStock > 0 && req.user) {
      await prisma.stockLog.create({
        data: {
          productId: newProduct.id,
          qtyChanged: newProduct.currentStock,
          movementType: 'IN',
          reason: 'Initial stock setup',
          createdById: req.user.id,
        },
      });
    }

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create product' });
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // If SKU changed, check uniqueness
    if (body.sku.toUpperCase() !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({
        where: { sku: body.sku.toUpperCase() },
      });
      if (duplicateSku) {
        return res.status(400).json({ error: `Product with SKU '${body.sku.toUpperCase()}' already exists` });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        sku: body.sku.toUpperCase(),
        category: body.category,
        unitPrice: body.unitPrice,
        minStockAlert: body.minStockAlert,
        location: body.location,
      },
    });

    return res.json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update product' });
  }
};

// POST /api/products/:id/adjust-stock
export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { qtyChanged, movementType, reason } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let newStock = product.currentStock;
    if (movementType === 'IN') {
      newStock += qtyChanged;
    } else {
      if (product.currentStock < qtyChanged) {
        return res.status(400).json({
          error: `Insufficient stock. Current stock is ${product.currentStock}, cannot reduce by ${qtyChanged}.`,
        });
      }
      newStock -= qtyChanged;
    }

    const [updatedProduct, log] = await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { currentStock: newStock },
      }),
      prisma.stockLog.create({
        data: {
          productId: id,
          qtyChanged,
          movementType,
          reason,
          createdById: req.user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
        },
      }),
    ]);

    return res.json({
      message: `Stock successfully adjusted (${movementType} ${qtyChanged})`,
      product: updatedProduct,
      log,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to adjust stock' });
  }
};
