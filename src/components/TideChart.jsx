import { useMemo } from 'react';
import styles from './TideChart.module.css';

function shortTime(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function relDayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const diff = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()) -
      new Date(today.getFullYear(), today.getMonth(), today.getDate())) /
      86400000
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yest';
  return `Day ${diff > 0 ? '+' : ''}${diff}`;
}

/**
 * Render an SVG curve of high/low tide turns for a station, plus a list.
 * @param {{station:{name:string,predictions:Array},now:Date}} props
 */
function StationTide({ station, now }) {
  const points = useMemo(() => {
    const preds = (station.predictions || []).filter((p) => p.time);
    return preds
      .map((p) => ({ ...p, t: new Date(p.time) }))
      .sort((a, b) => a.t - b.t);
  }, [station]);

  if (!points.length) {
    return (
      <div className={styles.station}>
        <h4 className={styles.stationName}>{station.name}</h4>
        <p className={styles.empty}>No tide data available.</p>
      </div>
    );
  }

  // SVG geometry
  const W = 300;
  const H = 120;
  const padX = 10;
  const padY = 14;
  const minT = points[0].t.getTime();
  const maxT = points[points.length - 1].t.getTime();
  const span = Math.max(1, maxT - minT);
  const heights = points.map((p) => p.height);
  const minH = Math.min(...heights);
  const maxH = Math.max(...heights);
  const hRange = Math.max(0.1, maxH - minH);

  const xOf = (t) => padX + ((t - minT) / span) * (W - padX * 2);
  const yOf = (h) => H - padY - ((h - minH) / hRange) * (H - padY * 2);

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.t.getTime()).toFixed(1)} ${yOf(p.height).toFixed(1)}`)
    .join(' ');

  const nowX = xOf(Math.max(minT, Math.min(maxT, now.getTime())));

  return (
    <div className={styles.station}>
      <h4 className={styles.stationName}>
        {station.name}
        <span className={styles.stationId}>#{station.id}</span>
      </h4>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Tide chart for ${station.name}`}
        preserveAspectRatio="none"
      >
        <path d={`${linePath} L ${W - padX} ${H - padY} L ${padX} ${H - padY} Z`} className={styles.area} />
        <path d={linePath} className={styles.line} />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={xOf(p.t.getTime())}
              cy={yOf(p.height)}
              r={3.2}
              className={p.type === 'H' ? styles.dotHi : styles.dotLo}
            />
          </g>
        ))}
        {/* now marker */}
        <line x1={nowX} y1={4} x2={nowX} y2={H - padY} className={styles.nowLine} />
      </svg>
      <ul className={styles.list}>
        {points.map((p, i) => (
          <li key={i} className={styles.row}>
            <span className={p.type === 'H' ? styles.hi : styles.lo}>
              {p.type === 'H' ? 'HIGH' : 'LOW'}
            </span>
            <span className={styles.time}>
              {shortTime(p.time)} <em className={styles.day}>{relDayLabel(p.time)}</em>
            </span>
            <span className={styles.height}>{p.height.toFixed(1)} ft</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @param {{tideStations:Array<{name:string,id:string,predictions:Array}>}} props
 */
export default function TideChart({ tideStations = [], now = new Date() }) {
  return (
    <section className={styles.wrap} aria-label="Tide predictions">
      <div className={styles.header}>
        <h3>Tides</h3>
        <span className={styles.sub}>High / low · MLLW (ft)</span>
      </div>
      <div className={styles.grid}>
        {tideStations.map((s) => (
          <StationTide key={s.id} station={s} now={now} />
        ))}
      </div>
    </section>
  );
}
