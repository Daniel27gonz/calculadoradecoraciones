import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { defaultMaterialCategories } from '@/lib/defaultMaterials';
import { useToast } from '@/hooks/use-toast';

export interface UserMaterial {
  id: string;
  user_id: string;
  category: string;
  name: string;
  price: number;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialWithPrice {
  name: string;
  price: number;
  isCustom: boolean;
  id?: string;
}

export interface CategoryWithMaterials {
  id: string;
  name: string;
  icon: string;
  materials: MaterialWithPrice[];
}

export function useMaterials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<UserMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch user materials from database
  const fetchMaterials = useCallback(async () => {
    if (!user) {
      setMaterials([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_materials')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los materiales',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Get categories with user materials merged
  const getCategoriesWithMaterials = useCallback((): CategoryWithMaterials[] => {
    return defaultMaterialCategories.map((category) => {
      const categoryMaterials: MaterialWithPrice[] = category.materials.map((name) => {
        const userMaterial = materials.find(
          (m) => m.category === category.id && m.name === name
        );
        return {
          name,
          price: userMaterial?.price || 0,
          isCustom: false,
          id: userMaterial?.id,
        };
      });

      // Add custom materials for this category
      const customMaterials = materials
        .filter((m) => m.category === category.id && m.is_custom)
        .map((m) => ({
          name: m.name,
          price: m.price,
          isCustom: true,
          id: m.id,
        }));

      return {
        ...category,
        materials: [...categoryMaterials, ...customMaterials],
      };
    });
  }, [materials]);

  // Update material price
  const updateMaterialPrice = async (
    categoryId: string,
    materialName: string,
    price: number,
    isCustom: boolean = false
  ) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar precios',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);
      const existingMaterial = materials.find(
        (m) => m.category === categoryId && m.name === materialName
      );

      if (existingMaterial) {
        const { error } = await supabase
          .from('user_materials')
          .update({ price })
          .eq('id', existingMaterial.id);

        if (error) throw error;

        setMaterials((prev) =>
          prev.map((m) =>
            m.id === existingMaterial.id ? { ...m, price } : m
          )
        );
      } else {
        const { data, error } = await supabase
          .from('user_materials')
          .insert({
            user_id: user.id,
            category: categoryId,
            name: materialName,
            price,
            is_custom: isCustom,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setMaterials((prev) => [...prev, data]);
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el precio',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add custom material
  const addCustomMaterial = async (categoryId: string, materialName: string) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para agregar materiales',
        variant: 'destructive',
      });
      return false;
    }

    // Check if material already exists
    const exists = materials.find(
      (m) => m.category === categoryId && m.name.toLowerCase() === materialName.toLowerCase()
    );

    if (exists) {
      toast({
        title: 'Material existente',
        description: 'Este material ya existe en esta categoría',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('user_materials')
        .insert({
          user_id: user.id,
          category: categoryId,
          name: materialName,
          price: 0,
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setMaterials((prev) => [...prev, data]);
        toast({
          title: 'Material agregado',
          description: `"${materialName}" se agregó correctamente`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el material',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Delete custom material
  const deleteMaterial = async (materialId: string) => {
    if (!user) return false;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials((prev) => prev.filter((m) => m.id !== materialId));
      toast({
        title: 'Material eliminado',
        description: 'El material se eliminó correctamente',
      });

      return true;
    } catch (error) {
      console.error('Error deleting material:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el material',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Save all pending changes (batch update)
  const saveAllChanges = async (updatedMaterials: { categoryId: string; name: string; price: number; isCustom: boolean }[]) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar cambios',
        variant: 'destructive',
      });
      return false;
    }

    try {
      setSaving(true);

      for (const material of updatedMaterials) {
        const existingMaterial = materials.find(
          (m) => m.category === material.categoryId && m.name === material.name
        );

        if (existingMaterial) {
          await supabase
            .from('user_materials')
            .update({ price: material.price })
            .eq('id', existingMaterial.id);
        } else if (material.price > 0) {
          await supabase
            .from('user_materials')
            .insert({
              user_id: user.id,
              category: material.categoryId,
              name: material.name,
              price: material.price,
              is_custom: material.isCustom,
            });
        }
      }

      await fetchMaterials();

      toast({
        title: 'Cambios guardados',
        description: 'Todos los precios se han actualizado correctamente',
      });

      return true;
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los cambios',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    materials,
    loading,
    saving,
    getCategoriesWithMaterials,
    updateMaterialPrice,
    addCustomMaterial,
    deleteMaterial,
    saveAllChanges,
    refetch: fetchMaterials,
  };
}
