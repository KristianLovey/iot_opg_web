'use client';

import { useState, useRef, useMemo, useEffect, useId } from 'react';
import { fmtTime, fmtTimeS } from './shared';

export function SparkLine({ data, dataKey, color, height = 44 }) {
  const uid = useId();
  const gradId = `sparkfill-${uid.replace(/:/g, '')}`;
  if (!data || data.length === 0) return <div style={{ height }} />;
  const w = 180;
  const h = height;
  const vals = data.map(d => d[dataKey]).filter(v => !isNaN(v));
  if (vals.length === 0) return <div style={{ height }} />;
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pad = 3;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (d[dataKey] - min) / range) * (h - pad * 2);
    return [x, y];
  });
  const path = points.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${points[points.length - 1][0]},${h} L${points[0][0]},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function LineChart({ data, dataKey, color, unit, label, decimals = 1, minThreshold, maxThreshold, height = 280 }) {
  const uid = useId();
  const gradId = `chartfill-${uid.replace(/:/g, '')}`;
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const { points, gridYs, gridXs, yMin, yMax, padL, padR, padT, padB, plotH } = useMemo(() => {
    const padL = 44, padR = 14, padT = 12, padB = 28;
    const plotW = Math.max(50, width - padL - padR);
    const plotH = height - padT - padB;
    const vals = (data || []).map(d => d[dataKey]).filter(v => !isNaN(v));
    if (!data || data.length === 0 || vals.length === 0) {
      return { points: [], gridYs: [], gridXs: [], yMin: 0, yMax: 1, padL, padR, padT, padB, plotW, plotH };
    }
    let yMin = Math.min(...vals, minThreshold ?? Infinity);
    let yMax = Math.max(...vals, maxThreshold ?? -Infinity);
    const pad = (yMax - yMin) * 0.1 || 1;
    yMin = yMin - pad; yMax = yMax + pad;
    const range = yMax - yMin || 1;
    const stepX = plotW / Math.max(1, data.length - 1);
    const pts = data.map((d, i) => ({
      x: padL + i * stepX,
      y: padT + (1 - (d[dataKey] - yMin) / range) * plotH,
      val: d[dataKey], ts: d.ts, i,
    }));
    const gridYs = [];
    for (let t = 0; t <= 5; t++) {
      gridYs.push({ v: yMin + ((yMax - yMin) * t / 5), y: padT + (1 - t / 5) * plotH });
    }
    const tickStep = Math.max(1, Math.floor(data.length / 6));
    const gridXs = data
      .map((d, i) => ({ i, x: padL + i * stepX, ts: d.ts }))
      .filter((_, i) => i % tickStep === 0);
    return { points: pts, gridYs, gridXs, yMin, yMax, padL, padR, padT, padB, plotW, plotH };
  }, [data, dataKey, width, height, minThreshold, maxThreshold]);

  if (points.length === 0) {
    return <div ref={containerRef} style={{ height }} className="flex items-center justify-center text-ink-400 text-[12px]">Nema podataka</div>;
  }

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x},${padT + plotH} L${points[0].x},${padT + plotH} Z`;
  const valueToY = (v) => padT + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - px);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    setHover(points[best]);
  };

  return (
    <div ref={containerRef} className="relative" style={{ height }}>
      <svg width={width} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridYs.map((g, i) => (
          <g key={'y' + i}>
            <line x1={padL} x2={width - padR} y1={g.y} y2={g.y} stroke="#e8ebe5" strokeDasharray="3 4" />
            <text x={padL - 6} y={g.y + 4} textAnchor="end" fontSize="10.5" fontFamily="Geist Mono" fill="#7f8e80">
              {Number(g.v).toFixed(decimals)}
            </text>
          </g>
        ))}
        {gridXs.map((g, i) => (
          <text key={'x' + i} x={g.x} y={height - padB + 16} textAnchor="middle" fontSize="10.5" fontFamily="Geist Mono" fill="#7f8e80">
            {fmtTime(g.ts)}
          </text>
        ))}
        {minThreshold != null && maxThreshold != null && (() => {
          const yTop = valueToY(maxThreshold);
          const yBot = valueToY(minThreshold);
          return (
            <g>
              <rect x={padL} y={Math.min(yTop, yBot)} width={width - padL - padR} height={Math.abs(yBot - yTop)} fill={color} fillOpacity="0.07" />
              <line x1={padL} x2={width - padR} y1={yTop} y2={yTop} stroke={color} strokeOpacity="0.35" strokeDasharray="4 4" />
              <line x1={padL} x2={width - padR} y1={yBot} y2={yBot} stroke={color} strokeOpacity="0.35" strokeDasharray="4 4" />
            </g>
          );
        })()}
        <path d={areaD} fill={`url(#${gradId})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padT} y2={padT + plotH} stroke={color} strokeOpacity="0.5" strokeDasharray="3 3" />
            <circle cx={hover.x} cy={hover.y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover && (
        <div
          className="absolute pointer-events-none bg-ink-900 text-paper text-[11.5px] rounded-md px-2.5 py-1.5 shadow-lg num"
          style={{ left: Math.min(Math.max(hover.x - 60, 0), width - 130), top: Math.max(0, hover.y - 50) }}
        >
          <div className="text-ink-300 text-[10px] mb-0.5">{fmtTimeS(hover.ts)}</div>
          <div className="font-semibold" style={{ color }}>
            {Number(hover.val).toFixed(decimals)} <span className="text-ink-300 font-normal">{unit}</span>
          </div>
        </div>
      )}
    </div>
  );
}
