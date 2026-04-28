import { motion, AnimatePresence } from 'framer-motion';
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
    if (rate > 0.15) return { bg: 'rgba(239, 68, 68, 0.2)', border: '#f87171', text: '#fca5a5', glow: 'rgba(239,68,68,0.5)' };
    if (rate > 0.08) return { bg: 'rgba(245, 158, 11, 0.2)', border: '#fbbf24', text: '#fde68a', glow: 'rgba(245,158,11,0.4)' };
    if (rate > 0.03) return { bg: 'rgba(252, 211, 77, 0.15)', border: '#fde047', text: '#fef08a', glow: 'rgba(252,211,77,0.3)' };
    if (rate > 0.005 || zone.infected > 0) return { bg: 'rgba(52, 211, 153, 0.15)', border: '#6ee7b7', text: '#a7f3d0', glow: 'rgba(52,211,153,0.2)' };
    return { bg: 'rgba(16, 185, 129, 0.05)', border: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7', glow: 'rgba(16,185,129,0.1)' };
  };

  // Arrange 36 zones into 6 rows of 6
  const rows = [];
  for (let r = 0; r < 6; r++) {
    rows.push(zones.slice(r * 6, r * 6 + 6));
  }

  const gridW = 6 * COL_GAP + ROW_OFFSET + 20;
  const gridH = 6 * ROW_GAP + HEX_H + 10;

  return (
    <div className="bento p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="logo-icon" style={{width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', boxShadow: 'none', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
            <MapPin size={16} className="text-emerald-400" />
          </div>
          <div>
            <span className="text-base font-bold text-white">City Topography</span>
            <span className="text-xs text-slate-500 ml-2 font-mono">36 sectors</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black font-mono text-red-500" style={{textShadow: '0 0 10px rgba(239, 68, 68, 0.5)'}}>{animInfected.toLocaleString()}</span>
          <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">infected</span>
        </div>
      </div>

      {/* Hex Grid */}
      <div className="flex justify-center mt-2 mb-2">
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
                  whileHover={{ scale: 1.15, zIndex: 20 }}
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
                      border: `1px solid ${colors.border}` // Fallback border
                    }}
                  >
                    {/* Simulated border with inner hex */}
                    <div className="absolute inset-0 m-[1px]" style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                      backgroundColor: isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(15, 23, 42, 0.7)',
                      zIndex: -1
                    }} />

                    {/* Lockdown pattern */}
                    {zone.lockdownLevel > 0 && (
                      <div className="absolute inset-0 opacity-30"
                        style={{
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)'
                        }} />
                    )}

                    <span className="text-xs font-bold leading-none opacity-80 truncate text-center mt-1"
                      style={{ color: colors.text, maxWidth: '50px' }}>
                      {zone.name}
                    </span>
                    {zone.infected > 0 && (
                      <span className="text-xs font-black font-mono leading-none mt-1"
                        style={{ color: colors.text, textShadow: `0 0 5px ${colors.glow}` }}>
                        {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                      </span>
                    )}
                    {zone.lockdownLevel === 2 && (
                      <span className="absolute bottom-1" style={{fontSize: '9px'}}>🔒</span>
                    )}
                  </div>

                  {/* Selection ring */}
                  {isSelected && (
                    <motion.div
                      layoutId="hex-selection"
                      className="absolute -inset-1"
                      style={{
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                        background: colors.border,
                        zIndex: -2,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}

                  {/* Hover tooltip */}
                  <div className="hex-tooltip">
                    <span className="font-bold text-white mr-1">{zone.name}</span>
                    <span className="text-slate-400">Pop: {(zone.population/1000).toFixed(0)}k</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {[
          { l: 'Safe', c: '#34d399' },
          { l: 'Low', c: '#6ee7b7' },
          { l: 'Medium', c: '#fde047' },
          { l: 'High', c: '#fbbf24' },
          { l: 'Critical', c: '#f87171' },
        ].map(({ l, c }) => (
          <div key={l} className="flex items-center gap-2">
            <div style={{ width: '10px', height: '10px', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', backgroundColor: c, boxShadow: `0 0 8px ${c}` }} />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider" style={{fontSize: '0.65rem'}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Selected Zone Detail */}
      <AnimatePresence>
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))',
            borderRadius: '16px',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '16px',
            marginTop: '8px'
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-base font-bold text-emerald-400">{selectedZone.name}</span>
            <span className="text-xs text-emerald-600 font-mono badge badge-solid">Sector #{selectedZone.id}</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <MiniStat label="Population" value={selectedZone.population.toLocaleString()} color="text-slate-300" />
            <MiniStat label="Infected" value={selectedZone.infected.toLocaleString()} color="text-red-400" />
            <MiniStat label="Recovered" value={selectedZone.recovered.toLocaleString()} color="text-emerald-400" />
            <MiniStat label="Deceased" value={selectedZone.deceased.toLocaleString()} color="text-slate-500" />
          </div>
          {selectedZone.hospitalCapacity > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Hospital</span>
              <div className="flex-1 overflow-hidden" style={{height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '3px'}}>
                <div style={{ height: '100%', borderRadius: '3px', backgroundColor: selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? '#ef4444' : '#10b981', width: `${Math.min(100, (selectedZone.hospitalOccupancy / selectedZone.hospitalCapacity) * 100)}%`, boxShadow: `0 0 10px ${selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? '#ef4444' : '#10b981'}` }} />
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">
                {selectedZone.hospitalOccupancy}/{selectedZone.hospitalCapacity}
              </span>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1" style={{fontSize: '0.65rem'}}>{label}</div>
      <div className={`text-lg font-black font-mono ${color}`}>{value}</div>
    </div>
  );
}
