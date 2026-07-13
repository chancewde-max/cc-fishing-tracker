import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchWeather } from '../services/weather.js';
import { fetchTides, deriveTideState } from '../services/tides.js';
import { computeSolunar } from '../services/solunar.js';
import { computeBite, SPECIES } from '../services/biteScore.js';
import BiteCard from './BiteCard.jsx';
import TideChart from './TideChart.jsx';
import styles from './ConditionsDashboard.module.css';

const LAT = 27.69;
const LNG = -97.36;
const REFRESH_MS = 15 * 60 * 1000;

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function tideStateLabel(state) {
  if (!state || !state.nextType) return '—';
  const label = state.nextType === 'H' ? 'High' : 'Low';
  return `${label} ${fmtTime(state.nextTime)}`;
}

function Stat({ label, value, unit, sub }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>
        {value}
        {unit && <span className={styles.statUnit}>{unit}</span>}
      </span>
      {sub && <span className={styles.statSub}>{sub}</span>}
    </div>
  );
}

export default function ConditionsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warn, setWarn] = useState(null);
  const [weather, setWeather] = useState(null);
  const [tides, setTides] = useState(null);
  const [solunar, setSolunar] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const sol = computeSolunar(LAT, LNG, now);
    setSolunar(sol);

    const [wRes, tRes] = await Promise.allSettled([fetchWeather(), fetchTides()]);

    let weatherData = null;
    let tideData = null;
    let errMsg = null;
    const warns = [];

    if (wRes.status === 'fulfilled') {
      weatherData = wRes.value;
      setWeather(weatherData);
    } else {
      errMsg = `Weather unavailable (${wRes.reason?.message || 'error'}). Using cached/local only.`;
    }

    if (tRes.status === 'fulfilled') {
      tideData = tRes.value;
      setTides(tideData);
      const bad = tideData.stations.filter((s) => s.error);
      if (bad.length) {
        warns.push(`Tides: ${bad.map((b) => b.name).join(', ')} failed.`);
      }
    } else {
      warns.push(`Tides unavailable (${tRes.reason?.message || 'error'}).`);
    }

    setError(errMsg);
    setWarn(warns.length ? warns.join(' ') : null);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const derived = useMemo(() => {
    const pressureTrend =
      weather && weather.pressure != null && weather.pressure6hAgo != null
        ? Number((weather.pressure - weather.pressure6hAgo).toFixed(2))
        : null;

    const primaryPreds = tides?.stations?.[0]?.predictions ?? [];
    const tideState = deriveTideState(primaryPreds, new Date());

    const waterTemp = weather?.waterTemp ?? null;
    const solunarScore = solunar?.score ?? null;

    const bites = SPECIES.map((sp) => ({
      ...sp,
      result: computeBite(
        {
          windSpeed: weather?.windSpeed ?? null,
          pressureTrend,
          tideState,
          solunarScore,
          waterTemp,
        },
        sp.key
      ),
    }));

    return { pressureTrend, tideState, bites };
  }, [weather, tides, solunar]);

  const primaryStation = tides?.stations?.[0];
  const nextTide = tideStateLabel(derived.tideState);

  return (
    <section className={styles.wrap} aria-label="Current fishing conditions">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Conditions</h2>
          <span className={styles.sub}>
            Corpus Christi Bay · {lastUpdated ? `updated ${fmtTime(lastUpdated.toISOString())}` : 'loading…'}
          </span>
        </div>
        <button
          type="button"
          className={styles.refresh}
          onClick={load}
          disabled={loading}
          aria-label="Refresh conditions"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Live region for status / errors */}
      <div aria-live="polite" className="visually-hidden">
        {loading ? 'Loading conditions' : error ? error : 'Conditions updated'}
      </div>
      {error && (
        <div className={styles.error} role="alert">
          ⚠ {error}
        </div>
      )}
      {warn && !error && (
        <div className={styles.warn} role="status">
          {warn}
        </div>
      )}

      {loading && !weather && !tides ? (
        <div className={styles.loading} aria-busy="true">
          <span className={styles.spinner} aria-hidden="true" />
          Loading live conditions…
        </div>
      ) : (
        <>
          {/* Current conditions */}
          <div className={styles.stats}>
            <Stat
              label="Wind"
              value={weather?.windSpeed != null ? Math.round(weather.windSpeed) : '—'}
              unit=" mph"
              sub={weather?.windDirText ? `from ${weather.windDirText}` : undefined}
            />
            <Stat
              label="Pressure"
              value={weather?.pressure != null ? Math.round(weather.pressure) : '—'}
              unit=" mb"
              sub={
                derived.pressureTrend != null
                  ? `${derived.pressureTrend > 0 ? '▲' : derived.pressureTrend < 0 ? '▼' : '■'} ${Math.abs(derived.pressureTrend)} mb/6h`
                  : 'trend n/a'
              }
            />
            <Stat
              label="Air Temp"
              value={weather?.temp != null ? Math.round(weather.temp) : '—'}
              unit="°F"
              sub={weather?.waterTemp != null ? `water ${Math.round(weather.waterTemp)}°F` : undefined}
            />
            <Stat label="Next Tide" value={nextTide} sub={primaryStation?.name ?? 'Aransas Pass'} />
          </div>

          {/* Solunar strip */}
          <div className={styles.solunar}>
            <div className={styles.solunarLeft}>
              <span className={styles.solunarLabel}>Solunar day rating</span>
              <span className={styles.solunarScore}>{solunar?.dayRating ?? '—'}</span>
              <span className={styles.solunarMax}>/100</span>
            </div>
            <div className={styles.solunarMeta}>
              <span>Moon: {solunar?.moonPhaseName ?? '—'}</span>
              <span>Now: {solunar?.currentPeriod === 'none' ? 'off-peak' : solunar?.currentPeriod}</span>
              <span>
                Peak in{' '}
                {solunar?.currentPeriodPeakInMin == null
                  ? '—'
                  : `${Math.abs(solunar.currentPeriodPeakInMin)} min`}
              </span>
            </div>
          </div>

          {/* Bite cards */}
          <h3 className={styles.sectionTitle}>Best bite right now</h3>
          <div className={styles.bites}>
            {derived.bites.map((b) => (
              <BiteCard key={b.key} name={b.name} emoji={b.emoji} result={b.result} />
            ))}
          </div>

          {/* Tides */}
          <div className={styles.tides}>
            <TideChart tideStations={tides?.stations ?? []} now={new Date()} />
          </div>
        </>
      )}
    </section>
  );
}
