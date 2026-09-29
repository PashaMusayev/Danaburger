'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, useAdmin } from './AdminStore';
import { btn } from './ui';

type Entry = { sha: string; message: string; date: string; author: string };

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

/** "29 sentyabr 2026, 09:36" in Baku time. Built by hand: many browsers ship no Azerbaijani month names. */
export function fmtDate(iso: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Baku', day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day} ${MONTHS[Number(parts.month) - 1]} ${parts.year}, ${parts.hour}:${parts.minute}`;
}

export default function HistoryScreen() {
  const { base, changes, confirm, toast, afterRevert } = useAdmin();
  const [list, setList] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setList((await api<{ commits: Entry[] }>('history')).commits);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const revert = async (e: Entry) => {
    if (!base) return;
    const when = fmtDate(e.date);
    const ok = await confirm({
      title: 'Bu versiyaya qayıdılsın?',
      body: (
        <p>
          Bütün filialların menyuları və qiymətləri <b>{when}</b> tarixindəki vəziyyətinə qaytarılacaq (telefonlar, ünvanlar və ayarlar dəyişmir), sayt yenilənəcək. Bu da tarixçədə yeni qeyd kimi saxlanılır, istəsəniz yenidən geri qayıda bilərsiniz.
        </p>
      ),
      ok: 'Bəli, qaytar',
    });
    if (!ok) return;
    setBusy(e.sha);
    try {
      const r = await api<{ commitSha: string }>('revert', { commitSha: e.sha, baseShas: base.shas, date: when });
      toast('Menyu geri qaytarıldı. Sayt ~1 dəqiqəyə yenilənəcək.');
      await afterRevert(r.commitSha);
      await load();
    } catch (err) {
      toast((err as ApiError).message, 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl uppercase">Tarixçə</h1>
      <p className="mt-1 text-sm text-mute">Menyularda, qiymətlərdə və ayarlarda edilən son 30 dəyişiklik. İstənilən versiyanın menyularına qayıtmaq olar.</p>
      {changes.length > 0 && (
        <p className="mt-4 rounded-xl border border-gold/40 bg-gold/10 p-3 text-sm text-gold">
          Yayımlanmamış {changes.length} dəyişikliyiniz var. Geri qaytarmaq üçün əvvəlcə onları yayımlayın və ya ləğv edin.
        </p>
      )}
      {error && (
        <div className="mt-6 rounded-2xl border border-red/40 bg-red/10 p-4">
          <p>{error}</p>
          <button onClick={load} className={`${btn.ghost} mt-3`}>
            Yenidən cəhd et
          </button>
        </div>
      )}
      {!list && !error && <p className="mt-6 text-mute">Yüklənir…</p>}
      {list?.length === 0 && <p className="mt-6 text-mute">Hələ heç bir dəyişiklik yoxdur.</p>}
      <ol className="mt-6 grid gap-2">
        {list?.map((e, n) => {
          const [subject, ...rest] = e.message.split('\n');
          const body = rest.join('\n').trim();
          return (
            <li key={e.sha} className="rounded-2xl border border-white/10 bg-card p-4" data-testid="history-entry">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-mute">
                    {fmtDate(e.date)} · {e.author}
                    {n === 0 && <span className="ml-2 rounded bg-ok/20 px-1.5 py-0.5 font-bold text-ok">indiki versiya</span>}
                  </p>
                  <p className="mt-1 font-semibold [overflow-wrap:anywhere]">{subject.replace(/^Admin:\s*/, '')}</p>
                  {body && (
                    <button onClick={() => setOpen(open === e.sha ? null : e.sha)} className="mt-1 text-sm text-gold" aria-expanded={open === e.sha}>
                      {open === e.sha ? 'Gizlət' : 'Bütün dəyişikliklər'}
                    </button>
                  )}
                  {open === e.sha && <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-cream/80">{body}</pre>}
                </div>
                {n > 0 && (
                  <button disabled={!!busy || changes.length > 0} onClick={() => revert(e)} className={btn.ghost}>
                    {busy === e.sha ? 'Qaytarılır…' : '↺ Bu versiyaya qayıt'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
