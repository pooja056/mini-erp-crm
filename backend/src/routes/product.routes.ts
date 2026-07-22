import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  adjustStock,
  productSchema,
  stockAdjustSchema,
} from '../controllers/product.controller';
import { authenticateJWT, requireRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';

const router = Router();

router.use(authenticateJWT);

router.get('/', requireRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProducts);
router.get('/:id', requireRoles('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'), getProductById);
router.post('/', requireRoles('ADMIN', 'WAREHOUSE'), validateRequest(productSchema), createProduct);
router.put('/:id', requireRoles('ADMIN', 'WAREHOUSE'), validateRequest(productSchema), updateProduct);
router.post('/:id/adjust-stock', requireRoles('ADMIN', 'WAREHOUSE'), validateRequest(stockAdjustSchema), adjustStock);

export default router;
