import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const gridSize = 6;
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const totalDeceased = zones.reduce((s, z) => s + z.deceased, 0);
  const animInfected = useAnimatedNumber(totalInfected);
  const animDeceased = useAnimatedNumber(totalDeceased);

  const getZoneClass = (zone) => {
    const rate = zone.infected / zone.population;
    let base = 'zone-clear';
    if (rate > 0.15) base = 'zone-crit';
    else if (rate > 0.08) base = 'zone-high';
    else if (rate > 0.03) base = 'zone-med';
    else if (rate > 0.005 || zone.infected > 0) base = 'zone-low';
    return `${base}${zone.lockdownLevel > 0 ? ' zone-lockdown' : ''}`;
  };

  const getIcon = (zone) => {
    if (zone.hospitalOccupancy > zone.hospitalCapacity) return '🚨';
    if (zone.militaryDeployed) return '🪖';
    if (zone.lockdownLevel === 2) return '🔒';
    if (zone.vaccinationRate > 0.3) return '💉';
    if (zone.hospitalCapacity > 300) return '🏥';
    return null;
  };

  return (
    <div className="glass-card rounded-xl p-3 corner-frame">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-[0.15em]">
            City Grid
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-red-400">
            ▲ {animInfected.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-slate-600">
            ✝ {animDeceased.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div
        className="grid gap-[2px] bg-surface/80 rounded-lg p-1 scanlines relative"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {/* Radar sweep overlay */}
        {totalInfected > 500 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 animate-sweep origin-center">
              <div className="absolute top-1/2 left-1/2 w-1/2 h-[1px] bg-gradient-to-r from-red-500/30 to-transparent origin-left" />
            </div>
          </div>
        )}

        {zones.map((zone) => {
          const icon = getIcon(zone);
          const isHot = zone.infected > zone.population * 0.05;

          return (
            <motion.button
              key={zone.id}
              onClick={() => onZoneClick?.(zone)}
              whileHover={{ scale: 1.12, zIndex: 20 }}
              whileTap={{ scale: 0.95 }}
              className={`
                relative aspect-square rounded border border-white/[0.04]
                flex flex-col items-center justify-center gap-[1px]
                cursor-pointer transition-all duration-500
                ${getZoneClass(zone)}
                ${selectedZone?.id === zone.id ? 'ring-1 ring-primary/50' : ''}
              `}
            >
              <span className="text-[6.5px] font-mono font-medium text-white/50 leading-none truncate w-full text-center px-0.5">
                {zone.name.length > 7 ? zone.name.split(' ')[0].slice(0, 7) : zone.name}
              </span>
              {zone.infected > 0 && (
                <span className="text-[7px] font-mono font-bold text-white/70">
                  {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                </span>
              )}
              {icon && (
                <span className="absolute -top-1 -right-0.5 text-[8px]">{icon}</span>
              )}
              {isHot && (
                <div className="absolute inset-0 rounded bg-red-500/15 animate-pulse-ring pointer-events-none" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-white/[0.03]">
        {[
          { l: 'CLR', c: 'bg-emerald-500/20 border-emerald-500/30' },
          { l: 'LOW', c: 'bg-yellow-500/20 border-yellow-500/30' },
          { l: 'MED', c: 'bg-orange-500/25 border-orange-500/35' },
          { l: 'HI', c: 'bg-red-500/30 border-red-500/40' },
          { l: 'LCK', c: 'bg-yellow-500/15 zone-lockdown border-yellow-500/20' },
        ].map(({ l, c }) => (
          <div key={l} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm border ${c}`} />
            <span className="text-[7px] font-mono text-slate-600 tracking-wider">{l}</span>
          </div>
        ))}
      </div>

      {/* Zone Detail */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 p-2.5 bg-surface/60 rounded-lg border border-white/[0.04]"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-white">{selectedZone.name}</span>
            <span className="text-[8px] font-mono text-slate-600">ID:{selectedZone.id}</span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] font-mono">
            <ZStat l="POP" v={selectedZone.population.toLocaleString()} />
            <ZStat l="INF" v={selectedZone.infected.toLocaleString()} c="text-red-400" />
            <ZStat l="REC" v={selectedZone.recovered.toLocaleString()} c="text-emerald-400" />
            <ZStat l="DEC" v={selectedZone.deceased.toLocaleString()} c="text-slate-500" />
            <ZStat l="HOSP" v={`${selectedZone.hospitalOccupancy}/${selectedZone.hospitalCapacity}`}
              c={selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'text-red-400' : 'text-emerald-400'} />
            <ZStat l="LOCK" v={['—', 'PRT', 'FUL'][selectedZone.lockdownLevel]}
              c={selectedZone.lockdownLevel > 0 ? 'text-yellow-400' : 'text-slate-600'} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ZStat({ l, v, c = 'text-slate-300' }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{l}</span>
      <span className={`font-semibold ${c}`}>{v}</span>
    </div>
  );
}
