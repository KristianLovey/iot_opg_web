const I = ({ d, children, className = "w-5 h-5", strokeWidth = 1.75, ...rest }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    {d ? <path d={d} /> : children}
  </svg>
);

export const Icon = {
  // sensors
  Thermometer: (p) => <I {...p}><path d="M14 4v10.5a4 4 0 1 1-4 0V4a2 2 0 1 1 4 0z"/></I>,
  Droplets:    (p) => <I {...p}><path d="M7 16.3c0 2.6 2 4.7 4.5 4.7s4.5-2.1 4.5-4.7c0-3-4.5-9.3-4.5-9.3S7 13.3 7 16.3z"/><path d="M12.5 21a4 4 0 0 0 3.5-4c0-2-1.5-3.8-3.5-3.8"/></I>,
  Sprout:      (p) => <I {...p}><path d="M7 20h10"/><path d="M12 20v-8"/><path d="M12 12c0-4 3-7 7-7-.5 4-3 7-7 7z"/><path d="M12 12C8 12 5 9 5 5c4 .5 7 3 7 7z"/></I>,
  Sun:         (p) => <I {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></I>,
  // actuators
  Wind:        (p) => <I {...p}><path d="M3 8h12a3 3 0 1 0-3-3"/><path d="M3 12h17a3 3 0 1 1-3 3"/><path d="M3 16h9"/></I>,
  Drop:        (p) => <I {...p}><path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/></I>,
  Flame:       (p) => <I {...p}><path d="M8.5 14.5C8.5 12.5 12 10 12 7c0 0 4 3 4 7.5a4 4 0 1 1-8 0 3 3 0 0 0 .5-.5z"/></I>,
  // status / alerts
  Alert:       (p) => <I {...p}><path d="M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></I>,
  Bell:        (p) => <I {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></I>,
  Check:       (p) => <I {...p}><path d="M20 6 9 17l-5-5"/></I>,
  X:           (p) => <I {...p}><path d="M18 6 6 18M6 6l12 12"/></I>,
  Clock:       (p) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></I>,
  History:     (p) => <I {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></I>,
  // nav / chrome
  Dashboard:   (p) => <I {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I>,
  Shield:      (p) => <I {...p}><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/></I>,
  Settings:    (p) => <I {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></I>,
  MapPin:      (p) => <I {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></I>,
  Building:    (p) => <I {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01"/></I>,
  Leaf:        (p) => <I {...p}><path d="M11 20A7 7 0 0 1 4 13c0-3.9 3.6-9 12-9 0 8.4-5.1 12-9 12a7 7 0 0 1-2-.3"/><path d="M5 20c2-2 4-3 8-4"/></I>,
  // editing / chrome
  Plus:        (p) => <I {...p}><path d="M12 5v14M5 12h14"/></I>,
  Pencil:      (p) => <I {...p}><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></I>,
  Trash:       (p) => <I {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></I>,
  Chevron:     (p) => <I {...p}><path d="m6 9 6 6 6-6"/></I>,
  ArrowRight:  (p) => <I {...p}><path d="M5 12h14M13 5l7 7-7 7"/></I>,
  ArrowUpRight:(p) => <I {...p}><path d="M7 17 17 7M7 7h10v10"/></I>,
  // connectivity
  Wifi:        (p) => <I {...p}><path d="M2 8.8a18 18 0 0 1 20 0"/><path d="M5 12.5a13 13 0 0 1 14 0"/><path d="M8.5 16a8 8 0 0 1 7 0"/><path d="M12 20h.01"/></I>,
  WifiOff:     (p) => <I {...p}><path d="M2 2l20 20"/><path d="M8.5 16a8 8 0 0 1 7 0"/><path d="M12 20h.01"/><path d="M5 12.5c1.6-1 3.5-1.7 5.5-1.9"/><path d="M2 8.8c2-1.4 4.3-2.4 6.7-3"/></I>,
  Cpu:         (p) => <I {...p}><rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></I>,
  Server:      (p) => <I {...p}><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 8h.01M7 17h.01"/></I>,
  Search:      (p) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></I>,
  Activity:    (p) => <I {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></I>,
  Gauge:       (p) => <I {...p}><path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></I>,
  Power:       (p) => <I {...p}><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></I>,
  Zap:         (p) => <I {...p}><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></I>,
  Eye:         (p) => <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></I>,
  Refresh:     (p) => <I {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></I>,
};
