import { Router } from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController';
import { requireAuth, requireAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Rotas públicas (ou protegidas dependendo da regra de negócio)
router.get('/', getProducts);

// Rotas protegidas (Apenas administradores podem gerenciar produtos)
router.post('/', requireAuth, requireAdmin, createProduct);
router.put('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
