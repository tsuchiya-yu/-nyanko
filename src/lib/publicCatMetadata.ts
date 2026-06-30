import type { PublicCatMetadataSource } from '../utils/catProfileMetadata';

interface PublicCatMetadataOptions {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
}

export async function fetchPublicCatMetadata(
  path: string,
  { supabaseUrl, supabaseAnonKey }: PublicCatMetadataOptions
): Promise<PublicCatMetadataSource | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are not configured');
  }

  const endpoint = new URL('/rest/v1/cats', supabaseUrl);
  endpoint.searchParams.set('select', 'name,catchphrase,description,image_url,prof_path_id');
  endpoint.searchParams.set('prof_path_id', `eq.${path}`);
  endpoint.searchParams.set('is_public', 'eq.true');
  endpoint.searchParams.set('limit', '1');

  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch cat metadata: ${response.status}`);
  }

  const cats = (await response.json()) as PublicCatMetadataSource[];
  return cats[0] ?? null;
}
