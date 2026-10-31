"use client";

import { Check } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getProduct, matchProducts } from "@/lib/catalogue";
import type { LoadedPhoto } from "@/lib/client-image";
import { MAX_SHORTLIST, STEPS, type Preferences, type Step } from "@/lib/consultation-types";
import { BudgetFilters } from "./BudgetFilters";
import { DecideStep } from "./DecideStep";
import { PreviewComparison, type TileState } from "./PreviewComparison";
import { ProductGrid } from "./ProductGrid";
import { SelfieUpload } from "./SelfieUpload";

interface Draft {
  step: Step;
  prefs: Preferences;
  shortlist: string[];
  photo: LoadedPhoto | null;
  consent: boolean;
  uploadId: string | null;
  tiles: Record<string, TileState>;
  favourite: string | null;
  note: string;
  showFace: boolean;
}

const KEY = "counterready-draft-v1";
const INITIAL: Draft = {
  step: "preferences",
  prefs: { category: "lipstick", budget: 2000, finish: "any", family: "any" },
  shortlist: [],
  photo: null,
  consent: false,
  uploadId: null,
  tiles: {},
  favourite: null,
  note: "",
  showFace: false,
};

/** Drops in-flight work on restore: a tile that was "working" when the tab closed has no live poller any more. */
function revive(d: Draft): Draft {
  const tiles = Object.fromEntries(Object.entries(d.tiles).map(([id, t]) => [id, t.status === "working" ? { status: "idle" as const } : t]));
  return { ...INITIAL, ...d, prefs: { ...INITIAL.prefs, ...d.prefs }, tiles };
}

export function ConsultFlow() {
  const [d, setD] = useState<Draft>(INITIAL);
  const [ready, setReady] = useState(false);

  // Restore the draft after mount (sessionStorage doesn't exist during SSR, so reading it in a state initialiser would mismatch).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from sessionStorage after hydration
      if (raw) setD(revive(JSON.parse(raw) as Draft));
    } catch {
      /* storage blocked or corrupt: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(d));
    } catch {
      /* quota or blocked: the flow still works, it just won't survive a reload */
    }
  }, [d, ready]);

  const patch = useCallback((p: Partial<Draft>) => setD((s) => ({ ...s, ...p })), []);
  const go = useCallback((step: Step) => {
    setD((s) => ({ ...s, step }));
    window.scrollTo({ top: 0 });
  }, []);

  const setTile = useCallback((id: string, t: TileState) => setD((s) => ({ ...s, tiles: { ...s.tiles, [id]: t } })), []);

  function changePrefs(prefs: Preferences) {
    const still = new Set(matchProducts(prefs).map((p) => p.id));
    setD((s) => {
      const shortlist = s.shortlist.filter((id) => still.has(id));
      return { ...s, prefs, shortlist, favourite: s.favourite && shortlist.includes(s.favourite) ? s.favourite : null };
    });
  }

  function toggle(id: string) {
    setD((s) => {
      const on = s.shortlist.includes(id);
      if (!on && s.shortlist.length >= MAX_SHORTLIST) return s;
      const shortlist = on ? s.shortlist.filter((x) => x !== id) : [...s.shortlist, id];
      return { ...s, shortlist, favourite: s.favourite && shortlist.includes(s.favourite) ? s.favourite : null };
    });
  }

  function restart() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
    setD(INITIAL);
    window.scrollTo({ top: 0 });
  }

  const idx = STEPS.findIndex((s) => s.id === d.step);
  const selected = d.favourite ? getProduct(d.favourite) : undefined;
  const compared = d.shortlist.map(getProduct).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
      <nav aria-label="Progress">
        <ol className="flex items-center gap-2 overflow-x-auto pb-2">
          {STEPS.map((s, i) => {
            const state = i < idx ? "done" : i === idx ? "current" : "todo";
            return (
              <li key={s.id} className="flex items-center gap-2" aria-current={state === "current" ? "step" : undefined}>
                <button
                  type="button"
                  disabled={state !== "done"}
                  onClick={() => go(s.id)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${state === "current" ? "border-ink bg-ink text-white" : state === "done" ? "border-hair bg-white hover:border-ink" : "border-hair bg-white text-faint"}`}
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-black/10 text-xs">{state === "done" ? <Check size={12} aria-hidden /> : i + 1}</span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <span aria-hidden className="h-px w-4 bg-hair" />}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-8">
        {d.step === "preferences" && <BudgetFilters prefs={d.prefs} onChange={changePrefs} onContinue={() => go("products")} />}
        {d.step === "products" && (
          <ProductGrid prefs={d.prefs} shortlist={d.shortlist} onToggle={toggle} onBack={() => go("preferences")} onContinue={() => go("photo")} />
        )}
        {d.step === "photo" && (
          <SelfieUpload
            photo={d.photo}
            consent={d.consent}
            onPhoto={(photo) => patch({ photo, uploadId: null, tiles: {}, favourite: null })}
            onConsent={(consent) => patch({ consent })}
            onBack={() => go("products")}
            onContinue={() => go("compare")}
          />
        )}
        {d.step === "compare" && d.photo && (
          <PreviewComparison
            photo={d.photo}
            shortlist={d.shortlist}
            uploadId={d.uploadId}
            tiles={d.tiles}
            favourite={d.favourite}
            onUploadId={(uploadId) => patch({ uploadId })}
            onTile={setTile}
            onFavourite={(favourite) => patch({ favourite })}
            onBack={() => go("photo")}
            onContinue={() => go("decide")}
          />
        )}
        {d.step === "decide" && selected && (
          <DecideStep
            prefs={d.prefs}
            compared={compared}
            selected={selected}
            previewUrl={d.tiles[selected.id]?.imageUrl}
            note={d.note}
            showFace={d.showFace}
            onNote={(note) => patch({ note })}
            onShowFace={(showFace) => patch({ showFace })}
            onBack={() => go("compare")}
            onRestart={restart}
          />
        )}
      </div>
    </div>
  );
}
