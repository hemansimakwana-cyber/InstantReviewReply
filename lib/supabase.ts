import { createClient } from "@supabase/supabase-js";

// SERVER-SIDE ONLY. Uses the service key, so never import this in a client component.
export const supabase = createClient(
  process.env.SUPABASE_URL ?? "",
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  { auth: { persistSession: false } }
);