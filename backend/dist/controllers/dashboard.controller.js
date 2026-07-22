"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = void 0;
const prisma_1 = require("../prisma");
const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        const [totalCustomers, totalProducts, lowStockProducts, confirmedChallansTotal] = await Promise.all([
            prisma_1.prisma.customer.count(),
            prisma_1.prisma.product.count(),
            prisma_1.prisma.product.findMany({
                where: {
                    currentStock: {
                        lt: prisma_1.prisma.product.fields.minStockAlert
                    }
                },
                take: 5
            }),
            prisma_1.prisma.challan.aggregate({
                where: {
                    status: 'CONFIRMED'
                },
                _sum: {
                    totalAmount: true
                }
            })
        ]);
        const recentChallans = await prisma_1.prisma.challan.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { name: true } }
            }
        });
        const revenueByMonth = await prisma_1.prisma.$queryRaw `
      SELECT 
        strftime('%Y-%m', createdAt) as month,
        SUM(totalAmount) as amount
      FROM Challan
      WHERE status = 'CONFIRMED'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `;
        // Timeline data (Recent Stock Logs)
        const recentStockLogs = await prisma_1.prisma.stockLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                product: { select: { name: true } },
                createdBy: { select: { name: true } }
            }
        });
        // Format revenue chart data
        const revenueData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayTotal = recentChallans
                .filter(c => c.createdAt.toISOString().split('T')[0] === dateStr && c.status === 'CONFIRMED')
                .reduce((sum, c) => sum + c.totalAmount, 0);
            revenueData.push({
                name: dateStr,
                revenue: dayTotal
            });
        }
        const kpis = {
            totalCustomers,
            totalRevenue: confirmedChallansTotal._sum.totalAmount || 0,
            totalProducts,
            lowStockCount: await prisma_1.prisma.product.count({
                where: { currentStock: { lt: prisma_1.prisma.product.fields.minStockAlert } }
            })
        };
        res.json({
            kpis,
            revenueData,
            lowStockProducts,
            recentActivity: recentStockLogs.map((log) => ({
                id: log.id,
                action: log.movementType === 'IN' ? 'Stock Added' : 'Stock Removed',
                description: `${log.qtyChanged} units of ${log.product?.name} (${log.reason})`,
                timestamp: log.createdAt,
                user: log.createdBy?.name || 'System'
            })),
            revenueByMonth: revenueByMonth
        });
    }
    catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
