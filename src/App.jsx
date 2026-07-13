import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import ConditionsDashboard from './components/ConditionsDashboard.jsx';
import HotspotMap from './components/HotspotMap.jsx';
import BlogStub from './components/BlogStub.jsx';
import LandingPage from './pages/LandingPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import styles from './App.module.css';

// The Header/footer chrome only wraps the app views (tracker/hotspots/blog);
// the landing page and auth cards render full-bleed over the bay background.
function AppShell() {
  return (
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
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<SignInPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}
