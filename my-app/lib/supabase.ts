import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yvphjvmlvimizgodzpcw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cGhqdm1sdmltaXpnb2R6cGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NTAwMzMsImV4cCI6MjA4MDMyNjAzM30.gPiWf29LNH8uVhfDC8Ty9v0RCIjP8eb6cVu2shyZLrE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
