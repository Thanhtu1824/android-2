import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://yvphjvmlvimizgodzpcw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cGhqdm1sdmltaXpnb2R6cGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTAwMzMsImV4cCI6MjA4MDMyNjAzM30.gPiWf29LNH8uVhfDC8Ty9v0RCIjP8eb6cVu2shyZLrE' // khóa anon của bạn
);
