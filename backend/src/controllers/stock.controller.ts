import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../prisma';

export const getStockLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const movementType = (req.query.movementType as string) || '';
    const productId = (req.query.productId as string) || '';

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (movementType) {
      whereClause.movementType = movementType;
    }

    if (productId) {
      whereClause.productId = productId;
    }

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
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
      prisma.stockLog.count({ where: whereClause }),
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
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch stock movement logs' });
  }
};
