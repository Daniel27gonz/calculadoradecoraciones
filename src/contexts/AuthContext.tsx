import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  business_name: string | null;
  logo_url: string | null;
  currency: string;
  default_hourly_rate: number;
  mode: string;
  events_per_month: number;
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  approvalStatus: ApprovalStatus;
  isApproved: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshApprovalStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const { toast } = useToast();
  const restorationAttemptedRef = useRef<Set<string>>(new Set());

  const isApproved = approvalStatus === 'approved';

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchUserRole(session.user.id);
            fetchApprovalStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setApprovalStatus(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchUserRole(session.user.id);
        fetchApprovalStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setProfile(data as Profile);
    }
  };

  // Function to attempt data restoration for returning users
  const attemptDataRestoration = async (accessToken: string, userId: string) => {
    // Only attempt once per user per session
    if (restorationAttemptedRef.current.has(userId)) {
      return;
    }
    restorationAttemptedRef.current.add(userId);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/restore-user-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error('Data restoration request failed:', response.status);
        return;
      }

      const result = await response.json();
      
      if (result.restored === true) {
        const totalRestored = 
          (result.quotes || 0) + 
          (result.materials || 0) + 
          (result.transactions || 0) + 
          (result.packages || 0);

        if (totalRestored > 0) {
          toast({
            title: "¡Datos restaurados!",
            description: "Hemos restaurado tu información automáticamente. Ya puedes continuar usando la app con normalidad.",
            duration: 6000,
          });
          
          // Refresh profile to get restored data
          await fetchProfile(userId);
        }
      }
    } catch (error) {
      console.error('Error attempting data restoration:', error);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error fetching user role:', error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(!!data);
  };

  const fetchApprovalStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_approval_status')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching approval status:', error);
      setApprovalStatus(null);
      return;
    }

    setApprovalStatus(data?.status as ApprovalStatus || null);
  };

  const refreshApprovalStatus = async () => {
    if (user) {
      await fetchApprovalStatus(user.id);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Error al registrarse",
        description: error.message === 'User already registered' 
          ? 'Este correo ya está registrado. Intenta iniciar sesión.'
          : error.message,
        variant: "destructive"
      });
      return { error };
    }

    // Update profile with name and email after signup
    if (data.user) {
      setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ name, email })
          .eq('user_id', data.user!.id);
      }, 500);

      // Attempt to restore old data for returning users
      if (data.session) {
        setTimeout(() => {
          attemptDataRestoration(data.session!.access_token, data.user!.id);
        }, 1500);
      }
    }

    toast({
      title: "¡Registro exitoso!",
      description: "Tu cuenta está pendiente de aprobación por el administrador."
    });

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message,
        variant: "destructive"
      });
      return { error };
    }

    // Attempt to restore old data for returning users
    if (data.session) {
      setTimeout(() => {
        attemptDataRestoration(data.session.access_token, data.user.id);
      }, 1000);
    }

    toast({
      title: "¡Hola de nuevo!",
      description: "Has iniciado sesión correctamente."
    });

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setApprovalStatus(null);
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente."
    });
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil.",
        variant: "destructive"
      });
      return;
    }

    setProfile(prev => prev ? { ...prev, ...updates } : null);
    toast({
      title: "Guardado",
      description: "Tu perfil ha sido actualizado."
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isAdmin,
      approvalStatus,
      isApproved,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshApprovalStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
