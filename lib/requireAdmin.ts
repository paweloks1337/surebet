import { supabaseServer } from '@/lib/supabaseServer';
import { isAdminDiscordId } from '@/lib/isAdmin';

// Zwraca user.id jeśli wywołujący jest adminem, albo null jeśli nie.
// Używaj na początku KAŻDEGO route handlera pod /api/admin/*.
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('discord_id')
    .eq('id', user.id)
    .single();

  if (!isAdminDiscordId(profile?.discord_id)) return null;
  return { userId: user.id };
}
