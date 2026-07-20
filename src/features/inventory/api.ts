import { supabase } from '../../services/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '../../services/supabase/types';

export type InventoryItem = Tables<'inventory_items'>;
export type Category = Tables<'categories'>;
export type InventoryItemInsert = TablesInsert<'inventory_items'>;
export type InventoryItemUpdate = TablesUpdate<'inventory_items'>;

export async function listCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name');
  if (error) throw error;
  return data;
}

export async function listInventoryItems(userId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getInventoryItem(id: string) {
  const { data, error } = await supabase.from('inventory_items').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function createInventoryItem(input: InventoryItemInsert) {
  const { error } = await supabase.from('inventory_items').insert(input);
  if (error) throw error;
}

export async function updateInventoryItem(id: string, input: InventoryItemUpdate) {
  const { error } = await supabase.from('inventory_items').update(input).eq('id', id);
  if (error) throw error;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase.from('inventory_items').delete().eq('id', id);
  if (error) throw error;
}
