import { supabaseServer } from '@/lib/supabaseServer';
import MatchTabs from '@/components/MatchTabs';

export const dynamic = 'force-dynamic';

export default async function MatchesPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('scheduled_at', { ascending: true });

  const all = matches || [];
  const upcoming = all.filter((m) => m.status === 'upcoming');
  const live = all.filter((m) => m.status === 'live');
  const finished = all
    .filter((m) => m.status === 'finished' || m.status === 'cancelled')
    .reverse();

  let predictionsByMatchId: Record<string, any> = {};
  if (user) {
    const { data: predictions } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id);
    (predictions || []).forEach((p) => {
      predictionsByMatchId[p.match_id] = p;
    });
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Mecze - US Open 2026</h1>
      <MatchTabs
        upcoming={upcoming}
        live={live}
        finished={finished}
        predictionsByMatchId={predictionsByMatchId}
        isLoggedIn={!!user}
      />
    </div>
  );
}
