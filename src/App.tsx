import React, { useState, useEffect, Component, ReactNode, ErrorInfo } from 'react';
import { 
  Bell, 
  Search, 
  SlidersHorizontal, 
  Droplet, 
  Zap, 
  Layers, 
  Wrench, 
  Package, 
  PaintBucket, 
  Hammer, 
  Tent,
  ShoppingCart,
  Home,
  MessageCircle,
  User,
  Moon,
  Sun,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  FileText,
  X,
  Check,
  Upload,
  LogOut,
  LogIn,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  CloudFog,
  CloudDrizzle,
  MapPin,
  RefreshCw,
  Tag,
  Mail,
  Phone,
  Download
} from 'lucide-react';
import { auth, db } from './firebase';
import { LoadingScreen } from './components/LoadingScreen';
import { TractorButton } from './components/TractorButton';
import { ChatView } from './components/ChatView';
import { 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  getDoc,
  where,
  writeBatch
} from 'firebase/firestore';

import { api } from './services/api';
import { OperationType, handleFirestoreError } from './utils/errorHandling';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-gray-600 mb-6">
              Encontramos um erro inesperado. Por favor, tente recarregar a página ou contate o suporte se o problema persistir.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors w-full"
            >
              Recarregar Página
            </button>
            {this.state.error && (
              <div className="mt-6 text-left">
                <p className="text-xs text-gray-400 font-mono break-all bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
                  {this.state.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

function AppContent() {
  const [appLoaded, setAppLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // PWA Install State
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
      }
    } catch (err) {
      console.error('Error with PWA install prompt', err);
    }
  };

  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (e) {
          console.error("Failed to parse cart from local storage", e);
        }
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const parsePrice = (priceStr: any) => {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    const parsed = parseFloat(priceStr.toString().replace(',', '.'));
    return isNaN(parsed) ? 0 : parsed;
  };

  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (parsePrice(item.price) * item.qty), 0);
  const cartShipping = cart.reduce((acc, item) => acc + (parsePrice(item.shipping) * item.qty), 0);

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [greeting, setGreeting] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState('');
  const [showSearchCategories, setShowSearchCategories] = useState(false);
  const [adminTab, setAdminTab] = useState('users');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [cartHighlight, setCartHighlight] = useState(false);
  const [chatHighlight, setChatHighlight] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<any>(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Firebase State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMainAdmin, setIsMainAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [address, setAddress] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const fetchLocation = () => {
    setIsFetchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=pt`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              const city = geoData.city || geoData.locality || "";
              const principalSubdivision = geoData.principalSubdivision || "";
              setAddress(`${city}, ${principalSubdivision}`);
            }
          } catch (e) {
            console.warn("Failed to fetch address", e);
          } finally {
            setIsFetchingLocation(false);
          }
        },
        (err) => {
          console.warn("Geolocation error:", err.message);
          setIsFetchingLocation(false);
          alert("Não foi possível obter sua localização. Por favor, digite o endereço manualmente.");
        },
        { timeout: 10000 }
      );
    } else {
      setIsFetchingLocation(false);
      alert("Geolocalização não é suportada pelo seu navegador.");
    }
  };

  // Auth Listener
  useEffect(() => {
    let unsubUserDoc = () => {};
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthReady(true); // Set ready immediately so UI doesn't hang
      
      if (user) {
        // Check if user exists in Firestore, if not create them
        const userRef = doc(db, 'users', user.uid);
        const isDefaultAdmin = user.email === 'marcossilva192024@gmail.com' && user.emailVerified;
        setIsMainAdmin(isDefaultAdmin);
        
        unsubUserDoc = onSnapshot(userRef, (docSnap) => {
          if (!docSnap.exists()) {
            setIsAdmin(isDefaultAdmin);
            // Don't await setDoc so it doesn't block the UI if offline
            setDoc(userRef, {
              uid: user.uid,
              name: user.displayName || 'Usuário',
              email: user.email,
              isAdmin: isDefaultAdmin,
              avatar: user.photoURL || ''
            }).catch(error => {
              console.error("Error creating user doc:", error);
            });
          } else {
            setIsAdmin(isDefaultAdmin || docSnap.data().isAdmin === true);
          }
        }, (error) => {
          setIsAdmin(isDefaultAdmin); // Fallback to default admin check if offline
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          } catch (e) {
            console.error("Error handled:", e);
          }
        });
      } else {
        setIsAdmin(false);
        setIsMainAdmin(false);
        unsubUserDoc();
      }
    });
    return () => {
      unsubscribe();
      unsubUserDoc();
    };
  }, []);

  // Real-time Listeners & Initial Loading
  useEffect(() => {
    const initializeApp = async () => {
      setLoadingProgress(15);
      
      // Simulate a small delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingProgress(45);

      try {
        const response = await api.get('/products');
        if (response.success) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error("Erro ao buscar produtos via API:", error);
      }

      setLoadingProgress(85);
      
      // Wait a bit to ensure smooth progress bar
      await new Promise(resolve => setTimeout(resolve, 600));
      setLoadingProgress(100);
      
      setTimeout(() => {
        setAppLoaded(true);
      }, 400); // Wait for the progress bar animation to hit 100% before hiding
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !isAdmin) return;

    // Listen to users (only if admin)
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'users');
      } catch (e) {
        console.error("Error handled:", e);
      }
    });

    return () => unsubUsers();
  }, [isAuthReady, isAdmin]);

  useEffect(() => {
    if (!isAuthReady || !currentUser) return;

    // Listen to notifications
    const qNotif = query(
      collection(db, 'notifications'), 
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const notifData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifData);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'notifications');
      } catch (e) {
        console.error("Error handled:", e);
      }
    });

    // Listen to chats for unread messages
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCount && data.unreadCount[currentUser.uid]) {
          count += data.unreadCount[currentUser.uid];
        }
      });
      setUnreadMessagesCount(count);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'chats');
      } catch (e) {
        console.error("Error handled:", e);
      }
    });

    return () => {
      unsubNotif();
      unsubChats();
    };
  }, [isAuthReady, currentUser]);

  useEffect(() => {
    if (!isAdmin && activeTab === 'admin') {
      setActiveTab('home');
    }
  }, [isAdmin, activeTab, adminTab]);

  const openAuthModal = () => {
    setLoginError(null);
    setAuthMode('email');
    setEmail('');
    setPassword('');
    setShowAuthModal(true);
  };

  const handleEmailSignup = async () => {
    if (!email || !password) {
      setLoginError("Preencha email e senha.");
      return;
    }
    setAuthLoading(true);
    setLoginError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setLoginError("Este email já está em uso. Tente fazer login.");
      } else if (error.code === 'auth/weak-password') {
        setLoginError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setLoginError(error.message || "Erro ao cadastrar com email");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setLoginError("Preencha email e senha.");
      return;
    }
    setAuthLoading(true);
    setLoginError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setLoginError("Senha incorreta ou conta não existe. Se você usava o Google para entrar, clique em 'Esqueceu a senha?' para criar uma senha para este email.");
      } else {
        setLoginError("Erro no login. Tente novamente.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError("Preencha o email para redefinir a senha.");
      return;
    }
    setAuthLoading(true);
    setLoginError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setLoginError("Link de redefinição enviado para o seu email!");
    } catch (error: any) {
      console.error("Forgot password error:", error);
      if (error.code === 'auth/user-not-found') {
        setLoginError("Usuário não encontrado com este email.");
      } else {
        setLoginError(error.message || "Erro ao enviar email de redefinição.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notifId), {
        read: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${notifId}`);
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isAdmin: !currentStatus
      });
      
      if (!currentStatus) {
        // They were not admin, now they are. Send notification.
        await setDoc(doc(collection(db, 'notifications')), {
          userId: userId,
          title: 'Privilégios de Administrador',
          message: 'Você agora é um administrador do sistema.',
          read: false,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleToggleSupport = async (userId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        isSupport: !currentStatus
      });
      
      if (!currentStatus) {
        await setDoc(doc(collection(db, 'notifications')), {
          userId: userId,
          title: 'Privilégios de Suporte',
          message: 'Você agora é um atendente de suporte.',
          read: false,
          createdAt: Date.now()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleSaveProduct = async () => {
    try {
      let finalImage = editingProduct.image || '';
      
      // Convert blob URL to base64 for persistence
      if (finalImage.startsWith('blob:')) {
        const response = await fetch(finalImage);
        const blob = await response.blob();
        finalImage = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const productData = {
        name: editingProduct.name,
        price: editingProduct.price,
        shipping: editingProduct.shipping || '0,00',
        unit: editingProduct.unit,
        tag: editingProduct.tag || '',
        tagColor: editingProduct.tagColor || '',
        image: finalImage,
      };

      if (editingProduct.id) {
        const res = await api.put(`/products/${editingProduct.id}`, productData);
        if (res.success) {
          setProducts(prev => prev.map(p => p.id === editingProduct.id ? res.data : p));
        }
      } else {
        const res = await api.post('/products', productData);
        if (res.success) {
          setProducts(prev => [res.data, ...prev]);
        }
      }
      setShowProductModal(false);
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto. Verifique os dados e tente novamente.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error("Erro ao deletar produto:", error);
      alert("Erro ao deletar produto.");
    }
  };

  const handleSeedProducts = async () => {
    const defaultProducts = [
      { name: 'Cimento CP II 50kg', price: '25,90', shipping: '5,00', unit: '/sc', tag: 'Mais Vendido', tagColor: 'bg-orange-500', image: 'https://i.postimg.cc/8cqRTrcZ/126881-removebg-preview.png' },
      { name: 'Tinta Acrílica Branca 18L', price: '120,00', shipping: '0,00', unit: '/lt', tag: 'Oferta', tagColor: 'bg-red-500', image: 'https://i.postimg.cc/XqZGZkHw/128772-removebg-preview.png' },
      { name: 'Tubo PVC 100mm', price: '15,50', shipping: '2,00', unit: '/m', tag: 'Novo', tagColor: 'bg-blue-500', image: 'https://i.postimg.cc/3RNmHRjD/126877-removebg-preview.png' },
      { name: 'Fio Elétrico 2.5mm 100m', price: '85,00', shipping: '0,00', unit: '/rl', tag: 'Essencial', tagColor: 'bg-yellow-500', image: 'https://i.postimg.cc/4xBxRRmF/127509-removebg-preview.png' },
      { name: 'Furadeira de Impacto 700W', price: '199,90', shipping: '0,00', unit: '/un', tag: 'Profissional', tagColor: 'bg-gray-800', image: 'https://i.postimg.cc/0j6M60Wm/128771-removebg-preview.png' },
      { name: 'Telha Cerâmica', price: '1,20', shipping: '10,00', unit: '/un', tag: 'Promoção', tagColor: 'bg-green-500', image: 'https://i.postimg.cc/904R4Y8P/128773-removebg-preview.png' }
    ];

    try {
      for (const prod of defaultProducts) {
        const res = await api.post('/products', prod);
        if (res.success) {
          setProducts(prev => [res.data, ...prev]);
        }
      }
    } catch (error) {
      console.error("Erro ao restaurar produtos:", error);
      alert("Erro ao restaurar produtos.");
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64Image = event.target?.result as string;
          const productData = {
            name: `Produto ${Date.now() + i}`,
            price: '0,00',
            shipping: '0,00',
            unit: '/un',
            tag: 'Novo',
            tagColor: 'bg-blue-500',
            image: base64Image,
          };
          const res = await api.post('/products', productData);
          if (res.success) {
            setProducts(prev => [res.data, ...prev]);
          }
        } catch (error) {
          console.error("Erro ao fazer upload da imagem:", error);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting('Bom dia');
      else if (hour >= 12 && hour < 18) setGreeting('Boa tarde');
      else setGreeting('Boa noite');
    };
    
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const categories = [
    { name: 'Hidráulica', image: 'https://i.postimg.cc/3RNmHRjD/126877-removebg-preview.png' },
    { name: 'Elétrica', image: 'https://i.postimg.cc/4xBxRRmF/127509-removebg-preview.png' },
    { name: 'Madeiras', image: 'https://i.postimg.cc/mk6dCDD9/126879-removebg-preview.png' },
    { name: 'Ferramentas', image: 'https://i.postimg.cc/0j6M60Wm/128771-removebg-preview.png' },
    { name: 'Cimentos', image: 'https://i.postimg.cc/8cqRTrcZ/126881-removebg-preview.png' },
    { name: 'Tintas', image: 'https://i.postimg.cc/XqZGZkHw/128772-removebg-preview.png' },
    { name: 'Ferragens', image: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Hammer.png' },
    { name: 'Telhados', image: 'https://i.postimg.cc/904R4Y8P/128773-removebg-preview.png' },
  ];

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = parseFloat(a.price.replace(',', '.'));
    const priceB = parseFloat(b.price.replace(',', '.'));
    if (sortOrder === 'asc') return priceA - priceB;
    if (sortOrder === 'desc') return priceB - priceA;
    return 0;
  });

  const banners = [
    {
      id: 1,
      title: 'Ofertas Exclusivas em Materiais!',
      subtitle: 'Economize 25% hoje!',
      buttonText: 'Comprar Agora',
      bgGradient: 'from-[#D6E6F9] to-[#E8F1FB]',
      buttonColor: 'bg-[#2A85FF] text-white hover:bg-blue-600 shadow-blue-500/30',
      image: 'https://i.postimg.cc/7ZtHt8sb/132523-removebg-preview.png'
    },
    {
      id: 2,
      title: 'Semana da Elétrica',
      subtitle: 'Até 40% de desconto',
      buttonText: 'Ver Ofertas',
      bgGradient: 'from-[#FDE6D5] to-[#FFF0E5]',
      buttonColor: 'bg-[#FF8A3D] text-white hover:bg-orange-600 shadow-orange-500/30',
      image: 'https://i.postimg.cc/rp2Kq2TC/127516-removebg-preview.png'
    },
    {
      id: 3,
      title: 'Festival de Tintas',
      subtitle: 'Cores que inspiram',
      buttonText: 'Aproveite',
      bgGradient: 'from-[#E5F5E5] to-[#F0FAF0]',
      buttonColor: 'bg-[#34C759] text-white hover:bg-green-600 shadow-green-500/30',
      image: 'https://i.postimg.cc/NFYtSd7g/127507-removebg-preview.png'
    },
    {
      id: 4,
      title: 'Tudo para Hidráulica',
      subtitle: 'Tubos e Conexões',
      buttonText: 'Confira',
      bgGradient: 'from-[#F5E6F5] to-[#FAF0FA]',
      buttonColor: 'bg-[#AF52DE] text-white hover:bg-purple-600 shadow-purple-500/30',
      image: 'https://i.postimg.cc/JhXTJpHL/126873-removebg-preview.png'
    },
    {
      id: 5,
      title: 'Construção Bruta',
      subtitle: 'Cimento e Areia',
      buttonText: 'Comprar',
      bgGradient: 'from-[#FFF5CC] to-[#FFFBE6]',
      buttonColor: 'bg-[#FFCC00] text-gray-900 hover:bg-yellow-500 shadow-yellow-500/30',
      image: 'https://i.postimg.cc/yNscvH2D/127513-removebg-preview.png'
    }
  ];

  useEffect(() => {
    if (unreadMessagesCount > 0) {
      setChatHighlight(true);
      const timer = setTimeout(() => {
        setChatHighlight(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [unreadMessagesCount]);

  const handleAddToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });

    setCartHighlight(true);
    setTimeout(() => {
      setCartHighlight(false);
    }, 1500);
  };

  const updateCartQuantity = (productId: any, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const handleDecreaseQuantity = (item: any) => {
    if (item.qty === 1) {
      setItemToRemove(item);
    } else {
      updateCartQuantity(item.id, -1);
    }
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      setCart(prev => prev.filter(i => i.id !== itemToRemove.id));
      setItemToRemove(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        const docRef = doc(db, 'notifications', n.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  if (!appLoaded) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <div 
      className="max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-[#F8FAFC] dark:bg-gray-900 min-h-screen relative pb-24 font-sans shadow-2xl overflow-hidden transition-colors duration-300"
    >
      
      {activeTab === 'home' && (
        <>
          {/* Fixed Top Section */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm pb-3 max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
            {/* Install PWA Banner */}
            {isInstallable && (
              <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  <span className="text-sm font-semibold">Instalar aplicativo oficial</span>
                </div>
                <button 
                  onClick={handleInstallPWA}
                  className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  Instalar
                </button>
              </div>
            )}
            
            {/* Header */}
            <header className="px-6 pt-4 pb-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                {currentUser ? (
                  <>
                    <img 
                      src={currentUser.photoURL || "https://cdn-icons-png.flaticon.com/512/2810/2810658.png"} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-800 shadow-sm object-cover bg-gray-50 dark:bg-gray-700 p-0.5"
                    />
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">Olá,</p>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{currentUser.displayName || 'Usuário'}!</h1>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={openAuthModal}
                      className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-sm text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                    >
                      <LogIn className="w-5 h-5" />
                      Fazer Login
                    </button>
                    {loginError && (
                      <span className="text-xs text-red-500 font-medium">{loginError}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="relative p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  {isDarkMode ? (
                    <Sun className="w-6 h-6 text-yellow-500" />
                  ) : (
                    <Moon className="w-6 h-6 text-gray-700" />
                  )}
                </button>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700"
                >
                  <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-6 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900 dark:text-white">Notificações</h3>
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                        >
                          Marcar lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                          Nenhuma notificação no momento
                        </div>
                      ) : (
                        notifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                            onClick={() => handleMarkNotificationRead(notification.id)}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">
                                {notification.type === 'cart' && <ShoppingCart className="w-5 h-5 text-blue-500" />}
                                {notification.type === 'order' && <Package className="w-5 h-5 text-green-500" />}
                                {notification.type === 'promo' && <Tag className="w-5 h-5 text-purple-500" />}
                                {!['cart', 'order', 'promo'].includes(notification.type) && <Bell className="w-5 h-5 text-yellow-500" />}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{notification.title}</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                                <span className="text-[10px] text-gray-400 mt-2 block">
                                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Search Bar */}
            <div className="px-6 flex gap-3 relative z-40">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input 
            type="text" 
            placeholder="Pesquisar materiais, ferramentas, etc." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchCategories(true)}
            onBlur={() => setTimeout(() => setShowSearchCategories(false), 200)}
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-colors"
          />
          {showSearchCategories && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 z-50">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Categorias Populares</h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((c, i) => (
                  <span key={i} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="p-3.5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          {showFilters && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-50">
              <button onClick={() => { setSortOrder('asc'); setShowFilters(false); }} className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'asc' ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}>Menor Preço</button>
              <button onClick={() => { setSortOrder('desc'); setShowFilters(false); }} className={`w-full text-left px-4 py-2 text-sm ${sortOrder === 'desc' ? 'text-blue-500 font-bold' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-50 dark:hover:bg-gray-700`}>Maior Preço</button>
              <button onClick={() => { setSortOrder(''); setShowFilters(false); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700">Limpar Filtro</button>
            </div>
          )}
        </div>
      </div>
          </div>
          
          {/* Spacer for fixed header */}
          <div className="h-[148px]"></div>

    {/* Scrollable Content Area */}
    <div className="pb-24 space-y-8">
      {/* Promo Banners Carousel */}
      <div className="mb-8 mt-2">
        <div className="flex gap-4 overflow-x-auto pt-10 pb-4 px-6 snap-x snap-mandatory hide-scrollbar">
          {banners.map((banner) => (
            <div key={banner.id} className="relative shrink-0 w-full md:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] snap-center">
              <div className={`bg-gradient-to-r ${banner.bgGradient} rounded-3xl p-6 shadow-sm relative z-10`}>
                <div className="relative z-20 w-[60%]">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                    {banner.title}
                  </h2>
                  <p className="text-gray-600 text-sm mb-4">{banner.subtitle}</p>
                  <button className={`${banner.buttonColor} px-5 py-2.5 rounded-full font-semibold text-sm transition-colors shadow-md relative z-30`}>
                    {banner.buttonText}
                  </button>
                </div>
              </div>
              {/* Personagem saltando para fora do banner */}
              <div className="absolute -right-4 -top-10 -bottom-0 w-52 z-30 pointer-events-none flex items-end justify-end">
                <img 
                  src={banner.image} 
                  alt={banner.title} 
                  className="w-full h-full object-contain drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Greeting */}
      <div className="px-6">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          {greeting}! <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">O que você precisa hoje?</span>
        </h2>
      </div>

      {/* Categories */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Categorias de Produtos</h3>
          <button className="text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            Ver Tudo
          </button>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-6 gap-x-4">
          {categories.map((cat, idx) => (
            <button key={idx} className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:scale-105 transition-all duration-200 p-3">
                <img 
                  src={cat.image} 
                  alt={cat.name} 
                  className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply dark:mix-blend-normal"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium text-center leading-tight px-1">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="px-6 mb-6">
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ofertas Próximas</h3>
          <button className="text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
            Ver Tudo
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 snap-x hide-scrollbar">
          {sortedProducts.length > 0 ? (
            sortedProducts.map((product) => (
              <div key={product.id} className="min-w-[200px] md:min-w-[250px] bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm snap-start flex flex-col transition-colors overflow-hidden relative">
                <div className="relative mb-3 bg-gray-50 dark:bg-gray-700 rounded-2xl aspect-square flex items-center justify-center overflow-hidden">
                  <span className={`absolute top-2 right-2 ${product.tagColor} text-white text-[10px] font-bold px-2 py-1 rounded-md z-10`}>
                    {product.tag}
                  </span>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                  />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 line-clamp-2 h-10">
                  {product.name}
                </h4>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">€ {product.price}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{product.unit}</span>
                  </div>
                  <TractorButton onClick={() => handleAddToCart(product)} />
                </div>
              </div>
            ))
          ) : (
            <div className="w-full py-12 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum produto disponível no momento.</p>
            </div>
          )}
        </div>
      </div>
      </div>
      </>
      )}

      {/* Chat View */}
      {activeTab === 'chat' && (
        <ChatView currentUser={currentUser} />
      )}

      {/* Cart View */}
      {activeTab === 'cart' && (
        <div className="px-6 pt-6 pb-24 min-h-screen">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Meu Carrinho</h2>
          <div className="space-y-4">
            {cart.length > 0 ? (
              <>
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <img src={item.image || item.img || 'https://images.unsplash.com/photo-1622473590773-f588134b6ce7?auto=format&fit=crop&q=80&w=200&h=200'} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</h4>
                      <p className="text-blue-500 font-bold mt-1">€ {parsePrice(item.price).toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-lg">
                      <button onClick={() => handleDecreaseQuantity(item)} className="text-gray-500 font-bold hover:text-gray-700 dark:hover:text-gray-300">-</button>
                      <span className="text-gray-900 dark:text-white font-medium">{item.qty}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="text-gray-500 font-bold hover:text-gray-700 dark:hover:text-gray-300">+</button>
                    </div>
                    <button onClick={() => setItemToRemove(item)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm">
                  <div className="flex justify-between mb-2 text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>€ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between mb-4 text-gray-600 dark:text-gray-400">
                    <span>Frete</span>
                    <span>{cartShipping === 0 ? 'Grátis' : `€ ${cartShipping.toFixed(2).replace('.', ',')}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white mb-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <span>Total</span>
                    <span>€ {(cartSubtotal + cartShipping).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button 
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full bg-[#2A85FF] text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                  >
                    Finalizar Compra
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <ShoppingCart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Carrinho Vazio</h3>
                <p className="text-gray-500 dark:text-gray-400">Adicione produtos para continuar comprando.</p>
                <button onClick={() => setActiveTab('home')} className="mt-6 bg-blue-50 dark:bg-gray-800 text-blue-500 px-6 py-3 rounded-xl font-bold hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors">
                  Explorar Produtos
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile View */}
      {activeTab === 'profile' && (
        <div className="px-6 pt-6 pb-24 min-h-screen">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Meu Perfil</h2>
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <img src={currentUser?.photoURL || "https://cdn-icons-png.flaticon.com/512/2810/2810658.png"} alt="Profile" className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-700 p-1 object-cover" />
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{currentUser?.displayName || 'Visitante'}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{currentUser?.email || 'Faça login para ver seu perfil'}</p>
              </div>
            </div>
            {currentUser ? (
              <button onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                <LogOut className="w-6 h-6" />
              </button>
            ) : (
              <button onClick={openAuthModal} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                <LogIn className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {currentUser && (
            <div className="space-y-2">
              {['Meus Pedidos', 'Endereços', 'Formas de Pagamento', 'Configurações'].map(item => (
                <button key={item} className="w-full flex justify-between items-center p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {item}
                  <span className="text-gray-400">{'>'}</span>
                </button>
              ))}
              {isAdmin && (
                <button onClick={() => setActiveTab('admin')} className="w-full flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-sm text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors mt-4 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Painel de Administrador
                  </div>
                  <span>{'>'}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin View */}
      {activeTab === 'admin' && (
        <div className="px-6 pt-6 pb-24 min-h-screen">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setActiveTab('profile')} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
              <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Administração</h2>
          </div>

          <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button onClick={() => setAdminTab('users')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${adminTab === 'users' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Usuários</button>
            <button onClick={() => setAdminTab('products')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${adminTab === 'products' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Produtos</button>
          </div>

          {adminTab === 'users' && (
            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{user.name}</h4>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => isMainAdmin && handleToggleSupport(user.id, user.isSupport)}
                      disabled={!isMainAdmin}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${user.isSupport ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'} ${!isMainAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.isSupport ? <Check className="w-3 h-3" /> : null}
                      Suporte
                    </button>
                    <button 
                      onClick={() => isMainAdmin && handleToggleAdmin(user.id, user.isAdmin)}
                      disabled={!isMainAdmin}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${user.isAdmin ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'} ${!isMainAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.isAdmin ? <Check className="w-3 h-3" /> : null}
                      Admin
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adminTab === 'products' && (
            <div>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => { setEditingProduct({ name: '', price: '', shipping: '0,00', unit: '/un', tag: 'Novo', tagColor: 'bg-blue-500', image: '' }); setShowProductModal(true); }}
                  className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-blue-100 dark:border-blue-800 border-dashed hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Adicionar Produto
                </button>
                <label className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-100 dark:border-green-800 border-dashed hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors cursor-pointer">
                  <Upload className="w-5 h-5" /> Subir em Massa
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkUpload} />
                </label>
              </div>
              {products.length === 0 && (
                <button 
                  onClick={handleSeedProducts}
                  className="w-full mb-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-orange-100 dark:border-orange-800 border-dashed hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" /> Restaurar Produtos Padrão
                </button>
              )}
              <div className="space-y-3">
                {products.map(product => (
                  <div key={product.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
                    <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover bg-gray-50 dark:bg-gray-700" />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{product.name}</h4>
                      <p className="text-blue-500 font-bold text-xs">€ {product.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingProduct(product); setShowProductModal(true); }} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-lg rounded-3xl p-6 shadow-2xl animate-modal-pop relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Email e Senha
            </h2>

            {loginError && (
              <div className={`mb-4 p-3 text-sm rounded-xl text-center font-medium ${loginError.includes('enviado') ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                {loginError}
              </div>
            )}

            {authMode === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="seu@email.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">Senha</label>
                    <button 
                      onClick={handleForgotPassword}
                      disabled={authLoading}
                      className="text-xs font-bold text-blue-500 hover:text-blue-600 disabled:opacity-50"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleEmailLogin}
                    disabled={authLoading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Entrar
                  </button>
                  <button 
                    onClick={handleEmailSignup}
                    disabled={authLoading}
                    className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cadastrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {showProductModal && editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-2xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setShowProductModal(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nome do Produto</label>
                <input type="text" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Preço (€)</label>
                  <input type="text" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Frete (€ ou 0 p/ Grátis)</label>
                  <input type="text" value={editingProduct.shipping || '0,00'} onChange={e => setEditingProduct({...editingProduct, shipping: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="w-1/4">
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Unidade</label>
                  <input type="text" value={editingProduct.unit} onChange={e => setEditingProduct({...editingProduct, unit: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Imagem (URL ou Galeria)</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="https://i.postimg.cc/..." value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" />
                  <label className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <Upload className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const url = URL.createObjectURL(e.target.files[0]);
                        setEditingProduct({...editingProduct, image: url});
                      }
                    }} />
                  </label>
                </div>
                {editingProduct.image && (
                  <div className="mt-3 relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                    <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <button 
                onClick={handleSaveProduct}
                className="w-full bg-[#2A85FF] text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30 mt-4"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] transition-colors">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-[#2A85FF]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <Home className="w-6 h-6" fill={activeTab === 'home' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 relative transition-colors duration-300 ${chatHighlight ? 'text-green-500' : activeTab === 'chat' ? 'text-[#2A85FF]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <MessageCircle className="w-6 h-6" fill={activeTab === 'chat' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">Chat</span>
          {unreadMessagesCount > 0 && (
            <span className={`absolute -top-1 -right-2 ${chatHighlight ? 'bg-green-500' : 'bg-blue-500'} text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 transition-colors duration-300`}>
              {unreadMessagesCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('cart')}
          className={`flex flex-col items-center gap-1 relative transition-colors duration-300 ${cartHighlight ? 'text-green-500' : activeTab === 'cart' ? 'text-[#2A85FF]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <ShoppingCart className="w-6 h-6" fill={activeTab === 'cart' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">Carrinho</span>
          {cartCount > 0 && (
            <span className={`absolute -top-1 -right-2 ${cartHighlight ? 'bg-green-500' : 'bg-blue-500'} text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 transition-colors duration-300`}>
              {cartCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-[#2A85FF]' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        >
          <User className="w-6 h-6" fill={activeTab === 'profile' ? 'currentColor' : 'none'} />
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </nav>

      {/* Remove Confirmation Modal */}
      {itemToRemove && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-modal-pop">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Remover item?</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Tem certeza que deseja remover <strong>{itemToRemove.name}</strong> do seu carrinho?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToRemove(null)}
                className="flex-1 py-3 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmRemove}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md md:max-w-lg rounded-3xl p-6 shadow-2xl animate-modal-pop max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Finalizar Compra</h3>
              <button onClick={() => setShowCheckoutModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Endereço de Entrega</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Digite seu endereço completo"
                    className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    onClick={fetchLocation}
                    disabled={isFetchingLocation}
                    className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 flex items-center justify-center"
                    title="Usar localização atual"
                  >
                    <MapPin className={`w-5 h-5 ${isFetchingLocation ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Forma de Pagamento</label>
                <select className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="pix">PIX</option>
                  <option value="credit">Cartão de Crédito</option>
                  <option value="cash">Dinheiro na Entrega</option>
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>€ {cartSubtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-gray-600 dark:text-gray-400">
                  <span>Frete</span>
                  <span>€ {cartShipping.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white mt-4">
                  <span>Total</span>
                  <span>€ {(cartSubtotal + cartShipping).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              <button 
                onClick={() => {
                  alert("Pedido realizado com sucesso!");
                  setCart([]);
                  setShowCheckoutModal(false);
                  setActiveTab('home');
                }}
                className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 mt-6"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-toast-slide-down {
          animation: toastSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-modal-pop {
          animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
