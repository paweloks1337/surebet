'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 16);
}

export default function EditMatchForm({ match }: { match: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    round: match.round || '',
    player1: match.player1,
    player2: match.player2,
    scheduled_at: toLocalInput(match.scheduled_at),
    deadline: toLocalInput(match.deadline),
    status: match.status,
  });
  const [result, setResult] = useState({
    winner: match.winner || 'player1',
    sets_p1: match.sets_p1 ?? 2,
    sets_p2: match.sets_p2 ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = async (body: any) => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/match/${match.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error || 'Błąd zapisu.');
      return;
    }
    router.refresh();
  };

  const deleteMatch = async () => {
    if (!confirm('Na pewno usunąć ten mecz razem z wszystkimi typami na niego?')) return;
    await fetch(`/api/admin/match/${match.id}`, { method: 'DELETE' });
    router.push('/admin');
  };

  return (
    <div className="space-y-6">
      {match.needs_review && (
        <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Ten mecz został automatycznie rozliczony przez API na podstawie ostatniego
          zaobserwowanego wyniku live i wymaga Twojej weryfikacji. Sprawdź oficjalny wynik i
          w razie potrzeby popraw poniżej.
        </div>
      )}

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">Dane meczu</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={form.round}
            onChange={(e) => setForm({ ...form, round: e.target.value })}
            placeholder="Runda"
            className="rounded border px-3 py-2 text-sm"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="upcoming">upcoming</option>
            <option value="live">live</option>
            <option value="finished">finished</option>
            <option value="cancelled">cancelled</option>
          </select>
          <input
            value={form.player1}
            onChange={(e) => setForm({ ...form, player1: e.target.value })}
            className="rounded border px-3 py-2 text-sm"
          />
          <input
            value={form.player2}
            onChange={(e) => setForm({ ...form, player2: e.target.value })}
            className="rounded border px-3 py-2 text-sm"
          />
          <label className="text-xs text-slate-500">
            Start
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-slate-500">
            Deadline na typy
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          onClick={() =>
            patch({
              round: form.round,
              player1: form.player1,
              player2: form.player2,
              scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
              deadline: new Date(form.deadline).toISOString(),
              status: form.status,
            })
          }
          disabled={saving}
          className="mt-3 rounded bg-slate-800 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Zapisz dane meczu
        </button>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-2 font-semibold">
          Wynik (ustawienie tutaj nadpisuje wynik z API i przelicza punkty wszystkim graczom)
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={result.winner}
            onChange={(e) => setResult({ ...result, winner: e.target.value })}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="player1">{form.player1} wygrywa</option>
            <option value="player2">{form.player2} wygrywa</option>
          </select>
          <span>Wynik w setach:</span>
          <input
            type="number"
            min={0}
            max={3}
            value={result.sets_p1}
            onChange={(e) => setResult({ ...result, sets_p1: Number(e.target.value) })}
            className="w-16 rounded border px-2 py-1 text-sm"
          />
          <span>:</span>
          <input
            type="number"
            min={0}
            max={3}
            value={result.sets_p2}
            onChange={(e) => setResult({ ...result, sets_p2: Number(e.target.value) })}
            className="w-16 rounded border px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={() =>
            patch({
              winner: result.winner,
              sets_p1: result.sets_p1,
              sets_p2: result.sets_p2,
            })
          }
          disabled={saving}
          className="mt-3 rounded bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Zatwierdź wynik i przelicz punkty
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button onClick={deleteMatch} className="text-sm text-red-600 underline">
        Usuń ten mecz
      </button>
    </div>
  );
}
