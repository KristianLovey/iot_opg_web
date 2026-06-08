'use client';

import { useState, useMemo } from 'react';
import { Icon } from './icons';
import {
  Card, SectionTitle, Badge, Toggle, Button, Field, Input, NumberInput,
  Modal, EmptyState, STATUS, fmtAgo, fmtTimeS, evalStatus,
} from './shared';
import { SparkLine, LineChart } from './charts';
import { SENSOR_DEFS, ACTUATOR_DEFS } from '@/lib/sensor-defs';
import { USE_MOCK_DATA } from '@/lib/api';
import GreenhouseMap from './map';

export { SENSOR_DEFS, ACTUATOR_DEFS };

/* ====================== GREENHOUSE SELECTOR ============================== */
function GreenhouseSelector({ houses, opgs, devices, latest, selectedId, onSelect }) {
  return (
    <div className="overflow-x-auto -mx-1 px-1 pt-1 pb-2">
      <div className="flex gap-3 min-w-min">
        {houses.map((h, i) => {
          const opg    = opgs.find(o => o.id === h.opgId);
          const device = devices.find(d => d.id === h.deviceId);
          const v      = latest[h.id];
          const active = h.id === selectedId;
          return (
            <button
              key={h.id}
              onClick={() => onSelect(h.id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={`flex-shrink-0 text-left rounded-2xl border p-4 w-[260px]
                transition-all duration-200 ease-out
                hover:-translate-y-0.5 active:translate-y-0
                ${active
                  ? 'bg-ink-900 border-ink-800 text-paper shadow-[0_4px_20px_rgba(22,32,26,0.25)]'
                  : 'bg-white border-ink-150 hover:border-ink-300 hover:shadow-md shadow-soft'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon.Leaf className={`w-4 h-4 ${active ? 'text-moss-300' : 'text-moss-600'}`} />
                  <span className={`text-[10px] tracking-[0.18em] uppercase font-medium ${active ? 'text-moss-300' : 'text-moss-700'}`}>
                    {h.type === 'virtualni' ? 'Virtualni' : 'Fizički'}
                  </span>
                </div>
                <span className={`w-2 h-2 rounded-full mt-0.5 ${device?.online ? 'bg-moss-500 live-dot' : 'bg-ink-300'}`}></span>
              </div>
              <div className={`text-[15px] font-semibold leading-tight mb-0.5 ${active ? 'text-paper' : 'text-ink-900'}`}>{h.name}</div>
              {h.kultura && <div className={`text-[11px] font-medium ${active ? 'text-moss-300' : 'text-moss-700'}`}>{h.kultura}</div>}
              <div className={`text-[12px] flex items-center gap-1 mt-1.5 ${active ? 'text-ink-300' : 'text-ink-600'}`}>
                <Icon.MapPin className="w-3 h-3 flex-shrink-0" />{h.location}
              </div>
              <div className={`text-[11px] mt-0.5 ${active ? 'text-ink-400' : 'text-ink-500'}`}>{opg?.name}</div>
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-dashed"
                style={{ borderColor: active ? 'rgba(247,243,234,0.12)' : '#dde2d9' }}>
                <div>
                  <div className={`text-[10px] uppercase tracking-wider font-medium ${active ? 'text-ink-500' : 'text-ink-500'}`}>Temp</div>
                  <div className={`display-num text-[22px] leading-none font-semibold mt-0.5 ${active ? 'text-paper' : 'text-ink-900'}`}>
                    {v ? `${v.temperature?.toFixed(1)}°` : <span className="text-ink-300">–</span>}
                  </div>
                </div>
                <div>
                  <div className={`text-[10px] uppercase tracking-wider font-medium ${active ? 'text-ink-500' : 'text-ink-500'}`}>Vlaga</div>
                  <div className={`display-num text-[22px] leading-none font-semibold mt-0.5 ${active ? 'text-paper' : 'text-ink-900'}`}>
                    {v ? `${v.humidity}%` : <span className="text-ink-300">–</span>}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ====================== SENSOR CARD ====================================== */
function SensorCard({ def, value, history, rule }) {
  const min    = def.min ? rule[def.min] : null;
  const max    = def.max ? rule[def.max] : null;
  const status = evalStatus(value, min, max);
  const IconC  = def.icon;
  return (
    <Card className="p-5 flex flex-col gap-3 animate-fade-in-up hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${def.color}15`, color: def.color }}>
            <IconC className="w-[18px] h-[18px]" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-ink-700 leading-tight">{def.label}</div>
            <div className="text-[11px] text-ink-400 mt-0.5">
              {min != null && max != null ? `${min}–${max} ${def.unit}` : max != null ? `max ${max} ${def.unit}` : min != null ? `min ${min} ${def.unit}` : 'bez praga'}
            </div>
          </div>
        </div>
        <Badge status={status} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="display-num text-[46px] leading-none font-semibold text-ink-900">
          {value == null ? '–' : Number(value).toFixed(def.decimals)}
        </span>
        <span className="text-[14px] text-ink-400 font-medium">{def.unit}</span>
      </div>
      <div className="-mx-1">
        <SparkLine data={history} dataKey={def.key} color={def.color} />
      </div>
    </Card>
  );
}

/* ====================== ACTUATOR PANEL (mock only) ======================= */
function ActuatorPanel({ houseId, state, rule, latestValues, onManual, onAuto }) {
  return (
    <Card className="p-5">
      <SectionTitle kicker="Upravljanje" title="Aktuatori" sub="LED indikatori simuliraju izvršne uređaje plastenika." />
      <div className="flex flex-col gap-3">
        {ACTUATOR_DEFS.map(a => {
          const on   = state.actuators?.[a.key] ?? false;
          const auto = state.autoMode?.[a.key] ?? true;
          const willTrigger = latestValues ? a.trigger(latestValues, rule) : false;
          const IconC  = a.icon;
          const color  = { sky: '#4a7a8c', moss: '#3d7a31', clay: '#c25a2a' }[a.color];
          return (
            <div key={a.key} className="rounded-xl border border-ink-100 bg-paper-soft/50 p-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
                  style={{ backgroundColor: on ? color : `${color}18`, color: on ? '#fff' : color }}>
                  <IconC className="w-5 h-5" />
                  {on && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-moss-500 border-2 border-white live-dot"></span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[14px] font-semibold text-ink-900">{a.label}</div>
                    <Toggle on={on} onChange={v => onManual(a.key, v)} disabled={auto} />
                  </div>
                  <div className="text-[11px] text-ink-500 mt-0.5">{a.sub}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-ink-100">
                <div className="flex items-center gap-1.5">
                  <Toggle on={auto} variant="auto" onChange={v => onAuto(a.key, v)} />
                  <span className="text-[12px] text-ink-600">Auto</span>
                  {auto && <span className="text-[10.5px] text-ink-400 ml-1 mono">{a.triggerLabel(rule)}</span>}
                </div>
                <span className={`text-[11px] font-medium ${on ? 'text-moss-700' : willTrigger ? 'text-amber-dark' : 'text-ink-400'}`}>
                  {on ? 'Uključeno' : willTrigger ? 'Treba uključiti' : 'Isključeno'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ====================== GREENHOUSE EDIT MODAL ============================ */
function HouseEditModal({ open, house, rule, onClose, onSave }) {
  const [form, setForm] = useState(null);

  // Reset form when modal opens
  if (open && !form) {
    setForm({
      kultura:  house.kultura  || '',
      location: house.location || '',
      area:     house.area     || 0,
      tempMax:  rule.tempMax   ?? 30,
      humMin:   rule.humMin    ?? 45,
      humMax:   rule.humMax    ?? 60,
    });
  }
  if (!open && form) setForm(null);

  if (!open || !form) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    await onSave(house.id,
      { kultura: form.kultura, location: form.location, area: Number(form.area) },
      { tempMax: Number(form.tempMax), humMin: Number(form.humMin), humMax: Number(form.humMax) }
    );
    onClose();
  };

  return (
    <Modal
      open={open} onClose={onClose}
      title="Postavke plastenika"
      sub={house.name}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Odustani</Button>
          <Button variant="primary" onClick={save}><Icon.Check className="w-4 h-4" /> Spremi</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-ink-400 mb-2">Podaci plastenika</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kultura" className="col-span-2">
              <Input value={form.kultura} onChange={e => set('kultura', e.target.value)} placeholder="npr. Rajčice" />
            </Field>
            <Field label="Lokacija" className="col-span-2">
              <Input value={form.location} onChange={e => set('location', e.target.value)} placeholder="Grad, županija" />
            </Field>
            <Field label="Površina">
              <NumberInput unit="m²" value={form.area} onChange={e => set('area', e.target.value)} />
            </Field>
          </div>
        </div>
        <div className="pt-3 border-t border-ink-100">
          <div className="text-[10px] font-medium tracking-[0.14em] uppercase text-ink-400 mb-2">Alarm pragovi</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max temperatura (°C)" className="col-span-2">
              <NumberInput unit="°C" value={form.tempMax} step={0.5} onChange={e => set('tempMax', e.target.value)} />
            </Field>
            <Field label="Min vlaga zraka (%)">
              <NumberInput unit="%" value={form.humMin} step={1} onChange={e => set('humMin', e.target.value)} />
            </Field>
            <Field label="Max vlaga zraka (%)">
              <NumberInput unit="%" value={form.humMax} step={1} onChange={e => set('humMax', e.target.value)} />
            </Field>
          </div>
          <p className="text-[11px] text-ink-400 mt-2">
            Alarm temperature okida se kad temperatura premaši maksimum. Alarm vlage okida se kad je vlaga izvan postavljenog raspona.
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ====================== ALERTS BANNER ==================================== */
function AlertsBanner({ alerts }) {
  if (!alerts.length) return null;
  return (
    <Card className="p-4 border-clay/30 bg-clay/5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-clay/15 text-clay-dark flex items-center justify-center flex-shrink-0">
          <Icon.Alert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-clay-dark flex items-center gap-2">
            Aktivna upozorenja
            <span className="num text-[11px] bg-clay text-white rounded-full px-1.5 py-0.5">{alerts.length}</span>
          </div>
          <div className="text-[12px] text-ink-600 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {alerts.map((a, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-clay"></span>{a.message}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ====================== EVENT HISTORY ==================================== */
const EVENT_ICONS = {
  rule_breach: { icon: Icon.Alert,    color: 'text-clay'    },
  auto_on:     { icon: Icon.Power,    color: 'text-moss-700' },
  auto_off:    { icon: Icon.Power,    color: 'text-ink-400'  },
  manual:      { icon: Icon.Settings, color: 'text-sky'      },
  recovery:    { icon: Icon.Check,    color: 'text-moss-600' },
};

function EventHistory({ events }) {
  return (
    <Card className="p-5">
      <SectionTitle kicker="Zapisnik" title="Povijest događaja" sub="Zadnja okidanja pravila i akcije aktuatora." />
      {events.length === 0 ? (
        <EmptyState icon={Icon.History} title="Još nema događaja" sub="Kad pravila okinu aktuatore, događaji se prikazuju ovdje." />
      ) : (
        <div className="space-y-0.5 max-h-[400px] overflow-y-auto -mx-2">
          {events.slice(0, 50).map((e, i) => {
            const k = EVENT_ICONS[e.kind] || EVENT_ICONS.manual;
            const IconC = k.icon;
            return (
              <div key={i} className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-paper-soft/70">
                <div className={`w-7 h-7 rounded-lg bg-ink-100 ${k.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <IconC className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-ink-800 leading-snug">{e.message}</div>
                  <div className="text-[11px] text-ink-400 mt-0.5 flex items-center gap-2 num">
                    {fmtTimeS(e.ts)} <span className="text-ink-300">·</span> {fmtAgo(e.ts)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ====================== DEVICE INFO (real TB mode) ======================= */
function DeviceInfo({ device, house, rule }) {
  return (
    <Card className="p-5">
      <SectionTitle kicker="Uređaj" title="ESP32 senzor" />
      <div className="space-y-2 text-[13px]">
        <div className="flex justify-between py-1.5 border-b border-dashed border-ink-100">
          <span className="text-ink-500">Naziv</span>
          <span className="text-ink-900 font-medium">{device?.name || '–'}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-dashed border-ink-100">
          <span className="text-ink-500">Status</span>
          <Badge status={device?.online ? 'on' : 'off'}>{device?.online ? 'Online' : 'Offline'}</Badge>
        </div>
        <div className="flex justify-between py-1.5 border-b border-dashed border-ink-100">
          <span className="text-ink-500">Firmware</span>
          <span className="mono text-[12px] text-ink-800">{device?.firmware || '–'}</span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-dashed border-ink-100">
          <span className="text-ink-500">Zadnji kontakt</span>
          <span className="text-ink-800">{device ? fmtAgo(device.lastSeen) : '–'}</span>
        </div>
        <div className="pt-3 mt-1">
          <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-ink-400 mb-2">Alarm pragovi</div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-ink-500">Max temperatura</span>
              <span className="num text-ink-900">{rule?.tempMax ?? '–'} °C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Vlaga alarm raspon</span>
              <span className="num text-ink-900">{rule?.humMin ?? '–'} – {rule?.humMax ?? '–'} %</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-ink-100">
        <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-ink-400 mb-2">Lokacija</div>
        <GreenhouseMap lat={house?.lat} lng={house?.lng} name={house?.name} />
      </div>
    </Card>
  );
}

/* ====================== MAIN USER VIEW =================================== */
export default function UserDashboard({
  houses, opgs, devices, rules, selectedHouseId, setSelectedHouseId,
  latest, history, mockSnapshot, events, onActuatorToggle, onAutoToggle, onSaveHouseDetails,
}) {
  const house       = houses.find(h => h.id === selectedHouseId) || houses[0];
  const rule        = rules[house?.id] || { tempMax: 30, humMin: 45, humMax: 60 };
  const opg         = opgs.find(o => o.id === house?.opgId);
  const device      = devices.find(d => d.id === house?.deviceId);
  const v           = latest[house?.id];
  const [activeSensor, setActiveSensor]   = useState('temperature');
  const [editOpen, setEditOpen]           = useState(false);
  const [selectorOpen, setSelectorOpen]   = useState(true);
  const activeDef   = SENSOR_DEFS.find(s => s.key === activeSensor) || SENSOR_DEFS[0];
  const houseHistory = history[house?.id] || [];
  const houseState  = mockSnapshot[house?.id] || { actuators: {}, autoMode: {} };

  const alerts = useMemo(() => {
    if (!v || !rule) return [];
    const out = [];
    if (rule.tempMax != null && v.temperature > rule.tempMax)
      out.push({ message: `Temperatura: ${v.temperature.toFixed(1)} °C (iznad ${rule.tempMax})` });
    if (rule.humMin != null && v.humidity < rule.humMin)
      out.push({ message: `Vlaga: ${v.humidity} % (ispod ${rule.humMin})` });
    if (rule.humMax != null && v.humidity > rule.humMax)
      out.push({ message: `Vlaga: ${v.humidity} % (iznad ${rule.humMax})` });
    return out;
  }, [v, rule]);

  const houseEvents = events.filter(e => e.houseId === house?.id);

  if (!house) return null;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Greenhouse selector */}
      <div className="rounded-2xl border border-ink-150 bg-white shadow-soft overflow-hidden">
        <button
          onClick={() => setSelectorOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 group hover:bg-ink-50/60 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-moss-100 flex items-center justify-center">
              <Icon.Leaf className="w-3.5 h-3.5 text-moss-700" />
            </div>
            <h2 className="text-[12px] tracking-[0.14em] uppercase font-semibold text-ink-600 group-hover:text-ink-900 transition-colors">
              Odabir plastenika
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-400 num bg-ink-100 px-2 py-0.5 rounded-full">{houses.length} dostupno</span>
            <div className={`w-5 h-5 rounded-md bg-ink-100 group-hover:bg-ink-200 flex items-center justify-center transition-all duration-200 ${selectorOpen ? '' : 'rotate-180'}`}>
              <Icon.Chevron className="w-3 h-3 text-ink-500" />
            </div>
          </div>
        </button>
        <div className={`grid transition-all duration-300 ease-in-out ${selectorOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 border-t border-ink-100">
              <GreenhouseSelector
                houses={houses} opgs={opgs} devices={devices} latest={latest}
                selectedId={house.id} onSelect={setSelectedHouseId}
                open={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Greenhouse header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pt-2">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-moss-700/80 font-medium mb-1">
            <Icon.Leaf className="w-3.5 h-3.5" />{opg?.name} · {house.type}
          </div>
          <h1 className="display text-3xl md:text-4xl text-ink-900 leading-none">{house.name}</h1>
          <div className="text-[13px] text-ink-500 mt-1.5 flex flex-wrap items-center gap-3">
            {house.kultura && <span className="flex items-center gap-1.5"><Icon.Sprout className="w-3.5 h-3.5" />{house.kultura}</span>}
            <span className="flex items-center gap-1.5"><Icon.MapPin className="w-3.5 h-3.5" />{house.location}</span>
            <span className="text-ink-200">·</span>
            <span className="flex items-center gap-1.5"><Icon.Cpu className="w-3.5 h-3.5" />{device?.name}</span>
            {house.area > 0 && <><span className="text-ink-200">·</span><span className="flex items-center gap-1.5"><Icon.Activity className="w-3.5 h-3.5" />{house.area} m²</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge status={device?.online ? 'on' : 'off'}>
            {device?.online ? `Live · ${fmtAgo(device.lastSeen)}` : `Offline · ${fmtAgo(device?.lastSeen || Date.now())}`}
          </Badge>
          <Badge status={alerts.length === 0 ? 'ok' : 'crit'}>
            {alerts.length === 0 ? 'Sve u granicama' : `${alerts.length} upozorenja`}
          </Badge>
          <Button variant="soft" size="sm" onClick={() => setEditOpen(true)}>
            <Icon.Pencil className="w-3.5 h-3.5" /> Uredi
          </Button>
        </div>
      </div>

      {alerts.length > 0 && <AlertsBanner alerts={alerts} />}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: sensors + chart */}
        <div className="lg:col-span-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger">
            {SENSOR_DEFS.map(s => (
              <SensorCard key={s.key} def={s} value={v?.[s.key]} history={houseHistory} rule={rule} />
            ))}
          </div>

          <Card className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
              <div>
                <div className="text-[11px] tracking-[0.18em] uppercase font-medium text-moss-700/80 mb-1.5">Kretanje · zadnjih 24 h</div>
                <h2 className="display text-2xl text-ink-900 leading-none flex items-baseline gap-2">
                  {activeDef.label}
                  <span className="num text-ink-400 text-base">
                    {v ? `${Number(v[activeSensor]).toFixed(activeDef.decimals)} ${activeDef.unit}` : ''}
                  </span>
                </h2>
              </div>
              <div className="flex gap-1 p-1 bg-ink-100 rounded-lg">
                {SENSOR_DEFS.map(s => (
                  <button key={s.key} onClick={() => setActiveSensor(s.key)}
                    className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${activeSensor === s.key ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-800'}`}>
                    {s.shortLabel}
                  </button>
                ))}
              </div>
            </div>
            <LineChart
              data={houseHistory} dataKey={activeSensor} color={activeDef.color}
              unit={activeDef.unit} label={activeDef.label} decimals={activeDef.decimals}
              minThreshold={activeDef.min ? rule[activeDef.min] : undefined}
              maxThreshold={activeDef.max ? rule[activeDef.max] : undefined}
              height={280}
            />
            <div className="flex items-center gap-4 mt-3 text-[11px] text-ink-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5" style={{ backgroundColor: activeDef.color }}></span>Stvarna vrijednost
              </span>
              {(activeDef.min || activeDef.max) && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded" style={{ backgroundColor: activeDef.color, opacity: 0.15 }}></span>
                  Dopuštene granice
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="lg:col-span-4 space-y-5">
          {USE_MOCK_DATA ? (
            <ActuatorPanel
              houseId={house.id} state={houseState} rule={rule}
              latestValues={v} onManual={onActuatorToggle} onAuto={onAutoToggle}
            />
          ) : (
            <DeviceInfo device={device} house={house} rule={rule} />
          )}
          <EventHistory events={houseEvents} />
        </div>
      </div>

      {/* Edit modal */}
      <HouseEditModal
        open={editOpen}
        house={house}
        rule={rule}
        onClose={() => setEditOpen(false)}
        onSave={onSaveHouseDetails}
      />
    </div>
  );
}
