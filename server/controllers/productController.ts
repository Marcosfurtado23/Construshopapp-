import { Request, Response } from 'express';
import { adminDb } from '../services/firebaseAdmin';
import { productSchema } from '../validators/productValidator';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string;
    
    let snapshot;
    if (tenantId) {
      // Fetch products for a specific tenant
      snapshot = await adminDb.collection('users').doc(tenantId).collection('products').orderBy('createdAt', 'desc').get();
    } else {
      // Fetch all products across all tenants (Marketplace view)
      snapshot = await adminDb.collectionGroup('products').orderBy('createdAt', 'desc').get();
    }

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: products });
  } catch (error) {
    logger.error('Erro ao buscar produtos', error);
    res.status(500).json({ success: false, error: 'Erro interno ao buscar produtos' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const parsedData = productSchema.parse(req.body);
    const productData = {
      ...parsedData,
      createdAt: Date.now(),
      createdBy: userId
    };

    const newDocRef = adminDb.collection('users').doc(userId).collection('products').doc();
    await newDocRef.set(productData);

    logger.info('Produto criado com sucesso', { id: newDocRef.id, uid: userId });
    res.status(201).json({ success: true, data: { id: newDocRef.id, ...productData } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Erro ao criar produto', error);
    res.status(500).json({ success: false, error: 'Erro interno ao criar produto' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const parsedData = productSchema.parse(req.body);
    const productRef = adminDb.collection('users').doc(userId).collection('products').doc(id);
    const doc = await productRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }

    await productRef.update(parsedData);
    logger.info('Produto atualizado com sucesso', { id, uid: userId });
    res.json({ success: true, data: { id, ...parsedData } });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: error.errors });
    }
    logger.error('Erro ao atualizar produto', error);
    res.status(500).json({ success: false, error: 'Erro interno ao atualizar produto' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    const productRef = adminDb.collection('users').doc(userId).collection('products').doc(id);
    const doc = await productRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    }

    await productRef.delete();
    logger.info('Produto deletado com sucesso', { id, uid: userId });
    res.json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar produto', error);
    res.status(500).json({ success: false, error: 'Erro interno ao deletar produto' });
  }
};
