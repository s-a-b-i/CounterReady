"use client";

import { useState } from "react";

export function DeleteData() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function wipe() {
    setState("busy");
    try {
      const res = await fetch("/api/privacy", { method: "DELETE" });
      if (!res.ok) throw new Error();
      try { sessionStorage.clear(); } catch { /* ignore */ }
      setState("done");
    } catch { setState("error"); }
  }
  return (
    <div className="card mt-12 p-6">
      <h2 className="display h-lg">Delete my data</h2>
      <p className="mt-2 text-sm text-soft">Removes your try-ons, stored preview images, decisions and shared links, and clears this browser session.</p>
      <button className="btn mt-5 !bg-oxblood !border-oxblood" onClick={wipe} disabled={state === "busy"}>
        {state === "busy" ? "Deleting…" : "Delete everything now"}
      </button>
      <p role="status" className="mt-3 text-sm">
        {state === "done" && "Done. Your data has been deleted."}
        {state === "error" && "That didn't work. Please try again."}
      </p>
    </div>
  );
}
