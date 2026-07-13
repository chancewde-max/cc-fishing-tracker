import styles from './BiteCard.module.css';

const LABEL_COLOR = {
  Excellent: styles.excellent,
  Good: styles.good,
  Fair: styles.fair,
  Poor: styles.poor,
};

/**
 * @param {{name:string,emoji:string,result:{score:number,label:string,reasons:string[]}}} props
 */
export default function BiteCard({ name, emoji, result }) {
  const score = result?.score ?? 1;
  const label = result?.label ?? 'Fair';
  const reasons = result?.reasons ?? [];

  return (
    <article
      className={`${styles.card} ${LABEL_COLOR[label] || ''}`}
      aria-label={`${name} bite: ${label} (${score} of 5)`}
    >
      <div className={styles.head}>
        <span className={styles.emoji} aria-hidden="true">
          {emoji}
        </span>
        <h3 className={styles.name}>{name}</h3>
        <span className={`${styles.label} ${LABEL_COLOR[label] || ''}`}>{label}</span>
      </div>

      <div
        className={styles.gauge}
        role="img"
        aria-label={`Bite score ${score} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`${styles.pip} ${i <= score ? styles.pipOn : styles.pipOff}`}
            aria-hidden="true"
          />
        ))}
      </div>

      <ul className={styles.reasons}>
        {reasons.slice(0, 2).map((r, idx) => (
          <li key={idx}>{r}</li>
        ))}
      </ul>
    </article>
  );
}
