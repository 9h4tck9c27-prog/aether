// Daily totals for the last 60 days. Set STATS_KEY in Netlify to keep this page private: /api/stats?key=...
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const keys = [Netlify.env.get("STATS_KEY"), Netlify.env.get("SOCIAL_KEY")].filter(Boolean);
  const given = new URL(req.url).searchParams.get("key") || req.headers.get("x-social-key");
  if (keys.length && !keys.includes(given)) return new Response("Not found", { status: 404 });
  const store = getStore({ name: "counts", consistency: "strong" });
  const days = [];
  for (let i = 0; i < 60; i++) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10);
    const v = await store.get(d, { type: "json" }).catch(() => null);
    if (v) days.push({ day: d, ...v });
  }
  const total = days.reduce((a, d) => ({ open: a.open + (d.open || 0), reading: a.reading + (d.reading || 0), instagram: a.instagram + (d.instagram || 0) }), { open: 0, reading: 0, instagram: 0 });
  return Response.json({ last60: total, days }, { headers: { "Cache-Control": "no-store" } });
};

export const config = { path: "/api/stats", method: "GET" };
