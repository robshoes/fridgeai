import { supabase } from '../../services/supabase/client';
import type { Tables } from '../../services/supabase/types';

export type ShoppingListItem = Tables<'shopping_list_items'>;
export type ShoppingListSource = 'manual' | 'auto_from_recipe';

export async function listShoppingListItems(userId: string) {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

function normalizeName(name: string) {
  return name.trim().toLowerCase();
}

// PRD §Deduplica lista della spesa: case-insensitive/trimmed name match
// against every existing item (checked or not — a duplicate row is
// clutter either way). No quantity/unit merging: neither the manual-add
// UI nor recipe ingredients carry a normalized quantity to sum.
export async function addShoppingListItem(
  userId: string,
  name: string,
  source: ShoppingListSource = 'manual',
): Promise<{ added: boolean }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { added: false };
  }

  const { data: existing, error: selectError } = await supabase
    .from('shopping_list_items')
    .select('name')
    .eq('user_id', userId);
  if (selectError) throw selectError;

  const normalized = normalizeName(trimmed);
  const alreadyPresent = (existing ?? []).some((item) => normalizeName(item.name) === normalized);
  if (alreadyPresent) {
    return { added: false };
  }

  const { error: insertError } = await supabase
    .from('shopping_list_items')
    .insert({ user_id: userId, name: trimmed, source });
  if (insertError) throw insertError;
  return { added: true };
}

// Sequential (not Promise.all): each call must see the previous one's
// insert to also dedupe within the same batch (e.g. two recipe
// ingredients normalizing to the same name).
export async function addIngredientsToShoppingList(
  userId: string,
  names: string[],
  source: ShoppingListSource,
): Promise<{ addedCount: number; skippedCount: number }> {
  let addedCount = 0;
  let skippedCount = 0;
  for (const name of names) {
    const { added } = await addShoppingListItem(userId, name, source);
    if (added) {
      addedCount += 1;
    } else {
      skippedCount += 1;
    }
  }
  return { addedCount, skippedCount };
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
