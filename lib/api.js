export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export const TB_CONFIG = {
  baseUrl: process.env.THINGSBOARD_URL || 'http://161.53.133.253:8080',
  mqttPort: 1883,
  username: 'tenant@thingsboard.org',
  password: '',
};

let _jwt = null;

async function tbFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (_jwt) headers['X-Authorization'] = `Bearer ${_jwt}`;
  const res = await fetch(`${TB_CONFIG.baseUrl}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error(`TB ${res.status}: ${await res.text()}`);
  return res.json();
}

const liveAPI = {
  async login(u = TB_CONFIG.username, p = TB_CONFIG.password) {
    const data = await tbFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ username: u, password: p }) });
    _jwt = data.token;
    return data;
  },
  async getLatestTelemetry(deviceId, keys) {
    return tbFetch(`/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keys.join(',')}`);
  },
  async getDeviceTelemetry(deviceId, keys, startTs, endTs, interval = 60000, limit = 200) {
    return tbFetch(`/api/plugins/telemetry/DEVICE/${deviceId}/values/timeseries?keys=${keys.join(',')}&startTs=${startTs}&endTs=${endTs}&interval=${interval}&limit=${limit}&agg=AVG`);
  },
  async sendRpcCommand(deviceId, method, params) {
    return tbFetch(`/api/plugins/rpc/oneway/${deviceId}`, { method: 'POST', body: JSON.stringify({ method, params }) });
  },
};

export const OPGS = [
  { id: 'opg-1', name: 'OPG Horvat', owner: 'Marko Horvat',  oib: '12345678901' },
  { id: 'opg-2', name: 'OPG Kovač',  owner: 'Ana Kovač',     oib: '23456789012' },
  { id: 'opg-3', name: 'OPG Babić',  owner: 'Ivan Babić',    oib: '34567890123' },
];

export const INITIAL_HOUSES = [
  { id: 'gh-1', name: 'Plastenik A – Rajčice',   kultura: 'Rajčice',   location: 'Velika Gorica, Zagrebačka', opgId: 'opg-1', type: 'fizički',   area: 320, deviceId: 'esp-001' },
  { id: 'gh-2', name: 'Plastenik B – Paprike',   kultura: 'Paprike',   location: 'Sesvete, Zagrebačka',       opgId: 'opg-1', type: 'virtualni', area: 240, deviceId: 'sim-002' },
  { id: 'gh-3', name: 'Plastenik C – Salata',    kultura: 'Salata',    location: 'Karlovac',                  opgId: 'opg-2', type: 'virtualni', area: 180, deviceId: 'sim-003' },
  { id: 'gh-4', name: 'Plastenik D – Krastavci', kultura: 'Krastavci', location: 'Slavonski Brod',            opgId: 'opg-3', type: 'virtualni', area: 280, deviceId: 'sim-004' },
];

export const INITIAL_DEVICES = [
  { id: 'esp-001', name: 'ESP32 – Rajčice', type: 'ESP',       houseId: 'gh-1', online: true,  lastSeen: Date.now() - 4000,            firmware: '1.4.2'   },
  { id: 'sim-002', name: 'Virt. senzor B',  type: 'virtualni', houseId: 'gh-2', online: true,  lastSeen: Date.now() - 1000,            firmware: 'sim-1.0' },
  { id: 'sim-003', name: 'Virt. senzor C',  type: 'virtualni', houseId: 'gh-3', online: true,  lastSeen: Date.now() - 2000,            firmware: 'sim-1.0' },
  { id: 'sim-004', name: 'Virt. senzor D',  type: 'virtualni', houseId: 'gh-4', online: false, lastSeen: Date.now() - 1000 * 60 * 47, firmware: 'sim-1.0' },
];

export const INITIAL_RULES = {
  'gh-1': { tempMax: 30, humMin: 40, humMax: 80 },
  'gh-2': { tempMax: 32, humMin: 45, humMax: 80 },
  'gh-3': { tempMax: 26, humMin: 50, humMax: 85 },
  'gh-4': { tempMax: 30, humMin: 45, humMax: 80 },
};

const BASELINES = {
  'gh-1': { temperature: 23.5, humidity: 62, lux: 28000 },
  'gh-2': { temperature: 27.0, humidity: 58, lux: 32000 },
  'gh-3': { temperature: 19.0, humidity: 70, lux: 18000 },
  'gh-4': { temperature: 31.5, humidity: 50, lux: 41000 },
};

const HISTORY_POINTS = 24 * 6;

function rnd(min, max) { return min + Math.random() * (max - min); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function seedHistory(b) {
  const now = Date.now();
  return Array.from({ length: HISTORY_POINTS }, (_, i) => {
    const ts = now - (HISTORY_POINTS - 1 - i) * 10 * 60 * 1000;
    const h  = new Date(ts).getHours() + new Date(ts).getMinutes() / 60;
    const df = Math.sin(((h - 6) / 24) * Math.PI * 2);
    return {
      ts,
      temperature: +(b.temperature + df * 4 + rnd(-0.7, 0.7)).toFixed(1),
      humidity:    +clamp(b.humidity - df * 8 + rnd(-3, 3), 20, 95).toFixed(0),
      lux:         Math.round(clamp(b.lux * Math.max(0, df + 0.3) + rnd(-2000, 2000), 0, 90000)),
    };
  });
}

export const mockState = {};
INITIAL_HOUSES.forEach(h => {
  const b = BASELINES[h.id];
  mockState[h.id] = {
    history:   seedHistory(b),
    actuators: { ventilation: false, irrigation: false, heating: false },
    autoMode:  { ventilation: true,  irrigation: true,  heating: true  },
    baseline:  { ...b },
  };
});

function stepSimulator(rules) {
  const now = Date.now();
  for (const h of INITIAL_HOUSES) {
    const s    = mockState[h.id];
    const last = s.history.at(-1);
    const hod  = new Date(now).getHours() + new Date(now).getMinutes() / 60;
    const df   = Math.sin(((hod - 6) / 24) * Math.PI * 2);

    let temperature = last.temperature + rnd(-0.25, 0.25) + (s.baseline.temperature + df * 4  - last.temperature) * 0.05;
    let humidity    = last.humidity    + rnd(-0.6, 0.6)   + (s.baseline.humidity    - df * 8  - last.humidity)    * 0.05;
    let lux         = last.lux         + rnd(-800, 800)   + (s.baseline.lux * Math.max(0, df + 0.3) - last.lux)  * 0.06;

    if (s.actuators.ventilation) { temperature -= 0.4; humidity -= 0.5; }
    if (s.actuators.heating)     { temperature += 0.6; humidity -= 0.2; }
    if (s.actuators.irrigation)  { humidity += 1.5; }

    temperature = +clamp(temperature, -5, 50).toFixed(1);
    humidity    = +clamp(humidity, 10, 99).toFixed(0);
    lux         = Math.round(clamp(lux, 0, 90000));

    s.history.push({ ts: now, temperature, humidity, lux });
    if (s.history.length > HISTORY_POINTS) s.history.shift();

    const r = rules[h.id] || INITIAL_RULES[h.id];
    if (s.autoMode.ventilation) s.actuators.ventilation = temperature > (r.tempMax ?? 30);
    if (s.autoMode.heating)     s.actuators.heating     = temperature < 15;
    if (s.autoMode.irrigation)  s.actuators.irrigation  = humidity    < (r.humMin  ?? 45);
  }
}

const TELEM_KEYS = ['temperature', 'humidity', 'lux'];

const mockAPI = {
  async login() { return { token: 'MOCK_JWT_TOKEN' }; },

  async getLatestTelemetry(deviceId, keys) {
    const house = INITIAL_HOUSES.find(h => h.deviceId === deviceId);
    if (!house) throw new Error('Device not found');
    const last = mockState[house.id].history.at(-1);
    const out = {};
    (keys || TELEM_KEYS).forEach(k => { out[k] = [{ ts: last.ts, value: String(last[k] ?? '') }]; });
    return out;
  },

  async getDeviceTelemetry(deviceId, keys) {
    const house = INITIAL_HOUSES.find(h => h.deviceId === deviceId);
    if (!house) throw new Error('Device not found');
    const out = {};
    (keys || TELEM_KEYS).forEach(k => {
      out[k] = mockState[house.id].history.map(p => ({ ts: p.ts, value: String(p[k] ?? '') }));
    });
    return out;
  },

  async sendRpcCommand(deviceId, method, params) {
    const house = INITIAL_HOUSES.find(h => h.deviceId === deviceId);
    if (!house) throw new Error('Device not found');
    if (method === 'setVentilation') mockState[house.id].actuators.ventilation = !!params;
    if (method === 'setIrrigation')  mockState[house.id].actuators.irrigation  = !!params;
    if (method === 'setHeating')     mockState[house.id].actuators.heating     = !!params;
    return { ok: true };
  },

  _getState(houseId) { return mockState[houseId]; },
  _step(rules)       { stepSimulator(rules); },
};

export const thingsboardAPI = USE_MOCK_DATA ? mockAPI : liveAPI;
