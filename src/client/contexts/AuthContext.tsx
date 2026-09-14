import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../../shared/types';
import { api } from '../services/api';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
} from '../../../firebase/config';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAppLocked: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  register: (email: string, username: string, displayName: string, pass: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  sendFirebasePasswordReset: (email: string) => Promise<void>;
  phoneOtpRequest: (phone: string, countryCode: string) => Promise<{ sent: boolean }>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  setAppLockPin: (pin: string, timeoutMinutes?: number) => Promise<void>;
  unlockApp: (pin: string) => Promise<boolean>;
  lockApp: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('falcon_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAppLocked, setIsAppLocked] = useState<boolean>(false);

  // Initialize session
  useEffect(() => {
    async function initAuth() {
      if (token) {
        try {
          const res = await api.get<User>('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            if (res.data.appLockPinHash) {
              // Check if app was previously locked
              const lockedState = sessionStorage.getItem('falcon_app_locked');
              if (lockedState === 'true') {
                setIsAppLocked(true);
              }
            }
          }
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    initAuth();
  }, [token]);

  const login = async (identifier: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, password: pass });
      if (res.success) {
        localStorage.setItem('falcon_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, displayName: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', { email, username, displayName, password: pass });
      if (res.success) {
        localStorage.setItem('falcon_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async () => {
    if (!auth || !googleProvider) {
      throw new Error('Firebase Authentication is not configured or unavailable.');
    }
    setIsLoading(true);
    try {
      // 1. Trigger real Google OAuth popup via Firebase Client SDK
      const result = await signInWithPopup(auth, googleProvider);
      // 2. Retrieve verified Firebase ID token
      const idToken = await result.user.getIdToken(true);
      // 3. Send ID token to Dark Falcon backend for cryptographic verification
      const res = await api.post('/auth/google', { idToken });
      if (res.success && res.data) {
        localStorage.setItem('falcon_token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendFirebasePasswordReset = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured.');
    }
    await sendPasswordResetEmail(auth, email);
  };

  const phoneOtpRequest = async (phone: string, countryCode: string) => {
    const res = await api.post('/auth/phone-otp', { phone, countryCode });
    return res.data;
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth).catch(() => {});
      }
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      localStorage.removeItem('falcon_token');
      sessionStorage.removeItem('falcon_app_locked');
      setToken(null);
      setUser(null);
      setIsAppLocked(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    const res = await api.put<User>('/users/profile', updates);
    if (res.success) {
      setUser(res.data);
    }
  };

  const setAppLockPin = async (pin: string, timeoutMinutes = 5) => {
    const res = await api.post('/auth/app-lock/pin', { pin, timeoutMinutes });
    if (res.success) {
      if (user) {
        setUser({ ...user, appLockPinHash: 'active', appLockTimeout: timeoutMinutes });
      }
    }
  };

  const unlockApp = async (pin: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/app-lock/verify', { pin });
      if (res.success && res.data?.verified) {
        setIsAppLocked(false);
        sessionStorage.removeItem('falcon_app_locked');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const lockApp = () => {
    setIsAppLocked(true);
    sessionStorage.setItem('falcon_app_locked', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAppLocked,
        login,
        register,
        googleLogin,
        sendFirebasePasswordReset,
        phoneOtpRequest,
        logout,
        updateUser,
        setAppLockPin,
        unlockApp,
        lockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
