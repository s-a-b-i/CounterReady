"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useRef } from "react";
import { formatPkr, getProduct } from "@/lib/catalogue";
import { dataUrlToBlob, type LoadedPhoto } from "@/lib/client-image";
import type { PreviewResult } from "@/lib/consultation-types";

export interface TileState {
  status: "idle" | "working" | "success" | "error";
  imageUrl?: string;
  message?: string;
  cached?: boolean;
}

interface Props {
  photo: LoadedPhoto;
  shortlist: string[];
  uploadId: string | null;
  tiles: Record<string, TileState>;
  favourite: string | null;
  onUploadId: (id: string | null) => void;
  onTile: (productId: string, t: TileState) => void;
  onFavourite: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

const POLL_MS = 2000;
const POLL_MAX = 60;
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

class ApiError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

async function readError(res: Response): Promise<ApiError> {
  const j = (await res.json().catch(() => null)) as { error?: { code?: string; message?: string } } | null;
  return new ApiError(j?.error?.message ?? "Something went wrong. Please try again.", j?.error?.code);
}

/** Step 4: the same original photo, one shade per tile, each tile with its own retry. */
export function PreviewComparison({ photo, shortlist, uploadId, tiles, favourite, onUploadId, onTile, onFavourite, onBack, onContinue }: Props) {
  const uploading = useRef<Promise<string> | null>(null);
  const uploadIdRef = useRef(uploadId);
  uploadIdRef.current = uploadId; // eslint-disable-line react-hooks/refs -- latest-value ref so concurrent tile runs share one upload

  /** Uploads the original photo once; concurrent tiles await the same promise. */
  function ensureUpload(): Promise<string> {
    if (uploadIdRef.current) return Promise.resolve(uploadIdRef.current);
    if (!uploading.current) {
      uploading.current = (async () => {
        const fd = new FormData();
        fd.set("consent", "true");
        if (photo.source === "sample") fd.set("sample", "1");
        else fd.set("photo", await dataUrlToBlob(photo.dataUrl), "photo.jpg");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw await readError(res);
        const { uploadId: id } = (await res.json()) as { uploadId: string };
        uploadIdRef.current = id;
        onUploadId(id);
        return id;
      })().finally(() => { uploading.current = null; });
    }
    return uploading.current;
  }

  async function run(productId: string) {
    onTile(productId, { status: "working" });
    try {
      const uploadIdNow = await ensureUpload();
      const start = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ uploadId: uploadIdNow, productId }),
      });
      if (!start.ok) {
        const err = await readError(start);
        if (err.code === "NO_UPLOAD") { uploadIdRef.current = null; onUploadId(null); }
        throw err;
      }
      const { previewId } = (await start.json()) as { previewId: string };
      for (let i = 0; i < POLL_MAX; i++) {
        await new Promise((r) => setTimeout(r, i === 0 ? 800 : POLL_MS));
        const res = await fetch(`/api/preview/${previewId}`);
        if (!res.ok) continue;
        const r = (await res.json()) as PreviewResult;
        if (r.status === "success") return onTile(productId, { status: "success", imageUrl: r.imageUrl, cached: r.cached });
        if (r.status === "error") return onTile(productId, { status: "error", message: r.message });
      }
      onTile(productId, { status: "error", message: "This is taking longer than usual. Please try again." });
    } catch (err) {
      onTile(productId, { status: "error", message: err instanceof ApiError ? err.message : "We couldn't reach the preview service. Check your connection and try again." });
    }
  }

  const pending = shortlist.filter((id) => tiles[id]?.status !== "success" && tiles[id]?.status !== "working");
  const working = shortlist.some((id) => tiles[id]?.status === "working");
  const done = shortlist.filter((id) => tiles[id]?.status === "success").length;
  const anyStarted = shortlist.some((id) => tiles[id] && tiles[id].status !== "idle");
  const ratio = `${photo.width} / ${photo.height}`;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="display h-lg">Compare on your photo</h2>
          <p className="mt-2 max-w-xl text-soft">
            Each shade is applied to your original photo, never to another preview. Digital colours are approximate and may differ from the physical product.
          </p>
        </div>
        <button type="button" className="btn btn-lg" disabled={working || pending.length === 0} onClick={() => pending.forEach((id) => void run(id))}>
          {working ? <><Loader2 className="animate-spin" size={16} aria-hidden /> Generating…</> : <><Sparkles size={16} aria-hidden /> {anyStarted && pending.length < shortlist.length ? "Generate the rest" : "Generate previews"}</>}
        </button>
      </div>
      <p className="mt-2 text-xs text-soft">Uses {shortlist.length} of the demo&apos;s limited preview credits (one per shade). Results usually take about 10 seconds.</p>

      <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <li className="card overflow-hidden">
          <div className="bg-surface" style={{ aspectRatio: ratio }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.dataUrl} alt="Your original photo" className="h-full w-full object-cover" />
          </div>
          <div className="p-4">
            <p className="font-semibold">Original</p>
            <p className="text-sm text-soft">Your photo, unedited</p>
          </div>
        </li>

        {shortlist.map((id) => {
          const p = getProduct(id);
          if (!p) return null;
          const t = tiles[id] ?? { status: "idle" };
          const isFav = favourite === id;
          return (
            <li key={id} className={`card overflow-hidden ${isFav ? "ring-2 ring-ink" : ""}`}>
              <div className="relative bg-surface" style={{ aspectRatio: ratio }}>
                {t.status === "success" && t.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.imageUrl} alt={`${p.name} (${p.category}) applied to your photo, AI preview`} className="h-full w-full object-cover" />
                ) : t.status === "working" ? (
                  <div role="status" aria-live="polite" className="shimmer grid h-full w-full place-items-center">
                    <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-medium"><Loader2 className="animate-spin" size={14} aria-hidden /> Applying {p.shadeCode}</span>
                  </div>
                ) : t.status === "error" ? (
                  <div role="alert" className="grid h-full w-full place-items-center bg-bad-bg p-4 text-center">
                    <div>
                      <AlertTriangle className="mx-auto text-bad" size={22} aria-hidden />
                      <p className="mt-2 text-sm">{t.message}</p>
                      <button type="button" className="btn btn-outline mt-3 !min-h-9 !px-4 text-sm" onClick={() => void run(id)}><RotateCcw size={14} aria-hidden /> Retry {p.shadeCode}</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid h-full w-full place-items-center text-sm text-soft">Not generated yet</div>
                )}
                {t.status === "success" && <span className="tag tag-ai absolute left-2 top-2">AI preview</span>}
              </div>
              <div className="p-4">
                <p className="font-semibold leading-tight">{p.name}</p>
                <p className="mt-1 text-sm text-soft">{p.shadeCode} · {cap(p.finish)}</p>
                <p className="num mt-1 font-bold">{formatPkr(p.price)}</p>
                {t.status === "success" && (
                  <button type="button" aria-pressed={isFav} onClick={() => onFavourite(id)} className={`btn mt-3 w-full !min-h-10 ${isFav ? "" : "btn-outline"}`}>
                    {isFav ? <><Check size={15} aria-hidden /> My favourite</> : "This is my favourite"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="sticky bottom-0 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-hair bg-white/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
        <button type="button" className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} aria-hidden /> Photo</button>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-soft sm:inline" aria-live="polite">{done} of {shortlist.length} ready{done > 0 && !favourite ? " · pick a favourite" : ""}</span>
          <button type="button" className="btn btn-lg" disabled={!favourite} onClick={onContinue}>Save my choice <ArrowRight size={16} aria-hidden /></button>
        </div>
      </div>
    </div>
  );
}
