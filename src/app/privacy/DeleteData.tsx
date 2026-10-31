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
      <p className="mt-2 text-sm text-soft">Removes what CounterReady holds for you (preview records, stored preview images, the upload reference) and clears this browser tab. It can&apos;t delete anything YouCam keeps on its side.</p>
      <button className="btn btn-danger mt-5" onClick={wipe} disabled={state === "busy"}>
        {state === "busy" ? "Deleting…" : "Delete everything now"}
      </button>
      <p role="status" className="mt-3 text-sm">
        {state === "done" && "Done. Your data on CounterReady has been deleted."}
        {state === "error" && "That didn't work. Please try again."}
      </p>
    </div>
  );
}
