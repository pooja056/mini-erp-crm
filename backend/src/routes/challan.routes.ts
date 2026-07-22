import { Router } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  updateChallanStatus,
  createChallanSchema,
  updateChallanStatusSchema,
} from '../controllers/challan.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallans);
router.get('/:id', requireRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getChallanById);
router.post('/', requireRoles('ADMIN', 'SALES'), validateRequest(createChallanSchema), createChallan);
router.patch('/:id/status', requireRoles('ADMIN', 'SALES', 'WAREHOUSE'), validateRequest(updateChallanStatusSchema), updateChallanStatus);

export default router;
