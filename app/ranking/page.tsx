import { supabaseServer } from '@/lib/supabaseServer';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function RankingPage() {
  const supabase = supabaseServer();
  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')
    .order('total_points', { ascending: false });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Ranking</h1>
      <p className="mb-4 text-sm text-slate-500">
        Aktualizuje się automatycznie po rozliczeniu meczów (co kilka minut).
      </p>
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Gracz</th>
              <th className="px-4 py-2 text-right">Mecze</th>
              <th className="px-4 py-2 text-right">Bonusy</th>
              <th className="px-4 py-2 text-right">Suma</th>
            </tr>
          </thead>
          <tbody>
            {(ranking || []).map((r, i) => (
              <tr key={r.user_id} className="border-t">
                <td className="px-4 py-2 font-semibold">{i + 1}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {r.avatar_url && (
                      <Image
                        src={r.avatar_url}
                        alt={r.username}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    {r.username}
                  </div>
                </td>
                <td className="px-4 py-2 text-right">{r.match_points}</td>
                <td className="px-4 py-2 text-right">{r.bonus_points}</td>
                <td className="px-4 py-2 text-right text-lg font-bold">{r.total_points}</td>
              </tr>
            ))}
            {(!ranking || ranking.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Ranking jest pusty - jeszcze nikt nie zdobył punktów.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
