'use client';

import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LoginPage() {
  const supabase = supabaseBrowser();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-xl border bg-white p-8 text-center shadow-sm">
      <h1 className="mb-2 text-2xl font-bold">Witaj w US Open Typer 🎾</h1>
      <p className="mb-6 text-slate-600">
        Zaloguj się przez Discorda - Twój nick i avatar zostaną ustawione automatycznie.
      </p>
      <button
        onClick={handleLogin}
        className="w-full rounded-lg bg-[#5865F2] px-4 py-3 font-semibold text-white hover:opacity-90"
      >
        Zaloguj przez Discord
      </button>
    </div>
  );
}
