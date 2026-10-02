'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '../../lib/api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const data = await api(`/auth/${mode}`, { method: 'POST', body: form });
      setToken(data.token);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const field = 'w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300';

  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="mb-1 text-2xl font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mb-6 text-sm text-slate-500">Your AI relationship assistant awaits.</p>

      <form onSubmit={submit} className="space-y-4">
        {mode === 'register' && (
          <input className={field} placeholder="Your name" required
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        )}
        <input className={field} type="email" placeholder="Email" required
          onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className={field} type="password" placeholder="Password (min 8 chars)" required minLength={8}
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button disabled={busy} className="w-full rounded bg-rose-500 py-2 text-white hover:bg-rose-600 disabled:opacity-50">
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>
      </form>

      <button className="mt-4 text-sm text-slate-500 hover:underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Log in'}
      </button>
    </div>
  );
}
