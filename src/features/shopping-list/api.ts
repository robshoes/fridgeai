import { supabase } from '../../services/supabase/client';
import type { Tables } from '../../services/supabase/types';

export type ShoppingListItem = Tables<'shopping_list_items'>;

export async function listShoppingListItems(userId: string) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createShoppingListItem(userId: string, name: string) {
  const { error } = await supabase
    .from('shopping_list_items')
    .insert({ user_id: userId, name, source: 'manual' });
  if (error) throw error;
}

export async function setShoppingListItemChecked(id: string, isChecked: boolean) {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: isChecked })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteShoppingListItem(id: string) {
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
  if (error) throw error;
}
