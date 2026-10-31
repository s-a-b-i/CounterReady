import type { Metadata } from "next";
import { DeleteData } from "./DeleteData";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <p className="eyebrow">Privacy</p>
      <h1 className="display h-xl mt-3">What happens to your photo.</h1>
      <div className="mt-8 space-y-6 text-soft">
        <p><strong className="text-ink">It is sent to Perfect Corp (YouCam) with your consent.</strong> When you press Generate, your photo goes from your browser to our server and on to YouCam&apos;s AI Makeup API, which creates the makeup previews. Nothing is sent before you tick the consent box.</p>
        <p><strong className="text-ink">What CounterReady keeps.</strong> We never write your photo to our database, disk or logs. We keep a reference to the uploaded file, a hash of it, the generated preview images (compressed) and an anonymous session id in a cookie, so each shade is applied to the same photo and your results survive a reload. No name, email or account.</p>
        <p><strong className="text-ink">What we can&apos;t promise.</strong> YouCam stores and deletes uploaded files under its own terms and retention rules, which we haven&apos;t independently verified. We therefore don&apos;t promise that your photo disappears from their systems immediately.</p>
        <p><strong className="text-ink">Your browser.</strong> While you work, your photo and choices sit in this browser tab&apos;s session storage so a reload doesn&apos;t lose them. Closing the tab or deleting your data clears them.</p>
        <p><strong className="text-ink">Purchase card.</strong> Your face appears on the exported card only if you switch that on. The default card shows the product alone.</p>
        <p><strong className="text-ink">Colour accuracy.</strong> Previews are approximate renderings, not calibrated matches to the physical product.</p>
      </div>
      <DeleteData />
    </div>
  );
}
