import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import styles from './HotspotMap.module.css';

const CENTER = [27.69, -97.36];
const ZOOM = 11;
const STORAGE_KEY = 'gulfbite.hotspots.v1';

// Real Corpus Christi inshore hotspots (approx lat/lng).
const DEFAULT_HOTSPOTS = [
  {
    id: 'aransas-pass',
    name: 'Aransas Pass',
    note: 'Jetties & channel mouth — trout, redfish on the outgoing.',
    lat: 27.8338,
    lng: -97.0556,
    user: false,
  },
  {
    id: 'packery-channel',
    name: 'Packery Channel',
    note: 'Inlet between CC Beach & Padre — strong current, drum & reds.',
    lat: 27.6389,
    lng: -97.2356,
    user: false,
  },
  {
    id: 'cc-bay-causeway',
    name: 'CC Bay Causeway',
    note: 'Pillings & lights — classic trout drift near the causeway.',
    lat: 27.7417,
    lng: -97.2497,
    user: false,
  },
  {
    id: 'redfish-bay',
    name: 'Redfish Bay',
    note: 'Grass flats north of the causeway — topwater redfish country.',
    lat: 27.85,
    lng: -97.27,
    user: false,
  },
  {
    id: 'estes-flats',
    name: 'Estes Flats',
    note: 'Shallow turtle-grass flats — sight-cast reds on calm days.',
    lat: 27.62,
    lng: -97.2,
    user: false,
  },
  {
    id: 'bird-island-basin',
    name: 'Bird Island Basin',
    note: 'Sheltered fishing pier inside the ship channel — drum & trout.',
    lat: 27.8197,
    lng: -97.0575,
    user: false,
  },
];

function loadCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

function markerColor(h) {
  return h.user ? '#ffb057' : '#34c0eb';
}

export default function HotspotMap() {
  const [custom, setCustom] = useState(loadCustom);
  const [placing, setPlacing] = useState(false);
  const mapRef = useRef(null);

  const hotspots = useMemo(
    () => [...DEFAULT_HOTSPOTS, ...custom],
    [custom]
  );

  const persist = (next) => {
    setCustom(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota errors */
    }
  };

  const addAt = (latlng, fromCenter = false) => {
    const name = window.prompt(
      fromCenter ? 'Name this hotspot:' : 'Name this hotspot:'
    );
    if (!name) {
      if (!fromCenter) setPlacing(false);
      return;
    }
    const note =
      window.prompt(`Note for "${name}" (optional):`, '') || 'User-added spot.';
    const spot = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      note,
      lat: latlng.lat,
      lng: latlng.lng,
      user: true,
    };
    persist([...custom, spot]);
    setPlacing(false);
  };

  const handleMapClick = (e) => {
    if (!placing) return;
    addAt(e.latlng);
  };

  const handleAddButton = () => {
    if (placing) {
      setPlacing(false);
      return;
    }
    setPlacing(true);
  };

  const handleAddAtCenter = () => {
    const c = mapRef.current
      ? mapRef.current.getCenter()
      : L.latLng(CENTER[0], CENTER[1]);
    addAt({ lat: c.lat, lng: c.lng }, true);
  };

  return (
    <section className={styles.wrap} aria-label="Fishing hotspots map">
      <div className={styles.header}>
        <div>
          <h3>Hotspots</h3>
          <span className={styles.sub}>Corpus Christi Bay &amp; Lighthouse Lakes</span>
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

      <div className={styles.mapBox}>
        <MapContainer
          center={CENTER}
          zoom={ZOOM}
          scrollWheelZoom={false}
          className={styles.map}
          onClick={handleMapClick}
        >
          <MapCapture onReady={(m) => (mapRef.current = m)} />
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
                  if (placing) addAt({ lat: h.lat, lng: h.lng });
                },
              }}
            >
              <Popup>
                <strong>{h.name}</strong>
                {h.user && <span className={styles.userTag}> · you</span>}
                <br />
                <span className={styles.popupNote}>{h.note}</span>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <p className={styles.count}>
        {DEFAULT_HOTSPOTS.length} built-in · {custom.length} saved locally
      </p>
    </section>
  );
}
