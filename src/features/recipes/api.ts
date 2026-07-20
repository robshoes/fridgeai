import { supabase } from '../../services/supabase/client';
import type { Tables } from '../../services/supabase/types';

export type RecipeCategory =
  'primo' | 'secondo' | 'contorno' | 'insalata' | 'zuppa' | 'dolce' | 'colazione' | 'altro';
export type RecipeDifficulty = 'facile' | 'media' | 'difficile';
export type RecipeIngredient = { name: string; note: string; have: boolean };
export type Recipe = {
  title: string;
  category: RecipeCategory;
  prep_time_minutes: number;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  steps: string[];
};

export type FavoriteRecipe = Tables<'user_recipe_favorites'>;

export async function generateRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase.functions.invoke('generate-recipes', { body: {} });
  if (error) throw error;
  return (data as { recipes: Recipe[] }).recipes;
}

export async function listFavorites(userId: string) {
  const { data, error } = await supabase
    .from('user_recipe_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addFavorite(userId: string, recipe: Recipe) {
  const { error } = await supabase
    .from('user_recipe_favorites')
    .insert({ user_id: userId, recipe_snapshot: recipe });
  if (error) throw error;
}

export async function removeFavorite(id: string) {
  const { error } = await supabase.from('user_recipe_favorites').delete().eq('id', id);
  if (error) throw error;
}
