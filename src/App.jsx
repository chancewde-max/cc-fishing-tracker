import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import ConditionsDashboard from './components/ConditionsDashboard.jsx';
import HotspotMap from './components/HotspotMap.jsx';
import BlogStub from './components/BlogStub.jsx';
import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.appShell}>
      <Header />
      <main className={styles.main} id="main">
        <Routes>
          <Route
            path="/"
            element={
              <div className={styles.homeGrid}>
                <ConditionsDashboard />
                <HotspotMap />
              </div>
            }
          />
          <Route
            path="/hotspots"
            element={
              <div className={styles.hotspotPage}>
                <HotspotMap />
              </div>
            }
          />
          <Route path="/blog" element={<BlogStub />} />
          <Route
            path="*"
            element={
              <div className={styles.homeGrid}>
                <ConditionsDashboard />
                <HotspotMap />
              </div>
            }
          />
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
