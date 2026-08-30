'use client';

import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();
      }}
      className="text-slate-300 hover:text-white"
      title="Wyloguj"
    >
      ⎋
    </button>
  );
}
