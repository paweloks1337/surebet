'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddBonusForm() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [points, setPoints] = useState(5);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    const options = optionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await fetch('/api/admin/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        options,
        points,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error || 'Błąd zapisu.');
      return;
    }
    setQuestion('');
    setOptionsText('');
    setDeadline('');
    router.refresh();
  };

  return (
    <div className="space-y-2 rounded-lg border bg-white p-4">
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Treść pytania, np. Kto wygra turniej mężczyzn?"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <input
        value={optionsText}
        onChange={(e) => setOptionsText(e.target.value)}
        placeholder="Opcje oddzielone przecinkiem (puste = odpowiedź tekstowa)"
        className="w-full rounded border px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <label className="flex-1 text-xs text-slate-500">
          Punkty
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>
        <label className="flex-1 text-xs text-slate-500">
          Deadline
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        onClick={submit}
        disabled={saving || !question || !deadline}
        className="rounded bg-usopen-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? 'Dodaję...' : 'Dodaj pytanie'}
      </button>
    </div>
  );
}
