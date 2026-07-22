"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFollowUpNote = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getCustomers = exports.followUpNoteSchema = exports.customerSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.customerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Customer name is required'),
    mobile: zod_1.z.string().min(1, 'Mobile number is required'),
    email: zod_1.z.string().email('Invalid email address'),
    businessName: zod_1.z.string().min(1, 'Business name is required'),
    gstNumber: zod_1.z.string().optional().nullable(),
    type: zod_1.z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).default('RETAIL'),
    address: zod_1.z.string().min(1, 'Address is required'),
    status: zod_1.z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
    followUpDate: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
});
exports.followUpNoteSchema = zod_1.z.object({
    note: zod_1.z.string().min(1, 'Note content is required'),
});
// GET /api/customers
const getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const type = req.query.type || '';
        const status = req.query.status || '';
        const skip = (page - 1) * limit;
        const whereClause = {};
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
            prisma_1.prisma.customer.findMany({
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
            prisma_1.prisma.customer.count({ where: whereClause }),
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch customers' });
    }
};
exports.getCustomers = getCustomers;
// GET /api/customers/:id
const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;
        const customer = await prisma_1.prisma.customer.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch customer details' });
    }
};
exports.getCustomerById = getCustomerById;
// POST /api/customers
const createCustomer = async (req, res) => {
    try {
        const body = req.body;
        const newCustomer = await prisma_1.prisma.customer.create({
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
            await prisma_1.prisma.followUpNote.create({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create customer' });
    }
};
exports.createCustomer = createCustomer;
// PUT /api/customers/:id
const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const existing = await prisma_1.prisma.customer.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const updatedCustomer = await prisma_1.prisma.customer.update({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to update customer' });
    }
};
exports.updateCustomer = updateCustomer;
// POST /api/customers/:id/notes
const addFollowUpNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const customer = await prisma_1.prisma.customer.findUnique({ where: { id } });
        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const newNote = await prisma_1.prisma.followUpNote.create({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to add follow-up note' });
    }
};
exports.addFollowUpNote = addFollowUpNote;
