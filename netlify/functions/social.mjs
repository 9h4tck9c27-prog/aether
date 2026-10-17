// Storage for the Instagram robot.
//   GET    /api/social/media/<name>   public: Instagram and the weekly email fetch the rendered posts from here
//   PUT    /api/social/media/<name>   upload (needs x-social-key)
//   DELETE /api/social/media/<name>   remove (needs x-social-key)
//   GET|PUT /api/social/kv/<name>     small private JSON values, e.g. the Instagram token (needs x-social-key)
import { getStore } from "@netlify/blobs";

const TYPES = { mp4: "video/mp4", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", json: "application/json" };
const authed = req => {
  const key = Netlify.env.get("SOCIAL_KEY");
  return !!key && req.headers.get("x-social-key") === key;
};

export default async (req, context) => {
  const { kind, name } = context.params;
  if (!/^[a-z0-9][a-z0-9._-]{0,140}$/.test(name || "")) return new Response("Bad name", { status: 400 });
  if (kind === "media") {
    const store = getStore("social-media");
    if (req.method === "GET") {
      const res = await store.getWithMetadata(name, { type: "stream" });
      if (!res) return new Response("Not found", { status: 404 });
      return new Response(res.data, { headers: { "Content-Type": res.metadata?.type || "application/octet-stream", "Cache-Control": "public, max-age=86400" } });
    }
    if (!authed(req)) return new Response("Forbidden", { status: 403 });
    if (req.method === "PUT") {
      // Big files arrive in parts (?part=0&parts=4) so each request stays small; the last part assembles them.
      const ext = name.split(".").pop().toLowerCase();
      const u = new URL(req.url);
      const parts = +(u.searchParams.get("parts") || 1), part = +(u.searchParams.get("part") || 0);
      const body = await req.arrayBuffer();
      const meta = { metadata: { type: TYPES[ext] || "application/octet-stream", at: Date.now() } };
      if (parts <= 1) await store.set(name, body, meta);
      else {
        await store.set(`${name}.part${part}`, body);
        if (part === parts - 1) {
          const chunks = [];
          for (let i = 0; i < parts; i++) {
            const c = await store.get(`${name}.part${i}`, { type: "arrayBuffer" });
            if (!c) return Response.json({ ok: false, missing: i }, { status: 409 });
            chunks.push(new Uint8Array(c));
          }
          const all = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
          let off = 0; for (const c of chunks) { all.set(c, off); off += c.length; }
          await store.set(name, all.buffer, meta);
          for (let i = 0; i < parts; i++) await store.delete(`${name}.part${i}`);
        }
      }
      return Response.json({ ok: true, url: new URL(`/api/social/media/${name}`, req.url).href });
    }
    if (req.method === "DELETE") { await store.delete(name); return Response.json({ ok: true }); }
  }
  if (kind === "kv") {
    if (!authed(req)) return new Response("Forbidden", { status: 403 });
    const store = getStore({ name: "social-kv", consistency: "strong" });
    if (req.method === "GET") return Response.json((await store.get(name, { type: "json" })) ?? null, { headers: { "Cache-Control": "no-store" } });
    if (req.method === "PUT") { await store.setJSON(name, await req.json()); return Response.json({ ok: true }); }
  }
  return new Response("Not allowed", { status: 405 });
};

export const config = { path: "/api/social/:kind/:name", method: ["GET", "PUT", "DELETE"] };
