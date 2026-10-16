// Anonymous visit counts: one number per day per event. No IP, no device ID, no cookies.
// The phone only sends this once a day, so the number is roughly "how many people opened Æther today".
import { getStore } from "@netlify/blobs";

const EVENTS = new Set(["open", "reading"]);

export default async (req) => {
  let ev = "open";
  try { ev = (await req.json()).e; } catch { /* default */ }
  if (!EVENTS.has(ev)) return new Response(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  const store = getStore({ name: "counts", consistency: "strong" });
  try {
    const cur = (await store.get(day, { type: "json" })) || {};
    cur[ev] = (cur[ev] || 0) + 1;
    await store.setJSON(day, cur);
  } catch { /* counting is best-effort */ }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/hit", method: "POST" };
