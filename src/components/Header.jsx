import { NavLink } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.brand} aria-label="Gulf Bite home">
          <span className={styles.logoMark} aria-hidden="true">
            🌊
          </span>
          <span className={styles.brandText}>
            GULF<span className={styles.brandAccent}>BITE</span>
          </span>
        </NavLink>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Tracker
          </NavLink>
          <NavLink
            to="/hotspots"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Hotspots
          </NavLink>
          <NavLink
            to="/blog"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            Blog
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
