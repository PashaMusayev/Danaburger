'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { MenuData } from '@/lib/menu';
import type { Settings } from '@/lib/config';
import { diffMenu, diffSettings } from '@/lib/admin/diff';
import { validateMenu } from '@/lib/admin/validate';
import { validateSettings } from '@/lib/admin/settings';

const DRAFT_KEY = 'db.admin.draft.v1';
const LIVE_POLL_MS = 5000;
const LIVE_TIMEOUT_MS = 4 * 60 * 1000;

type Base = { menu: MenuData; menuSha: string; settings: Settings; settingsSha: string };
type Draft = { menu: MenuData; settings: Settings };
type StoredDraft = Draft & { baseMenuSha: string; baseSettingsSha: string; images: Record<string, string>; changes: string[] };

export type PublishPhase =
  | { kind: 'idle' }
  | { kind: 'uploading'; done: number; total: number }
  | { kind: 'committing' }
  | { kind: 'deploying'; commitSha: string; since: number }
  | { kind: 'live'; commitSha: string }
  | { kind: 'slow'; commitSha: string }
  | { kind: 'published'; commitSha: string }; // local dev: no deploy to wait for

export type Toast = { id: number; text: string; kind: 'ok' | 'error' | 'info' };
type ConfirmReq = { title: string; body: ReactNode; ok: string; danger?: boolean; resolve: (v: boolean) => void };

type Store = {
  status: 'loading' | 'ready' | 'error';
  loadError: string | null;
  base: Base | null;
  menu: MenuData;
  settings: Settings;
  setMenu: (fn: (m: MenuData) => MenuData) => void;
  setSettings: (s: Settings) => void;
  images: Record<string, string>;
  addImage: (path: string, dataUrl: string) => void;
  srcFor: (image?: string) => string | undefined;
  changes: string[];
  problems: string[];
  /** Your saved draft was made against an older menu (someone published in between). */
  conflict: { changes: string[] } | null;
  discard: () => void;
  reload: (keepDraft?: boolean) => Promise<void>;
  publish: () => Promise<void>;
  phase: PublishPhase;
  saveNow: () => void;
  toasts: Toast[];
  toast: (text: string, kind?: Toast['kind']) => void;
  confirm: (req: Omit<ConfirmReq, 'resolve'>) => Promise<boolean>;
  confirmReq: ConfirmReq | null;
  afterRevert: (commitSha: string) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export const useAdmin = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useAdmin outside AdminProvider');
  return s;
};

