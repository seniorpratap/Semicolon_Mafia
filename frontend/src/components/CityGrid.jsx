import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin } from 'lucide-react';

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const gridSize = 6;
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const animInfected = useAnimatedNumber(totalInfected);

  const getZoneBg = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.15) return 'bg-red-200 border-red-300 text-red-900';
    if (rate > 0.08) return 'bg-red-100 border-red-200 text-red-800';
    if (rate > 0.03) return 'bg-amber-100 border-amber-200 text-amber-800';
    if (rate > 0.005 || zone.infected > 0) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-emerald-50 border-emerald-100 text-emerald-700';
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

      {/* Grid */}
      <div
        className="grid gap-1 p-1.5 bg-slate-50 rounded-xl"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {zones.map(zone => (
          <motion.button
            key={zone.id}
            onClick={() => onZoneClick?.(zone)}
            whileHover={{ scale: 1.08, zIndex: 10 }}
            whileTap={{ scale: 0.95 }}
            className={`
              relative aspect-square rounded-lg border transition-all duration-300
              flex flex-col items-center justify-center gap-0.5
              ${getZoneBg(zone)}
              ${selectedZone?.id === zone.id ? 'ring-2 ring-emerald-500 ring-offset-1 shadow-md' : ''}
              ${zone.lockdownLevel > 0 ? 'opacity-70' : ''}
            `}
          >
            <span className="text-[7px] font-semibold leading-none truncate w-full text-center px-0.5 opacity-70">
              {zone.name}
            </span>
            {zone.infected > 0 && (
              <span className="text-[8px] font-bold font-mono leading-none">
                {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
              </span>
            )}
            {zone.lockdownLevel === 2 && (
              <span className="absolute top-0 right-0.5 text-[7px]">🔒</span>
            )}
          </motion.button>
        ))}
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
