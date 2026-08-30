'use client';

import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
import { useRouter } from 'next/navigation';

type Match = {
  id: string;
  round: string | null;
  player1: string;
  player2: string;
  scheduled_at: string | null;
  deadline: string;
  status: string;
  sets_p1: number | null;
  sets_p2: number | null;
  winner: 'player1' | 'player2' | null;
  needs_review: boolean;
};

type Prediction = {
  predicted_winner: 'player1' | 'player2';
  predicted_sets_p1: number;
  predicted_sets_p2: number;
  points: number | null;
};

export default function MatchCard({
  match,
  myPrediction,
  isLoggedIn,
}: {
  match: Match;
  myPrediction: Prediction | null;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [winner, setWinner] = useState<'player1' | 'player2'>(
    myPrediction?.predicted_winner || 'player1'
  );
  const [setsWinner, setSetsWinner] = useState(
    myPrediction
      ? Math.max(myPrediction.predicted_sets_p1, myPrediction.predicted_sets_p2)
      : 2
  );
  const [setsLoser, setSetsLoser] = useState(
    myPrediction
      ? Math.min(myPrediction.predicted_sets_p1, myPrediction.predicted_sets_p2)
      : 0
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deadlinePassed = new Date(match.deadline).getTime() < Date.now();
  const canPredict = isLoggedIn && match.status === 'upcoming' && !deadlinePassed;

  const submit = async () => {
    setSaving(true);
    setError(null);
    const predicted_sets_p1 = winner === 'player1' ? setsWinner : setsLoser;
    const predicted_sets_p2 = winner === 'player2' ? setsWinner : setsLoser;

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        match_id: match.id,
        predicted_winner: winner,
        predicted_sets_p1,
        predicted_sets_p2,
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Nie udało się zapisać typu.');
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
        <span>{match.round || 'US Open 2026'}</span>
        <StatusBadge status={match.status} needsReview={match.needs_review} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold">
          {match.player1} <span className="text-slate-400">vs</span> {match.player2}
        </div>
        {match.status === 'finished' && match.sets_p1 !== null && (
          <div className="text-xl font-bold">
            {match.sets_p1} : {match.sets_p2}
          </div>
        )}
      </div>

      {match.scheduled_at && (
        <p className="mb-2 text-xs text-slate-500">
          Start: {new Date(match.scheduled_at).toLocaleString('pl-PL')}
        </p>
      )}
      <p className="mb-3 text-xs text-slate-500">
        Deadline na typy: {new Date(match.deadline).toLocaleString('pl-PL')}
      </p>

      {!isLoggedIn && match.status === 'upcoming' && (
        <p className="text-sm text-slate-500">Zaloguj się, żeby wytypować ten mecz.</p>
      )}

      {isLoggedIn && canPredict && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="flex gap-2">
            <button
              onClick={() => setWinner('player1')}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
                winner === 'player1' ? 'bg-usopen-blue text-white' : 'bg-white border'
              }`}
            >
              {match.player1}
            </button>
            <button
              onClick={() => setWinner('player2')}
              className={`flex-1 rounded px-3 py-2 text-sm font-medium ${
                winner === 'player2' ? 'bg-usopen-blue text-white' : 'bg-white border'
              }`}
            >
              {match.player2}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Dokładny wynik w setach:</span>
            <select
              value={setsWinner}
              onChange={(e) => setSetsWinner(Number(e.target.value))}
              className="rounded border px-2 py-1"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
            <span>:</span>
            <select
              value={setsLoser}
              onChange={(e) => setSetsLoser(Number(e.target.value))}
              className="rounded border px-2 py-1"
            >
              <option value={0}>0</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
            </select>
            <span className="text-slate-400">(dla zwycięzcy)</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={saving}
            className="w-full rounded bg-usopen-navy px-3 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Zapisuję...' : myPrediction ? 'Zaktualizuj typ' : 'Zapisz typ'}
          </button>
        </div>
      )}

      {isLoggedIn && myPrediction && (
        <p className="mt-2 text-sm text-slate-600">
          Twój typ: <strong>{myPrediction.predicted_winner === 'player1' ? match.player1 : match.player2}</strong>{' '}
          {myPrediction.predicted_sets_p1}:{myPrediction.predicted_sets_p2}
          {myPrediction.points !== null && (
            <span className="ml-2 font-semibold text-green-700">
              (+{myPrediction.points} pkt)
            </span>
          )}
        </p>
      )}

      {isLoggedIn && !canPredict && !myPrediction && match.status !== 'upcoming' && (
        <p className="text-sm text-slate-400">Nie wytypowano tego meczu.</p>
      )}

      {isLoggedIn && deadlinePassed && match.status === 'upcoming' && !myPrediction && (
        <p className="text-sm text-amber-600">Czas na typowanie minął.</p>
      )}
    </div>
  );
}

function StatusBadge({ status, needsReview }: { status: string; needsReview: boolean }) {
  const map: Record<string, string> = {
    upcoming: 'bg-slate-100 text-slate-600',
    live: 'bg-red-100 text-red-700 animate-pulse',
    finished: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-100 text-slate-400',
  };
  const label: Record<string, string> = {
    upcoming: 'Nierozpoczęty',
    live: '🔴 LIVE',
    finished: 'Zakończony',
    cancelled: 'Anulowany',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium ${map[status] || ''}`}>
      {label[status] || status}
      {needsReview && status === 'finished' ? ' · do weryfikacji' : ''}
    </span>
  );
}
