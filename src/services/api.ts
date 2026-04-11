import { auth, db } from '../firebase';
import { collection, collectionGroup, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

const API_URL = '/api';

const getHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

export const api = {
  get: async (endpoint: string) => {
    // Intercepta rotas de produtos para usar o SDK do Cliente (Serverless)
    if (endpoint.startsWith('/products')) {
      try {
        const url = new URL(endpoint, window.location.origin);
        const tenantId = url.searchParams.get('tenantId');
        
        let q;
        if (tenantId) {
          q = query(collection(db, 'users', tenantId, 'products'), orderBy('createdAt', 'desc'));
        } else {
          q = query(collectionGroup(db, 'products'), orderBy('createdAt', 'desc'));
        }
        
        const snapshot = await getDocs(q);
        const products = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...(docSnap.data() as Record<string, any>) }));
        return { success: true, data: products };
      } catch (error: any) {
        throw new Error(error.message || 'Erro ao buscar produtos no Firestore');
      }
    }

    // Fallback para o backend Node.js
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: await getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }
    return response.json();
  },
  
  post: async (endpoint: string, data: any) => {
    if (endpoint === '/products') {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Não autorizado. Faça login para criar produtos.');
        
        const productData = {
          ...data,
          createdAt: Date.now(),
          createdBy: user.uid
        };
        
        const docRef = await addDoc(collection(db, 'users', user.uid, 'products'), productData);
        return { success: true, data: { id: docRef.id, ...productData } };
      } catch (error: any) {
        throw new Error(error.message || 'Erro ao criar produto no Firestore');
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    if (endpoint.startsWith('/products/')) {
      try {
        const id = endpoint.split('/')[2];
        const user = auth.currentUser;
        if (!user) throw new Error('Não autorizado. Faça login para editar produtos.');
        
        const docRef = doc(db, 'users', user.uid, 'products', id);
        await updateDoc(docRef, data);
        return { success: true, data: { id, ...data } };
      } catch (error: any) {
        throw new Error(error.message || 'Erro ao atualizar produto no Firestore');
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    if (endpoint.startsWith('/products/')) {
      try {
        const id = endpoint.split('/')[2];
        const user = auth.currentUser;
        if (!user) throw new Error('Não autorizado. Faça login para deletar produtos.');
        
        const docRef = doc(db, 'users', user.uid, 'products', id);
        await deleteDoc(docRef);
        return { success: true, message: 'Produto deletado com sucesso' };
      } catch (error: any) {
        throw new Error(error.message || 'Erro ao deletar produto no Firestore');
      }
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro na requisição');
    }
    return response.json();
  }
};
