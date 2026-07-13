import { useState } from 'react';
import AuthCard from '../components/AuthCard.jsx';
import { useAuth } from '../lib/useAuth.js';
import styles from '../components/AuthCard.module.css';

export default function SignUpPage() {
  const { signUpWithPassword, signInWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    const { error: err } = await signUpWithPassword(email, password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess('Check your email to confirm your account.');
  };

  const social = async (provider) => {
    setError(null);
    const { error: err } = await signInWithProvider(provider);
    if (err) setError(err.message);
  };

  return (
    <AuthCard
      icon="🎣"
      title="Create your account"
      subtitle="Save hotspots, log catches, and pick up where you left off."
      onSubmit={submit}
      submitLabel="Sign Up"
      busy={busy}
      error={error}
      success={success}
      onSocial={social}
      switchText="Already have an account?"
      switchLinkText="Log in"
      switchTo="/login"
    >
      <label className={styles.field}>
        <span className={styles.fieldIcon} aria-hidden="true">✉️</span>
        <input
          className={styles.input}
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className={styles.field}>
        <span className={styles.fieldIcon} aria-hidden="true">🔒</span>
        <input
          className={styles.input}
          type="password"
          placeholder="Create a password"
          autoComplete="new-password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
    </AuthCard>
  );
}
