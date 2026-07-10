/**
 * Supabase + API config (same project as lekkeleer-lees web app).
 * Override via .env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://taiwqvydfhlkyjguunrb.supabase.co';

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhaXdxdnlkZmhsa3lqZ3V1bnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTIwNDksImV4cCI6MjA4ODk2ODA0OX0.pnB1kt2kS81Y8jrxyc3Ot2psO1YqEEZr1M8F7aRaSMw';

export const AZURE_VOICES = {
  Adri: 'af-ZA-AdriNeural',
  Willem: 'af-ZA-WillemNeural',
} as const;

export type VoiceName = keyof typeof AZURE_VOICES;
