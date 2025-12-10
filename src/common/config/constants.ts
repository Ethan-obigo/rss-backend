if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL environment variable is required');
}
if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY environment variable is required');
}

export const SUPABASE_URL: string = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY: string = process.env.SUPABASE_ANON_KEY;
export const BUCKET_NAME: string =
  process.env.SUPABASE_BUCKET_NAME || 'youtube-rss';

export const SPOTIFY_CLIENT_ID: string = process.env.SPOTIFY_CLIENT_ID || '';
export const SPOTIFY_CLIENT_SECRET: string =
  process.env.SPOTIFY_CLIENT_SECRET || '';
