import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display h-xl mt-3">That one slipped off the ear.</h1>
      <p className="mt-4 text-soft">We couldn&apos;t find that page or card.</p>
      <Link href="/" className="btn mt-8">Back home</Link>
    </div>
  );
}
