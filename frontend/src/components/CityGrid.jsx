import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin, Lock, Activity, Shield } from 'lucide-react';

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const gridSize = 6;
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const totalDeceased = zones.reduce((s, z) => s + z.deceased, 0);
  const animInf = useAnimatedNumber(totalInfected);
  const animDec = useAnimatedNumber(totalDeceased);

  const getCellClass = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.08) return 'grid-cell-hi';
    if (rate > 0.02) return 'grid-cell-med';
    if (zone.infected > 0) return 'grid-cell-low';
    return 'grid-cell-clr';
  };

  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="tac-panel-header border-b" style={{ borderColor: 'var(--t-border)' }}>
        <span className="flex items-center gap-2">
          <MapPin size={12} className="text-muted" /> Sector Command
        </span>
        <div className="flex gap-4 text-[9px] font-mono font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1"><Activity size={10} className="text-red-500" /> INF <span className="text-red-500">{animInf.toLocaleString()}</span></span>
          <span className="flex items-center gap-1 opacity-60"><Shield size={10} /> DEC {animDec.toLocaleString()}</span>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 scroll-y p-1.5">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {zones.map(zone => {
            const isSelected = selectedZone?.id === zone.id;
            return (
              <motion.button
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`grid-cell relative px-2 py-3 text-left transition-all rounded border-2
                  ${getCellClass(zone)}
                  ${isSelected ? 'border-accent shadow-lg z-10 scale-105' : 'border-transparent'}
                `}
              >
                {/* Zone Name + Icons */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-black uppercase tracking-tighter truncate opacity-70" style={{ color: 'var(--t-text)' }}>
                    {zone.name.substring(0, 8)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {zone.lockdownLevel > 0 && <Lock size={8} className="text-accent" />}
                  </div>
                </div>

                {/* Infected Count */}
                <div className="text-sm font-black tracking-tighter leading-none" style={{ color: 'var(--t-text)' }}>
                  {zone.infected > 0 ? (zone.infected >= 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected) : '0'}
                </div>
                
                {/* Visual indicator bar */}
                <div className="mt-1.5 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-current opacity-30" style={{ width: `${Math.min(100, (zone.infected/zone.population)*200)}%` }} />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-t text-[8px] font-black uppercase tracking-[0.2em]" style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg)', color: 'var(--t-muted)' }}>
        {[
          { l: 'CLR', c: 'var(--t-bg)', b: 'var(--t-border)' },
          { l: 'LOW', c: 'rgba(16,185,129,0.1)', b: 'rgba(16,185,129,0.3)' },
          { l: 'MED', c: 'rgba(245,158,11,0.1)', b: 'rgba(245,158,11,0.3)' },
          { l: 'HI', c: 'rgba(239,68,68,0.1)', b: 'rgba(239,68,68,0.3)' },
        ].map(({ l, c, b }) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border" style={{ background: c, borderColor: b }} />
            <span>{l}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-auto opacity-50">
          <Lock size={10} /> LCK
        </div>
      </div>
    </div>
  );
}
