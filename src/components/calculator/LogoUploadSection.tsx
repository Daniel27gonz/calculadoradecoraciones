import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function LogoUploadSection() {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'El logo debe ser menor a 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor sube una imagen (JPG, PNG, GIF, WebP)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(fileName);

      // Add timestamp to bust cache
      const logoUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      await updateProfile({ logo_url: logoUrlWithCache });

      toast({
        title: '¡Logo actualizado!',
        description: 'Tu logo se mostrará en las cotizaciones',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el logo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    await updateProfile({ logo_url: null });
    toast({
      title: 'Logo eliminado',
      description: 'Se usará el ícono por defecto en las cotizaciones',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🏷️</span>
          Logo de tu negocio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Logo Preview */}
          <div className="relative w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
            {profile?.logo_url ? (
              <>
                <img
                  src={profile.logo_url}
                  alt="Logo del negocio"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
                  title="Eliminar logo"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={handleUploadClick}
              disabled={uploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Subiendo...' : profile?.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              JPG, PNG, GIF o WebP. Máx 5MB.
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-3">
          Este logo aparecerá en tus cotizaciones cuando las compartas o descargues.
        </p>
      </CardContent>
    </Card>
  );
}
