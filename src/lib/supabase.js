import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("[Supabase 초기화] URL:", supabaseUrl ? "설정됨" : "❌ 없음");
console.log("[Supabase 초기화] Key:", supabaseAnonKey ? "설정됨" : "❌ 없음");

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
