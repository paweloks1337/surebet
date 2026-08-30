import { redirect } from 'next/navigation';
import Image from 'next/image';
import { supabaseServer } from '@/lib/supabaseServer';
import BonusQuestionCard from '@/components/BonusQuestionCard';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: predictions } = await supabase
    .from('predictions')
    .select('*, matches(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const { data: ranking } = await supabase
    .from('ranking')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: bonusQuestions } = await supabase
    .from('bonus_questions')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: bonusAnswers } = await supabase
    .from('bonus_answers')
    .select('*')
    .eq('user_id', user.id);

  const bonusAnswersByQuestionId: Record<string, any> = {};
  (bonusAnswers || []).forEach((a) => (bonusAnswersByQuestionId[a.bonus_question_id] = a));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
        {profile?.avatar_url && (
          <Image
            src={profile.avatar_url}
            alt={profile.username}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">{profile?.username}</h1>
          <p className="text-sm text-slate-500">
            Punkty: <strong>{ranking?.total_points ?? 0}</strong> (mecze: {ranking?.match_points ?? 0},
            bonusy: {ranking?.bonus_points ?? 0})
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Pytania bonusowe</h2>
        <div className="space-y-3">
          {(bonusQuestions || []).length === 0 && (
            <p className="text-sm text-slate-400">Admin nie dodał jeszcze żadnych pytań bonusowych.</p>
          )}
          {(bonusQuestions || []).map((q) => (
            <BonusQuestionCard
              key={q.id}
              question={q}
              myAnswer={bonusAnswersByQuestionId[q.id] || null}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Moje typy</h2>
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left text-slate-600">
              <tr>
                <th className="px-4 py-2">Mecz</th>
                <th className="px-4 py-2">Twój typ</th>
                <th className="px-4 py-2">Wynik</th>
                <th className="px-4 py-2 text-right">Punkty</th>
              </tr>
            </thead>
            <tbody>
              {(predictions || []).map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-2">
                    {p.matches.player1} vs {p.matches.player2}
                  </td>
                  <td className="px-4 py-2">
                    {p.predicted_winner === 'player1' ? p.matches.player1 : p.matches.player2}{' '}
                    {p.predicted_sets_p1}:{p.predicted_sets_p2}
                  </td>
                  <td className="px-4 py-2">
                    {p.matches.status === 'finished'
                      ? `${p.matches.sets_p1}:${p.matches.sets_p2}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {p.points ?? '—'}
                  </td>
                </tr>
              ))}
              {(!predictions || predictions.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    Nie wytypowałeś jeszcze żadnego meczu.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
