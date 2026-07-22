"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStockLogs = void 0;
const prisma_1 = require("../prisma");
const getStockLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const movementType = req.query.movementType || '';
        const productId = req.query.productId || '';
        const skip = (page - 1) * limit;
        const whereClause = {};
        if (movementType) {
            whereClause.movementType = movementType;
        }
        if (productId) {
            whereClause.productId = productId;
        }
        const [logs, total] = await Promise.all([
            prisma_1.prisma.stockLog.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    product: {
                        select: { id: true, name: true, sku: true, location: true },
                    },
                    createdBy: {
                        select: { id: true, name: true, role: true },
                    },
                },
            }),
            prisma_1.prisma.stockLog.count({ where: whereClause }),
        ]);
        return res.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message || 'Failed to fetch stock movement logs' });
    }
};
exports.getStockLogs = getStockLogs;
