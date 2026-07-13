// ============================================================
// weather.js — Open-Meteo (marine + forecast), browser-side.
// Open-Meteo supports CORS, so this works with no backend.
// ============================================================

const LAT = 27.69;
const LNG = -97.36;

// Open-Meteo forecast + marine variables for the Corpus Christi bay.
const HOURLY = [
  'temperature_2m',
  'sea_surface_temperature',
  'wind_speed_10m',
  'wind_direction_10m',
  'pressure_msl',
  'wind_wave_height',
  'wave_height',
].join(',');

const DAILY = [
  'temperature_2m_max',
  'temperature_2m_min',
  'wind_speed_10m_max',
  'sunrise',
  'sunset',
].join(',');

export const WEATHER_API_URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}` +
  `&hourly=${HOURLY}&daily=${DAILY}` +
  `&wind_speed_unit=mph&temperature_unit=fahrenheit&pressure_unit=mb` +
  `&forecast_days=3&timezone=auto`;

const COMPASS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
];

export function degreesToCompass(deg) {
  if (deg == null || Number.isNaN(deg)) return '--';
  const idx = Math.round(deg / 22.5) % 16;
  return COMPASS[idx];
}

// Find the index of the hourly entry closest to `when` (a Date).
function nearestHourIndex(times, when) {
  const t = when.getTime();
  let best = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < times.length; i += 1) {
    const delta = Math.abs(new Date(times[i]).getTime() - t);
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  }
  return best;
}

/**
 * Fetch + normalize current conditions and a 3-day hourly forecast.
 * @returns {Promise<{temp:number,windSpeed:number,windDir:number,windDirText:string,pressure:number,pressure6hAgo:number|null,windWave:number|null,waveHeight:number|null,daily:object,hourly:Array,units:object,forecastDays:number}>}
 */
export async function fetchWeather() {
  const res = await fetch(WEATHER_API_URL);
  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (${res.status})`);
  }
  const data = await res.json();

  const times = data.hourly?.time ?? [];
  const nowIdx = nearestHourIndex(times, new Date());

  const get = (arr) => (arr && arr[nowIdx] != null ? arr[nowIdx] : null);
  const getAt = (arr, i) => (arr && arr[i] != null ? arr[i] : null);

  const waterTemp = get(data.hourly?.sea_surface_temperature);
  const pressure = get(data.hourly?.pressure_msl);
  // pressure 6h ago for trend (compare now vs 6 hours earlier)
  const pressure6hAgoIdx = Math.max(0, nowIdx - 6);
  const pressure6hAgo = getAt(data.hourly?.pressure_msl, pressure6hAgoIdx);

  const hourly = (data.hourly?.time ?? []).map((iso, i) => ({
    time: iso,
    temp: getAt(data.hourly.temperature_2m, i),
    windSpeed: getAt(data.hourly.wind_speed_10m, i),
    windDir: getAt(data.hourly.wind_direction_10m, i),
    pressure: getAt(data.hourly.pressure_msl, i),
    windWave: getAt(data.hourly.wind_wave_height, i),
    waveHeight: getAt(data.hourly.wave_height, i),
  }));

  return {
    temp: get(data.hourly.temperature_2m),
    waterTemp,
    windSpeed: get(data.hourly.wind_speed_10m),
    windDir: get(data.hourly.wind_direction_10m),
    windDirText: degreesToCompass(get(data.hourly.wind_direction_10m)),
    pressure,
    pressure6hAgo,
    windWave: get(data.hourly.wind_wave_height),
    waveHeight: get(data.hourly.wave_height),
    waterTemp,
    daily: data.daily ?? null,
    hourly,
    units: data.hourly_units ?? {},
    forecastDays: 3,
    fetchedAt: new Date().toISOString(),
  };
}
