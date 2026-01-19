import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  loading: boolean;
  approvalStatus: ApprovalStatus;
  isAdmin: boolean;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  checkApprovalStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const checkApprovalStatus = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_approval_status')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking approval status:', error);
      return;
    }

    if (data) {
      setApprovalStatus(data.status as ApprovalStatus);
    } else {
      // If no approval status exists, create one as pending
      const { error: insertError } = await supabase
        .from('user_approval_status')
        .insert({ user_id: user.id, status: 'pending' });
      
      if (!insertError) {
        setApprovalStatus('pending');
      }
    }
  }, [user]);

  const checkAdminRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!error && data) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, []);

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
          }, 0);
        } else {
          setProfile(null);
          setApprovalStatus(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check approval status and admin role when user changes
  useEffect(() => {
    if (user) {
      checkApprovalStatus();
      checkAdminRole(user.id);
    }
  }, [user, checkApprovalStatus, checkAdminRole]);

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
      description: "Tu cuenta ha sido creada. Está pendiente de aprobación."
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

    // Check approval status
    if (data.user) {
      const { data: approvalData } = await supabase
        .from('user_approval_status')
        .select('status')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (approvalData?.status === 'pending') {
        toast({
          title: "Cuenta en revisión",
          description: "Tu cuenta aún no ha sido aprobada. Por favor espera la aprobación."
        });
        return { error: null };
      }

      if (approvalData?.status === 'rejected') {
        toast({
          title: "Acceso denegado",
          description: "Tu solicitud de acceso ha sido rechazada.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        return { error: new Error('Access denied') };
      }
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
    setApprovalStatus(null);
    setIsAdmin(false);
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
      approvalStatus,
      isAdmin,
      signUp,
      signIn,
      signOut,
      updateProfile,
      checkApprovalStatus
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
