// Vercel serverless function: tide predictions for CC Bay stations.
//
// Strategy (most-reliable / cheapest first):
//   1. NOAA harmonic constituents (mdapi) -> synthesize locally. FREE, no key,
//      and works even when NOAA's predictions API (datagetson) is down.
//   2. NOAA datagetson predictions (tried first in case it recovers).
//   3. StormGlass tides (paid) via STORMGLASS_KEY env.
//
// Returns: { stations:[{id,name,lat,lng,predictions:[{type,time,height}],error?,source?}], fetchedAt }
//
// Heights are in FEET (MLLW), matching the rest of the UI.

const STATIONS = [
  { id: '8775238', name: 'Aransas Pass', lat: 27.835, lng: -97.055, constituentsFrom: '8779770' },
  { id: '8779770', name: 'Packery Channel', lat: 27.62, lng: -97.23, constituentsFrom: '8779770' },
];

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
function isoDay(date) {
  return date.toISOString().split('T')[0];
}

// ---------- NOAA harmonic constituents ----------
async function fetchConstituents(stationId) {
  const url = `https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/${stationId}/harcon.json`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`NOAA mdapi HTTP ${r.status}`);
  const d = await r.json();
  const list = d.HarmonicConstituents || [];
  if (!list.length) throw new Error('no constituents');
  return list.map((c) => ({
    name: c.name,
    A: Number(c.amplitude),
    // phase_local is referenced to 0h LOCAL STANDARD TIME, 1 Jan of the year.
    phaseLocal: Number(c.phase_local),
    speed: Number(c.speed), // degrees per hour
  }));
}

// Synthesize water level (feet, relative to MLLW) at a JS Date.
// height(t) = Σ Aᵢ · cos( speedᵢ·hoursSinceLocalJan1 + phaseLocalᵢ )
function tideHeight(date, constituents) {
  const year = date.getUTCFullYear();
  // 0h LOCAL STANDARD TIME, 1 Jan of `year`. CC is CST (UTC-6), no DST in the reference.
  const localJan1 = new Date(Date.UTC(year, 0, 1, 0, 0, 0) - 6 * 3600 * 1000);
  const hoursSince = (date.getTime() - localJan1.getTime()) / 3600000;
  let h = 0;
  for (const c of constituents) {
    const ang = ((c.speed * hoursSince + c.phaseLocal) * Math.PI) / 180;
    h += c.A * Math.cos(ang);
  }
  return h;
}

// Sample the curve, find high/low turning points in [start, end].
function findExtremes(constituents, start, end, stepMin = 10) {
  const stepMs = stepMin * 60000;
  const samples = [];
  for (let t = start.getTime(); t <= end.getTime(); t += stepMs) {
    samples.push({ t, h: tideHeight(new Date(t), constituents) });
  }
  const out = [];
  for (let i = 1; i < samples.length - 1; i++) {
    const prev = samples[i - 1].h;
    const cur = samples[i].h;
    const next = samples[i + 1].h;
    if (cur > prev && cur >= next) out.push({ type: 'H', time: new Date(samples[i].t).toISOString(), height: +cur.toFixed(1) });
    else if (cur < prev && cur <= next) out.push({ type: 'L', time: new Date(samples[i].t).toISOString(), height: +cur.toFixed(1) });
  }
  return out;
}

async function computeFromConstituents(st) {
  // Aransas Pass has no published constituents in mdapi; reuse Packery's (≈15mi away, near-identical timing).
  const cons = await fetchConstituents(st.constituentsFrom);
  const start = new Date(Date.now() - 12 * 3600 * 1000); // include yesterday for "prior tide"
  const end = new Date(Date.now() + 36 * 3600 * 1000);
  const predictions = findExtremes(cons, start, end);
  return predictions;
}

// ---------- NOAA predictions (datagetson, in case it recovers) ----------
function noaaUrl(stationId, begin, end) {
  const p = new URLSearchParams({
    begin_date: begin, end_date: end, station: stationId,
    product: 'predictions', datum: 'MLLW', interval: 'hilo',
    units: 'english', time_zone: 'lst_ldt', format: 'json',
  });
  return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetson?${p.toString()}`;
}
async function fetchNoaa(st) {
  const today = new Date();
  const s = new Date(today); s.setDate(today.getDate() - 1);
  const e = new Date(today); e.setDate(today.getDate() + 1);
  const r = await fetch(noaaUrl(st.id, ymd(s), ymd(e)), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`NOAA HTTP ${r.status}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || 'NOAA error');
  return (data.predictions || []).map((p) => ({ type: p.type, time: p.t, height: Number(p.v) }));
}

// ---------- StormGlass (paid) ----------
async function fetchStormGlass(st, key) {
  const start = isoDay(new Date());
  const end = isoDay(new Date(Date.now() + 2 * 86400000));
  const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${st.lat}&lng=${st.lng}&start=${start}&end=${end}`;
  const r = await fetch(url, { headers: { Authorization: key } });
  if (!r.ok) throw new Error(`StormGlass HTTP ${r.status}`);
  const data = await r.json();
  return (data.data || []).map((e) => ({
    type: e.type === 'high' ? 'H' : 'L', time: e.time,
    height: e.height != null ? Number((e.height * 3.28084).toFixed(1)) : null,
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  const key = process.env.STORMGLASS_KEY;
  const results = await Promise.all(
    STATIONS.map(async (st) => {
      // 1) local harmonic synthesis (free, robust)
      try {
        const predictions = await computeFromConstituents(st);
        if (predictions.length) return { ...st, predictions, source: 'noaa-harmonic' };
      } catch (_) { /* fall through */ }
      // 2) NOAA predictions (if recovered)
      try {
        const predictions = await fetchNoaa(st);
        if (predictions.length) return { ...st, predictions, source: 'noaa' };
      } catch (_) { /* fall through */ }
      // 3) StormGlass (paid)
      if (key) {
        try {
          const predictions = await fetchStormGlass(st, key);
          if (predictions.length) return { ...st, predictions, source: 'stormglass' };
        } catch (e) {
          return { ...st, predictions: [], error: `StormGlass: ${e.message}` };
        }
      }
      return { ...st, predictions: [], error: 'all tide sources failed' };
    })
  );

  res.status(200).json({ stations: results, fetchedAt: new Date().toISOString() });
}
