import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard.jsx';
import { useAuth } from '../lib/useAuth.js';
import styles from '../components/AuthCard.module.css';

export default function SignInPage() {
  const { signInWithPassword, signInWithProvider, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await signInWithPassword(email, password);
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate('/tracker');
  };

  const social = async (provider) => {
    setError(null);
    const { error: err } = await signInWithProvider(provider);
    if (err) setError(err.message);
  };

  const forgotPassword = async () => {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Enter your email above first.');
      return;
    }
    const { error: err } = await resetPassword(email);
    if (err) setError(err.message);
    else setNotice('Password reset email sent.');
  };

  return (
    <AuthCard
      icon="→"
      title="Sign in to Gulf Bite"
      subtitle="Log in to save hotspots and track your catches."
      onSubmit={submit}
      submitLabel="Log In"
      busy={busy}
      error={error}
      success={notice}
      onSocial={social}
      switchText="New here?"
      switchLinkText="Create an account"
      switchTo="/signup"
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
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <div className={styles.rowEnd}>
        <button type="button" className={styles.forgotBtn} onClick={forgotPassword}>
          Forgot password?
        </button>
      </div>
    </AuthCard>
  );
}
