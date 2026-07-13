import styles from './BayBackground.module.css';

// A calm, mostly-static Corpus Christi bay backdrop: sky, water, a subtle
// slow shimmer, and a couple of small boats drifting across very slowly.
// Pure CSS/SVG, no network assets — used behind the landing/sign-in/sign-up
// pages. Fixed to one viewport so it stays stable regardless of page height.
const BOATS = [
  { emoji: '⛵', top: '62%', duration: '85s', delay: '0s', size: '1.8rem' },
  { emoji: '🚤', top: '78%', duration: '70s', delay: '-35s', size: '1.3rem' },
];

export default function BayBackground({ children }) {
  return (
    <div className={styles.scene}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.sky} />
        <div className={styles.water} />
        <div className={styles.shimmer} />
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
