"use client";

import { ArrowLeft, ArrowRight, Camera, ImageUp, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { loadPhoto, PhotoProblem, validatePhotoFile, type LoadedPhoto } from "@/lib/client-image";
import { CONSENT_TEXT } from "@/lib/consultation-types";

interface Props {
  photo: LoadedPhoto | null;
  consent: boolean;
  onPhoto: (p: LoadedPhoto | null) => void;
  onConsent: (v: boolean) => void;
  onBack: () => void;
  onContinue: () => void;
}

/** Step 3: photo plus explicit consent. Nothing leaves the browser until the shopper presses Generate on the next screen. */
export function SelfieUpload({ photo, consent, onPhoto, onConsent, onBack, onContinue }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const file = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);

  async function take(f: File) {
    const problem = validatePhotoFile(f);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      onPhoto(await loadPhoto(f, "upload"));
    } catch (err) {
      setError(err instanceof PhotoProblem ? err.message : "We couldn't read that image. Try another JPG or PNG.");
    } finally {
      setBusy(false);
    }
  }

  async function useSample() {
    setBusy(true);
    setError(null);
    try {
      const blob = await (await fetch("/sample-photos/sample-1.jpg")).blob();
      onPhoto(await loadPhoto(blob, "sample"));
    } catch {
      setError("The sample photo couldn't be loaded. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const ready = !!photo && consent;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
      <div>
        <h2 className="display h-lg">Add a photo</h2>
        <p className="mt-2 text-soft">Face the camera, with your whole face visible and good light. For the best previews, keep your eyes open and move hair away from your lips, cheeks and eyes.</p>

        <div
          id="photo-zone"
          tabIndex={0}
          role="button"
          aria-label={photo ? "Replace photo" : "Upload photo"}
          onClick={() => file.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), file.current?.click())}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) void take(f); }}
          className={`mt-6 grid aspect-[4/3] w-full cursor-pointer place-items-center overflow-hidden rounded-3xl border-2 border-dashed text-center transition-colors ${drag ? "border-ink bg-surface" : "border-hair bg-surface/60 hover:border-ink"}`}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.dataUrl} alt="Your selected photo" className="h-full w-full object-contain" />
          ) : (
            <div className="px-6">
              <ImageUp className="mx-auto text-soft" size={32} aria-hidden />
              <p className="mt-3 font-semibold">{busy ? "Reading photo…" : "Drop a photo here"}</p>
              <p className="mt-1 text-sm text-soft">or click to choose. JPG or PNG, up to 10 MB.</p>
            </div>
          )}
        </div>
        <input ref={file} type="file" accept="image/jpeg,image/png" className="sr-only" aria-label="Photo file" tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void take(f); e.target.value = ""; }} />
        <input ref={camera} type="file" accept="image/*" capture="user" className="sr-only" aria-label="Take a photo" tabIndex={-1}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void take(f); e.target.value = ""; }} />
        <p role="alert" className="field-error min-h-5">{error}</p>

        <div className="mt-3 flex flex-wrap gap-3">
          <button type="button" className="btn btn-outline" onClick={() => camera.current?.click()} disabled={busy}><Camera size={16} aria-hidden /> Take a photo</button>
          <button type="button" className="btn btn-outline" onClick={useSample} disabled={busy}><Sparkles size={16} aria-hidden /> Use the sample photo</button>
        </div>
        <p className="field-hint">The sample is a stock portrait licensed for free use. It lets you try the whole flow without a photo of your own.</p>
      </div>

      <div>
        <div className="card p-6">
          <p className="flex items-center gap-2 font-semibold"><ShieldCheck size={18} aria-hidden /> Before we generate anything</p>
          <p className="mt-3">{CONSENT_TEXT}</p>
          <p className="mt-3 text-sm text-soft">
            CounterReady itself never stores your photo: we keep only a reference to it so each shade can be applied to the same image.
            YouCam handles it under its own terms. See <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>.
          </p>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-surface p-4">
            <input type="checkbox" checked={consent} onChange={(e) => onConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-black" />
            <span className="text-sm font-medium">I agree to send this photo to Perfect Corp (YouCam) to generate virtual makeup previews. I understand the colours are approximate.</span>
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" className="btn btn-ghost" onClick={onBack}><ArrowLeft size={16} aria-hidden /> Shortlist</button>
          <button type="button" className="btn btn-lg" disabled={!ready} onClick={onContinue}>Continue <ArrowRight size={16} aria-hidden /></button>
        </div>
        {!ready && <p className="field-hint text-right">{!photo ? "Add a photo" : "Tick the consent box"} to continue.</p>}
      </div>
    </div>
  );
}
