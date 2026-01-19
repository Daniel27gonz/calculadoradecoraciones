import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Check, X, Clock, Users, UserCheck, UserX, Shield, Loader2 } from 'lucide-react';

interface UserWithApproval {
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: {
    name: string | null;
    business_name: string | null;
  };
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  const [users, setUsers] = useState<UserWithApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
        toast.error('No tienes permisos de administrador');
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch approval statuses
      const { data: approvalData, error: approvalError } = await supabase
        .from('user_approval_status')
        .select('*')
        .order('created_at', { ascending: false });

      if (approvalError) throw approvalError;

      // Fetch profiles for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, business_name');

      if (profilesError) throw profilesError;

      // Combine data
      const combinedUsers = approvalData.map(approval => ({
        ...approval,
        profile: profilesData?.find(p => p.user_id === approval.user_id)
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    try {
      setUpdating(userId);
      
      const { error } = await supabase
        .from('user_approval_status')
        .update({ status: newStatus })
        .eq('user_id', userId);

      if (error) throw error;

      setUsers(prev => 
        prev.map(u => 
          u.user_id === userId ? { ...u, status: newStatus } : u
        )
      );

      toast.success(
        newStatus === 'approved' 
          ? 'Usuario aprobado correctamente' 
          : 'Usuario rechazado'
      );
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><UserCheck className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><UserX className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
    }
  };

  const filterUsers = (status: string) => {
    if (status === 'all') return users;
    return users.filter(u => u.status === status);
  };

  const counts = {
    all: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    rejected: users.filter(u => u.status === 'rejected').length,
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/20 rounded-xl">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
            <p className="text-muted-foreground">Gestiona los usuarios y sus permisos</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{counts.all}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{counts.pending}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{counts.approved}</p>
                <p className="text-sm text-muted-foreground">Aprobados</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <UserX className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{counts.rejected}</p>
                <p className="text-sm text-muted-foreground">Rechazados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Usuarios Registrados</CardTitle>
            <CardDescription>Aprueba o rechaza solicitudes de acceso</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="pending">Pendientes ({counts.pending})</TabsTrigger>
                <TabsTrigger value="approved">Aprobados ({counts.approved})</TabsTrigger>
                <TabsTrigger value="rejected">Rechazados ({counts.rejected})</TabsTrigger>
                <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
              </TabsList>

              {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filterUsers(tab).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay usuarios en esta categoría
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Negocio</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha Registro</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filterUsers(tab).map((userItem) => (
                            <TableRow key={userItem.user_id}>
                              <TableCell className="font-medium">
                                {userItem.profile?.name || 'Sin nombre'}
                              </TableCell>
                              <TableCell>
                                {userItem.profile?.business_name || '-'}
                              </TableCell>
                              <TableCell>{getStatusBadge(userItem.status)}</TableCell>
                              <TableCell>
                                {new Date(userItem.created_at).toLocaleDateString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                  {userItem.status !== 'approved' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                                      onClick={() => updateUserStatus(userItem.user_id, 'approved')}
                                      disabled={updating === userItem.user_id}
                                    >
                                      {updating === userItem.user_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                  {userItem.status !== 'rejected' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                      onClick={() => updateUserStatus(userItem.user_id, 'rejected')}
                                      disabled={updating === userItem.user_id}
                                    >
                                      {updating === userItem.user_id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <X className="w-4 h-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
