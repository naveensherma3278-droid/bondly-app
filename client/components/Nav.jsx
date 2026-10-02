'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearToken } from '../lib/api';

export default function Nav() {
  const [authed, setAuthed] = useState(false);
  const router = useRouter();

  useEffect(() => setAuthed(!!getToken()), []);

  const logout = () => { clearToken(); setAuthed(false); router.push('/login'); };

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-rose-500">Bondly</Link>
        <nav className="flex items-center gap-4 text-sm">
          {authed ? (
            <>
              <Link href="/dashboard" className="hover:text-rose-500">Dashboard</Link>
              <Link href="/contacts" className="hover:text-rose-500">Contacts</Link>
              <Link href="/calendar" className="hover:text-rose-500">Calendar</Link>
              <button onClick={logout} className="text-slate-500 hover:text-rose-500">Log out</button>
            </>
          ) : (
            <Link href="/login" className="rounded bg-rose-500 px-3 py-1.5 text-white hover:bg-rose-600">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
