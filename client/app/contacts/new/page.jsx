'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';

const RELATIONSHIPS = ['friend', 'family', 'colleague', 'partner', 'other'];

export default function NewContact() {
  const [form, setForm] = useState({
    name: '', day: '', month: '', relationship: 'friend',
    phone: '', email: '', interests: '', favoriteColor: '', notes: '',
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/contacts', {
        method: 'POST',
        body: {
          ...form,
          day: Number(form.day),
          month: Number(form.month),
          interests: form.interests.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      router.push('/dashboard');
    } catch (err) { setError(err.message); }
  };

  const field = 'w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Add someone</h1>
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <input className={`${field} col-span-2`} placeholder="Name" required onChange={set('name')} />
        <select className={field} value={form.day} required onChange={set('day')}>
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className={field} value={form.month} required onChange={set('month')}>
          <option value="">Month</option>
          {['January','February','March','April','May','June','July','August','September','October','November','December']
            .map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select className={field} value={form.relationship} onChange={set('relationship')}>
          {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <input className={field} placeholder="Favorite color" onChange={set('favoriteColor')} />
        <input className={`${field} col-span-2`} placeholder="Interests (comma-separated: cricket, gaming)" onChange={set('interests')} />
        <input className={field} placeholder="Phone (for midnight WhatsApp/SMS)" onChange={set('phone')} />
        <input className={field} type="email" placeholder="Email" onChange={set('email')} />
        <textarea className={`${field} col-span-2`} rows={3} placeholder="Notes" onChange={set('notes')} />
        {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}
        <button className="col-span-2 rounded bg-rose-500 py-2 text-white hover:bg-rose-600">
          Save — reminders will be scheduled automatically
        </button>
      </form>
    </div>
  );
}
