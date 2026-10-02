'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

export default function Dashboard() {
  const [upcoming, setUpcoming] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/contacts/upcoming')
      .then(setUpcoming)
      .catch((e) => setError(e.message));
  }, []);

  const urgent = (d) => (d <= 7 ? 'text-rose-600 font-semibold' : 'text-slate-600');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Upcoming birthdays</h1>
        <Link href="/contacts/new" className="rounded bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600">
          + Add someone
        </Link>
      </div>

      {error && <p className="text-sm text-rose-600">{error} — try logging in again.</p>}

      {!error && upcoming.length === 0 && (
        <p className="rounded border border-dashed p-8 text-center text-sm text-slate-500">
          No birthdays in the next 60 days. Add the people you care about. 💛
        </p>
      )}

      <ul className="space-y-3">
        {upcoming.map((c) => (
          <li key={c._id} className="flex items-center justify-between rounded-lg border bg-white p-4">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-slate-500 capitalize">{c.relationship} · {c.interests.join(', ') || 'no interests yet'}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`text-sm ${urgent(c.daysLeft)}`}>
                {c.daysLeft === 0 ? 'Today! 🎂' : c.daysLeft === 1 ? 'Tomorrow' : `in ${c.daysLeft} days`}
              </span>
              <Link href={`/wish?contactId=${c._id}`} className="rounded border px-3 py-1.5 text-sm hover:border-rose-400 hover:text-rose-500">
                Wish studio
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
