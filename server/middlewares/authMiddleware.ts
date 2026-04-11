import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Acesso negado: Token ausente ou inválido', { path: req.path });
    return res.status(401).json({ success: false, error: 'Não autorizado. Token ausente.' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.error('Erro ao verificar token JWT', error);
    return res.status(401).json({ success: false, error: 'Não autorizado. Token inválido ou expirado.' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Não autorizado.' });
  }

  // Aqui você pode verificar se o usuário é admin buscando no Firestore
  // ou usando Custom Claims do Firebase Auth
  // Para simplificar, vamos assumir que o admin tem uma claim 'admin' ou o email específico
  if (req.user.email === 'marcossilva192024@gmail.com' || req.user.admin) {
    next();
  } else {
    logger.warn('Acesso negado: Usuário não é admin', { uid: req.user.uid });
    return res.status(403).json({ success: false, error: 'Acesso negado. Requer privilégios de administrador.' });
  }
};
