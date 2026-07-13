import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/useAuth.js';
import styles from './Header.module.css';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <NavLink to="/tracker" className={styles.brand} aria-label="Gulf Bite home">
          <span className={styles.logoMark} aria-hidden="true">
            🌊
          </span>
          <span className={styles.brandText}>
            GULF<span className={styles.brandAccent}>BITE</span>
          </span>
        </NavLink>

        <nav className={styles.nav} aria-label="Primary">
          <NavLink
            to="/tracker"
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
          {user ? (
            <button type="button" className={styles.link} onClick={signOut}>
              Log Out
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.active}` : styles.link
              }
            >
              Log In
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
