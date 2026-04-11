import admin from 'firebase-admin';
import { logger } from '../utils/logger';

// Em produção real, você usaria variáveis de ambiente para a Service Account Key
// process.env.FIREBASE_SERVICE_ACCOUNT_KEY
// Como estamos em um ambiente de demonstração, vamos inicializar o admin SDK.
// Se a chave não estiver presente, ele tentará usar as credenciais padrão (ADC).
// Para o backend funcionar corretamente com o Firebase, você DEVE fornecer a chave.

let app: admin.app.App | undefined;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      logger.info('Firebase Admin inicializado com Service Account Key.');
    } else {
      logger.warn('FIREBASE_SERVICE_ACCOUNT_KEY não encontrada. Inicializando com credenciais padrão. Isso pode falhar se não houver ADC configurado.');
      app = admin.initializeApp();
    }
  } else {
    app = admin.apps[0]!;
  }
} catch (error) {
  logger.error('Erro ao inicializar Firebase Admin', error);
}

// Exporta instâncias apenas se a inicialização foi bem-sucedida, 
// caso contrário exporta objetos vazios/proxies para evitar crash na inicialização do servidor.
// As rotas que dependem disso falharão em tempo de execução, mas o servidor iniciará.
export const adminDb = app ? admin.firestore() : {} as FirebaseFirestore.Firestore;
export const adminAuth = app ? admin.auth() : {} as admin.auth.Auth;
