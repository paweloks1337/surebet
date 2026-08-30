'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddMatchForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    round: '',
    player1: '',
    player2: '',
    scheduled_at: '',
    deadline: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error || 'Błąd zapisu.');
      return;
    }
    setForm({ round: '', player1: '', player2: '', scheduled_at: '', deadline: '' });
    router.refresh();
  };

  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border bg-white p-4 sm:grid-cols-2">
      <input
        placeholder="Runda (np. 1R, QF, SF, F)"
        value={form.round}
        onChange={(e) => setForm({ ...form, round: e.target.value })}
        className="rounded border px-3 py-2 text-sm"
      />
      <div />
      <input
        placeholder="Gracz 1"
        value={form.player1}
        onChange={(e) => setForm({ ...form, player1: e.target.value })}
        className="rounded border px-3 py-2 text-sm"
      />
      <input
        placeholder="Gracz 2"
        value={form.player2}
        onChange={(e) => setForm({ ...form, player2: e.target.value })}
        className="rounded border px-3 py-2 text-sm"
      />
      <label className="text-xs text-slate-500">
        Start meczu
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
      {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={saving}
        className="col-span-2 rounded bg-usopen-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Dodaję...' : 'Dodaj mecz'}
      </button>
    </div>
  );
}
