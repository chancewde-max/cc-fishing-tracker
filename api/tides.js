// Vercel serverless function: fetches tide predictions.
//
// Strategy (most-reliable first):
//   1. NOAA CO-OPS (free, no key) — tried first in case it recovers.
//   2. StormGlass (free dev tier) using STORMGLASS_KEY env — real extremes.
//   3. If both fail, return a clear error per station (UI shows "unavailable").
//
// GET /api/tides -> { stations:[{id,name,lat,lng,predictions:[{type,time,height}],error?}], fetchedAt }

const STATIONS = [
  { id: '8775238', name: 'Aransas Pass', lat: 27.835, lng: -97.055 },
  { id: '8779770', name: 'Packery Channel', lat: 27.62, lng: -97.23 },
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

// ---- NOAA (kept for when it recovers) ----
function noaaUrl(stationId, begin, end) {
  const p = new URLSearchParams({
    begin_date: begin,
    end_date: end,
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    interval: 'hilo',
    units: 'english',
    time_zone: 'lst_ldt',
    format: 'json',
  });
  return `https://api.tidesandcurrents.noaa.gov/api/prod/datagetson?${p.toString()}`;
}

async function fetchNoaa(st) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 1);
  const url = noaaUrl(st.id, ymd(start), ymd(end));
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`NOAA HTTP ${r.status}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message || 'NOAA error');
  return (data.predictions || []).map((p) => ({
    type: p.type,
    time: p.t,
    height: Number(p.v),
  }));
}

// ---- StormGlass (real extremes, keyed) ----
// Correct v2 path is /v2/tide/extremes/point (singular "tide").
// Heights come back in METERS; convert to FEET for the US display.
async function fetchStormGlass(st, key) {
  const start = isoDay(new Date());
  const end = isoDay(new Date(Date.now() + 2 * 86400000));
  const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${st.lat}&lng=${st.lng}&start=${start}&end=${end}`;
  const r = await fetch(url, { headers: { Authorization: key } });
  if (!r.ok) throw new Error(`StormGlass HTTP ${r.status}`);
  const data = await r.json();
  const extremes = data.data || [];
  return extremes.map((e) => ({
    type: e.type === 'high' ? 'H' : 'L',
    time: e.time,
    height: e.height != null ? Number((e.height * 3.28084).toFixed(1)) : null,
  }));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const key = process.env.STORMGLASS_KEY;
  const results = await Promise.all(
    STATIONS.map(async (st) => {
      // 1) NOAA
      try {
        const predictions = await fetchNoaa(st);
        if (predictions.length) return { ...st, predictions };
      } catch (_) {
        /* fall through */
      }
      // 2) StormGlass
      if (key) {
        try {
          const predictions = await fetchStormGlass(st, key);
          if (predictions.length) return { ...st, predictions, source: 'stormglass' };
        } catch (e) {
          return { ...st, predictions: [], error: `StormGlass: ${e.message}` };
        }
      }
      return { ...st, predictions: [], error: key ? 'both sources failed' : 'NOAA down, no StormGlass key' };
    })
  );

  res.status(200).json({ stations: results, fetchedAt: new Date().toISOString() });
}
