'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';
import { Badge } from './shared';
import UserDashboard from './user';
import AdminPanel from './admin';
import {
  thingsboardAPI, USE_MOCK_DATA, TB_CONFIG,
  OPGS, INITIAL_HOUSES, INITIAL_DEVICES, INITIAL_RULES,
} from '@/lib/api';
import {
  loadGreenhouseData, getLatestTelemetry, getTelemetryHistory,
  saveAssetAttributes, saveDeviceThresholds, logout,
} from '@/lib/tb-api';

const TELEM_KEYS = ['temperature', 'humidity', 'lux'];

export default function AppMain() {
  const router = useRouter();
  const [view, setView] = useState('user');

  const [houses, setHouses]   = useState(USE_MOCK_DATA ? INITIAL_HOUSES : []);
  const [devices, setDevices] = useState(USE_MOCK_DATA ? INITIAL_DEVICES : []);
  const [rules, setRules]     = useState(USE_MOCK_DATA ? INITIAL_RULES : {});
  const [opgs, setOpgs]       = useState(USE_MOCK_DATA ? OPGS : []);
  const [selectedHouseId, setSelectedHouseId] = useState(INITIAL_HOUSES[0]?.id ?? null);

  const [latest, setLatest]             = useState({});
  const [history, setHistory]           = useState({});
  const [mockSnapshot, setMockSnapshot] = useState({});
  const [events, setEvents]             = useState([]);
  const [tbLoading, setTbLoading]       = useState(!USE_MOCK_DATA);
  const prevBreachRef = useRef({});

  // ── Real TB: initial data load ──────────────────────────────────────────
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    setTbLoading(true);
    loadGreenhouseData()
      .then(data => {
        setHouses(data.houses);
        setDevices(data.devices);
        setRules(data.rules);
        setOpgs(data.opgs);
        if (data.houses.length > 0) setSelectedHouseId(data.houses[0].id);
      })
      .catch(err => {
        console.error('TB data load failed', err);
        if (err.message === 'Not authenticated') router.push('/login');
      })
      .finally(() => setTbLoading(false));
  }, []);

  // ── Real TB: load 24h history once houses are known ────────────────────
  useEffect(() => {
    if (USE_MOCK_DATA || houses.length === 0) return;
    const go = async () => {
      const nextHistory = {};
      for (const h of houses) {
        if (!h.deviceId) continue;
        try {
          const hist = await getTelemetryHistory(h.deviceId);
          const tsMap = {};
          TELEM_KEYS.forEach(k => {
            (hist[k] || []).forEach(({ ts, value }) => {
              tsMap[ts] = tsMap[ts] || { ts };
              tsMap[ts][k] = parseFloat(value);
            });
          });
          nextHistory[h.id] = Object.values(tsMap).sort((a, b) => a.ts - b.ts);
        } catch (e) { console.warn('History failed', h.id, e); }
      }
      setHistory(nextHistory);
    };
    go();
  }, [houses]);

  // ── Unified polling loop ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let handle;

    const detectBreaches = (nextLatest, nextSnap) => {
      const newEvents = [];
      const now = Date.now();
      for (const h of houses) {
        const v = nextLatest[h.id];
        const r = rules[h.id];
        if (!v || !r) continue;
        const prev = prevBreachRef.current[h.id] || {};
        const breach = {};
        const checks = [
          { key: 'temperature', label: 'Temperatura', unit: '°C',  decimals: 1, actuatorIfHi: 'ventilation', actuatorIfLo: 'heating',   minKey: null,     maxKey: 'tempMax' },
          { key: 'humidity',    label: 'Vlaga zraka', unit: '%',   decimals: 0, actuatorIfLo: 'irrigation',  minKey: 'humMin', maxKey: 'humMax' },
          { key: 'lux',         label: 'Osvjetljenost', unit: 'lux', decimals: 0, minKey: null, maxKey: null },
        ];
        for (const c of checks) {
          const min = c.minKey ? r[c.minKey] : null;
          const max = c.maxKey ? r[c.maxKey] : null;
          const val = v[c.key];
          let state = null;
          if (max != null && val > max) state = 'hi';
          else if (min != null && val < min) state = 'lo';
          breach[c.key] = state;
          if (state !== prev[c.key]) {
            if (state) {
              newEvents.push({ ts: now, houseId: h.id, kind: 'rule_breach',
                message: `${h.name}: ${c.label} ${state === 'hi' ? 'iznad' : 'ispod'} praga – ${Number(val).toFixed(c.decimals)} ${c.unit}` });
              const act = state === 'hi' ? c.actuatorIfHi : c.actuatorIfLo;
              if (act && nextSnap[h.id]?.autoMode?.[act] !== false) {
                newEvents.push({ ts: now + 1, houseId: h.id, kind: 'auto_on',
                  message: `Auto-režim uključio ${{ ventilation: 'ventilaciju', irrigation: 'navodnjavanje', heating: 'grijanje' }[act]} u "${h.name}"` });
              }
            } else if (prev[c.key]) {
              newEvents.push({ ts: now, houseId: h.id, kind: 'recovery',
                message: `${h.name}: ${c.label} vraćena u granice (${Number(val).toFixed(c.decimals)} ${c.unit})` });
            }
          }
        }
        prevBreachRef.current[h.id] = breach;
      }
      if (newEvents.length > 0) setEvents(prev => [...newEvents.reverse(), ...prev].slice(0, 200));
    };

    const tickMock = async () => {
      if (cancelled) return;
      thingsboardAPI._step(rules);
      const nextLatest = {}, nextHistory = {}, nextSnap = {};
      for (const h of houses) {
        try {
          const lat = await thingsboardAPI.getLatestTelemetry(h.deviceId, TELEM_KEYS);
          nextLatest[h.id] = { temperature: parseFloat(lat.temperature?.[0]?.value), humidity: parseFloat(lat.humidity?.[0]?.value), lux: parseFloat(lat.lux?.[0]?.value) };
          const hist = await thingsboardAPI.getDeviceTelemetry(h.deviceId, TELEM_KEYS);
          const tsMap = {};
          TELEM_KEYS.forEach(k => { (hist[k] || []).forEach(({ ts, value }) => { tsMap[ts] = tsMap[ts] || { ts }; tsMap[ts][k] = parseFloat(value); }); });
          nextHistory[h.id] = Object.values(tsMap).sort((a, b) => a.ts - b.ts);
          nextSnap[h.id] = JSON.parse(JSON.stringify(thingsboardAPI._getState(h.id)));
        } catch (e) { console.warn('Mock poll failed', h.id, e); }
      }
      if (cancelled) return;
      setLatest(nextLatest);
      setHistory(nextHistory);
      setMockSnapshot(nextSnap);
      detectBreaches(nextLatest, nextSnap);
      handle = setTimeout(tickMock, 3000);
    };

    const tickReal = async () => {
      if (cancelled) return;
      const nextLatest = {};
      for (const h of houses) {
        if (!h.deviceId) continue;
        try {
          const lat = await getLatestTelemetry(h.deviceId);
          nextLatest[h.id] = { temperature: parseFloat(lat.temperature?.[0]?.value), humidity: parseFloat(lat.humidity?.[0]?.value), lux: parseFloat(lat.lux?.[0]?.value) };
        } catch (e) { console.warn('TB poll failed', h.id, e); }
      }
      if (cancelled) return;
      setLatest(nextLatest);
      detectBreaches(nextLatest, {});
      handle = setTimeout(tickReal, 5000);
    };

    if (houses.length > 0) {
      USE_MOCK_DATA ? tickMock() : tickReal();
    }
    return () => { cancelled = true; clearTimeout(handle); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [houses, rules]);

  // ── Actuator toggle (mock + real RPC) ──────────────────────────────────
  const handleActuatorToggle = useCallback(async (key, on) => {
    const house = houses.find(h => h.id === selectedHouseId);
    if (!house) return;
    const method = { ventilation: 'setVentilation', irrigation: 'setIrrigation', heating: 'setHeating' }[key];
    try {
      await thingsboardAPI.sendRpcCommand(house.deviceId, method, on);
      if (USE_MOCK_DATA) {
        setMockSnapshot(s => ({ ...s, [house.id]: { ...s[house.id], actuators: { ...s[house.id]?.actuators, [key]: on } } }));
      }
      setEvents(prev => [{ ts: Date.now(), houseId: house.id, kind: 'manual',
        message: `Ručno ${on ? 'uključen' : 'isključen'} ${{ ventilation: 'ventilacija', irrigation: 'navodnjavanje', heating: 'grijanje' }[key]} u "${house.name}"` }, ...prev].slice(0, 200));
    } catch (e) { console.error('RPC failed', e); }
  }, [houses, selectedHouseId]);

  const handleAutoToggle = useCallback((key, on) => {
    if (!USE_MOCK_DATA) return;
    const house = houses.find(h => h.id === selectedHouseId);
    if (!house) return;
    thingsboardAPI._getState(house.id).autoMode[key] = on;
    setMockSnapshot(s => ({ ...s, [house.id]: { ...s[house.id], autoMode: { ...s[house.id]?.autoMode, [key]: on } } }));
  }, [houses, selectedHouseId]);

  // ── Save greenhouse attributes + thresholds ────────────────────────────
  const handleSaveHouseDetails = useCallback(async (houseId, attrs, thresholds) => {
    if (USE_MOCK_DATA) {
      setHouses(hs => hs.map(h => h.id === houseId ? { ...h, ...attrs } : h));
      setRules(r => ({ ...r, [houseId]: { ...r[houseId], ...thresholds } }));
      return;
    }
    const house = houses.find(h => h.id === houseId);
    if (!house) return;
    await saveAssetAttributes(houseId, { Kultura: attrs.kultura, Lokacija: attrs.location, 'Površina': attrs.area });
    if (house.deviceId) await saveDeviceThresholds(house.deviceId, thresholds);
    setHouses(hs => hs.map(h => h.id === houseId ? { ...h, ...attrs } : h));
    setRules(r => ({ ...r, [houseId]: { ...r[houseId], ...thresholds } }));
  }, [houses]);

  // ── Logout ─────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [router]);

  const opg = opgs.find(o => o.id === houses.find(h => h.id === selectedHouseId)?.opgId);
  const allLatest = Object.values(latest);

  const alertsAcrossAll = useMemo(() => {
    let n = 0;
    for (const h of houses) {
      const v = latest[h.id]; const r = rules[h.id];
      if (!v || !r) continue;
      if (r.tempMax != null && v.temperature > r.tempMax) n++;
      if (r.humMin  != null && v.humidity < r.humMin)  n++;
      if (r.humMax  != null && v.humidity > r.humMax)  n++;
    }
    return n;
  }, [latest, rules, houses]);

  if (tbLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-ink-400">
        <div className="w-12 h-12 rounded-2xl bg-moss-100 text-moss-700 flex items-center justify-center mb-3 animate-pulse">
          <Icon.Leaf className="w-6 h-6" />
        </div>
        <div className="text-[13px] num">Učitavam podatke s ThingsBoardu…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* TOP NAV */}
      <header className="sticky top-0 z-30 bg-paper/85 backdrop-blur border-b border-ink-100">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 h-[64px] flex items-center gap-4">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-ink-900 text-paper flex items-center justify-center relative overflow-hidden">
              <Icon.Leaf className="w-5 h-5 text-moss-300 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-moss-700/30 to-transparent"></div>
            </div>
            <div>
              <div className="display text-[16px] leading-none text-ink-900 font-semibold">Plastenik<span className="text-moss-700">.io</span></div>
              <div className="text-[10px] text-ink-400 tracking-wider uppercase mt-0.5">Pametni IoT nadzor</div>
            </div>
          </div>

          <div className="ml-4 md:ml-8 flex p-1 bg-ink-100 rounded-lg">
            <ViewTab active={view === 'user'}  onClick={() => setView('user')}>
              <Icon.Dashboard className="w-4 h-4" /> Korisnik
            </ViewTab>
            <ViewTab active={view === 'admin'} onClick={() => setView('admin')}>
              <Icon.Shield className="w-4 h-4" /> Administrator
            </ViewTab>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center gap-2">
            <Badge status={USE_MOCK_DATA ? 'warn' : 'on'}>
              {USE_MOCK_DATA ? 'Demo mod' : 'ThingsBoard'}
            </Badge>
            {alertsAcrossAll > 0 && (
              <Badge status="crit">
                <Icon.Bell className="w-3 h-3 -mr-0.5" /> {alertsAcrossAll}
              </Badge>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-3 ml-1 border-l border-ink-100">
            <div className="w-8 h-8 rounded-full bg-moss-100 text-moss-700 flex items-center justify-center text-[12px] font-semibold">
              {(opg?.owner || 'OPG').split(' ').map(w => w[0]).slice(0, 2).join('')}
            </div>
            <div className="text-[12px] leading-tight">
              <div className="font-medium text-ink-900">{opg?.owner}</div>
              <div className="text-ink-400">{opg?.name}</div>
            </div>
            {!USE_MOCK_DATA && (
              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 text-ink-400 hover:text-clay hover:bg-clay/10 rounded-lg"
                title="Odjava"
              >
                <Icon.Power className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {allLatest.length === 0 && houses.length > 0 ? (
          <BootSkeleton />
        ) : houses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-500">
            <Icon.Building className="w-10 h-10 mb-3 text-ink-300" />
            <div className="text-[14px] font-medium text-ink-700">Nema plastenika</div>
            <div className="text-[13px] mt-0.5">Korisnički račun nema pripisanih plastenika u ThingsBoardu.</div>
          </div>
        ) : view === 'user' ? (
          <UserDashboard
            houses={houses} opgs={opgs} devices={devices} rules={rules}
            selectedHouseId={selectedHouseId} setSelectedHouseId={setSelectedHouseId}
            latest={latest} history={history}
            mockSnapshot={mockSnapshot}
            events={events}
            onActuatorToggle={handleActuatorToggle}
            onAutoToggle={handleAutoToggle}
            onSaveHouseDetails={handleSaveHouseDetails}
          />
        ) : (
          <AdminPanel
            houses={houses} setHouses={setHouses}
            devices={devices} setDevices={setDevices}
            opgs={opgs}
            rules={rules} setRules={setRules}
            onSaveRules={!USE_MOCK_DATA ? async (houseId, r) => {
              const house = houses.find(h => h.id === houseId);
              if (house?.deviceId) await saveDeviceThresholds(house.deviceId, r);
              setRules(prev => ({ ...prev, [houseId]: r }));
            } : null}
          />
        )}
      </main>

      <footer className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 border-t border-ink-100 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-ink-400">
          <div>Tim <span className="font-medium text-ink-700">Plastenik</span> · Internet stvari, projekt 2026</div>
          <div className="flex items-center gap-3 mono">
            <span>ThingsBoard CE @ {TB_CONFIG.baseUrl}</span>
            <span className="text-ink-300">·</span>
            <span>{USE_MOCK_DATA ? 'demo mod' : 'polling 5 s'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ViewTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors ${
        active ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800'
      }`}
    >
      {children}
    </button>
  );
}

function BootSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-ink-400">
      <div className="w-12 h-12 rounded-2xl bg-moss-100 text-moss-700 flex items-center justify-center mb-3 animate-pulse">
        <Icon.Leaf className="w-6 h-6" />
      </div>
      <div className="text-[13px] num">Učitavam telemetriju…</div>
    </div>
  );
}
