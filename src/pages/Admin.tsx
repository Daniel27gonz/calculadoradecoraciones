import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Mail,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserWithApproval {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: {
    name: string | null;
    business_name: string | null;
  };
  email?: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithApproval[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    userId: string;
    action: 'approve' | 'reject';
    userName: string;
  }>({ open: false, userId: '', action: 'approve', userName: '' });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    
    // Fetch all approval statuses
    const { data: approvalData, error: approvalError } = await supabase
      .from('user_approval_status')
      .select('*')
      .order('created_at', { ascending: false });

    if (approvalError) {
      console.error('Error fetching users:', approvalError);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive"
      });
      setLoadingUsers(false);
      return;
    }

    // Fetch profiles for all users
    const userIds = approvalData?.map(a => a.user_id) || [];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, name, business_name')
      .in('user_id', userIds);

    // Combine data
    const usersWithProfiles: UserWithApproval[] = (approvalData || []).map(approval => {
      const profile = profilesData?.find(p => p.user_id === approval.user_id);
      return {
        ...approval,
        profile: profile ? { name: profile.name, business_name: profile.business_name } : undefined
      };
    });

    setUsers(usersWithProfiles);
    setLoadingUsers(false);
  };

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('user_approval_status')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Error",
        description: `No se pudo ${status === 'approved' ? 'aprobar' : 'rechazar'} al usuario.`,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: status === 'approved' ? "Usuario aprobado" : "Usuario rechazado",
      description: `El usuario ha sido ${status === 'approved' ? 'aprobado' : 'rechazado'} correctamente.`
    });

    fetchUsers();
  };

  const handleAction = (userId: string, action: 'approve' | 'reject', userName: string) => {
    setConfirmDialog({ open: true, userId, action, userName });
  };

  const confirmAction = async () => {
    await updateUserStatus(
      confirmDialog.userId, 
      confirmDialog.action === 'approve' ? 'approved' : 'rejected'
    );
    setConfirmDialog({ open: false, userId: '', action: 'approve', userName: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Aprobado
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const approvedCount = users.filter(u => u.status === 'approved').length;
  const rejectedCount = users.filter(u => u.status === 'rejected').length;

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-hero py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="font-display text-2xl font-bold">Panel de Administrador</h1>
          </div>
          <p className="text-muted-foreground">Gestiona las solicitudes de acceso de usuarios</p>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-xs text-muted-foreground">Pendientes</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              <div className="text-xs text-muted-foreground">Aprobados</div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
              <div className="text-xs text-muted-foreground">Rechazados</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Users List */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        <Card className="shadow-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Usuarios Registrados
                </CardTitle>
                <CardDescription>
                  {users.length} usuario{users.length !== 1 ? 's' : ''} en total
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUsers}
                disabled={loadingUsers}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="py-8 text-center text-muted-foreground">
                Cargando usuarios...
              </div>
            ) : users.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay usuarios registrados aún.
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((userItem) => (
                  <div 
                    key={userItem.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate">
                          {userItem.profile?.name || 'Sin nombre'}
                        </span>
                        {getStatusBadge(userItem.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{userItem.user_id}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Registrado: {new Date(userItem.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      {userItem.status !== 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400 dark:border-green-800"
                          onClick={() => handleAction(userItem.user_id, 'approve', userItem.profile?.name || 'Usuario')}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Aprobar
                        </Button>
                      )}
                      {userItem.status !== 'rejected' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 dark:border-red-800"
                          onClick={() => handleAction(userItem.user_id, 'reject', userItem.profile?.name || 'Usuario')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rechazar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'approve' ? '¿Aprobar usuario?' : '¿Rechazar usuario?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' 
                ? `¿Estás seguro de que deseas aprobar a "${confirmDialog.userName}"? Podrá acceder a todas las funciones de la aplicación.`
                : `¿Estás seguro de que deseas rechazar a "${confirmDialog.userName}"? No podrá acceder a la aplicación.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={confirmDialog.action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
              }
            >
              {confirmDialog.action === 'approve' ? 'Aprobar' : 'Rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
