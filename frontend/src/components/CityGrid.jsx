import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';

/**
 * CityGrid — Premium command-center style city map
 * Each zone is a cell showing real-time infection status
 */
export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const gridSize = 6;

  const getZoneClass = (zone) => {
    const rate = zone.infected / zone.population;
    let base = 'zone-safe';
    if (rate > 0.15) base = 'zone-critical';
    else if (rate > 0.08) base = 'zone-high';
    else if (rate > 0.03) base = 'zone-medium';
    else if (rate > 0.005) base = 'zone-low';
    else if (zone.infected > 0) base = 'zone-low';

    const lockdown = zone.lockdownLevel > 0 ? ' zone-lockdown' : '';
    const selected = selectedZone?.id === zone.id ? ' ring-1 ring-white/60' : '';
    return `${base}${lockdown}${selected}`;
  };

  const getStatusIcon = (zone) => {
    if (zone.hospitalOccupancy > zone.hospitalCapacity) return '🚨';
    if (zone.militaryDeployed) return '🪖';
    if (zone.vaccinationRate > 0.3) return '💉';
    if (zone.lockdownLevel === 2) return '🔒';
    if (zone.lockdownLevel === 1) return '⚠️';
    if (zone.hospitalCapacity > 300) return '🏥';
    return null;
  };

  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const totalDeceased = zones.reduce((s, z) => s + z.deceased, 0);
  const animInfected = useAnimatedNumber(totalInfected);
  const animDeceased = useAnimatedNumber(totalDeceased);

  return (
    <div className="glass rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">City Map</h3>
        </div>
        <div className="flex gap-3 text-[10px] font-mono">
          <span className="text-red-400">{animInfected.toLocaleString()} inf</span>
          <span className="text-slate-500">{animDeceased.toLocaleString()} dec</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-[3px] p-2 bg-surface/50 rounded-xl border border-white/[0.03]"
           style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
        {zones.map((zone) => {
          const icon = getStatusIcon(zone);
          const isHot = zone.infected > zone.population * 0.05;

          return (
            <motion.button
              key={zone.id}
              onClick={() => onZoneClick?.(zone)}
              whileHover={{ scale: 1.08, zIndex: 20 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative aspect-square rounded-md border border-white/[0.06]
                flex flex-col items-center justify-center gap-0.5
                cursor-pointer transition-all duration-700
                ${getZoneClass(zone)}
              `}
            >
              {/* Zone name */}
              <span className="text-[7px] font-medium text-white/70 leading-none text-center px-0.5 truncate w-full">
                {zone.name.length > 8 ? zone.name.split(' ')[0] : zone.name}
              </span>

              {/* Infection count */}
              {zone.infected > 0 && (
                <span className="text-[8px] font-mono text-white/50">
                  {zone.infected > 1000 ? `${(zone.infected/1000).toFixed(1)}k` : zone.infected}
                </span>
              )}

              {/* Status icon */}
              {icon && (
                <span className="absolute -top-1 -right-0.5 text-[9px] drop-shadow-lg">{icon}</span>
              )}

              {/* Pulse ring for critical zones */}
              {isHot && (
                <div className="absolute inset-0 rounded-md">
                  <div className="absolute inset-0 rounded-md bg-red-500/20 animate-pulse-ring" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-3">
        {[
          { label: 'Safe', cls: 'bg-emerald-500/30' },
          { label: 'Low', cls: 'bg-yellow-500/40' },
          { label: 'Med', cls: 'bg-orange-500/50' },
          { label: 'High', cls: 'bg-red-500/50' },
          { label: 'Lock', cls: 'bg-yellow-500/30 zone-lockdown' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-sm ${l.cls} border border-white/10`} />
            <span className="text-[9px] text-slate-600">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Zone Detail Card */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mt-3 p-3 bg-surface-lighter/60 rounded-xl border border-white/[0.05]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-white">{selectedZone.name}</span>
            <span className="text-[9px] text-slate-500 font-mono">Zone {selectedZone.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
            <Stat label="Population" value={selectedZone.population.toLocaleString()} />
            <Stat label="Infected" value={selectedZone.infected.toLocaleString()} color="text-red-400" />
            <Stat label="Recovered" value={selectedZone.recovered.toLocaleString()} color="text-emerald-400" />
            <Stat label="Deceased" value={selectedZone.deceased.toLocaleString()} color="text-slate-400" />
            <Stat label="Hospital" value={`${selectedZone.hospitalOccupancy}/${selectedZone.hospitalCapacity}`}
                  color={selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'text-red-400' : 'text-emerald-400'} />
            <Stat label="Lockdown" value={['None', 'Partial', 'Full'][selectedZone.lockdownLevel]}
                  color={selectedZone.lockdownLevel > 0 ? 'text-yellow-400' : 'text-slate-500'} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value, color = 'text-slate-300' }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={`font-mono font-medium ${color}`}>{value}</span>
    </div>
  );
}
