import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import BayBackground from './components/BayBackground.jsx';
import ConditionsDashboard from './components/ConditionsDashboard.jsx';
import HotspotMap from './components/HotspotMap.jsx';
import BlogStub from './components/BlogStub.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import { useAuth } from './lib/useAuth.js';
import styles from './App.module.css';

const PUBLIC_PATHS = ['/', '/login', '/signup'];

// OAuth providers redirect back to the bare origin (no route), which
// HashRouter resolves to "/" — the landing page. Rather than fight that
// through the redirect URL (Supabase appends ?code=... to it, which would
// land inside the hash fragment where the router can't see it), just watch
// auth state here: once a session exists while sitting on a public page,
// send the user on to the tracker.
function AuthRedirect() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && PUBLIC_PATHS.includes(location.pathname)) {
      navigate('/tracker', { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
}

// Shares the same bay backdrop as the landing/auth pages. Every panel here
// (Header, ConditionsDashboard, HotspotMap) has its own fully-opaque
// background already, so legibility is unaffected — the image only shows
// through the gaps between panels.
function AppShell() {
  return (
    <BayBackground>
      <div className={styles.appShell}>
        <Header />
        <main className={styles.main} id="main">
          <Routes>
            <Route
              path="tracker"
              element={
                <div className={styles.homeGrid}>
                  <ConditionsDashboard />
                  <HotspotMap />
                </div>
              }
            />
            <Route
              path="hotspots"
              element={
                <div className={styles.hotspotPage}>
                  <HotspotMap />
                </div>
              }
            />
            <Route path="blog" element={<BlogStub />} />
            <Route path="*" element={<Navigate to="/tracker" replace />} />
          </Routes>
        </main>
        <footer className={styles.footer}>
          <span>Gulf Bite · Corpus Christi inshore conditions</span>
          <span className={styles.footerMuted}>
            Data: Open-Meteo · NOAA CO-OPS · Solunar tables · Phase A
          </span>
        </footer>
      </div>
    </BayBackground>
  );
}

export default function App() {
  return (
    <>
      <AuthRedirect />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </>
  );
}
