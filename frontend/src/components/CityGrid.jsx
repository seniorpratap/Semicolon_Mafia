import { motion } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin } from 'lucide-react';

const HEX_W = 72;
const HEX_H = 62;
const ROW_OFFSET = HEX_W * 0.52;
const COL_GAP = HEX_W * 1.04;
const ROW_GAP = HEX_H * 0.78;

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const animInfected = useAnimatedNumber(totalInfected);

  const getColor = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.15) return { bg: '#fca5a5', border: '#f87171', text: '#991b1b', glow: 'rgba(239,68,68,0.3)' };
    if (rate > 0.08) return { bg: '#fdba74', border: '#fb923c', text: '#9a3412', glow: 'rgba(251,146,60,0.2)' };
    if (rate > 0.03) return { bg: '#fde68a', border: '#fbbf24', text: '#92400e', glow: 'rgba(251,191,36,0.2)' };
    if (rate > 0.005 || zone.infected > 0) return { bg: '#d9f99d', border: '#a3e635', text: '#3f6212', glow: 'rgba(163,230,53,0.15)' };
    return { bg: '#bbf7d0', border: '#4ade80', text: '#166534', glow: 'rgba(74,222,128,0.1)' };
  };

  // Arrange 36 zones into 6 rows of 6
  const rows = [];
  for (let r = 0; r < 6; r++) {
    rows.push(zones.slice(r * 6, r * 6 + 6));
  }

  const gridW = 6 * COL_GAP + ROW_OFFSET + 20;
  const gridH = 6 * ROW_GAP + HEX_H + 10;

  return (
    <div className="bento p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
            <MapPin size={14} className="text-emerald-600" />
          </div>
          <div>
            <span className="text-sm font-bold text-slate-800">City Topography</span>
            <span className="text-[10px] text-slate-400 ml-2">36 sectors</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-black font-mono text-red-500">{animInfected.toLocaleString()}</span>
          <span className="text-[10px] text-slate-400 font-medium">infected</span>
        </div>
      </div>

      {/* Hex Grid */}
      <div className="flex justify-center">
        <div className="relative" style={{ width: gridW, height: gridH }}>
          {rows.map((row, ri) =>
            row.map((zone, ci) => {
              const x = ci * COL_GAP + (ri % 2 === 1 ? ROW_OFFSET : 0) + 10;
              const y = ri * ROW_GAP + 5;
              const colors = getColor(zone);
              const isSelected = selectedZone?.id === zone.id;

              return (
                <motion.div
                  key={zone.id}
                  onClick={() => onZoneClick?.(zone)}
                  whileHover={{ scale: 1.12, zIndex: 20 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (ri * 6 + ci) * 0.015, duration: 0.3 }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: x, top: y,
                    width: HEX_W, height: HEX_H,
                  }}
                >
                  {/* Hex shape */}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center relative transition-all duration-300"
                    style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                      backgroundColor: colors.bg,
                      boxShadow: isSelected ? `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}` : 'none',
                    }}
                  >
                    {/* Lockdown pattern */}
                    {zone.lockdownLevel > 0 && (
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)'
                        }} />
                    )}

                    <span className="text-[8px] font-bold leading-none opacity-60 truncate max-w-[50px] text-center"
                      style={{ color: colors.text }}>
                      {zone.name}
                    </span>
                    {zone.infected > 0 && (
                      <span className="text-[10px] font-black font-mono leading-none mt-0.5"
                        style={{ color: colors.text }}>
                        {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                      </span>
                    )}
                    {zone.lockdownLevel === 2 && (
                      <span className="text-[7px] absolute bottom-1">🔒</span>
                    )}
                  </div>

                  {/* Selection ring */}
                  {isSelected && (
                    <motion.div
                      layoutId="hex-selection"
                      className="absolute -inset-1"
                      style={{
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                        border: `2px solid ${colors.border}`,
                        background: 'transparent',
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}

                  {/* Hover tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30
                    bg-white rounded-lg shadow-lg border border-slate-100 px-2 py-1 whitespace-nowrap">
                    <span className="text-[9px] font-bold text-slate-700">{zone.name}</span>
                    <span className="text-[9px] text-slate-400 ml-1">Pop: {(zone.population/1000).toFixed(0)}k</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4">
        {[
          { l: 'Safe', c: '#bbf7d0' },
          { l: 'Low', c: '#d9f99d' },
          { l: 'Medium', c: '#fde68a' },
          { l: 'High', c: '#fdba74' },
          { l: 'Critical', c: '#fca5a5' },
        ].map(({ l, c }) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-3" style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', backgroundColor: c }} />
            <span className="text-[9px] text-slate-400 font-medium">{l}</span>
          </div>
        ))}
      </div>

      {/* Selected Zone Detail */}
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-emerald-800">{selectedZone.name}</span>
            <span className="text-[10px] text-emerald-500 font-mono">Sector #{selectedZone.id}</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <MiniStat label="Population" value={selectedZone.population.toLocaleString()} color="text-slate-700" />
            <MiniStat label="Infected" value={selectedZone.infected.toLocaleString()} color="text-red-600" />
            <MiniStat label="Recovered" value={selectedZone.recovered.toLocaleString()} color="text-emerald-600" />
            <MiniStat label="Deceased" value={selectedZone.deceased.toLocaleString()} color="text-slate-500" />
          </div>
          {selectedZone.hospitalCapacity > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-semibold">Hospital</span>
              <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'bg-red-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(100, (selectedZone.hospitalOccupancy / selectedZone.hospitalCapacity) * 100)}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-500">
                {selectedZone.hospitalOccupancy}/{selectedZone.hospitalCapacity}
              </span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">{label}</div>
      <div className={`text-sm font-black font-mono ${color}`}>{value}</div>
    </div>
  );
}
