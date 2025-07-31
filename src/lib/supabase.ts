import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a default client even if not configured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key' &&
    supabaseUrl.includes('supabase.co'));
};

// Database types
export interface Profile {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SentimentAnalysis {
  id: string;
  user_id: string;
  type: 'reddit' | 'text';
  content: string;
  url?: string;
  results: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
  analysis: Array<{
    text: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
  }>;
  created_at: string;
}