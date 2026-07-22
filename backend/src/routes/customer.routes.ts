import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  addFollowUpNote,
  customerSchema,
  followUpNoteSchema,
} from '../controllers/customer.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomers);
router.get('/:id', requireRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), getCustomerById);
router.post('/', requireRoles('ADMIN', 'SALES'), validateRequest(customerSchema), createCustomer);
router.put('/:id', requireRoles('ADMIN', 'SALES'), validateRequest(customerSchema), updateCustomer);
router.post('/:id/notes', requireRoles('ADMIN', 'SALES', 'ACCOUNTS'), validateRequest(followUpNoteSchema), addFollowUpNote);

export default router;
