import { Link } from 'react-router-dom';
import styles from './FishButton.module.css';

// Spotted-seatrout silhouette used as a call-to-action button on the landing
// page. Drawn in SVG (no external asset) so it needs no network/image file.
// Key ID features vs. a generic fish blob: forked tail, two dorsal fins,
// tapered torpedo body, and dark spots concentrated on the back/tail/dorsal
// fin rather than scattered evenly.
function FishSvg() {
  return (
    <svg viewBox="0 0 220 100" className={styles.svg} aria-hidden="true">
      <defs>
        <linearGradient id="fishBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8f9d7c" />
          <stop offset="42%" stopColor="#c3cdb3" />
          <stop offset="75%" stopColor="#e9ecdf" />
          <stop offset="100%" stopColor="#f8f9f4" />
        </linearGradient>
      </defs>

      {/* forked tail */}
      <path
        d="M34 50 L4 30 L17 50 L4 70 Z"
        fill="url(#fishBody)"
        stroke="#6d7a5e"
        strokeWidth="1.5"
      />

      {/* body: tapered torpedo shape, pointed nose at right */}
      <path
        d="M32 50
           C 36 28, 70 14, 115 13
           C 150 12, 186 22, 213 50
           C 186 78, 150 88, 115 87
           C 70 86, 36 72, 32 50 Z"
        fill="url(#fishBody)"
        stroke="#6d7a5e"
        strokeWidth="1.5"
      />

      {/* first (spiny) dorsal fin */}
      <path
        d="M93 16 C 98 3, 110 -2, 120 4 C 112 11, 102 15, 93 16 Z"
        fill="#8b9976"
        stroke="#6d7a5e"
        strokeWidth="1"
      />
      {/* second (soft) dorsal fin */}
      <path
        d="M121 5 C 130 -4, 146 -3, 156 6 C 146 11, 132 10, 121 5 Z"
        fill="#8b9976"
        stroke="#6d7a5e"
        strokeWidth="1"
      />

      {/* pectoral fin */}
      <path
        d="M148 54 C 156 64, 156 76, 148 84 C 140 75, 139 62, 148 54 Z"
        fill="#e8d590"
        stroke="#b89a5c"
        strokeWidth="1"
      />
      {/* pelvic/anal fin */}
      <path
        d="M104 85 C 109 92, 118 94, 127 90 C 118 87, 111 86, 104 85 Z"
        fill="#e8d590"
        stroke="#b89a5c"
        strokeWidth="1"
      />

      {/* spots concentrated on the back, trailing onto the tail + dorsal fins */}
      {[
        [60, 34], [72, 26], [86, 22], [100, 20], [114, 21], [128, 24], [142, 30], [154, 36],
        [66, 44], [80, 38], [94, 34], [108, 33], [122, 35], [136, 40],
        [56, 52], [70, 56], [84, 58],
        [102, 8], [131, 2], [24, 40], [22, 58],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.4" fill="#3c4a35" opacity="0.8" />
      ))}

      {/* eye */}
      <circle cx="197" cy="42" r="5.5" fill="#d9b65c" />
      <circle cx="198" cy="42" r="3" fill="#20240f" />
      <circle cx="199.5" cy="40" r="1.1" fill="#fff" />

      {/* mouth + protruding lower jaw */}
      <path
        d="M212 49 C 208 52, 204 53, 199 53"
        stroke="#6d7a5e"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M205 54 L200 60 L210 56 Z" fill="#c3cdb3" stroke="#6d7a5e" strokeWidth="1" />
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
