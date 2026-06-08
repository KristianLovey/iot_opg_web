'use client';

import { useState } from 'react';
import { Icon } from './icons';

export const Card = ({ children, className = '', as: As = 'div', ...rest }) => (
  <As className={`bg-white rounded-2xl border border-ink-100 shadow-soft ${className}`} {...rest}>
    {children}
  </As>
);

export const SectionTitle = ({ kicker, title, sub, right }) => (
  <div className="flex items-end justify-between gap-4 mb-4">
    <div>
      {kicker && (
        <div className="text-[11px] font-medium tracking-[0.18em] uppercase text-moss-700/80 mb-1.5">
          {kicker}
        </div>
      )}
      <h2 className="display text-2xl md:text-[28px] text-ink-900 leading-none">{title}</h2>
      {sub && <p className="text-sm text-ink-500 mt-1.5">{sub}</p>}
    </div>
    {right}
  </div>
);

export const STATUS = {
  ok:   { bg: 'bg-moss-100',  text: 'text-moss-800',  dot: 'bg-moss-600', label: 'U granicama' },
  warn: { bg: 'bg-amber/15',  text: 'text-amber-dark', dot: 'bg-amber',   label: 'Granično' },
  crit: { bg: 'bg-clay/15',   text: 'text-clay-dark', dot: 'bg-clay',     label: 'Izvan granica' },
  off:  { bg: 'bg-ink-100',   text: 'text-ink-500',   dot: 'bg-ink-300',  label: 'Offline' },
  on:   { bg: 'bg-moss-100',  text: 'text-moss-800',  dot: 'bg-moss-600', label: 'Online' },
};

export const Badge = ({ status = 'ok', children, className = '' }) => {
  const s = STATUS[status] || STATUS.ok;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${s.bg} ${s.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {children ?? s.label}
    </span>
  );
};

export const Toggle = ({ on, onChange, variant = 'on', disabled = false, label }) => {
  const cls = ['toggle'];
  if (on) cls.push(variant === 'auto' ? 'auto' : 'on');
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange && onChange(!on)}
      className={`${cls.join(' ')} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    />
  );
};

const btnBase = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed';
export const Button = ({ children, variant = 'primary', size = 'md', className = '', as: As = 'button', ...rest }) => {
  const sizes = { sm: 'px-2.5 py-1.5 text-[12px]', md: 'px-4 py-2.5 text-[13px]', lg: 'px-5 py-2.5 text-sm' };
  const variants = {
    primary: 'bg-moss-700 text-white hover:bg-moss-800 active:scale-95 shadow-sm hover:shadow-md',
    ghost:   'bg-transparent text-ink-700 hover:bg-ink-100',
    soft:    'bg-ink-100 text-ink-800 hover:bg-ink-200',
    danger:  'bg-clay text-white hover:bg-clay-dark',
    outline: 'border border-ink-200 text-ink-800 hover:bg-ink-50',
  };
  return (
    <As className={`${btnBase} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </As>
  );
};

export const Field = ({ label, hint, children, className = '' }) => (
  <label className={`flex flex-col gap-2.5 ${className}`}>
    {label && <span className="text-[13px] font-semibold text-ink-800">{label}</span>}
    {children}
    {hint && <span className="text-[12px] text-ink-500">{hint}</span>}
  </label>
);

const inputCls = 'w-full px-4 py-2.5 text-[13px] bg-white border border-ink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-moss-500/50 focus:border-moss-500 placeholder:text-ink-400 transition-colors';
export const Input = (props) => <input {...props} className={`${inputCls} ${props.className || ''}`} />;

export const NumberInput = ({ unit, ...props }) => (
  <div className="relative">
    <input type="number" {...props} className={`${inputCls} num pr-12 ${props.className || ''}`} />
    {unit && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-medium text-ink-500">{unit}</span>}
  </div>
);

export const Select = (props) => (
  <div className="relative">
    <select {...props} className={`${inputCls} appearance-none pr-10 ${props.className || ''}`}>
      {props.children}
    </select>
    <Icon.Chevron className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
  </div>
);

export const Modal = ({ open, onClose, title, sub, children, footer, size = 'md' }) => {
  if (!open) return null;
  const w = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size];
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose}></div>
      <div className={`relative w-full ${w} bg-white rounded-2xl shadow-[0_25px_50px_rgba(0,0,0,0.25)] border-2 border-ink-200 overflow-hidden z-[10000]`}>
        <div className="flex items-start justify-between px-5 py-3 border-b border-ink-100">
          <div>
            <h3 className="display text-lg text-ink-900 leading-tight">{title}</h3>
            {sub && <p className="text-[12px] text-ink-500 mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1 -m-1">
            <Icon.X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[55vh] overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-ink-100 bg-paper-soft flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const Drawer = ({ open, onClose, title, sub, children, footer }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/15 backdrop-blur-sm" onClick={onClose}></div>
      <div className="fixed right-0 top-16 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right z-[10000]">
        {/* Header accent bar */}
        <div className="h-1 bg-gradient-to-r from-moss-600 to-moss-500"></div>

        <div className="flex items-start justify-between px-7 py-5">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-ink-900 leading-snug">{title}</h2>
            {sub && <p className="text-[13px] text-ink-500 mt-2">{sub}</p>}
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-600 hover:bg-ink-100 p-2 -m-2 rounded-lg flex-shrink-0 transition-colors">
            <Icon.X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-1">{children}</div>

        {footer && (
          <div className="px-7 py-5 border-t border-ink-100 bg-gradient-to-b from-transparent to-ink-50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const EmptyState = ({ icon: IconComp, title, sub, action }) => (
  <div className="flex flex-col items-center text-center py-10 text-ink-500">
    {IconComp && <IconComp className="w-8 h-8 mb-2 text-ink-300" />}
    <div className="text-sm font-medium text-ink-700">{title}</div>
    {sub && <div className="text-[13px] mt-0.5">{sub}</div>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

export const fmtTime  = (ts) => new Date(ts).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
export const fmtTimeS = (ts) => new Date(ts).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
export const fmtDate  = (ts) => new Date(ts).toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
export const fmtAgo = (ts) => {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return `prije ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `prije ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `prije ${h} h`;
  return fmtDate(ts);
};

export function evalStatus(value, min, max) {
  if (value == null) return 'off';
  if (max != null && value > max) return 'crit';
  if (min != null && value < min) return 'crit';
  if (min == null && max == null) return 'ok';
  if (max != null && min != null) {
    const margin = (max - min) * 0.08 || 1;
    if (value > max - margin || value < min + margin) return 'warn';
  } else if (max != null) {
    if (value > max * 0.94) return 'warn';
  } else if (min != null) {
    if (value < min * 1.06) return 'warn';
  }
  return 'ok';
}
