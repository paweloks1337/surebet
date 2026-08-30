'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BonusQuestionCard({
  question,
  myAnswer,
}: {
  question: any;
  myAnswer: any;
}) {
  const router = useRouter();
  const [answer, setAnswer] = useState(myAnswer?.answer || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deadlinePassed = new Date(question.deadline).getTime() < Date.now();
  const canAnswer = question.status === 'open' && !deadlinePassed;

  const submit = async () => {
    if (!answer) return;
    setSaving(true);
    setError(null);
    const res = await fetch('/api/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus_question_id: question.id, answer }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Błąd zapisu.');
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-medium">{question.question}</p>
        <span className="text-xs font-semibold text-usopen-blue">{question.points} pkt</span>
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Deadline: {new Date(question.deadline).toLocaleString('pl-PL')}
      </p>

      {question.status === 'resolved' && (
        <p className="text-sm">
          Poprawna odpowiedź: <strong>{question.correct_answer}</strong>
          {myAnswer && (
            <span className={`ml-2 font-semibold ${myAnswer.points ? 'text-green-700' : 'text-red-500'}`}>
              {myAnswer.points ? `+${myAnswer.points} pkt` : '0 pkt'}
            </span>
          )}
        </p>
      )}

      {question.status === 'open' && (
        <>
          {question.options ? (
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt: string) => (
                <button
                  key={opt}
                  disabled={!canAnswer}
                  onClick={() => setAnswer(opt)}
                  className={`rounded px-3 py-1.5 text-sm ${
                    answer === opt ? 'bg-usopen-blue text-white' : 'border bg-white'
                  } disabled:opacity-50`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              disabled={!canAnswer}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Twoja odpowiedź"
              className="w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
            />
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          {canAnswer && (
            <button
              onClick={submit}
              disabled={saving || !answer}
              className="mt-2 rounded bg-usopen-navy px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Zapisuję...' : myAnswer ? 'Zmień odpowiedź' : 'Zapisz odpowiedź'}
            </button>
          )}
          {!canAnswer && !myAnswer && (
            <p className="text-sm text-amber-600">Czas na odpowiedź minął.</p>
          )}
        </>
      )}
    </div>
  );
}
