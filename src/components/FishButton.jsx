import { Link } from 'react-router-dom';
import styles from './FishButton.module.css';

// Spotted-seatrout silhouette used as a call-to-action button on the landing
// page. Drawn in SVG (no external asset) so it needs no network/image file.
// Key ID features vs. a generic fish blob: forked tail, a single dorsal fin
// (two lobes, one connected silhouette), a slim tapered body, and dark spots
// concentrated on the back/tail/dorsal fin rather than scattered evenly.
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
        d="M32 50 L6 33 L17 50 L6 67 Z"
        fill="url(#fishBody)"
        stroke="#6d7a5e"
        strokeWidth="1.5"
      />

      {/* body: slim tapered torpedo shape, pointed nose at right */}
      <path
        d="M32 50
           C 36 34, 70 24, 115 23
           C 150 22, 186 30, 213 50
           C 186 70, 150 78, 115 77
           C 70 76, 36 66, 32 50 Z"
        fill="url(#fishBody)"
        stroke="#6d7a5e"
        strokeWidth="1.5"
      />

      {/* single dorsal fin, two lobes joined in one silhouette */}
      <path
        d="M88 24
           C 92 8, 102 0, 108 2
           C 114 4, 118 10, 122 12
           C 126 8, 134 -2, 142 1
           C 150 4, 158 12, 162 23
           C 145 21, 105 21, 88 24 Z"
        fill="#8b9976"
        stroke="#6d7a5e"
        strokeWidth="1"
      />

      {/* pectoral fin */}
      <path
        d="M147 56 C 154 63, 154 71, 147 78 C 141 71, 140 62, 147 56 Z"
        fill="#e8d590"
        stroke="#b89a5c"
        strokeWidth="1"
      />
      {/* pelvic/anal fin */}
      <path
        d="M103 76 C 107 82, 115 84, 123 81 C 115 79, 109 78, 103 76 Z"
        fill="#e8d590"
        stroke="#b89a5c"
        strokeWidth="1"
      />

      {/* spots concentrated on the back, trailing onto the tail + dorsal fin */}
      {[
        [58, 36], [70, 30], [84, 27], [98, 26], [112, 27], [126, 29], [140, 34], [152, 39],
        [64, 45], [78, 40], [92, 38], [106, 37], [120, 39], [134, 43],
        [56, 52], [68, 55], [80, 57],
        [104, 8], [133, 4], [22, 42], [20, 58],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.2" fill="#3c4a35" opacity="0.8" />
      ))}

      {/* eye */}
      <circle cx="196" cy="43" r="5" fill="#d9b65c" />
      <circle cx="197" cy="43" r="2.7" fill="#20240f" />
      <circle cx="198.5" cy="41" r="1" fill="#fff" />

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
