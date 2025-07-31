import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Profile } from '../lib/supabase';

interface User extends Profile {}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to prevent infinite loading

  useEffect(() => {
    // Skip auth initialization entirely if Supabase not configured
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, running in demo mode');
      return;
    }

    console.log('Setting up auth state listener...');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      try {
        if (session?.user) {
          console.log('User session found, fetching profile...');
          await fetchUserProfile(session.user);
        } else {
          console.log('No user session, clearing user state');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    if (!authUser || !isSupabaseConfigured()) return;
    
    console.log('Fetching profile for user:', authUser.id);
    
    try {
      // Add timeout to profile fetch
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]);

      console.log('Profile query result:', { profile, error });
      
      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (profile) {
        console.log('Profile found, setting user:', profile);
        setUser(profile);
      } else {
        console.log('No profile found, will create fallback user');
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
    
    // Always create a fallback user to ensure login works
    console.log('Creating fallback user to ensure login works');
    const fallbackUser = {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      created_at: authUser.created_at,
      updated_at: authUser.updated_at || authUser.created_at
    };
    console.log('Setting fallback user:', fallbackUser);
    setUser(fallbackUser);
  };

  const login = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Please connect to Supabase first');
    }
    
    setLoading(true);
    try {
      console.log('Starting login process for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase login error:', error.message, error);
        throw error;
      }

      console.log('Login successful, user data:', data.user);
      if (data.user) {
        await fetchUserProfile(data.user);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      throw new Error('Please connect to Supabase first');
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Supabase registration error:', error);
        throw error;
      }

      if (data.user) {
        await fetchUserProfile(data.user);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(console.error);
    }
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    console.log('Updating user with:', updates);
    if (user) {
      const updatedUser = { ...user, ...updates };
      console.log('Updated user state:', updatedUser);
      setUser(updatedUser);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}