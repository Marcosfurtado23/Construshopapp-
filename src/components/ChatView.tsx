import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, ArrowLeft, User as UserIcon } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../utils/errorHandling';

interface ChatViewProps {
  currentUser: any;
}

export const ChatView: React.FC<ChatViewProps> = ({ currentUser }) => {
  const [supportUsers, setSupportUsers] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSupport, setIsSupport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubUser = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setIsSupport(docSnap.data().isSupport === true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });

    return () => unsubUser();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch support users if current user is not support
    if (!isSupport) {
      const qUsers = query(collection(db, 'users'), where('isSupport', '==', true));
      const unsubUsers = onSnapshot(qUsers, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSupportUsers(usersData);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });
      return () => unsubUsers();
    }
  }, [currentUser, isSupport]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch chats where current user is a participant
    const qChats = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const unsubChats = onSnapshot(qChats, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUserId = data.participants.find((id: string) => id !== currentUser.uid);
        
        let otherUser = { name: 'Usuário Desconhecido', avatar: '' };
        if (otherUserId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              otherUser = userDoc.data() as any;
            }
          } catch (e) {
            console.error("Error fetching user details", e);
          }
        }
        
        return { 
          id: chatDoc.id, 
          ...data,
          otherUser
        };
      }));
      setChats(chatsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chats');
    });

    return () => unsubChats();
  }, [currentUser]);

  useEffect(() => {
    if (!activeChat) return;

    const qMessages = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${activeChat.id}/messages`);
    });

    return () => unsubMessages();
  }, [activeChat]);

  useEffect(() => {
    if (activeChat && currentUser) {
      const currentChatData = chats.find(c => c.id === activeChat.id);
      if (currentChatData && currentChatData.unreadCount?.[currentUser.uid] > 0) {
        updateDoc(doc(db, 'chats', activeChat.id), {
          [`unreadCount.${currentUser.uid}`]: 0
        }).catch(e => console.error(e));
      }
    }
  }, [activeChat, chats, currentUser]);

  const startChat = async (supportUser: any) => {
    // Check if chat already exists
    const existingChat = chats.find(c => c.participants.includes(supportUser.uid));
    if (existingChat) {
      setActiveChat(existingChat);
      return;
    }

    // Create new chat
    try {
      const chatRef = doc(collection(db, 'chats'));
      await setDoc(chatRef, {
        participants: [currentUser.uid, supportUser.uid],
        updatedAt: Date.now(),
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: {
          [currentUser.uid]: 0,
          [supportUser.uid]: 0
        }
      });
      
      setActiveChat({
        id: chatRef.id,
        participants: [currentUser.uid, supportUser.uid],
        otherUser: supportUser
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const text = newMessage.trim();
    setNewMessage('');

    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        chatId: activeChat.id,
        senderId: currentUser.uid,
        text,
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${activeChat.id}/messages`);
      return;
    }

    try {
      const otherUserId = activeChat.participants.find((id: string) => id !== currentUser.uid);

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: text,
        lastMessageTime: Date.now(),
        updatedAt: Date.now(),
        ...(otherUserId ? { [`unreadCount.${otherUserId}`]: increment(1) } : {})
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${activeChat.id}`);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (activeChat) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-4 flex items-center gap-3 shadow-sm z-10">
          <button onClick={() => setActiveChat(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          {activeChat.otherUser?.avatar ? (
            <img src={activeChat.otherUser.avatar} alt={activeChat.otherUser.name} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{activeChat.otherUser?.name || 'Usuário'}</h3>
            <p className="text-xs text-green-500 font-medium">Online</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm shadow-sm'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 pb-24 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Mensagens</h2>
      </div>

      {!isSupport && supportUsers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Suporte Disponível</h3>
          <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
            {supportUsers.map(user => (
              <button 
                key={user.id} 
                onClick={() => startChat(user)}
                className="flex flex-col items-center gap-2 min-w-[72px]"
              >
                <div className="relative">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || 'Suporte'} className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                      <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center line-clamp-1 w-full">{user.name?.split(' ')[0] || 'Suporte'}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Conversas Recentes</h3>
        {chats.length > 0 ? (
          <div className="space-y-3">
            {chats.map(chat => {
              const unread = chat.unreadCount?.[currentUser.uid] || 0;
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className="flex items-center gap-4 p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {chat.otherUser?.avatar ? (
                    <img src={chat.otherUser.avatar} alt={chat.otherUser.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className={`font-bold truncate pr-2 ${unread > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {chat.otherUser?.name || 'Usuário'}
                      </h4>
                      {chat.lastMessageTime && (
                        <span className={`text-xs whitespace-nowrap ${unread > 0 ? 'text-blue-500 font-bold' : 'text-gray-500'}`}>
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${unread > 0 ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                      {chat.lastMessage || 'Nenhuma mensagem ainda'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {unread}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 dark:text-gray-400">Nenhuma conversa encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
};
