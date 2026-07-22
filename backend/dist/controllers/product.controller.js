"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustStock = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = exports.stockAdjustSchema = exports.productSchema = void 0;
const prisma_1 = require("../prisma");
const zod_1 = require("zod");
exports.productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Product name is required'),
    sku: zod_1.z.string().min(1, 'SKU is required'),
    category: zod_1.z.string().min(1, 'Category is required'),
    unitPrice: zod_1.z.number().min(0, 'Unit price must be non-negative'),
    currentStock: zod_1.z.number().int().min(0, 'Current stock must be non-negative').default(0),
    minStockAlert: zod_1.z.number().int().min(0, 'Min stock alert must be non-negative').default(5),
    location: zod_1.z.string().min(1, 'Warehouse/location is required'),
});
exports.stockAdjustSchema = zod_1.z.object({
    qtyChanged: zod_1.z.number().int().positive('Quantity must be greater than zero'),
    movementType: zod_1.z.enum(['IN', 'OUT']),
    reason: zod_1.z.string().min(1, 'Reason for stock movement is required'),
});
// GET /api/products
const getProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const search = req.query.search || '';
        const category = req.query.category || '';
        const lowStockOnly = req.query.lowStock === 'true';
        const skip = (page - 1) * limit;
        const whereClause = {};
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
            prisma_1.prisma.product.findMany({
                where: whereClause,
                orderBy: { name: 'asc' },
                skip,
                take: limit,
            }),
            prisma_1.prisma.product.count({ where: whereClause }),
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch products' });
    }
};
exports.getProducts = getProducts;
// GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma_1.prisma.product.findUnique({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch product details' });
    }
};
exports.getProductById = getProductById;
// POST /api/products
const createProduct = async (req, res) => {
    try {
        const body = req.body;
        const existingSku = await prisma_1.prisma.product.findUnique({
            where: { sku: body.sku.toUpperCase() },
        });
        if (existingSku) {
            return res.status(400).json({ error: `Product with SKU '${body.sku.toUpperCase()}' already exists` });
        }
        const newProduct = await prisma_1.prisma.product.create({
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
            await prisma_1.prisma.stockLog.create({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to create product' });
    }
};
exports.createProduct = createProduct;
// PUT /api/products/:id
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const existing = await prisma_1.prisma.product.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // If SKU changed, check uniqueness
        if (body.sku.toUpperCase() !== existing.sku) {
            const duplicateSku = await prisma_1.prisma.product.findUnique({
                where: { sku: body.sku.toUpperCase() },
            });
            if (duplicateSku) {
                return res.status(400).json({ error: `Product with SKU '${body.sku.toUpperCase()}' already exists` });
            }
        }
        const updatedProduct = await prisma_1.prisma.product.update({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to update product' });
    }
};
exports.updateProduct = updateProduct;
// POST /api/products/:id/adjust-stock
const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { qtyChanged, movementType, reason } = req.body;
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const product = await prisma_1.prisma.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        let newStock = product.currentStock;
        if (movementType === 'IN') {
            newStock += qtyChanged;
        }
        else {
            if (product.currentStock < qtyChanged) {
                return res.status(400).json({
                    error: `Insufficient stock. Current stock is ${product.currentStock}, cannot reduce by ${qtyChanged}.`,
                });
            }
            newStock -= qtyChanged;
        }
        const [updatedProduct, log] = await prisma_1.prisma.$transaction([
            prisma_1.prisma.product.update({
                where: { id },
                data: { currentStock: newStock },
            }),
            prisma_1.prisma.stockLog.create({
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
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to adjust stock' });
    }
};
exports.adjustStock = adjustStock;
