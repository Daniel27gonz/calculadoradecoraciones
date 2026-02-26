import { useEffect, useState, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Database, RefreshCw, Users, Search } from 'lucide-react';

interface UserProfile {
  id: string;
  user_id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
}

interface ApprovalStatus {
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  updated_at: string;
}

interface UserWithStatus extends UserProfile {
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  status_updated_at: string;
}

export default function AdminDatabase() {
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.status.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch approval statuses
      const { data: approvalStatuses, error: statusError } = await supabase
        .from('user_approval_status')
        .select('*');

      if (statusError) throw statusError;

      // Create a map of user_id to status
      const statusMap = new Map<string, ApprovalStatus>();
      approvalStatuses?.forEach(status => {
        statusMap.set(status.user_id, status as ApprovalStatus);
      });

      // Combine profiles with statuses
      const usersWithStatus: UserWithStatus[] = (profiles || []).map(profile => {
        const status = statusMap.get(profile.user_id);
        return {
          ...profile,
          email: profile.email || 'Sin email',
          status: status?.status || 'pending',
          status_updated_at: status?.updated_at || profile.created_at
        };
      });

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios.",
        variant: "destructive"
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();

      // Subscribe to realtime changes
      const profilesChannel = supabase
        .channel('profiles-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles' },
          () => fetchUsers()
        )
        .subscribe();

      const statusChannel = supabase
        .channel('approval-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_approval_status' },
          () => fetchUsers()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(profilesChannel);
        supabase.removeChannel(statusChannel);
      };
    }
  }, [isAdmin]);

  const updateUserStatus = async (userId: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('user_approval_status')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: newStatus === 'approved' ? "Usuario aprobado" : "Usuario rechazado",
        description: `El estado del usuario ha sido actualizado a ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}.`
      });

      // Update local state
      setUsers(prev => prev.map(u => 
        u.user_id === userId 
          ? { ...u, status: newStatus, status_updated_at: new Date().toISOString() }
          : u
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario.",
        variant: "destructive"
      });
    } finally {
      setUpdatingUser(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      default:
        return <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not logged in or not admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 pt-16 md:pt-20">
      <main className="container max-w-4xl mx-auto px-4 py-6">
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Database className="w-5 h-5 text-primary shrink-0" />
              <CardTitle className="text-base sm:text-xl truncate">Database - Profiles</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUsers}
              disabled={loadingUsers}
              className="shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Actualizar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 py-4 bg-muted/50 border-b">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {filteredUsers.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="font-semibold">Email</TableHead>
                      <TableHead className="font-semibold">Nombre</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold">Creado</TableHead>
                      <TableHead className="font-semibold">Actualizado</TableHead>
                      <TableHead className="font-semibold text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) => (
                      <TableRow key={userItem.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium text-sm">
                          {userItem.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {userItem.name || 'Sin nombre'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(userItem.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(userItem.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(userItem.status_updated_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => updateUserStatus(userItem.user_id, 'approved')}
                              disabled={userItem.status === 'approved' || updatingUser === userItem.user_id}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => updateUserStatus(userItem.user_id, 'rejected')}
                              disabled={userItem.status === 'rejected' || updatingUser === userItem.user_id}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y">
                {filteredUsers.map((userItem) => (
                  <div key={userItem.id} className="px-3 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{userItem.email}</p>
                        <p className="text-xs text-muted-foreground">{userItem.name || 'Sin nombre'}</p>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(userItem.status)}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Creado: {formatDate(userItem.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-0 text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => updateUserStatus(userItem.user_id, 'approved')}
                        disabled={userItem.status === 'approved' || updatingUser === userItem.user_id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1 shrink-0" />
                        <span className="truncate">Aprobar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 min-w-0 text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => updateUserStatus(userItem.user_id, 'rejected')}
                        disabled={userItem.status === 'rejected' || updatingUser === userItem.user_id}
                      >
                        <XCircle className="w-4 h-4 mr-1 shrink-0" />
                        <span className="truncate">Rechazar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
