import type { Metadata } from "next";
import { DeleteData } from "./DeleteData";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <p className="eyebrow">Privacy</p>
      <h1 className="display h-xl mt-3">What we do with your photo.</h1>
      <div className="mt-8 space-y-6 text-soft">
        <p><strong className="text-ink">Your selfie is never stored.</strong> It is sent from your browser to our server, passed straight to YouCam&apos;s Earring VTO API to generate the preview, and discarded. It is not written to a database, a file, or our logs.</p>
        <p><strong className="text-ink">What we do keep.</strong> The generated preview image (compressed), your brief and verdicts, and an anonymous session id in an httpOnly cookie, so your comparison survives a reload. No name, email or account.</p>
        <p><strong className="text-ink">Shared cards.</strong> A share link shows only your verdicts and the catalogue facts. Your try-on photos are included only if you tick &ldquo;Include my try-on photos&rdquo;.</p>
        <p><strong className="text-ink">YouCam.</strong> YouCam processes the photo under its own terms. Generated results are stored there for a short time.</p>
        <p><strong className="text-ink">Not medical advice.</strong> Material and hypoallergenic notes are the seller&apos;s declarations. SmallPrint never claims an earring is allergy-safe.</p>
      </div>
      <DeleteData />
    </div>
  );
}
