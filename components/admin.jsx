'use client';

import { useState } from 'react';
import { Icon } from './icons';
import {
  Card, SectionTitle, Badge, Button, Field, Input, NumberInput, Select, Modal,
  fmtAgo,
} from './shared';
import { SENSOR_DEFS } from '@/lib/sensor-defs';
import { TB_CONFIG, USE_MOCK_DATA } from '@/lib/api';

const ADMIN_TABS = [
  { id: 'houses',   label: 'Plastenici', icon: Icon.Building, sub: 'OPG-ovi i lokacije' },
  { id: 'devices',  label: 'Uređaji',    icon: Icon.Cpu,      sub: 'ESP i virtualni senzori' },
  { id: 'rules',    label: 'Pravila',    icon: Icon.Gauge,    sub: 'Granice senzora' },
  { id: 'platform', label: 'Platforma',  icon: Icon.Server,   sub: 'ThingsBoard veza' },
];

/* ============== HOUSES TAB =============================================== */
function HousesTab({ houses, setHouses, opgs, devices, setDevices, onSaveHouse, onDeleteHouse }) {
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (h) => {
    if (onSaveHouse) {
      setSaving(true);
      try { await onSaveHouse(h); } catch (e) { console.error('Save house failed', e); } finally { setSaving(false); }
    } else {
      if (h.id) {
        setHouses(houses.map(x => x.id === h.id ? h : x));
      } else {
        const id = `gh-${Date.now()}`;
        const deviceId = `sim-${Math.floor(Math.random() * 9000 + 1000)}`;
        setHouses([...houses, { ...h, id, deviceId, type: 'virtualni' }]);
        setDevices([...devices, {
          id: deviceId, name: `Virt. senzor ${h.name.slice(0, 8)}`, type: 'virtualni',
          houseId: id, online: true, lastSeen: Date.now(), firmware: 'sim-1.0',
        }]);
      }
    }
    setEditing(null);
  };

  const remove = async (id) => {
    if (onDeleteHouse) {
      await onDeleteHouse(id).catch(console.error);
    } else {
      setHouses(houses.filter(h => h.id !== id));
      setDevices(devices.filter(d => d.houseId !== id));
    }
    setConfirmDel(null);
  };

  return (
    <>
      <SectionTitle
        kicker="Skalabilnost"
        title="Plastenici i OPG-ovi"
        sub="Dodaj nove lokacije bilo kojem OPG-u – sustav je već pripremljen za komercijalizaciju."
        right={
          <Button variant="primary" onClick={() => setEditing({ new: true, name: '', location: '', opgId: opgs[0].id, area: 200 })}>
            <Icon.Plus className="w-4 h-4" /> Dodaj plastenik
          </Button>
        }
      />
      <Card className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50">
              {['Plastenik','OPG','Lokacija','Tip','Površina','Uređaj',''].map((h, i) => (
                <th key={i} className="text-left font-semibold text-ink-600 text-[11px] uppercase tracking-wider px-5 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {houses.map((h, idx) => {
              const opg = opgs.find(o => o.id === h.opgId);
              const dev = devices.find(d => d.id === h.deviceId);
              return (
                <tr key={h.id} className={`border-b border-ink-100 last:border-0 hover:bg-moss-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-paper-soft/30'}`}>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-ink-900">{h.name}</div>
                    <div className="text-[11px] text-ink-400 mono mt-0.5">{h.id.slice(0, 12)}…</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-ink-800">{opg?.name}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">{opg?.owner}</div>
                  </td>
                  <td className="px-5 py-4 text-ink-700">{h.location}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      h.type === 'fizički' ? 'bg-moss-100 text-moss-800 border border-moss-200' : 'bg-sky/15 text-sky-dark border border-sky/20'
                    }`}>
                      {h.type === 'fizički' ? <Icon.Cpu className="w-3 h-3" /> : <Icon.Activity className="w-3 h-3" />}
                      {h.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 num font-medium text-ink-800">{h.area} m²</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dev?.online ? 'bg-moss-500' : 'bg-ink-300'}`}></span>
                      <span className="mono text-[12px] text-ink-600 truncate max-w-[140px]">{h.deviceId}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing(h)} className="p-1.5 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors">
                        <Icon.Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setConfirmDel(h)} className="p-1.5 text-ink-400 hover:text-clay hover:bg-clay/10 rounded-lg transition-colors">
                        <Icon.Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.new ? 'Novi plastenik' : 'Uredi plastenik'}
        sub="Plastenici predstavljaju lokacije pod jednim OPG-om."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>Odustani</Button>
            <Button variant="primary" onClick={() => save(editing)} disabled={saving}>
              <Icon.Check className="w-4 h-4" /> {saving ? 'Sprema…' : (editing?.new ? 'Dodaj' : 'Spremi')}
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Naziv plastenika">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="npr. Plastenik E – Jagode" />
            </Field>
            <Field label="OPG">
              <Select value={editing.opgId} onChange={(e) => setEditing({ ...editing, opgId: e.target.value })}>
                {opgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Površina">
              <NumberInput unit="m²" value={editing.area} onChange={(e) => setEditing({ ...editing, area: +e.target.value })} />
            </Field>
            <Field label="Lokacija">
              <Input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="Grad, županija" />
            </Field>
            {!editing.new && (
              <Field label="ID uređaja">
                <Input value={editing.deviceId} readOnly className="num bg-ink-100/50 cursor-not-allowed" />
              </Field>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="Obriši plastenik?"
        sub={`"${confirmDel?.name}" i pridruženi virtualni uređaj bit će uklonjeni.`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDel(null)}>Odustani</Button>
            <Button variant="danger" onClick={() => remove(confirmDel.id)}>
              <Icon.Trash className="w-4 h-4" /> Obriši
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-ink-600">Ova akcija je nepovratna u demo načinu rada.</p>
      </Modal>
    </>
  );
}

/* ============== DEVICES TAB ============================================== */
function DevicesTab({ devices, setDevices, houses, onSaveDevice, onDeleteDevice }) {
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: '', houseId: houses[0]?.id, type: 'virtualni' });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (onSaveDevice) {
      setSaving(true);
      try { await onSaveDevice(draft); } catch (e) { console.error('Create device failed', e); } finally { setSaving(false); }
    } else {
      const id = `sim-${Math.floor(Math.random() * 9000 + 1000)}`;
      setDevices([...devices, { ...draft, id, online: true, lastSeen: Date.now(), firmware: 'sim-1.0' }]);
    }
    setAddOpen(false);
    setDraft({ name: '', houseId: houses[0]?.id, type: 'virtualni' });
  };

  return (
    <>
      <SectionTitle
        kicker="Inventar"
        title="IoT uređaji"
        sub="Registrirani ESP mikrokontroleri i virtualni senzori."
        right={
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Icon.Plus className="w-4 h-4" /> Dodaj virtualni uređaj
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
        {devices.map(d => {
          const house = houses.find(h => h.id === d.houseId);
          return (
            <Card key={d.id} className={`p-5 border animate-fade-in-up hover:shadow-md transition-shadow duration-200 ${d.online ? 'border-ink-150' : 'border-ink-100 opacity-80'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                    d.type === 'ESP' ? 'bg-ink-900 text-paper' : 'bg-sky/20 text-sky-dark border border-sky/30'
                  }`}>
                    {d.type === 'ESP' ? <Icon.Cpu className="w-5 h-5" /> : <Icon.Activity className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-ink-900 text-[14px]">{d.name}</div>
                    <div className="text-[11px] text-ink-400 mono mt-0.5">{d.id}</div>
                  </div>
                </div>
                <Badge status={d.online ? 'on' : 'off'}>{d.online ? 'Online' : 'Offline'}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink-150">
                <div className="bg-paper-soft/60 rounded-lg px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-medium text-ink-500">Tip</div>
                  <div className="text-[12px] text-ink-900 font-semibold mt-0.5">{d.type}</div>
                </div>
                <div className="bg-paper-soft/60 rounded-lg px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-medium text-ink-500">Firmware</div>
                  <div className="mono text-[12px] text-ink-900 mt-0.5">{d.firmware}</div>
                </div>
                <div className="bg-paper-soft/60 rounded-lg px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-medium text-ink-500">Plastenik</div>
                  <div className="text-[12px] text-ink-900 font-medium truncate mt-0.5">{house?.name || '–'}</div>
                </div>
                <div className="bg-paper-soft/60 rounded-lg px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wider font-medium text-ink-500">Zadnje</div>
                  <div className="text-[12px] text-ink-900 mt-0.5">{fmtAgo(d.lastSeen)}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 pt-3 border-t border-ink-100">
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setDevices(devices.map(x => x.id === d.id ? { ...x, online: !x.online, lastSeen: Date.now() } : x))}
                >
                  <Icon.Power className="w-3.5 h-3.5" /> {d.online ? 'Simuliraj pad' : 'Vrati online'}
                </Button>
                {d.type === 'virtualni' && (
                  <Button
                    variant="ghost" size="sm" className="text-clay hover:bg-clay/10"
                    onClick={async () => {
                      if (onDeleteDevice) await onDeleteDevice(d.id).catch(console.error);
                      else setDevices(devices.filter(x => x.id !== d.id));
                    }}
                  >
                    <Icon.Trash className="w-3.5 h-3.5" /> Ukloni
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Novi virtualni uređaj"
        sub="Virtualni senzor generira realistične podatke za prikaz skalabilnosti."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Odustani</Button>
            <Button variant="primary" onClick={add} disabled={!draft.name || !draft.houseId || saving}>
              <Icon.Plus className="w-4 h-4" /> {saving ? 'Stvara…' : 'Dodaj'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Naziv uređaja">
            <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="npr. Virt. senzor F" />
          </Field>
          <Field label="Plastenik">
            <Select value={draft.houseId} onChange={(e) => setDraft({ ...draft, houseId: e.target.value })}>
              {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ============== RULES TAB ================================================ */
function RulesTab({ houses, rules, setRules, onSaveRules }) {
  const [selected, setSelected] = useState(houses[0]?.id);
  const [saving, setSaving]     = useState(false);
  const r = rules[selected] || { tempMax: 30, humMin: 45, humMax: 60 };

  const update = (key, value) => setRules({ ...rules, [selected]: { ...r, [key]: value } });

  const save = async () => {
    if (!onSaveRules) return;
    setSaving(true);
    try { await onSaveRules(selected, r); } finally { setSaving(false); }
  };

  const tempDef = SENSOR_DEFS[0];
  const humDef  = SENSOR_DEFS[1];

  return (
    <>
      <SectionTitle
        kicker="Konfiguracija"
        title="Granične vrijednosti"
        sub="Alarm temperatura i vlaga po plasteniku – odgovaraju ThingsBoard alarm pravilima."
        right={onSaveRules && (
          <Button variant="primary" onClick={save} disabled={saving}>
            <Icon.Check className="w-4 h-4" /> {saving ? 'Sprema…' : 'Spremi na ThingsBoard'}
          </Button>
        )}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <Card className="lg:col-span-3 p-2">
          <div className="space-y-0.5">
            {houses.map(h => (
              <button key={h.id} onClick={() => setSelected(h.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${selected === h.id ? 'bg-ink-900 text-paper' : 'hover:bg-paper-soft'}`}>
                <div className={`text-[13px] font-medium ${selected === h.id ? 'text-paper' : 'text-ink-900'}`}>{h.name}</div>
                <div className={`text-[11px] mt-0.5 ${selected === h.id ? 'text-ink-300' : 'text-ink-400'}`}>{h.location}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-9 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Temperature – only max threshold */}
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${tempDef.color}15`, color: tempDef.color }}>
                  <tempDef.icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">{tempDef.label}</div>
                  <div className="text-[11px] text-ink-400">ThingsBoard: temperatureHighThreshold</div>
                </div>
              </div>
              <Field label="Alarm ako temperatura premaši (°C)">
                <NumberInput unit="°C" value={r.tempMax ?? 30} step={0.5} onChange={e => update('tempMax', +e.target.value)} />
              </Field>
              <div className="mt-3 pt-3 border-t border-dashed border-ink-100 text-[11px] text-ink-500">
                Alarm se gasi kada temperatura padne ispod <span className="num font-medium">{(r.tempMax ?? 30) - 1} °C</span>.
              </div>
            </div>

            {/* Humidity – min + max */}
            <div className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${humDef.color}15`, color: humDef.color }}>
                  <humDef.icon className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">{humDef.label}</div>
                  <div className="text-[11px] text-ink-400">ThingsBoard: humidityThresholdLow / High</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min vlaga (%)">
                  <NumberInput unit="%" value={r.humMin ?? 45} step={1} onChange={e => update('humMin', +e.target.value)} />
                </Field>
                <Field label="Max vlaga (%)">
                  <NumberInput unit="%" value={r.humMax ?? 60} step={1} onChange={e => update('humMax', +e.target.value)} />
                </Field>
              </div>
              <div className="mt-3 pt-3 border-t border-dashed border-ink-100">
                <div className="text-[11px] text-ink-500 flex items-center justify-between mb-1">
                  <span>Optimalni raspon</span>
                  <span className="num">{r.humMin}–{r.humMax} %</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-100 overflow-hidden relative">
                  <div className="absolute h-full" style={{ left: '10%', right: '10%', backgroundColor: humDef.color, opacity: 0.6 }}></div>
                </div>
              </div>
            </div>
          </div>

          {!onSaveRules && (
            <p className="text-[12px] text-ink-400 mt-4 pt-4 border-t border-dashed border-ink-100">
              Demo mod – promjene se čuvaju lokalno. Prebaci <code className="mono bg-ink-100 px-1 rounded">NEXT_PUBLIC_USE_MOCK=false</code> za zapis na ThingsBoard.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}

/* ============== PLATFORM TAB ============================================= */
function PlatformTab() {
  const cfg = TB_CONFIG;
  const isMock = USE_MOCK_DATA;
  return (
    <>
      <SectionTitle kicker="Integracija" title="ThingsBoard platforma" sub="Pregled veze s IoT platformom i očekivanih API endpointa." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isMock ? 'bg-amber/20 text-amber-dark' : 'bg-moss-100 text-moss-700'}`}>
              {isMock ? <Icon.Activity className="w-6 h-6" /> : <Icon.Wifi className="w-6 h-6" />}
            </div>
            <div>
              <div className="text-[11px] tracking-[0.18em] uppercase font-medium text-ink-500">Status veze</div>
              <div className="display text-xl text-ink-900 leading-tight">{isMock ? 'Demo / simulacija' : 'Povezano'}</div>
            </div>
          </div>
          <div className="space-y-2.5 text-[12.5px] mt-4">
            <Row label="Bazni URL" value={cfg.baseUrl} mono />
            <Row label="MQTT port" value={cfg.mqttPort} mono />
            <Row label="USE_MOCK_DATA" value={String(isMock)} mono pill={isMock ? 'amber' : 'moss'} />
            <Row label="Korisnik" value={cfg.username || '–'} />
            <Row label="JWT" value={isMock ? 'MOCK_JWT_TOKEN' : '–'} mono />
          </div>
          <div className="mt-5 pt-5 border-t border-ink-100">
            <div className="text-[12px] text-ink-500 leading-relaxed">
              Prebaci <code className="mono bg-ink-100 px-1.5 py-0.5 rounded">USE_MOCK_DATA = false</code> i unesi vjerodajnice u <code className="mono bg-ink-100 px-1.5 py-0.5 rounded">TB_CONFIG</code>.
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="text-[11px] tracking-[0.18em] uppercase font-medium text-ink-500 mb-1">API endpointi</div>
          <h3 className="display text-xl text-ink-900 mb-4">Pozivi koje dashboard koristi</h3>
          <div className="space-y-3">
            <EndpointRow method="POST" path="/api/auth/login" desc="Prijava – vraća JWT u tijelu odgovora." />
            <EndpointRow method="GET"  path="/api/plugins/telemetry/DEVICE/{deviceId}/values/timeseries?keys=temperature,humidity,soil_moisture,light" desc="Zadnja telemetrija." />
            <EndpointRow method="GET"  path="/api/plugins/telemetry/DEVICE/{deviceId}/values/timeseries?keys=...&startTs=...&endTs=..." desc="Vremenske serije (24 h)." />
            <EndpointRow method="POST" path='/api/plugins/rpc/oneway/{deviceId}' desc='RPC naredba aktuatoru – tijelo: { "method": "setVentilation", "params": true }' />
          </div>
          <div className="mt-5 pt-5 border-t border-ink-100 text-[12px] text-ink-500">
            JWT se uvijek šalje u zaglavlju <code className="mono bg-ink-100 px-1.5 py-0.5 rounded">X-Authorization: Bearer &lt;token&gt;</code>.
          </div>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <div className="text-[11px] tracking-[0.18em] uppercase font-medium text-ink-500 mb-1">MQTT topics</div>
          <h3 className="display text-xl text-ink-900 mb-4">ESP → ThingsBoard</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MqttCard title="Telemetry"    topic="v1/devices/me/telemetry"         payload={`{ "temperature": 24.3, "humidity": 62, "soil_moisture": 48, "light": 28000 }`} />
            <MqttCard title="Attributes"   topic="v1/devices/me/attributes"        payload={`{ "firmware": "1.4.2", "ip": "192.168.1.42" }`} />
            <MqttCard title="RPC requests" topic="v1/devices/me/rpc/request/+"     payload={`{ "method": "setVentilation", "params": true }`} dir="← " />
          </div>
        </Card>
      </div>
    </>
  );
}

function Row({ label, value, mono, pill }) {
  const pillCls = { moss: 'bg-moss-100 text-moss-800', amber: 'bg-amber/15 text-amber-dark' }[pill];
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-dashed border-ink-100 last:border-0">
      <span className="text-ink-500">{label}</span>
      {pill ? (
        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium num ${pillCls}`}>{value}</span>
      ) : (
        <span className={`text-ink-900 ${mono ? 'mono text-[12px]' : ''} text-right break-all`}>{value}</span>
      )}
    </div>
  );
}

function EndpointRow({ method, path, desc }) {
  const c = { GET: 'bg-sky/15 text-sky-dark', POST: 'bg-moss-100 text-moss-800', PUT: 'bg-amber/15 text-amber-dark', DELETE: 'bg-clay/15 text-clay-dark' }[method];
  return (
    <div className="rounded-lg border border-ink-100 px-4 py-3 hover:bg-paper-soft/50">
      <div className="flex items-start gap-3">
        <span className={`mono text-[10px] font-semibold tracking-wider rounded px-1.5 py-0.5 ${c} flex-shrink-0 mt-0.5`}>{method}</span>
        <div className="flex-1 min-w-0">
          <div className="mono text-[12px] text-ink-900 break-all leading-snug">{path}</div>
          <div className="text-[12px] text-ink-500 mt-1">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function MqttCard({ title, topic, payload, dir = '→ ' }) {
  return (
    <div className="rounded-xl border border-ink-100 p-4 bg-paper-soft/40">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[13px] font-semibold text-ink-900">{title}</div>
        <span className="text-[10px] tracking-[0.18em] uppercase font-medium text-ink-400">{dir}TB</span>
      </div>
      <div className="mono text-[11.5px] text-moss-800 bg-moss-100/60 rounded px-2 py-1 mb-2 break-all">{topic}</div>
      <pre className="mono text-[11px] text-ink-700 bg-ink-900/5 rounded p-2 overflow-x-auto whitespace-pre-wrap">{payload}</pre>
    </div>
  );
}

/* ============== ADMIN PANEL (root) ======================================= */
export default function AdminPanel(props) {
  const [tab, setTab] = useState('houses');
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl overflow-hidden mb-2">
        <div className="bg-green-grad px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-moss-200 font-semibold mb-2">
              <Icon.Shield className="w-3.5 h-3.5" />
              Administratorsko sučelje
            </div>
            <h1 className="display text-3xl md:text-4xl text-white leading-none">Konfiguracija sustava</h1>
            <p className="text-[13px] text-moss-200 mt-1.5">
              Upravljaj OPG-ovima, uređajima i pravilima.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/15 border border-white/20 rounded-xl text-[12px] text-white backdrop-blur-sm flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-[11px] font-bold">LD</div>
            <div>
              <div className="font-semibold">luka.dizdar@fer.hr</div>
              <div className="text-[10px] text-moss-200">Tenant Administrator</div>
            </div>
          </div>
        </div>
        {/* subtle mesh overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(0,0,0,0.08) 0%, transparent 50%)'
        }} />
      </div>

      <div className="border-b border-ink-200 bg-white/60 -mt-1">
        <div className="flex gap-0.5 overflow-x-auto">
          {ADMIN_TABS.map(t => {
            const IconC = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-[13px] font-semibold border-b-2 transition-all duration-150 -mb-px whitespace-nowrap ${
                  active
                    ? 'border-moss-600 text-moss-700 bg-moss-50/70'
                    : 'border-transparent text-ink-500 hover:text-ink-800 hover:bg-ink-50'
                }`}
              >
                <IconC className={`w-4 h-4 ${active ? 'text-moss-600' : ''}`} />
                {t.label}
                {active && <span className="text-[10px] text-moss-500 hidden sm:inline opacity-80">{t.sub}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-fade-in-up">
        {tab === 'houses'   && <HousesTab {...props} />}
        {tab === 'devices'  && <DevicesTab {...props} />}
        {tab === 'rules'    && <RulesTab houses={props.houses} rules={props.rules} setRules={props.setRules} onSaveRules={props.onSaveRules} />}
        {tab === 'platform' && <PlatformTab />}
      </div>
    </div>
  );
}
