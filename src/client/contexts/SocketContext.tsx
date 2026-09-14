import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

type SocketEventHandler = (payload: any) => void;

interface SocketContextType {
  isConnected: boolean;
  sendEvent: (type: string, payload?: any) => void;
  subscribe: (type: string, handler: SocketEventHandler) => () => void;
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<SocketEventHandler>>>(new Map());

  useEffect(() => {
    if (!token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('🦅 Connected to Dark Falcon Real-time WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence_change') {
          const { userId, isOnline } = data.payload;
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (isOnline) next.add(userId);
            else next.delete(userId);
            return next;
          });
        }

        const handlers = listenersRef.current.get(data.type);
        if (handlers) {
          handlers.forEach((handler) => handler(data.payload));
        }
      } catch (err) {
        console.error('Socket message decode error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('🦅 Disconnected from Dark Falcon WebSocket');
    };

    ws.onerror = (err) => {
      console.warn('Dark Falcon WebSocket error:', err);
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const sendEvent = (type: string, payload: any = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  };

  const subscribe = (type: string, handler: SocketEventHandler) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(handler);

    return () => {
      const set = listenersRef.current.get(type);
      if (set) {
        set.delete(handler);
      }
    };
  };

  return (
    <SocketContext.Provider value={{ isConnected, sendEvent, subscribe, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
