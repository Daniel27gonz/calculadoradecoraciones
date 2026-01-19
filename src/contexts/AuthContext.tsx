import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  business_name: string | null;
  logo_url: string | null;
  currency: string;
  default_hourly_rate: number;
  mode: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  approvalStatus: ApprovalStatus;
  loading: boolean;
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
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
            fetchApprovalStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
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

  const fetchApprovalStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_approval_status')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching approval status:', error);
      return;
    }

    if (data) {
      setApprovalStatus(data.status as ApprovalStatus);
    }
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

    // Update profile with name after signup
    if (data.user) {
      setTimeout(async () => {
        await supabase
          .from('profiles')
          .update({ name })
          .eq('user_id', data.user!.id);
      }, 500);
    }

    toast({
      title: "¡Registro exitoso!",
      description: "Tu cuenta ha sido creada. Espera la aprobación para acceder."
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

    // Check approval status after sign in
    if (data.user) {
      const { data: statusData } = await supabase
        .from('user_approval_status')
        .select('status')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (statusData?.status === 'approved') {
        toast({
          title: "¡Hola de nuevo!",
          description: "Has iniciado sesión correctamente."
        });
      } else if (statusData?.status === 'rejected') {
        toast({
          title: "Acceso denegado",
          description: "Tu cuenta ha sido rechazada.",
          variant: "destructive"
        });
      }
      // For pending, we don't show toast as the PendingApproval page will show
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
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
      approvalStatus,
      loading,
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
