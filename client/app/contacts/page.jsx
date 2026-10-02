'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Contacts() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => { api('/contacts').then(setContacts).catch(() => {}); }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">People you care about</h1>
        <Link href="/contacts/new" className="rounded bg-rose-500 px-4 py-2 text-sm text-white hover:bg-rose-600">+ Add</Link>
      </div>
      {contacts.length === 0 ? (
        <p className="rounded border border-dashed p-8 text-center text-sm text-slate-500">No contacts yet.</p>
      ) : (
        <table className="w-full rounded-lg border bg-white text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="p-3">Name</th><th className="p-3">Birthday</th><th className="p-3">Relationship</th><th className="p-3">Interests</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c._id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3">{c.day} {MONTHS[c.month - 1]}</td>
                <td className="p-3 capitalize">{c.relationship}</td>
                <td className="p-3 text-slate-500">{c.interests.join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
