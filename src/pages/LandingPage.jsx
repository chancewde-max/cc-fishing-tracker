import BayBackground from '../components/BayBackground.jsx';
import FishButton from '../components/FishButton.jsx';
import styles from './LandingPage.module.css';

const FEATURES = [
  {
    emoji: '🌬️',
    title: 'Live conditions',
    body: 'Wind, pressure and water temp for Corpus Christi Bay, refreshed every 15 minutes.',
  },
  {
    emoji: '🌊',
    title: 'Real tide predictions',
    body: 'High/low tide turns for Aransas Pass & Packery Channel, straight from NOAA.',
  },
  {
    emoji: '🌕',
    title: 'Solunar timing',
    body: 'Major & minor feeding windows calculated from sun and moon position — no API needed.',
  },
  {
    emoji: '🎣',
    title: 'Best-bite scores',
    body: 'Species-specific scoring for Speckled Trout, Redfish & Black Drum, with the reasons why.',
  },
  {
    emoji: '📍',
    title: 'Hotspot map',
    body: 'Six built-in CC inshore spots, plus add your own and log catches at each one.',
  },
];

export default function LandingPage() {
  return (
    <BayBackground>
      <div className={styles.page}>
        <header className={styles.brand}>
          <span className={styles.logoMark} aria-hidden="true">🌊</span>
          <span className={styles.brandText}>
            GULF<span className={styles.brandAccent}>BITE</span>
          </span>
        </header>

        <section className={styles.hero}>
          <h1 className={styles.title}>Know before you go.</h1>
          <p className={styles.lead}>
            Wind, tide, solunar timing and species-specific bite scores for the
            Corpus Christi bay system — plus a hotspot map for logging what you
            catch and where. One dashboard, built for CC inshore anglers.
          </p>

          <div className={styles.ctas}>
            <FishButton label="Sign Up" to="/signup" variant="amber" />
            <FishButton label="Log In" to="/login" variant="teal" />
          </div>
        </section>

        <section className={styles.features} aria-label="What Gulf Bite offers">
          {FEATURES.map((f) => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureEmoji} aria-hidden="true">{f.emoji}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureBody}>{f.body}</p>
            </div>
          ))}
        </section>

        <footer className={styles.footer}>
          <span>Gulf Bite · Corpus Christi inshore conditions</span>
        </footer>
      </div>
    </BayBackground>
  );
}
