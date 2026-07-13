import styles from './BayBackground.module.css';

// A slowly-scrolling Corpus Christi bay scene: sky, two parallax water bands,
// and a few small boats drifting across at different speeds. Pure CSS/SVG,
// no network assets — used behind the landing/sign-in/sign-up pages.
// The backdrop is fixed to one viewport (not the scrollable page height), so
// it stays a stable sky-to-water scene no matter how tall the page content is.
const BOATS = [
  { emoji: '⛵', top: '58%', duration: '38s', delay: '0s', size: '2.1rem' },
  { emoji: '🚤', top: '71%', duration: '26s', delay: '-9s', size: '1.6rem' },
  { emoji: '⛴️', top: '65%', duration: '46s', delay: '-20s', size: '2.4rem' },
];

export default function BayBackground({ children }) {
  return (
    <div className={styles.scene}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.sky} />
        <div className={styles.waterFar} />
        <div className={styles.waterNear} />
        {BOATS.map((b, i) => (
          <span
            key={i}
            className={styles.boat}
            style={{
              top: b.top,
              fontSize: b.size,
              animationDuration: b.duration,
              animationDelay: b.delay,
            }}
          >
            {b.emoji}
          </span>
        ))}
      </div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
