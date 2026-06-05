'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

function LeafletMap({ lat, lng, name, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !containerRef.current) return;
    let cancelled = false;

    import('leaflet').then(mod => {
      if (cancelled || mapRef.current) return;
      const L = mod.default;

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const instance = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true, wheelPxPerZoomLevel: 30, wheelDebounceTime: 20 })
        .setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(instance);
      L.marker([lat, lng]).addTo(instance).bindPopup(name);
      mapRef.current = instance;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lng, name]);

  return <div ref={containerRef} className={className} style={{ zIndex: 0 }} />;
}

export default function GreenhouseMap({ lat, lng, name }) {
  const [expanded, setExpanded] = useState(false);

  if (!lat || !lng) {
    return (
      <div className="h-[180px] rounded-xl bg-ink-50 border border-dashed border-ink-200 flex flex-col items-center justify-center gap-2 text-ink-400">
        <Icon.MapPin className="w-5 h-5" />
        <span className="text-[12px]">Nema koordinata u ThingsBoardu</span>
      </div>
    );
  }

  return (
    <>
      {/* Small map */}
      <div className="relative group">
        <LeafletMap lat={lat} lng={lng} name={name} className="h-[180px] rounded-xl overflow-hidden border border-ink-100" />
        <button
          onClick={() => setExpanded(true)}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 hover:bg-white border border-ink-100 rounded-lg flex items-center justify-center text-ink-600 hover:text-ink-900 shadow-soft transition-all opacity-0 group-hover:opacity-100"
          title="Proširi mapu"
        >
          <Icon.Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setExpanded(false); }}
        >
          <div className="bg-paper rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-ink-100">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-100">
              <div className="flex items-center gap-2 text-[13px] font-medium text-ink-800">
                <Icon.MapPin className="w-4 h-4 text-moss-600" />
                {name}
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors"
              >
                <Icon.X className="w-4 h-4" />
              </button>
            </div>
            <LeafletMap lat={lat} lng={lng} name={name} className="h-[480px]" />
          </div>
        </div>
      )}
    </>
  );
}
