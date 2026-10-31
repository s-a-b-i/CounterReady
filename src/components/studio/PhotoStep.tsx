"use client";

import { Camera, ImageUp, ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { useStudio } from "./store";

const GUIDE = [
  ["Side profile", "Turn so one ear faces the camera."],
  ["Ear visible", "Hair tucked back, nothing covering the lobe."],
  ["Even light", "Face a window. Avoid harsh shadows."],
  ["Bare lobe works best", "Take current earrings out for a cleaner result."],
];

export function PhotoStep() {
  const { selfie, selfieUrl, selfieError, setSelfie, consent, setConsent, isRightEar, setIsRightEar, setStep } = useStudio();
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const pick = (f?: File | null) => { if (f) void setSelfie(f); };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Step 3 of 6</p>
        <h1 className="display h-xl mt-3">Now, your ear.</h1>
        <ul className="mt-8 space-y-4">
          {GUIDE.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="num mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-hair text-xs text-goldtext">{i + 1}</span>
              <p><strong>{t}.</strong> <span className="text-soft">{d}</span></p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-start gap-3 rounded-2xl bg-sunk p-4 text-sm text-soft">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-sage" aria-hidden />
          <p>Your photo is sent to YouCam to make the preview and is <strong className="text-ink">not stored by SmallPrint</strong>. It stays in this browser tab so you can compare, then it&apos;s gone when you close it.</p>
        </div>
      </div>

      <div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          className={`card grid aspect-[4/5] place-items-center overflow-hidden border-dashed ${drag ? "!border-goldtext bg-maybebg" : ""}`}
        >
          {selfieUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selfieUrl} alt="Your selected photo" className="h-full w-full object-cover" />
          ) : (
            <div className="p-8 text-center">
              <ImageUp size={34} className="mx-auto text-goldtext" aria-hidden />
              <p className="mt-4 font-medium">Drop a photo here</p>
              <p className="mt-1 text-sm text-soft">JPG or PNG, up to 10 MB</p>
            </div>
          )}
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png" className="sr-only" aria-label="Upload a photo" onChange={(e) => pick(e.target.files?.[0])} />
        <input ref={cam} type="file" accept="image/*" capture="user" className="sr-only" aria-label="Take a photo with your camera" onChange={(e) => pick(e.target.files?.[0])} />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn btn-ghost" onClick={() => cam.current?.click()}><Camera size={16} aria-hidden /> Take a photo</button>
          <button className="btn btn-ghost" onClick={() => input.current?.click()}><ImageUp size={16} aria-hidden /> Choose a file</button>
        </div>
        {selfieError && <p role="alert" className="mt-3 text-sm text-oxblood">{selfieError}</p>}

        <fieldset className="mt-6">
          <legend className="eyebrow mb-3">Which ear can we see?</legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Which ear is visible">
            <button role="radio" aria-checked={isRightEar} className="chip" onClick={() => setIsRightEar(true)}>Right ear (you face left)</button>
            <button role="radio" aria-checked={!isRightEar} className="chip" onClick={() => setIsRightEar(false)}>Left ear (you face right)</button>
          </div>
        </fieldset>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 accent-[var(--gold-text)]" />
          <span>Your photo is sent to YouCam for processing and is not stored by SmallPrint.</span>
        </label>

        <div className="mt-8 flex justify-between">
          <button className="btn btn-ghost" onClick={() => setStep("pieces")}>Back</button>
          <button className="btn" disabled={!selfie || !consent} onClick={() => setStep("tryon")}>Continue</button>
        </div>
        {selfie && !consent && <p className="mt-3 text-right text-xs text-soft">Tick the box to continue.</p>}
      </div>
    </div>
  );
}
