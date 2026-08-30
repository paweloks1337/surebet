import { createClient } from '@supabase/supabase-js';

// UWAGA: ten klient omija RLS (service_role). Używaj TYLKO w kodzie server-side
// (route handlers /api/..., nigdy w komponentach klienckich) i tylko po weryfikacji
// że wywołujący jest adminem albo że to zaufany cron.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
