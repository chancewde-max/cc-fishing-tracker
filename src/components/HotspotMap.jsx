import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import styles from './HotspotMap.module.css';
import { useHotspots, DEFAULT_HOTSPOTS, isAuthError } from '../lib/useHotspots';
import { useCatches } from '../lib/useCatches';

const CENTER = [27.69, -97.36];
const ZOOM = 11;

// Captures the Leaflet map instance + keeps the canvas sized correctly.
function MapCapture({ onReady }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map, onReady]);
  return null;
}

// Scroll-wheel zoom is OFF by default (so the page doesn't hijack scroll).
// Hold CTRL + scroll to zoom the map (common power-user pattern).
function CtrlScrollZoom() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    const onKeyDown = (e) => {
      if (e.key === 'Control') enable();
    };
    const onKeyUp = (e) => {
      if (e.key === 'Control') disable();
    };
    map.scrollWheelZoom.disable();
    container.addEventListener('keydown', onKeyDown);
    container.addEventListener('keyup', onKeyUp);
    // Also catch ctrl via window (map container may not have focus)
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      container.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      map.scrollWheelZoom.disable();
    };
  }, [map]);
  return null;
}

// MapContainer doesn't forward an onClick prop to Leaflet's click event
// (unrecognized props are passed through as Leaflet MapOptions and ignored),
// so map clicks must be captured via useMapEvents instead.
function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: onMapClick });
  return null;
}

function markerColor(h) {
  return h.user ? '#ffb057' : '#34c0eb';
}

