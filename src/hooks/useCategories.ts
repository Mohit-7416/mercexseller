import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, subcategoriesRes] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('subcategories').select('*').order('name')
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (subcategoriesRes.error) throw subcategoriesRes.error;

        setCategories(categoriesRes.data || []);
        setSubcategories(subcategoriesRes.data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSubcategoriesByCategory = (categoryId: string) => {
    return subcategories.filter(sub => sub.category_id === categoryId);
  };

  return { categories, subcategories, loading, getSubcategoriesByCategory };
};