/** fetch() for /api/admin/*: JSON in/out, session expiry → back to login. */
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/admin/${path}/`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  }).catch(() => null);
  if (!res) throw new ApiError(0, 'İnternet bağlantısı yoxdur. Yenidən cəhd edin.');
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.href = '/admin/login/';
    throw new ApiError(401, data.error ?? 'Sessiya bitib.');
  }
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Xəta baş verdi.', data.details);
  return data as T;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message);
  }
}

const readStored = (): StoredDraft | null => {
  try {
    const v = localStorage.getItem(DRAFT_KEY);
    return v ? (JSON.parse(v) as StoredDraft) : null;
  } catch {
    return null;
  }
};

export function AdminProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Store['status']>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [base, setBase] = useState<Base | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [images, setImages] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState<Store['conflict']>(null);
  const [phase, setPhase] = useState<PublishPhase>({ kind: 'idle' });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmReq, setConfirmReq] = useState<ConfirmReq | null>(null);
  const warnedQuota = useRef(false);

  const toast = useCallback((text: string, kind: Toast['kind'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 7000 : 3500);
  }, []);

  const confirm = useCallback(
    (req: Omit<ConfirmReq, 'resolve'>) =>
      new Promise<boolean>((resolve) =>
        setConfirmReq({
          ...req,
          resolve: (v) => {
            setConfirmReq(null);
            resolve(v);
          },
        }),
      ),
    [],
  );

  const reload = useCallback(async (keepDraft = true) => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const st = await api<Base>('state');
      const stored = keepDraft ? readStored() : null;
      setBase(st);
      setConflict(null);
      if (stored && stored.baseMenuSha === st.menuSha && stored.baseSettingsSha === st.settingsSha) {
        setDraft({ menu: stored.menu, settings: stored.settings });
        setImages(stored.images ?? {});
      } else {
        // A draft is only stored while it has edits. It was made against an older menu, so it can't be
        // published as is: list what the owner had changed so they can redo it.
        if (stored?.changes?.length) setConflict({ changes: stored.changes });
        setDraft({ menu: st.menu, settings: st.settings });
        setImages({});
      }
      setStatus('ready');
      setLoadError(null);
    } catch (e) {
      setLoadError((e as Error).message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const changes = useMemo(
    () => (base && draft ? [...diffMenu(base.menu, draft.menu), ...diffSettings(base.settings, draft.settings)] : []),
    [base, draft],
  );
  const problems = useMemo(() => {
    if (!draft) return [];
    return [...validateMenu(draft.menu), ...Object.values(validateSettings(draft.settings)).map((e) => `Ayarlar: ${e}`)];
  }, [draft]);

  // Persist the draft so closing the tab never loses work.
  const persist = useCallback(
    (d: Draft | null, imgs: Record<string, string>) => {
      if (!base || !d) return;
      const list = [...diffMenu(base.menu, d.menu), ...diffSettings(base.settings, d.settings)];
      try {
        if (!list.length) return localStorage.removeItem(DRAFT_KEY);
        const stored: StoredDraft = { ...d, baseMenuSha: base.menuSha, baseSettingsSha: base.settingsSha, images: imgs, changes: list };
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(stored));
        } catch {
          localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...stored, images: {} }));
          if (!warnedQuota.current) {
            warnedQuota.current = true;
            toast('Fotolar yalnız bu pəncərədə saxlanılır: yayımlamadan səhifəni bağlamayın.', 'info');
          }
        }
      } catch {
        /* storage unavailable (private mode): the draft lives only in this tab */
      }
    },
    [base, toast],
  );
  useEffect(() => {
    const t = setTimeout(() => persist(draft, images), 300);
    return () => clearTimeout(t);
  }, [draft, images, persist]);

  const saveNow = useCallback(() => {
    persist(draft, images);
    toast(changes.length ? 'Qaralama yadda saxlanıldı' : 'Yadda saxlanılacaq dəyişiklik yoxdur', 'info');
  }, [persist, draft, images, changes.length, toast]);

  // Wait for Vercel to finish the new build: /version.json carries the commit it was built from.
  const watchDeploy = useCallback(async (commitSha: string) => {
    const since = Date.now();
    setPhase({ kind: 'deploying', commitSha, since });
    const probe = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
    if (probe?.sha === 'local') return setPhase({ kind: 'published', commitSha });
    const tick = async () => {
      const v = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null);
      if (v?.sha === commitSha) return setPhase({ kind: 'live', commitSha });
      if (Date.now() - since > LIVE_TIMEOUT_MS) return setPhase({ kind: 'slow', commitSha });
      setTimeout(tick, LIVE_POLL_MS);
    };
    setTimeout(tick, LIVE_POLL_MS);
  }, []);

  const publish = useCallback(async () => {
    if (!base || !draft || !changes.length) return;
    if (problems.length) {
      toast('Əvvəlcə səhvləri düzəldin: ' + problems[0], 'error');
      return;
    }
    const menuChanged = diffMenu(base.menu, draft.menu).length > 0;
    const settingsChanged = diffSettings(base.settings, draft.settings).length > 0;
    const used = new Set(draft.menu.items.map((i) => i.image).filter(Boolean) as string[]);
    const toUpload = Object.entries(images).filter(([path]) => used.has(path.replace(/^public/, '')));
    try {
      const uploaded: { path: string; sha: string }[] = [];
      for (const [n, [path, dataUrl]] of toUpload.entries()) {
        setPhase({ kind: 'uploading', done: n, total: toUpload.length });
        const { sha } = await api<{ sha: string }>('blob', { data: dataUrl.split(',')[1] });
        uploaded.push({ path, sha });
      }
      setPhase({ kind: 'committing' });
      const res = await api<{ commitSha: string; menuSha: string; settingsSha: string }>('publish', {
        baseMenuSha: base.menuSha,
        baseSettingsSha: base.settingsSha,
        ...(menuChanged && { menu: draft.menu }),
        ...(settingsChanged && { settings: draft.settings }),
        images: uploaded,
      });
      setBase({ menu: draft.menu, menuSha: res.menuSha, settings: draft.settings, settingsSha: res.settingsSha });
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      toast('Yayımlandı! Sayt ~1 dəqiqəyə yenilənəcək.');
      watchDeploy(res.commitSha);
    } catch (e) {
      setPhase({ kind: 'idle' });
      const err = e as ApiError;
      if (err.status === 409) setConflict({ changes });
      else toast(err.details?.length ? `${err.message} ${err.details[0]}` : err.message, 'error');
    }
  }, [base, draft, changes, problems, images, toast, watchDeploy]);

  const afterRevert = useCallback(
    async (commitSha: string) => {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      await reload(false);
      watchDeploy(commitSha);
    },
    [reload, watchDeploy],
  );

  const discard = useCallback(() => {
    if (!base) return;
    setDraft({ menu: base.menu, settings: base.settings });
    setConflict(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, [base]);

  const value = useMemo<Store>(
    () => ({
      status,
      loadError,
      base,
      menu: draft?.menu ?? ({ currency: 'AZN', categories: [], items: [] } as MenuData),
      settings: draft?.settings ?? (base?.settings as Settings),
      setMenu: (fn) => setDraft((d) => (d ? { ...d, menu: fn(d.menu) } : d)),
      setSettings: (s) => setDraft((d) => (d ? { ...d, settings: s } : d)),
      images,
      addImage: (path, dataUrl) => setImages((m) => ({ ...m, [path]: dataUrl })),
      // photos uploaded in this session aren't on the live site yet: show the local copy
      srcFor: (image) => (image ? (images[`public${image}`] ?? image) : undefined),
      changes,
      problems,
      conflict,
      discard,
      reload,
      publish,
      phase,
      saveNow,
      toasts,
      toast,
      confirm,
      confirmReq,
      afterRevert,
    }),
    [status, loadError, base, draft, images, changes, problems, conflict, discard, reload, publish, phase, saveNow, toasts, toast, confirm, confirmReq, afterRevert],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
