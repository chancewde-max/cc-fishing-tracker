// ============================================================
// tides.js — NOAA CO-OPS tide predictions (browser-side).
// NOAA CO-OPS allows CORS, so this works with no backend.
// Stations:
//   8775238 — Aransas Pass
//   8779770 — Packery Channel / Corpus Christi
// ============================================================

export const TIDE_STATIONS = [
  { id: '8775238', name: 'Aransas Pass' },
  { id: '8779770', name: 'Packery Channel' },
];

function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function buildTideUrl(stationId, beginDate, endDate) {
  const base = 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetson';
  const params = new URLSearchParams({
    begin_date: beginDate,
    end_date: endDate,
    station: stationId,
    product: 'predictions',
    datum: 'MLLW',
    interval: 'hilo',
    units: 'english',
    time_zone: 'lst_ldt',
    format: 'json',
  });
  return `${base}?${params.toString()}`;
}

/**
 * Fetch high/low tide predictions for one station across a date window.
 * @returns {Promise<{id:string,name:string,url:string,predictions:Array<{type:'H'|'L',time:string,height:number}>,error?:string}>}
 */
export async function fetchTidesForStation(station) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1); // include yesterday so "prior tide" is known
  const end = new Date(today);
  end.setDate(today.getDate() + 1); // include tomorrow for upcoming tides

  const url = buildTideUrl(station.id, ymd(start), ymd(end));
  try {
    const res = await fetch(url);
    if (!res.ok) {
      return {
        id: station.id,
        name: station.name,
        url,
        predictions: [],
        error: `HTTP ${res.status}`,
      };
    }
    const data = await res.json();
    if (data.error) {
      return {
        id: station.id,
        name: station.name,
        url,
        predictions: [],
        error: data.error.message || 'NOAA error',
      };
    }
    const predictions = (data.predictions || []).map((p) => ({
      type: p.type, // 'H' or 'L'
      time: p.t, // ISO local time
      height: Number(p.v), // feet (MLLW)
    }));
    return { id: station.id, name: station.name, url, predictions };
  } catch (err) {
    return {
      id: station.id,
      name: station.name,
      url,
      predictions: [],
      error: err.message,
    };
  }
}

/**
 * Fetch both stations. Goes through the Vercel serverless function
 * (/api/tides) which proxies NOAA server-side — avoids browser CORS and
 * any edge-blocking of direct client calls to api.tidesandcurrents.noaa.gov.
 * Falls back to direct NOAA fetch if the function is unavailable (local dev).
 */
export async function fetchTides() {
  try {
    const res = await fetch('/api/tides', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.stations) throw new Error('bad shape');
    return data;
  } catch (e) {
    // Local/dev fallback: call NOAA directly (needs CORS; works on some setups)
    const results = await Promise.all(TIDE_STATIONS.map(fetchTidesForStation));
    return { stations: results, fetchedAt: new Date().toISOString(), note: 'direct-fallback' };
  }
}

/**
 * Derive a "tide state" summary from high/low predictions relative to `now`.
 * Used by the bite-score service.
 * @returns {{nextType:string|null,nextTime:string|null,minutesToNext:number|null,range:number|null,isMoving:boolean,previous:object|null}}
 */
export function deriveTideState(predictions, now = new Date()) {
  if (!predictions || predictions.length === 0) {
    return {
      nextType: null,
      nextTime: null,
      minutesToNext: null,
      range: null,
      isMoving: true, // assume moving if unknown (conservative for bite score)
      previous: null,
    };
  }
  const sorted = [...predictions].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );
  const nowMs = now.getTime();

  // Most recent tide at or before now
  let previous = null;
  let next = null;
  for (let i = 0; i < sorted.length; i += 1) {
    const t = new Date(sorted[i].time).getTime();
    if (t <= nowMs) previous = sorted[i];
    else {
      next = sorted[i];
      break;
    }
  }
  // Fallback if no "next" found (all in the past) -> use last
  if (!next && sorted.length) next = sorted[sorted.length - 1];

  const minutesToNext = next
    ? Math.round((new Date(next.time).getTime() - nowMs) / 60000)
    : null;

  // Tide is considered "slack" within ~45 min of a turn; otherwise "moving".
  const isMoving = minutesToNext == null ? true : Math.abs(minutesToNext) > 45;

  // Range = height difference between previous and next turn (bigger = more movement)
  let range = null;
  if (previous && next) range = Math.abs(next.height - previous.height);

  return {
    nextType: next ? next.type : null,
    nextTime: next ? next.time : null,
    minutesToNext,
    range,
    isMoving,
    previous,
  };
}
