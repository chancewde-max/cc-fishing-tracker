import { Link } from 'react-router-dom';
import BayBackground from './BayBackground.jsx';
import styles from './AuthCard.module.css';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.5 34.9 26.9 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.5 5.5C41 35.4 44 30.1 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.428 2.19-1.14 2.988-.83.92-2.146 1.63-3.34 1.53-.145-1.1.42-2.25 1.13-3.02.81-.87 2.21-1.51 3.35-1.5zM20.6 17.02c-.42.97-.62 1.4-1.16 2.26-.75 1.19-1.81 2.67-3.12 2.68-1.17.01-1.47-.76-3.05-.75-1.58.01-1.91.76-3.08.75-1.31-.01-2.31-1.35-3.06-2.54-2.1-3.3-2.32-7.18-1.03-9.24.92-1.47 2.37-2.33 3.73-2.33 1.39 0 2.26.79 3.41.79 1.11 0 1.79-.79 3.41-.79 1.21 0 2.5.66 3.42 1.8-3.01 1.65-2.52 5.94.48 7.37z" />
    </svg>
  );
}

/**
 * Shared shell for the sign-in / sign-up cards: bay background, brand
 * header, glass card with icon fields, primary button, a divider, social
 * buttons, and a footer line linking to the other auth page.
 */
export default function AuthCard({
  icon = '🔑',
  title,
  subtitle,
  onSubmit,
  children,
  submitLabel,
  busy,
  error,
  success,
  onSocial,
  switchText,
  switchLinkText,
  switchTo,
}) {
  return (
    <BayBackground>
      <div className={styles.wrap}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logoMark} aria-hidden="true">🌊</span>
          <span className={styles.brandText}>
            GULF<span className={styles.brandAccent}>BITE</span>
          </span>
        </Link>

        <div className={styles.card}>
          <div className={styles.iconBadge} aria-hidden="true">{icon}</div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>

          <form className={styles.form} onSubmit={onSubmit}>
            {children}

            {error && <p className={styles.error} role="alert">{error}</p>}
            {success && <p className={styles.success} role="status">{success}</p>}

            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? 'Please wait…' : submitLabel}
            </button>
          </form>

          <div className={styles.divider}>Or continue with</div>
          <div className={styles.socials}>
            <button
              type="button"
              className={styles.socialBtn}
              aria-label="Continue with Google"
              onClick={() => onSocial?.('google')}
            >
              <GoogleIcon />
            </button>
            <button
              type="button"
              className={styles.socialBtn}
              aria-label="Continue with Apple"
              onClick={() => onSocial?.('apple')}
            >
              <AppleIcon />
            </button>
          </div>

          <p className={styles.switchLine}>
            {switchText} <Link to={switchTo}>{switchLinkText}</Link>
          </p>
        </div>
      </div>
    </BayBackground>
  );
}
