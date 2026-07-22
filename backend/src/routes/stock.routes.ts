import { Router } from 'express';
import { getStockLogs } from '../controllers/stock.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateJWT);
router.get('/', requireRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), getStockLogs);

export default router;
