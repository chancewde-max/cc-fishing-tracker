// Vercel serverless function: fetches NOAA CO-OPS tide predictions
// server-side (Vercel's egress reaches NOAA reliably) and returns clean
// JSON to the browser. This avoids browser CORS + any edge-blocking of
// client requests to api.tidesandcurrents.noaa.gov.
//
// GET /api/tides  ->  { stations: [{ id, name, predictions:[{type,time,height}], error? }], fetchedAt }

const STATIONS = [
  { id: '8775238', name: 'Aransas Pass' },
  { id: '8779770', name: 'Packery Channel' },
];

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function buildUrl(stationId, begin, end) {
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

export default async function handler(req, res) {
  // CORS (in case it's ever called cross-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);
  const end = new Date(today);
  end.setDate(today.getDate() + 1);
  const begin = ymd(start);
  const finish = ymd(end);

  try {
    const results = await Promise.all(
      STATIONS.map(async (st) => {
        const url = buildUrl(st.id, begin, finish);
        try {
          const r = await fetch(url, {
            headers: { Accept: 'application/json', 'User-Agent': 'GulfBite/1.0' },
          });
          if (!r.ok) {
            return { id: st.id, name: st.name, predictions: [], error: `HTTP ${r.status}` };
          }
          const data = await r.json();
          if (data.error) {
            return { id: st.id, name: st.name, predictions: [], error: data.error.message || 'NOAA error' };
          }
          const predictions = (data.predictions || []).map((p) => ({
            type: p.type,
            time: p.t,
            height: Number(p.v),
          }));
          return { id: st.id, name: st.name, predictions };
        } catch (e) {
          return { id: st.id, name: st.name, predictions: [], error: e.message };
        }
      })
    );
    res.status(200).json({ stations: results, fetchedAt: new Date().toISOString() });
  } catch (e) {
    res.status(200).json({ stations: STATIONS.map((s) => ({ ...s, predictions: [], error: e.message })), fetchedAt: new Date().toISOString() });
  }
}
