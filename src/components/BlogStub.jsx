import styles from './BlogStub.module.css';

export default function BlogStub() {
  return (
    <section className={styles.wrap} aria-label="Fishing reports">
      <div className={styles.inner}>
        <span className={styles.kicker}>Fishing Reports</span>
        <h1 className={styles.title}>Community reports coming soon</h1>
        <p className={styles.lead}>
          We’re wiring up a spot for anglers to post catch photos, trip notes and
          live reports from the flats. Sign-in and posting arrive in Phase B
          (Supabase).
        </p>

        <form
          className={styles.login}
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="you@email.com"
              autoComplete="email"
              disabled
            />
          </label>
          <button type="submit" className={styles.btn} disabled>
            Request early access
          </button>
        </form>

        <p className={styles.note}>
          Notifications are stubbed in Phase A — no data is sent.
        </p>
      </div>
    </section>
  );
}
