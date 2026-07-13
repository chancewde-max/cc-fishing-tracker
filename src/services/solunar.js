// ============================================================
// solunar.js — Pure solunar (sun/moon) calculation. No API.
// ------------------------------------------------------------
// Implements a standard solunar model:
//   - Moon phase + illumination (lunation-based)
//   - Moon/sun rise, set, transit via low-precision ephemeris
//     (Paul Schlyter's "Compute planetary positions" method) +
//     local sidereal time event solving.
//   - Major periods: moon overhead & moon underfoot (moon transit
//     and antimeridian) — the classic solunar "major" windows.
//   - Minor periods: moonrise & moonset.
//   - dayRating (0-100): best near new/full moon per solunar theory.
//   - score (0-100): dayRating adjusted for the current moment
//     (boosted inside a major/minor window) — feeds biteScore.
//
// Accuracy is "naval-almanac-lite" (event times within a few min);
// more than adequate for a best-bite heuristic. No network calls.
// ============================================================

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const OBLIQUITY = 23.4393; // degrees

function rev(x) {
  // Normalize to [0, 360)
  return x - 360 * Math.floor(x / 360);
}

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

// Low-precision orbital position (Schlyter). Angles in degrees.
function orbitalElements(N, i, w, a, e, Mdeg) {
  const M = Mdeg * DEG;
  // Solve Kepler's equation (a few iterations is plenty here)
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let k = 0; k < 5; k += 1) {
    E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  }
  const xv = a * (Math.cos(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const r = Math.sqrt(xv * xv + yv * yv);
  const v = Math.atan2(yv, xv); // true anomaly (rad)
  const vw = v + w * DEG; // argument of latitude in ecliptic frame
  const Nr = N * DEG;

  const xeclip =
    r * (Math.cos(Nr) * Math.cos(vw) - Math.sin(Nr) * Math.sin(vw) * Math.cos(i * DEG));
  const yeclip =
    r * (Math.sin(Nr) * Math.cos(vw) + Math.cos(Nr) * Math.sin(vw) * Math.cos(i * DEG));
  const zeclip = r * (Math.sin(vw) * Math.sin(i * DEG));

  const lon = Math.atan2(yeclip, xeclip) * RAD;
  const lat = Math.atan2(zeclip, Math.sqrt(xeclip * xeclip + yeclip * yeclip)) * RAD;
  return { lon: rev(lon), lat, r };
}

// Ecliptic (lon,lat) -> equatorial (RA hours, Dec deg)
function eclipticToEquatorial(lonDeg, latDeg) {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const eps = OBLIQUITY * DEG;
  const ra =
    Math.atan2(
      Math.sin(lon) * Math.cos(eps) - Math.tan(lat) * Math.sin(eps),
      Math.cos(lon)
    ) * RAD;
  const dec = Math.asin(
    Math.sin(lat) * Math.cos(eps) + Math.cos(lat) * Math.sin(eps) * Math.sin(lon)
  ) * RAD;
  return { raHours: ra / 15, dec };
}

// Compute Sun + Moon positions for a given JD.
function getBodies(jd) {
  const d = jd - 2451543.5; // days since 2000-01-01 0h (Schlyter epoch)

  // --- Sun ---
  const sun = orbitalElements(
    0.0,
    0.0,
    282.9404 + 4.70935e-5 * d,
    1.0,
    0.016709 - 1.151e-9 * d,
    356.047 + 0.9856002585 * d
  );
  const sunEq = eclipticToEquatorial(sun.lon, sun.lat);

  // --- Moon ---
  const moon = orbitalElements(
    125.1228 - 0.0529538083 * d,
    5.1454,
    318.0634 + 0.1643573223 * d,
    60.2666,
    0.0549,
    115.3654 + 13.0649929509 * d
  );
  // Perturbations (Schlyter) — degrees.
  const Mm = 115.3654 + 13.0649929509 * d;
  const Ms = 356.047 + 0.9856002585 * d;
  const D = rev(moon.lon - sun.lon);
  const Fm = rev(moon.lon - (125.1228 - 0.0529538083 * d));

  const lonPert =
    -1.274 * Math.sin((Mm - 2 * D) * DEG) +
    0.658 * Math.sin(2 * D * DEG) -
    0.186 * Math.sin(Ms * DEG) -
    0.059 * Math.sin((2 * Mm - 2 * D) * DEG) -
    0.057 * Math.sin((Mm - 2 * D + Ms) * DEG) +
    0.053 * Math.sin((Mm + 2 * D) * DEG) +
    0.046 * Math.sin((2 * D - Ms) * DEG) +
    0.041 * Math.sin((Mm - Ms) * DEG) -
    0.035 * Math.sin(D * DEG) -
    0.031 * Math.sin((Mm + Ms) * DEG) -
    0.015 * Math.sin((2 * Fm - 2 * D) * DEG) +
    0.011 * Math.sin((Mm - 4 * D) * DEG);

  const latPert =
    -0.173 * Math.sin((Fm - 2 * D) * DEG) -
    0.055 * Math.sin((Mm - Fm - 2 * D) * DEG) -
    0.046 * Math.sin((Mm + Fm - 2 * D) * DEG) +
    0.032 * Math.sin((Fm - 2 * D) * DEG) +
    0.017 * Math.sin((2 * Mm + Fm - 2 * D) * DEG);

  const moonLon = rev(moon.lon + lonPert);
  const moonLat = moon.lat + latPert;
  const moonEq = eclipticToEquatorial(moonLon, moonLat);

  return { sun: sunEq, moon: moonEq, moonLon, D, Mm };
}

// Greenwich Mean Sidereal Time (hours) at JD.
function gmstHours(jd) {
  const d = jd - 2451545.0;
  let g = 18.697374558 + 24.06570982441908 * d;
  g = ((g % 24) + 24) % 24;
  return g;
}

// Local sidereal time at 0h UT for (jdMidnightUT, lonDeg).
function lst0Hours(jdMidnightUT, lonDeg) {
  const g = gmstHours(jdMidnightUT);
  return ((g + lonDeg / 15) % 24 + 24) % 24;
}

// Convert a UT hour-of-day (relative to 0h UT of jdMidnightUT) to a
// local Date, accounting for the computer's timezone.
function utHourToLocalDate(jdMidnightUT, utHour, tzOffsetMin) {
  const ms = (jdMidnightUT - 2440587.5) * 86400000 + utHour * 3600000;
  // tzOffsetMin = getTimezoneOffset() (minutes, +ve = behind UTC)
  return new Date(ms - tzOffsetMin * 60000);
}

// Solve upper transit + rise/set for a body at a location on a date.
function solveEvents({ raHours, dec, lat, lon, jdMidnightUT, tzOffsetMin, h0 = 0 }) {
  const SID2SOLAR = 0.997269566; // sidereal hour -> solar hour
  const L0 = lst0Hours(jdMidnightUT, lon);
  // Upper transit sidereal hours after 0h UT:
  let Ht = rev(raHours - L0);
  const transitUT = Ht * SID2SOLAR;
  const transitDate = utHourToLocalDate(jdMidnightUT, transitUT, tzOffsetMin);

  // Hour angle of rise/set (degrees)
  const cosH =
    (Math.sin(h0 * DEG) - Math.sin(lat * DEG) * Math.sin(dec * DEG)) /
    (Math.cos(lat * DEG) * Math.cos(dec * DEG));
  let riseDate = null;
  let setDate = null;
  if (cosH >= -1 && cosH <= 1) {
    const H = Math.acos(cosH) * RAD; // degrees
    const Hh = (H / 15) * SID2SOLAR;
    riseDate = utHourToLocalDate(jdMidnightUT, transitUT - Hh, tzOffsetMin);
    setDate = utHourToLocalDate(jdMidnightUT, transitUT + Hh, tzOffsetMin);
  }
  // Underfoot = upper transit + 12h
  const underfootDate = new Date(transitDate.getTime() + 12 * 3600000);
  return { transitDate, underfootDate, riseDate, setDate };
}

function moonPhaseName(frac) {
  // frac: 0=new, 0.5=full, 1=new
  if (frac < 0.02 || frac >= 0.98) return 'New Moon';
  if (frac < 0.23) return 'Waxing Crescent';
  if (frac < 0.27) return 'First Quarter';
  if (frac < 0.48) return 'Waxing Gibbous';
  if (frac < 0.52) return 'Full Moon';
  if (frac < 0.73) return 'Waning Gibbous';
  if (frac < 0.77) return 'Last Quarter';
  return 'Waning Crescent';
}

function pad(n) {
  return String(n).padStart(2, '0');
}
function fmt(date) {
  if (!date) return null;
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Compute solunar data for a location + date.
 * @param {number} lat latitude (deg)
 * @param {number} lng longitude (deg, east positive)
 * @param {Date} date reference date (defaults to now)
 * @returns {{majorPeriods:Array,minorPeriods:Array,moonPhase:number,moonPhaseName:string,dayRating:number,score:number,currentPeriod:string,currentPeriodPeakInMin:number|null,sun:object,moon:object}}
 */
export function computeSolunar(lat, lng, date = new Date()) {
  const tzOffsetMin = date.getTimezoneOffset();

  // Representative position: compute at local noon of the date.
  const base = new Date(date);
  base.setHours(12, 0, 0, 0);
  const jd = julianDay(base);

  // Midnight UT of the same calendar date:
  const midUT = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), 0, 0, 0)
  );
  const jdMid = julianDay(midUT);

  const { sun, moon } = getBodies(jd);

  const sunEv = solveEvents({
    raHours: sun.raHours,
    dec: sun.dec,
    lat,
    lon: lng,
    jdMidnightUT: jdMid,
    tzOffsetMin,
    h0: -0.833,
  });
  const moonEv = solveEvents({
    raHours: moon.raHours,
    dec: moon.dec,
    lat,
    lon: lng,
    jdMidnightUT: jdMid,
    tzOffsetMin,
    h0: 0,
  });

  // --- Moon phase from lunation ---
  // Reference new moon: 2000-01-06 18:14 UTC (JD 2451550.26)
  const SYNODIC = 29.530588853;
  const age = ((jd - 2451550.26) % SYNODIC + SYNODIC) % SYNODIC;
  const phase = age / SYNODIC; // 0=new, 0.5=full

  // --- Day rating: best near new/full moon ---
  const phaseDist = Math.min(phase, 1 - phase); // 0 at new/full, 0.25 at quarter
  const moonFactor = 1 - phaseDist / 0.25; // 1 at new/full, 0 at quarter
  const dayRating = Math.round(45 + moonFactor * 50); // 45..95

  // --- Build major/minor periods (window = peak +/- 1h) ---
  const makeWindow = (label, type, peak) => {
    if (!peak) return null;
    return {
      label,
      type,
      peak: peak.toISOString(),
      peakLocal: fmt(peak),
      start: new Date(peak.getTime() - 60 * 60000).toISOString(),
      end: new Date(peak.getTime() + 60 * 60000).toISOString(),
    };
  };

  const majorPeriods = [
    makeWindow('Moon Overhead', 'major', moonEv.transitDate),
    makeWindow('Moon Underfoot', 'major', moonEv.underfootDate),
  ].filter(Boolean);

  const minorPeriods = [
    makeWindow('Moonrise', 'minor', moonEv.riseDate),
    makeWindow('Moonset', 'minor', moonEv.setDate),
  ].filter(Boolean);

  // --- Current-moment score ---
  const now = date.getTime();
  const allPeaks = [
    ...majorPeriods.map((p) => ({ type: 'major', t: new Date(p.peak).getTime() })),
    ...minorPeriods.map((p) => ({ type: 'minor', t: new Date(p.peak).getTime() })),
  ];
  let currentPeriod = 'none';
  let currentPeriodPeakInMin = null;
  let bestDelta = Infinity;
  for (const p of allPeaks) {
    const deltaMin = (p.t - now) / 60000;
    if (Math.abs(deltaMin) <= 60 && Math.abs(deltaMin) < Math.abs(bestDelta)) {
      bestDelta = deltaMin;
      currentPeriod = p.type;
    }
  }
  if (currentPeriod === 'none') {
    // distance to nearest peak regardless
    for (const p of allPeaks) {
      const deltaMin = (p.t - now) / 60000;
      if (Math.abs(deltaMin) < Math.abs(bestDelta)) {
        bestDelta = deltaMin;
      }
    }
  }
  currentPeriodPeakInMin =
    bestDelta === Infinity ? null : Math.round(bestDelta);

  let score = dayRating;
  if (currentPeriod === 'major') score = Math.min(100, score + 18);
  else if (currentPeriod === 'minor') score = Math.min(100, score + 9);
  else score = Math.max(20, score - 12);
  score = Math.round(score);

  return {
    majorPeriods,
    minorPeriods,
    moonPhase: Number(phase.toFixed(4)),
    moonPhaseName: moonPhaseName(phase),
    moonIllumination: Number((0.5 * (1 - Math.cos(2 * Math.PI * phase))).toFixed(3)),
    dayRating,
    score,
    currentPeriod,
    currentPeriodPeakInMin,
    sun: {
      rise: sunEv.riseDate ? sunEv.riseDate.toISOString() : null,
      set: sunEv.setDate ? sunEv.setDate.toISOString() : null,
      riseLocal: fmt(sunEv.riseDate),
      setLocal: fmt(sunEv.setDate),
    },
    moon: {
      rise: moonEv.riseDate ? moonEv.riseDate.toISOString() : null,
      set: moonEv.setDate ? moonEv.setDate.toISOString() : null,
      riseLocal: fmt(moonEv.riseDate),
      setLocal: fmt(moonEv.setDate),
      transitLocal: fmt(moonEv.transitDate),
    },
  };
}

export default computeSolunar;
