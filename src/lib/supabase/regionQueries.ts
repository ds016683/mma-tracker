import { supabase } from './client';

export interface RegionRow {
  region_id: number;
  region_name: string;
  networks_of_interest: string;
  v7_coverage: string;
  v8_coverage: string;
  areas_of_opportunity: string;
  updated_at: string;
}

export async function fetchAllRegions(): Promise<RegionRow[]> {
  const { data, error } = await supabase
    .from('region_data')
    .select('*')
    .order('region_id');
  if (error) throw error;
  return data as RegionRow[];
}

export async function upsertRegion(
  row: Partial<RegionRow> & { region_id: number }
): Promise<void> {
  const { error } = await supabase
    .from('region_data')
    .upsert({ ...row, updated_at: new Date().toISOString() });
  if (error) throw error;
}
