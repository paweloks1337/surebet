'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BonusAdminCard({ question }: { question: any }) {
  const router = useRouter();
  const [deadline, setDeadline] = useState(
    new Date(question.deadline).toISOString().slice(0, 16)
  );
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer || '');
  const [saving, setSaving] = useState(false);

  const patch = async (body: any) => {
    setSaving(true);
    await fetch(`/api/admin/bonus/${question.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm('Usunąć to pytanie razem z odpowiedziami?')) return;
    await fetch(`/api/admin/bonus/${question.id}`, { method: 'DELETE' });
    router.refresh();
  };

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium">{question.question}</p>
        <span
          className={`rounded px-2 py-0.5 text-xs ${
            question.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-100'
          }`}
        >
          {question.status}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="text-xs text-slate-500">
          Deadline
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="ml-1 rounded border px-2 py-1 text-sm"
          />
        </label>
        <button
          onClick={() => patch({ deadline: new Date(deadline).toISOString() })}
          disabled={saving}
          className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-white"
        >
          Zapisz deadline
        </button>
      </div>

      {question.status === 'open' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="Poprawna odpowiedź"
            className="rounded border px-2 py-1 text-sm"
          />
          <button
            onClick={() => patch({ correct_answer: correctAnswer })}
            disabled={saving || !correctAnswer}
            className="rounded bg-green-700 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            Rozstrzygnij i przyznaj punkty
          </button>
        </div>
      )}

      {question.status === 'resolved' && (
        <p className="mt-2 text-sm text-slate-600">
          Poprawna odpowiedź: <strong>{question.correct_answer}</strong>
        </p>
      )}

      <button onClick={remove} className="mt-2 text-xs text-red-600 underline">
        Usuń pytanie
      </button>
    </div>
  );
}
