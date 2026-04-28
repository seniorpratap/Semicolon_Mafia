import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin } from 'lucide-react';
import { useState } from 'react';

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const animInfected = useAnimatedNumber(totalInfected);
  const visibleZones = zones.slice(0, 18);

  const getZoneStyle = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.15) return { fill: '#020403', stroke: '#22c55e', text: '#86efac' };
    if (rate > 0.08) return { fill: '#030706', stroke: '#16a34a', text: '#6ee7b7' };
    if (rate > 0.03) return { fill: '#040907', stroke: '#15803d', text: '#4ade80' };
    if (rate > 0.005 || zone.infected > 0) return { fill: '#050b08', stroke: '#166534', text: '#34d399' };
    return { fill: '#060d09', stroke: '#14532d', text: '#22c55e' };
  };

  return (
    <div className="card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
            <MapPin size={13} className="text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">City Grid</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-red-500">{animInfected.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400">infected</span>
        </div>
      </div>

      {/* 3D box city board */}
      <div
        className="rounded-xl overflow-hidden border border-emerald-300 bg-emerald-900 p-3"
        style={{ perspective: '1100px' }}
      >
        <div
          className="grid grid-cols-3 gap-3 h-[360px] p-1"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {visibleZones.map((zone) => {
            const style = getZoneStyle(zone);
            const isSelected = selectedZone?.id === zone.id;
            const isHovered = hoveredZone?.id === zone.id;
            return (
              <motion.button
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                onMouseEnter={() => setHoveredZone(zone)}
                onMouseLeave={() => setHoveredZone(null)}
                whileHover={{ scale: 1.05, y: -3, rotateX: 4, rotateY: -3 }}
                whileTap={{ scale: 0.98 }}
                className="relative rounded-xl border text-left px-3 py-2.5 transition-all duration-300 shadow-sm overflow-hidden"
                style={{
                  backgroundColor: style.fill,
                  borderColor: isSelected ? '#22c55e' : style.stroke,
                  color: style.text,
                  boxShadow: isSelected
                    ? '0 16px 24px rgba(34, 197, 94, 0.3), inset 0 -8px 14px rgba(0,0,0,0.55)'
                    : isHovered
                      ? '0 12px 18px rgba(16, 185, 129, 0.24), inset 0 -8px 14px rgba(0,0,0,0.55)'
                      : '0 8px 14px rgba(0, 0, 0, 0.45), inset 0 -6px 12px rgba(0,0,0,0.55)',
                  transform: isSelected ? 'translateZ(18px)' : 'translateZ(0px)',
                  opacity: zone.lockdownLevel > 0 ? 0.95 : 1,
                }}
              >
                <div className="absolute inset-x-1 top-1 h-3 rounded-md bg-emerald-400/15" />
                <div className="relative z-10">
                  <div className="text-[10px] font-semibold leading-snug whitespace-normal break-words min-h-[36px]">
                    {zone.name}
                  </div>
                  <div className="text-[12px] font-bold font-mono mt-1.5 leading-none">
                    {zone.infected > 999 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                  </div>
                  <div className="text-[9px] opacity-80 mt-1.5">Zone {zone.id + 1}</div>
                </div>
                {zone.lockdownLevel === 2 && (
                  <span className="absolute top-1 right-1 text-[10px] text-emerald-300">🔒</span>
                )}
              </motion.button>
            );
          })}
        </div>
        {hoveredZone && (
          <div className="mt-2 rounded-lg bg-white border border-slate-200 px-3 py-2 text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-700">{hoveredZone.name}</span>
            <span className="text-slate-500">Inf: {hoveredZone.infected.toLocaleString()} · Pop: {hoveredZone.population.toLocaleString()}</span>
          </div>
        )}
        <div className="mt-2 text-[10px] text-emerald-100/90 font-medium text-right">
          Showing {visibleZones.length} of {zones.length} zones
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 pt-1">
        {[
          { l: 'Safe', c: 'bg-emerald-200' },
          { l: 'Low', c: 'bg-yellow-200' },
          { l: 'Med', c: 'bg-amber-200' },
          { l: 'High', c: 'bg-red-200' },
          { l: 'Crit', c: 'bg-red-400' },
        ].map(({ l, c }) => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${c}`} />
            <span className="text-[9px] text-slate-400 font-medium">{l}</span>
          </div>
        ))}
      </div>

      {/* Zone Detail */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-emerald-50 rounded-xl border border-emerald-100"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-emerald-800">{selectedZone.name}</span>
            <span className="text-[9px] text-emerald-500 font-mono">Zone #{selectedZone.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex justify-between"><span className="text-slate-400">Pop</span><span className="font-bold text-slate-700">{selectedZone.population.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-red-400">Inf</span><span className="font-bold text-red-600">{selectedZone.infected.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-emerald-400">Rec</span><span className="font-bold text-emerald-600">{selectedZone.recovered.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Dec</span><span className="font-bold text-slate-500">{selectedZone.deceased.toLocaleString()}</span></div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
