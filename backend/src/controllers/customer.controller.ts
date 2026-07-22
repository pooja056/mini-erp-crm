import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma';
import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(1, 'Mobile number is required'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(1, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  type: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
  address: z.string().min(1, 'Address is required'),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const followUpNoteSchema = z.object({
  note: z.string().min(1, 'Note content is required'),
});

// GET /api/customers
export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const type = (req.query.type as string) || '';
    const status = (req.query.status as string) || '';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { businessName: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
      ];
    }

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { challans: true, followUps: true },
          },
        },
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    return res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
};

// GET /api/customers/:id
export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json({ customer });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch customer details' });
  }
};

// POST /api/customers
export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body;

    const newCustomer = await prisma.customer.create({
      data: {
        name: body.name,
        mobile: body.mobile,
        email: body.email,
        businessName: body.businessName,
        gstNumber: body.gstNumber || null,
        type: body.type,
        address: body.address,
        status: body.status,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        notes: body.notes || null,
      },
    });

    // If initial notes were provided, add to FollowUpNote model as well
    if (body.notes && req.user) {
      await prisma.followUpNote.create({
        data: {
          customerId: newCustomer.id,
          note: `Initial Note: ${body.notes}`,
          createdById: req.user.id,
        },
      });
    }

    return res.status(201).json({
      message: 'Customer created successfully',
      customer: newCustomer,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
};

// PUT /api/customers/:id
export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        mobile: body.mobile,
        email: body.email,
        businessName: body.businessName,
        gstNumber: body.gstNumber || null,
        type: body.type,
        address: body.address,
        status: body.status,
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        notes: body.notes || null,
      },
    });

    return res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update customer' });
  }
};

// POST /api/customers/:id/notes
export const addFollowUpNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const newNote = await prisma.followUpNote.create({
      data: {
        customerId: id,
        note,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return res.status(201).json({
      message: 'Follow-up note added successfully',
      note: newNote,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to add follow-up note' });
  }
};
