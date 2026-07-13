import { Link } from 'react-router-dom';
import styles from './FishButton.module.css';

// Spotted-seatrout silhouette used as a call-to-action button on the landing
// page. Drawn in SVG (no external asset) so it needs no network/image file.
function FishSvg() {
  return (
    <svg viewBox="0 0 220 100" className={styles.svg} aria-hidden="true">
      <defs>
        <linearGradient id="fishBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#aab89a" />
          <stop offset="45%" stopColor="#c9d3bd" />
          <stop offset="100%" stopColor="#eef1e8" />
        </linearGradient>
      </defs>
      {/* tail */}
      <path
        d="M6 50 L34 30 L28 50 L34 70 Z"
        fill="url(#fishBody)"
        stroke="#7c8a6e"
        strokeWidth="1.5"
      />
      {/* body */}
      <path
        d="M30 50
           C 40 22, 90 12, 130 16
           C 168 19, 198 34, 214 50
           C 198 66, 168 81, 130 84
           C 90 88, 40 78, 30 50 Z"
        fill="url(#fishBody)"
        stroke="#7c8a6e"
        strokeWidth="1.5"
      />
      {/* dorsal fin */}
      <path
        d="M95 17 C 105 2, 130 0, 150 10 C 132 16, 112 18, 95 17 Z"
        fill="#9fae8c"
        stroke="#7c8a6e"
        strokeWidth="1"
      />
      {/* pectoral fin */}
      <path
        d="M150 58 C 158 70, 158 82, 150 90 C 142 80, 140 66, 150 58 Z"
        fill="#e2c98a"
        stroke="#b89a5c"
        strokeWidth="1"
      />
      {/* spots */}
      {[
        [70, 28], [88, 22], [106, 26], [124, 24], [142, 30],
        [78, 40], [96, 36], [114, 40], [132, 42], [150, 44],
        [66, 52], [84, 56], [102, 58],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.6" fill="#3c4a35" opacity="0.75" />
      ))}
      {/* eye */}
      <circle cx="200" cy="45" r="5" fill="#2a2a1c" />
      <circle cx="202" cy="43" r="1.4" fill="#fff" />
      {/* mouth */}
      <path d="M214 50 L221 54" stroke="#7c8a6e" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/**
 * @param {{label:string,to:string,variant?:'amber'|'teal'}} props
 */
export default function FishButton({ label, to, variant = 'amber' }) {
  return (
    <Link to={to} className={`${styles.wrap} ${styles[variant]}`}>
      <FishSvg />
      <span className={styles.label}>{label}</span>
    </Link>
  );
}
