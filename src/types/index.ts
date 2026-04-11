export interface User {
  uid: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isSupport?: boolean;
  avatar?: string;
  createdAt?: number;
}

export interface Product {
  id?: string;
  name: string;
  price: string;
  shipping: string;
  unit: string;
  tag?: string;
  tagColor?: string;
  image: string;
  createdAt?: number;
}

export interface Order {
  id?: string;
  userId: string;
  items: Array<{
    productId: string;
    name: string;
    price: string;
    qty: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: number;
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'cart' | 'order' | 'promo' | 'system';
  read: boolean;
  createdAt: number;
}
