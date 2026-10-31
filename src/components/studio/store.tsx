"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Brief } from "@/lib/fit";
import type { Product } from "@/lib/products";

export type Step = "brief" | "pieces" | "photo" | "tryon" | "compare" | "card";
export const STEPS: { key: Step; label: string }[] = [
  { key: "brief", label: "Brief" },
  { key: "pieces", label: "Pieces" },
  { key: "photo", label: "Photo" },
  { key: "tryon", label: "Try on" },
  { key: "compare", label: "Compare" },
  { key: "card", label: "Card" },
];

export interface TryResult {
  status: "idle" | "running" | "success" | "error" | "timeout";
  tryonId?: string;
  imageUrl?: string;
  error?: string;
  cached?: boolean;
}
export type VerdictKind = "buy" | "maybe" | "skip";
export interface Verdict { verdict: VerdictKind; reasons: string[] }
export interface SessionInfo { tryonsUsed: number; tryonsAllowed: number; exhausted: boolean }

interface Persisted {
  step: Step;
  brief: Brief;
  shortlist: string[];
  isRightEar: boolean;
  consent: boolean;
  results: Record<string, TryResult>;
  verdicts: Record<string, Verdict>;
}

const KEY = "smallprint.studio.v1";
const DEFAULT_BRIEF: Brief = { budget: 100, maxDropCm: 6, fastening: "any", material: "any", occasion: "any" };
const MAX_SIDE = 4096;

interface Ctx extends Persisted {
  products: Product[];
  selfie: File | null;
  selfieUrl: string | null;
  selfieError: string | null;
  session: SessionInfo;
  online: boolean;
  setStep: (s: Step) => void;
  setBrief: (b: Partial<Brief>) => void;
  toggleShortlist: (id: string) => void;
  setSelfie: (f: File | null) => Promise<void>;
  setIsRightEar: (v: boolean) => void;
  setConsent: (v: boolean) => void;
  generate: (productId: string) => Promise<void>;
  resume: (productId: string) => void;
  setVerdict: (productId: string, v: Verdict) => void;
  resetAll: () => void;
}

const StudioCtx = createContext<Ctx | null>(null);
export const useStudio = () => {
  const c = useContext(StudioCtx);
  if (!c) throw new Error("useStudio outside provider");
  return c;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function checkDimensions(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const [w, h] = [img.naturalWidth, img.naturalHeight];
      if (Math.min(w, h) < 400) resolve("That photo is quite small. Use one at least 400px on its short side.");
      else if (Math.max(w, h) > MAX_SIDE) resolve(null); // server downsizes; allowed
      else resolve(null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve("We couldn't read that image. Try a JPG or PNG."); };
    img.src = url;
  });
}

