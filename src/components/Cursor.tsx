"use client";

import { useEffect, useRef } from "react";

/** Desktop-only custom cursor ring. Skipped for touch devices and reduced-motion users. */
export function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return;
    document.body.classList.add("has-cursor");
    let x = 0, y = 0, rx = 0, ry = 0, raf = 0;
    const move = (e: MouseEvent) => {
      x = e.clientX; y = e.clientY;
      if (ring.current) ring.current.style.opacity = "1";
    };
    const tick = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      const el = ring.current;
      if (el) el.style.transform = `translate(${rx - 16}px, ${ry - 16}px)`;
      raf = requestAnimationFrame(tick);
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const hot = !!t?.closest("a,button,[role=button],input,label,summary");
      if (ring.current) ring.current.style.scale = hot ? "1.9" : "1";
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    raf = requestAnimationFrame(tick);
    return () => {
      document.body.classList.remove("has-cursor");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-70 hidden h-8 w-8 opacity-0 rounded-full border border-goldtext transition-[scale] duration-200 [@media(hover:hover)_and_(pointer:fine)]:block"
    />
  );
}
