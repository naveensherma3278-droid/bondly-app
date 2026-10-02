'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Calendar() {
  const [contacts, setContacts] = useState([]);
  const [view, setView] = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() }; });

  useEffect(() => { api('/contacts').then(setContacts).catch(() => {}); }, []);

  const byDay = useMemo(() => {
    const map = {};
    contacts.forEach((c) => {
      if (c.month === view.m + 1) (map[c.day] ||= []).push(c);
    });
    return map;
  }, [contacts, view]);

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [view]);

  const move = (d) => setView((v) => { const dt = new Date(v.y, v.m + d, 1); return { y: dt.getFullYear(), m: dt.getMonth() }; });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{MONTHS[view.m]} {view.y}</h1>
        <div className="flex gap-2">
          <button onClick={() => move(-1)} className="rounded border px-3 py-1 text-sm hover:border-rose-400">←</button>
          <button onClick={() => move(1)} className="rounded border px-3 py-1 text-sm hover:border-rose-400">→</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
        {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="p-2">{d}</div>)}
        {cells.map((day, i) => (
          <div key={i} className={`min-h-[72px] rounded border bg-white p-1 text-sm ${day ? '' : 'border-0 bg-transparent'}`}>
            {day && (
              <>
                <span className={byDay[day]?.length ? 'font-bold text-rose-500' : 'text-slate-500'}>{day}</span>
                <div className="mt-1 space-y-0.5">
                  {(byDay[day] || []).map((c) => (
                    <div key={c._id} className="truncate rounded bg-rose-50 px-1 text-xs text-rose-600">{c.name}</div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
