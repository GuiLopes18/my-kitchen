import { createClient } from "@supabase/supabase-js";

// Variáveis VITE_* são públicas no navegador. Use apenas a chave publishable, nunca service_role.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY em .env.local.");
}

// Cliente compartilhado pelas telas e serviços.
export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
