import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Address } from '../types';
import { api } from '../services/api';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  addresses: Address[];
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (payload: { name: string; email: string; password: string; phone?: string; address?: string }) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
  quickLoginAsDemo: () => Promise<boolean>;
  quickLoginAsAdmin: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  const { success, error: toastError } = useToast();

  const syncSupabaseUser = async (sessionUser: any) => {
    if (!sessionUser) return null;

    try {
      // Query customers table
      const { data: customer } = (await supabase
        .from('customers')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle()) as { data: any };

      const userRole: 'user' | 'admin' =
        sessionUser.email === 'admin@freshsip.com' ||
        sessionUser.user_metadata?.role === 'admin'
          ? 'admin'
          : 'user';

      const resolvedUser: User = {
        id: sessionUser.id,
        name: (customer as any)?.name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Customer',
        email: sessionUser.email || '',
        phone: (customer as any)?.phone || sessionUser.user_metadata?.phone || '',
        address: (customer as any)?.address || sessionUser.user_metadata?.address || '',
        role: userRole,
        created_at: sessionUser.created_at || new Date().toISOString(),
      };

      setUser(resolvedUser);
      return resolvedUser;
    } catch (e) {
      console.error('Error syncing Supabase user:', e);
      return null;
    }
  };

  const fetchProfile = async () => {
    // 1. Check Supabase Auth first if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const sbUser = await syncSupabaseUser(session.user);
          if (sbUser) {
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Supabase session check error:', err);
      }
    }

    // 2. Fallback to token-based profile
    const token = localStorage.getItem('freshsip_token');
    if (!token) {
      setUser(null);
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      setUser(res.user);
      setAddresses(res.addresses || []);
    } catch {
      localStorage.removeItem('freshsip_token');
      setUser(null);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    // Listen to Supabase auth state change if configured
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await syncSupabaseUser(session.user);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // If Supabase is configured, attempt Supabase Auth first
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!error && data?.user) {
          await syncSupabaseUser(data.user);
          success(`Welcome to FreshSip, ${data.user.email?.split('@')[0]}!`);
          closeAuthModal();
          return true;
        }
      } catch (sbErr) {
        console.warn('Supabase login attempt failed, trying backend auth fallback:', sbErr);
      }
    }

    // Fallback to Express backend auth
    try {
      const res = await api.auth.login({ email, password });
      localStorage.setItem('freshsip_token', res.token);
      setUser(res.user);
      await fetchProfile();
      success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      closeAuthModal();
      return true;
    } catch (err: any) {
      toastError(err.message || 'Login failed');
      return false;
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<boolean> => {
    // If Supabase is configured, register via Supabase Auth
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email.trim(),
          password: payload.password,
          options: {
            data: {
              name: payload.name,
              phone: payload.phone || '',
              address: payload.address || '',
              role: 'user',
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Upsert into customers table
          await (supabase.from('customers') as any).upsert({
            id: data.user.id,
            name: payload.name,
            email: payload.email.trim().toLowerCase(),
            phone: payload.phone || null,
            address: payload.address || null,
          });

          await syncSupabaseUser(data.user);
          success(`Account created with Supabase! Welcome, ${payload.name}!`);
          closeAuthModal();
          return true;
        }
      } catch (sbErr: any) {
        console.warn('Supabase register error, falling back:', sbErr);
      }
    }

    // Backend fallback
    try {
      const res = await api.auth.register(payload);
      localStorage.setItem('freshsip_token', res.token);
      setUser(res.user);
      await fetchProfile();
      success(`Account created! Welcome to FreshSip, ${res.user.name.split(' ')[0]}!`);
      closeAuthModal();
      return true;
    } catch (err: any) {
      toastError(err.message || 'Registration failed');
      return false;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase signout error:', e);
      }
    }
    localStorage.removeItem('freshsip_token');
    setUser(null);
    setAddresses([]);
    success('Logged out successfully');
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        success('Password recovery email sent via Supabase!');
        return true;
      } catch (err: any) {
        toastError(err.message || 'Failed to send reset link');
        return false;
      }
    }

    try {
      const res = await api.auth.forgotPassword(email);
      success(res.message || 'Password reset link sent to your email.');
      return true;
    } catch (err: any) {
      toastError(err.message || 'Failed to send reset email');
      return false;
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const quickLoginAsDemo = async () => {
    return login('demo@freshsip.com', 'demo123');
  };

  const quickLoginAsAdmin = async () => {
    return login('admin@freshsip.com', 'admin123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        addresses,
        loading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile,
        resetPassword,
        quickLoginAsDemo,
        quickLoginAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
