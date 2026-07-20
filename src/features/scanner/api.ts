import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '../../services/supabase/client';
import type { Tables } from '../../services/supabase/types';

export type ScanItem = Tables<'scan_items'>;

type AnalyzeSuccess = { items: ScanItem[]; lowConfidenceThreshold: number };
type AnalyzeRateLimited = { rateLimited: true; dailyLimit: number };

// Mirrors the Edge Function's own limit (PRD §Controllo dei costi AI).
// Kept in sync manually since the function runs in a separate Deno
// runtime that can't share this module — this copy is display-only; the
// Edge Function is the actual authority that enforces the limit.
const BASE_DAILY_LIMIT = 10;

export async function getScanUsageToday(userId: string): Promise<{ used: number; limit: number }> {
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartIso = todayStart.toISOString();

  const { count: used } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStartIso);

  return { used: used ?? 0, limit: BASE_DAILY_LIMIT };
}

export async function uploadScanPhoto(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from('fridge-scans')
    .upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;

  return path;
}

export async function createScan(userId: string, imagePath: string) {
  const { data, error } = await supabase
    .from('scans')
    .insert({ user_id: userId, image_path: imagePath, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function analyzeScan(scanId: string): Promise<AnalyzeSuccess | AnalyzeRateLimited> {
  const { data, error } = await supabase.functions.invoke('analyze-fridge-photo', {
    body: { scan_id: scanId },
  });

  if (error) {
    if (error instanceof FunctionsHttpError && error.context.status === 429) {
      const body = await error.context.json();
      return { rateLimited: true, dailyLimit: body.dailyLimit };
    }
    throw error;
  }

  return data as AnalyzeSuccess;
}

export async function listScanItems(scanId: string) {
  const { data, error } = await supabase.from('scan_items').select('*').eq('scan_id', scanId);
  if (error) throw error;
  return data;
}

export async function updateScanItemStatus(
  id: string,
  status: 'confirmed' | 'edited' | 'rejected',
) {
  const { error } = await supabase.from('scan_items').update({ status }).eq('id', id);
  if (error) throw error;
}

export async function getLastScan(userId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
