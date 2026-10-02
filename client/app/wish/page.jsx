'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';

function WishStudio() {
  const params = useSearchParams();
  const contactId = params.get('contactId');
  const [tones, setTones] = useState([]);
  const [contact, setContact] = useState(null);
  const [tone, setTone] = useState('friend');
  const [wish, setWish] = useState('');
  const [gifts, setGifts] = useState(null);
  const [scheduled, setScheduled] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/wishes/tones').then((d) => setTones(d.tones)).catch(() => {});
    if (contactId) api(`/contacts/${contactId}`).then(setContact).catch(() => {});
  }, [contactId]);

  const generate = async () => {
    setBusy(true); setError(''); setScheduled(null);
    try {
      const [w, g] = await Promise.all([
        api('/wishes/generate', { method: 'POST', body: { contactId, tone } }),
        api(`/gifts/suggest/${contactId}`),
      ]);
      setWish(w.text); setGifts(g);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const schedule = async () => {
    setBusy(true); setError('');
    try {
      const res = await api('/wishes/schedule', { method: 'POST', body: { contactId, tone } });
      setScheduled(res.runAt);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (!contact) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold">Wish studio</h1>
      <p className="mb-6 text-sm text-slate-500">For <strong>{contact.name}</strong> · {contact.day}/{contact.month}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        {tones.map((t) => (
          <button key={t} onClick={() => setTone(t)}
            className={`rounded-full border px-3 py-1 text-sm capitalize ${tone === t ? 'border-rose-500 bg-rose-500 text-white' : 'hover:border-rose-400'}`}>
            {t}
          </button>
        ))}
      </div>

      <button onClick={generate} disabled={busy}
        className="mb-4 rounded bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600 disabled:opacity-50">
        {busy ? 'Thinking…' : '✨ Generate wish + gift ideas'}
      </button>
      {error && <p className="mb-4 text-sm text-rose-600">{error}</p>}

      {wish && (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap rounded-lg border bg-white p-4 text-sm">{wish}</div>

          {gifts && gifts.budget.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <p className="mb-2 text-sm font-semibold">Gift ideas {gifts.matchedInterest && <span className="font-normal text-slate-500">(they love {gifts.matchedInterest})</span>}</p>
              <ul className="list-disc pl-5 text-sm text-slate-600">
                {[...gifts.budget, ...gifts.premium].map((g) => <li key={g}>{g}</li>)}
              </ul>
            </div>
          )}

          <button onClick={schedule} disabled={busy}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50">
            🕛 Schedule midnight auto-wish
          </button>
          {scheduled && (
            <p className="text-sm text-emerald-600">
              Scheduled for {new Date(scheduled).toLocaleString()} — Bondly will deliver it at exactly 12:00 AM.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function WishPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <WishStudio />
    </Suspense>
  );
}
