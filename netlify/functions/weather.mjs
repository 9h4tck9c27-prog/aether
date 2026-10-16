// Local weather for the reading, from MET Norway (free, CC BY 4.0).
// The phone sends rough coordinates, or none: then we use Netlify's city-level guess from the request.
// Nothing is stored. Coordinates are rounded to about 10 km before they leave this function.
const UA = "Aether/1.0 aetherapp@icloud.com";
const round1 = n => Math.round(n * 10) / 10;

export default async (req, context) => {
  const url = new URL(req.url);
  let lat = parseFloat(url.searchParams.get("lat"));
  let lon = parseFloat(url.searchParams.get("lon"));
  let place = null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    const g = context.geo || {};
    lat = g.latitude; lon = g.longitude; place = g.city || null;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return Response.json({ error: "no location" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  lat = round1(lat); lon = round1(lon);
  try {
    const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`met ${r.status}`);
    const data = await r.json();
    const now = Date.now();
    const series = data.properties.timeseries;
    const slot = series.find(s => new Date(s.time).getTime() > now - 36e5) || series[0];
    const inst = slot.data.instant.details;
    const next = slot.data.next_1_hours || slot.data.next_6_hours || {};
    const body = {
      temp: inst.air_temperature,
      wind: inst.wind_speed,
      cloud: inst.cloud_area_fraction,
      symbol: next.summary?.symbol_code || null,
      precip: next.details?.precipitation_amount ?? null,
      place,
      time: slot.time,
    };
    // Cache at Netlify's edge for 20 minutes per rounded spot so MET Norway sees very few requests.
    // Responses that used the request's location vary by visitor, so those are not shared.
    const shared = url.searchParams.has("lat");
    return Response.json(body, {
      headers: {
        "Cache-Control": "public, max-age=600",
        "Netlify-CDN-Cache-Control": shared ? "public, s-maxage=1200, stale-while-revalidate=600" : "no-store",
        "Netlify-Vary": "query=lat|lon",
      },
    });
  } catch {
    return Response.json({ error: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
};

export const config = { path: "/api/weather", method: "GET" };
