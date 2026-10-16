// Builds the birthplace search data: site/places/<letter>.json
// Source: GeoNames towns (cities.json, CC BY 4.0), time zones via @photostructure/tz-lookup (CC0),
// country names via countries-list (MIT). Run: node tools/build_places.mjs <node_modules dir>
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const nm = process.argv[2];
const require = createRequire(path.join(nm, "x.js"));
const cities = require("cities.json/cities.json");
const admin1 = require("cities.json/admin1.json");
const tzlookup = require("@photostructure/tz-lookup");
const { countries } = require("countries-list");
const out = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../site/places");
fs.mkdirSync(out, { recursive: true });
const adminName = {};
for (const a of admin1) adminName[a.code] = a.name;
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const shards = {};
for (const c of cities) {
  const lat = +c.lat, lon = +c.lng;
  let tz; try { tz = tzlookup(lat, lon); } catch { continue; }
  const country = countries[c.country]?.name || c.country;
  const region = [adminName[`${c.country}.${c.admin1}`], country].filter(Boolean).join(", ");
  const n = norm(c.name);
  const key = /^[a-z]/.test(n) ? n[0] : "other";
  const sh = (shards[key] ||= { r: [], ri: new Map(), t: [], ti: new Map(), c: [] });
  if (!sh.ri.has(region)) { sh.ri.set(region, sh.r.length); sh.r.push(region); }
  if (!sh.ti.has(tz)) { sh.ti.set(tz, sh.t.length); sh.t.push(tz); }
  sh.c.push([c.name, Math.round(lat * 100), Math.round(lon * 100), sh.ri.get(region), sh.ti.get(tz)]);
}
let total = 0, bytes = 0;
for (const [k, sh] of Object.entries(shards)) {
  sh.c.sort((a, b) => a[0].localeCompare(b[0]));
  const json = JSON.stringify({ r: sh.r, t: sh.t, c: sh.c });
  fs.writeFileSync(path.join(out, `${k}.json`), json);
  total += sh.c.length; bytes += json.length;
}
fs.writeFileSync(path.join(out, "ATTRIBUTION.txt"), "Place names and coordinates: GeoNames (geonames.org), CC BY 4.0, via the cities.json package.\nTime zones: @photostructure/tz-lookup (CC0). Country names: countries-list (MIT).\n");
console.log(`${total} places in ${Object.keys(shards).length} files, ${(bytes / 1e6).toFixed(1)} MB total`);
