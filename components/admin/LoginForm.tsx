'use client';

import { useState } from 'react';
import { btn, input } from './ui';

export default function LoginForm({ missing }: { missing: string[] }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (missing.length) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-5 text-sm">
        <p className="font-bold text-gold">Admin panel hələ quraşdırılmayıb</p>
        <p className="mt-2 text-cream/85">Developer Vercel-də bu dəyişənləri əlavə etməlidir (ADMIN.md → Qurulma):</p>
        <ul className="mt-2 list-inside list-disc font-mono text-xs">
          {missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch('/api/admin/login/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }).catch(() => null);
        if (res?.ok) {
          window.location.href = '/admin/';
          return;
        }
        const data = await res?.json().catch(() => ({}));
        setError(data?.error ?? 'İnternet bağlantısı yoxdur. Yenidən cəhd edin.');
        setBusy(false);
      }}
    >
      <label className="grid gap-1.5 text-sm font-semibold" htmlFor="pw">
        Parol
        <span className="relative">
          <input
            id="pw"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            required
            className={`${input} pr-24`}
            value={password}
            aria-invalid={!!error}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs text-mute hover:text-cream">
            {show ? 'Gizlət' : 'Göstər'}
          </button>
        </span>
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red/15 px-3 py-2 text-sm text-[#ff9a92]">
          {error}
        </p>
      )}
      <button disabled={busy || !password} className={btn.primary}>
        {busy ? 'Yoxlanılır…' : 'Daxil ol'}
      </button>
    </form>
  );
}