// Convert a Date to a value usable by <input type="datetime-local"> (local time).
function toLocalInputValue(d) {
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function fmtCaughtAt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---- Catch-logging section inside each hotspot popup ----
function CatchSection({ hotspot }) {
  const { catches, loading, error, isAuthError, addCatch, removeCatch } =
    useCatches(hotspot.id);

  const [species, setSpecies] = useState('Speckled Trout');
  const [caughtAt, setCaughtAt] = useState(() => toLocalInputValue(new Date()));
  const [lengthIn, setLengthIn] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [localErr, setLocalErr] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setLocalErr(null);
    // datetime-local value -> ensure 'Z' is dropped; send as timestamptz string
    const caughtIso = caughtAt ? new Date(caughtAt).toISOString() : new Date().toISOString();
    const res = await addCatch({
      hotspot_id: hotspot.id,
      species,
      caught_at: caughtIso,
      length_in: lengthIn === '' ? null : Number(lengthIn),
      note: note.trim(),
    });
    setBusy(false);
    if (res && res.error) {
      setLocalErr(res.error);
      return;
    }
    setLengthIn('');
    setNote('');
  };

  return (
    <div className={styles.popupBody}>
      <p className={styles.catchTitle}>Log a catch</p>
      <form className={styles.popupForm} onSubmit={submit}>
        <label className={styles.formRow}>
          Species
          <select
            className={styles.select}
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
          >
            <option>Speckled Trout</option>
            <option>Redfish</option>
            <option>Black Drum</option>
            <option>Other</option>
          </select>
        </label>
        <label className={styles.formRow}>
          Date / Time
          <input
            className={styles.input}
            type="datetime-local"
            value={caughtAt}
            onChange={(e) => setCaughtAt(e.target.value)}
          />
        </label>
        <label className={styles.formRow}>
          Length (inches)
          <input
            className={styles.input}
            type="number"
            min="0"
            step="0.1"
            value={lengthIn}
            onChange={(e) => setLengthIn(e.target.value)}
            placeholder="e.g. 22"
          />
        </label>
        <label className={styles.formRow}>
          Note (optional)
          <input
            className={styles.input}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="lure, conditions…"
          />
        </label>
        <button type="submit" className={styles.submitBtn} disabled={busy}>
          {busy ? 'Saving…' : 'Save catch'}
        </button>
      </form>

      {isAuthError && (
        <p className={styles.signInNote} role="status">
          Sign in to save catches.
        </p>
      )}
      {localErr && !isAuthError && (
        <p className={styles.signInNote} role="status">
          Couldn't save: {localErr.message || 'try again'}
        </p>
      )}

      <p className={styles.catchTitle}>Recent catches</p>
      {loading ? (
        <p className={styles.emptyCatch}>Loading…</p>
      ) : catches.length === 0 ? (
        <p className={styles.emptyCatch}>No catches logged yet.</p>
      ) : (
        <ul className={styles.catchList}>
          {catches.map((c) => (
            <li key={c.id} className={styles.catchItem}>
              <span>
                <span className={styles.catchSpecies}>{c.species}</span>
                {c.length_in != null && ` · ${c.length_in}″`}
                {c.note && <span className={styles.catchNote}>{c.note}</span>}
              </span>
              <span className={styles.catchMeta}>
                {fmtCaughtAt(c.caught_at)}
                <br />
                <button
                  type="button"
                  className={styles.delCatch}
                  onClick={() => removeCatch(c.id)}
                >
                  remove
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Per-hotspot popup content ----
function HotspotPopup({ hotspot, onRemove }) {
  return (
    <div>
      <strong>{hotspot.name}</strong>
      {hotspot.user && <span className={styles.userTag}> · you</span>}
      <br />
      <span className={styles.popupNote}>{hotspot.note}</span>
      <CatchSection hotspot={hotspot} />
      {hotspot.user && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onRemove(hotspot.id)}
        >
          Remove this hotspot
        </button>
      )}
    </div>
  );
}

export default function HotspotMap() {
  const { hotspots, loading, error, addHotspot, removeHotspot } = useHotspots();
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState(null); // { lat, lng } awaiting name/note
  const [addName, setAddName] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addErr, setAddErr] = useState(null);
  const mapRef = useRef(null);

  const handleMapClick = (e) => {
    if (!placing) return;
    setPending({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

  const handleAddButton = () => {
    if (placing) {
      setPlacing(false);
      setPending(null);
      setAddErr(null);
      return;
    }
    setPlacing(true);
    setAddName('');
    setAddNote('');
  };

  const handleAddAtCenter = () => {
    const c = mapRef.current
      ? mapRef.current.getCenter()
      : L.latLng(CENTER[0], CENTER[1]);
    setPending({ lat: c.lat, lng: c.lng });
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    if (!pending || !addName.trim()) return;
    setAddErr(null);
    const res = await addHotspot({
      name: addName.trim(),
      note: addNote.trim() || 'User-added spot.',
      lat: pending.lat,
      lng: pending.lng,
    });
    if (res && res.error) {
      setAddErr(res.error);
      return;
    }
    setPending(null);
    setPlacing(false);
    setAddName('');
    setAddNote('');
  };

  const handleRemove = async (id) => {
    await removeHotspot(id);
  };

  const dbCount = hotspots.filter((h) => h.user).length;

  return (
    <section className={styles.wrap} aria-label="Fishing hotspots map">
      <div className={styles.header}>
        <div>
          <h3>Hotspots</h3>
          <span className={styles.sub}>
            Corpus Christi Bay &amp; Lighthouse Lakes
          </span>
        </div>
        <div className={styles.actions}>
          {placing && (
            <button
              type="button"
              className={styles.centerBtn}
              onClick={handleAddAtCenter}
            >
              Drop at center
            </button>
          )}
          <button
            type="button"
            className={placing ? styles.addActive : styles.add}
            onClick={handleAddButton}
            aria-pressed={placing}
          >
            {placing ? 'Cancel' : '+ Add Hotspot'}
          </button>
        </div>
      </div>

      {placing && (
        <p className={styles.hint} role="status">
          Click the map to drop your pin, or use “Drop at center”.
        </p>
      )}

      {pending && (
        <form className={styles.addForm} onSubmit={submitAdd}>
          <label>
            Name
            <input
              className={styles.input}
              type="text"
              value={addName}
              autoFocus
              onChange={(e) => setAddName(e.target.value)}
              placeholder="e.g. Secret Flat"
            />
          </label>
          <label>
            Note (optional)
            <input
              className={styles.input}
              type="text"
              value={addNote}
              onChange={(e) => setAddNote(e.target.value)}
              placeholder="what's there…"
            />
          </label>
          <button type="submit" className={styles.submitBtn} disabled={!addName.trim()}>
            Save hotspot
          </button>
          {addErr && (
            <p className={styles.signInNote} role="status">
              {isAuthError(addErr)
                ? 'Sign in to save hotspots.'
                : `Couldn't save: ${addErr.message || 'try again'}`}
            </p>
          )}
        </form>
      )}

      {error && (
        <p className={styles.signInNote} role="status">
          Couldn't load saved spots — showing built-ins only.
        </p>
      )}

      <div className={styles.mapBox}>
        <MapContainer
          center={CENTER}
          zoom={ZOOM}
          scrollWheelZoom={false}
          className={styles.map}
        >
          <MapCapture onReady={(m) => (mapRef.current = m)} />
          <CtrlScrollZoom />
          <MapClickHandler onMapClick={handleMapClick} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {hotspots.map((h) => (
            <CircleMarker
              key={h.id}
              center={[h.lat, h.lng]}
              radius={9}
              pathOptions={{
                color: markerColor(h),
                weight: 2,
                fillColor: markerColor(h),
                fillOpacity: 0.55,
              }}
              eventHandlers={{
                click: () => {
                  if (placing) handleMapClick({ latlng: { lat: h.lat, lng: h.lng } });
                },
              }}
            >
              <Popup>
                <HotspotPopup hotspot={h} onRemove={handleRemove} />
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <p className={styles.count}>
        {DEFAULT_HOTSPOTS.length} built-in · {dbCount} saved
        {loading ? ' (loading…)' : ''}
      </p>
    </section>
  );
}

