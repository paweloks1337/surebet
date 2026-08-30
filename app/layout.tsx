import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { supabaseServer } from '@/lib/supabaseServer';
import { isAdminDiscordId } from '@/lib/isAdmin';

export const metadata: Metadata = {
  title: 'US Open Typer 2026',
  description: 'Typuj mecze US Open ze znajomymi',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { username: string; avatar_url: string | null; discord_id: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, discord_id')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const admin = isAdminDiscordId(profile?.discord_id);

  return (
    <html lang="pl">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar profile={profile} isLoggedIn={!!user} isAdmin={admin} />
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
