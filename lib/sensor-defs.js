import { Icon } from '@/components/icons';

export const SENSOR_DEFS = [
  { key: 'temperature', label: 'Temperatura zraka', shortLabel: 'Temp',  unit: '°C',  icon: Icon.Thermometer, color: '#c25a2a', min: null,     max: 'tempMax', decimals: 1 },
  { key: 'humidity',    label: 'Vlaga zraka',       shortLabel: 'Vlaga', unit: '%',   icon: Icon.Droplets,    color: '#4a7a8c', min: 'humMin', max: 'humMax',  decimals: 0 },
  { key: 'lux',         label: 'Osvjetljenost',     shortLabel: 'Lux',   unit: 'lux', icon: Icon.Sun,         color: '#d99a2b', min: null,     max: null,      decimals: 0 },
];

export const ACTUATOR_DEFS = [
  {
    key: 'ventilation', label: 'Ventilacija',   sub: 'Reagira na visoku temperaturu',
    icon: Icon.Wind,  color: 'sky',  method: 'setVentilation',
    trigger:      (v, r) => v.temperature > (r.tempMax ?? 30),
    triggerLabel: (r)    => `temp > ${r.tempMax ?? 30}°C`,
  },
  {
    key: 'irrigation',  label: 'Navodnjavanje', sub: 'Reagira na nisku vlagu zraka',
    icon: Icon.Drop,  color: 'moss', method: 'setIrrigation',
    trigger:      (v, r) => v.humidity < (r.humMin ?? 45),
    triggerLabel: (r)    => `vlaga < ${r.humMin ?? 45}%`,
  },
  {
    key: 'heating',     label: 'Grijanje',      sub: 'Reagira na nisku temperaturu',
    icon: Icon.Flame, color: 'clay', method: 'setHeating',
    trigger:      (v)    => v.temperature < 15,
    triggerLabel: ()     => 'temp < 15°C',
  },
];