export function StudioProvider({ products, initial, children }: { products: Product[]; initial: SessionInfo; children: ReactNode }) {
  const [state, setState] = useState<Persisted>({
    step: "brief", brief: DEFAULT_BRIEF, shortlist: [], isRightEar: true, consent: false, results: {}, verdicts: {},
  });
  const [selfie, setSelfieFile] = useState<File | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionInfo>(initial);
  const [online, setOnline] = useState(true);
  const hydrated = useRef(false);
  const [restored, setRestored] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });
  const polling = useRef(new Set<string>());

  // restore + persist (never the selfie)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      // Hydrating from sessionStorage can only happen after mount (SSR has no storage).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState((s) => ({ ...s, ...(JSON.parse(raw) as Persisted) }));
    } catch { /* storage unavailable */ }
    hydrated.current = true;
    setRestored(true);
    setOnline(navigator.onLine);
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  useEffect(() => {
    if (!hydrated.current) return;
    try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const patchResult = useCallback((id: string, r: Partial<TryResult>) => {
    setState((s) => ({ ...s, results: { ...s.results, [id]: { ...s.results[id], ...r } as TryResult } }));
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const r = await fetch("/api/session", { method: "POST" });
      const j = (await r.json()) as { tryonsUsed: number; tryonsAllowed: number; demoCreditsExhausted: boolean };
      setSession({ tryonsUsed: j.tryonsUsed, tryonsAllowed: j.tryonsAllowed, exhausted: j.demoCreditsExhausted });
    } catch { /* offline */ }
  }, []);

  const poll = useCallback(async (productId: string, tryonId: string) => {
    if (polling.current.has(tryonId)) return;
    polling.current.add(tryonId);
    const started = Date.now();
    let delay = 2000;
    try {
      while (Date.now() - started < 60_000) {
        await sleep(delay);
        delay = Math.min(delay + 500, 4000);
        try {
          const res = await fetch(`/api/tryon/${tryonId}`);
          if (!res.ok) continue;
          const j = (await res.json()) as { status: string; imageUrl: string | null; error: string | null; cached?: boolean };
          if (j.status === "success" && j.imageUrl) { patchResult(productId, { status: "success", imageUrl: j.imageUrl, cached: j.cached }); return; }
          if (j.status === "error") { patchResult(productId, { status: "error", error: j.error ?? "That try-on didn't work out." }); return; }
        } catch { /* transient: keep polling */ }
      }
      patchResult(productId, { status: "timeout", error: "This is taking longer than usual. Your credit is safe; check again in a moment." });
    } finally {
      polling.current.delete(tryonId);
      void refreshSession();
    }
  }, [patchResult, refreshSession]);

  const generate = useCallback(async (productId: string) => {
    if (!selfie) return;
    patchResult(productId, { status: "running", error: undefined, imageUrl: undefined, tryonId: undefined });
    const fd = new FormData();
    fd.set("selfie", selfie);
    fd.set("productId", productId);
    fd.set("isRightEar", String(stateRef.current.isRightEar));
    try {
      const res = await fetch("/api/tryon", { method: "POST", body: fd });
      const j = (await res.json()) as { tryonId?: string; cached?: boolean; error?: { code: string; message: string } };
      if (!res.ok || !j.tryonId) {
        patchResult(productId, { status: "error", error: j.error?.message ?? "Something went wrong. Please try again." });
        if (j.error?.code === "GLOBAL_CAP" || j.error?.code === "SESSION_CAP") void refreshSession();
        return;
      }
      patchResult(productId, { tryonId: j.tryonId, cached: j.cached });
      void refreshSession();
      void poll(productId, j.tryonId);
    } catch {
      patchResult(productId, { status: "error", error: "We couldn't reach the server. Check your connection and try again." });
    }
  }, [selfie, patchResult, poll, refreshSession]);

  const resume = useCallback((productId: string) => {
    const r = stateRef.current.results[productId];
    if (!r?.tryonId) return;
    patchResult(productId, { status: "running", error: undefined });
    void poll(productId, r.tryonId);
  }, [patchResult, poll]);

  // continue polling after a reload
  useEffect(() => {
    if (!restored) return;
    for (const [pid, r] of Object.entries(stateRef.current.results)) {
      if (r.status === "running" && r.tryonId && !polling.current.has(r.tryonId)) void poll(pid, r.tryonId);
    }
  }, [restored, poll]);

  const savePrefs = useRef<ReturnType<typeof setTimeout> | null>(null);
  const value = useMemo<Ctx>(() => ({
    ...state, products, selfie, selfieUrl, selfieError, session, online,
    setStep: (step) => { setState((s) => ({ ...s, step })); window.scrollTo({ top: 0, behavior: "smooth" }); },
    setBrief: (b) => {
      setState((s) => ({ ...s, brief: { ...s.brief, ...b } }));
      if (savePrefs.current) clearTimeout(savePrefs.current);
      savePrefs.current = setTimeout(() => {
        const merged = { ...stateRef.current.brief };
        void fetch("/api/session", {
          method: "POST",
          body: JSON.stringify({ budget: merged.budget, maxDropCm: merged.maxDropCm, fastening: merged.fastening, material: merged.material, occasion: merged.occasion }),
        }).catch(() => undefined);
      }, 800);
    },
    toggleShortlist: (id) => setState((s) => ({
      ...s,
      shortlist: s.shortlist.includes(id) ? s.shortlist.filter((x) => x !== id) : s.shortlist.length >= 3 ? s.shortlist : [...s.shortlist, id],
    })),
    setSelfie: async (f) => {
      if (selfieUrl) URL.revokeObjectURL(selfieUrl);
      if (!f) { setSelfieFile(null); setSelfieUrl(null); setSelfieError(null); return; }
      if (!/^image\/(jpeg|png)$/.test(f.type)) { setSelfieError("Only JPG or PNG photos work. Phone HEIC photos need converting first."); return; }
      if (f.size > 10 * 1024 * 1024) { setSelfieError("That photo is over 10 MB. Try a smaller one."); return; }
      const dim = await checkDimensions(f);
      if (dim) { setSelfieError(dim); return; }
      setSelfieError(null);
      setSelfieFile(f);
      setSelfieUrl(URL.createObjectURL(f));
    },
    setIsRightEar: (isRightEar) => setState((s) => ({ ...s, isRightEar })),
    setConsent: (consent) => setState((s) => ({ ...s, consent })),
    generate, resume,
    setVerdict: (id, v) => setState((s) => ({ ...s, verdicts: { ...s.verdicts, [id]: v } })),
    resetAll: () => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } setState({ step: "brief", brief: DEFAULT_BRIEF, shortlist: [], isRightEar: true, consent: false, results: {}, verdicts: {} }); },
  }), [state, products, selfie, selfieUrl, selfieError, session, online, generate, resume]);

  return <StudioCtx.Provider value={value}>{children}</StudioCtx.Provider>;
}
