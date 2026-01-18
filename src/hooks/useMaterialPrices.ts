import { useMemo } from 'react';
import { useMaterials } from './useMaterials';

export interface MaterialPrice {
  name: string;
  price: number;
  category: string;
  categoryName: string;
}

export function useMaterialPrices() {
  const { materials, loading, getCategoriesWithMaterials } = useMaterials();

  // Get a flat list of all materials with prices for easy lookup
  const allMaterialsWithPrices = useMemo((): MaterialPrice[] => {
    const categories = getCategoriesWithMaterials();
    const result: MaterialPrice[] = [];

    categories.forEach((category) => {
      category.materials.forEach((material) => {
        if (material.price > 0) {
          result.push({
            name: material.name,
            price: material.price,
            category: category.id,
            categoryName: category.name,
          });
        }
      });
    });

    return result;
  }, [getCategoriesWithMaterials]);

  // Find price for a material by name (case-insensitive partial match)
  const findMaterialPrice = (name: string): MaterialPrice | undefined => {
    if (!name.trim()) return undefined;

    const normalizedName = name.toLowerCase().trim();

    // First try exact match
    const exactMatch = allMaterialsWithPrices.find(
      (m) => m.name.toLowerCase() === normalizedName
    );
    if (exactMatch) return exactMatch;

    // Then try partial match
    return allMaterialsWithPrices.find(
      (m) => m.name.toLowerCase().includes(normalizedName) ||
             normalizedName.includes(m.name.toLowerCase())
    );
  };

  // Get suggestions based on input
  const getSuggestions = (input: string, limit: number = 10): MaterialPrice[] => {
    if (!input.trim()) return allMaterialsWithPrices.slice(0, limit);

    const normalizedInput = input.toLowerCase().trim();
    
    return allMaterialsWithPrices
      .filter((m) => m.name.toLowerCase().includes(normalizedInput))
      .slice(0, limit);
  };

  return {
    allMaterialsWithPrices,
    findMaterialPrice,
    getSuggestions,
    loading,
  };
}
