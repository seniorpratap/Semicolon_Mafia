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
    if (rate > 0.15) return { bg: 'var(--color-danger-dim)', border: 'var(--color-danger)', text: 'var(--color-danger)', glow: 'var(--color-danger-glow)' };
    if (rate > 0.08) return { bg: 'var(--color-warning-dim)', border: 'var(--color-warning)', text: 'var(--color-warning)', glow: 'var(--color-warning-dim)' };
    if (rate > 0.03) return { bg: 'rgba(255, 255, 0, 0.1)', border: '#ffff00', text: '#ffff00', glow: 'rgba(255,255,0,0.3)' };
    if (rate > 0.005 || zone.infected > 0) return { bg: 'var(--color-primary-dim)', border: 'var(--color-primary)', text: 'var(--color-primary)', glow: 'var(--color-primary-glow)' };
    return { bg: 'transparent', border: 'var(--border-color)', text: 'var(--text-main)', glow: 'transparent' };
  };

  // Arrange 36 zones into 6 rows of 6
  const rows = [];
  for (let r = 0; r < 6; r++) {
    rows.push(zones.slice(r * 6, r * 6 + 6));
  }

  const gridW = 6 * COL_GAP + ROW_OFFSET + 20;
  const gridH = 6 * ROW_GAP + HEX_H + 10;

  return (
    <div className="bento p-6 flex flex-col gap-4 relative">
      {/* Radar Sweep Animation overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
          style={{
            position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, var(--color-primary) 360deg)',
            transformOrigin: 'center center'
          }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center text-primary">
            <MapPin size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold font-mono text-primary uppercase tracking-widest">TACTICAL MAP</div>
            <div className="text-[9px] text-muted font-mono tracking-widest">GRID SECTORS: 36</div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-danger font-mono font-bold uppercase tracking-widest mb-1">KNOWN THREATS</span>
          <span className="text-xl font-black font-mono text-danger leading-none">[{animInfected.toLocaleString()}]</span>
        </div>
      </div>

      {/* Hex Grid */}
      <div className="flex justify-center mt-2 mb-2 relative z-10">
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (ri * 6 + ci) * 0.015, duration: 0.1 }}
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
                      boxShadow: isSelected ? `0 0 20px ${colors.glow}` : 'none',
                    }}
                  >
                    {/* Wireframe border */}
                    <div className="absolute inset-0" style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                      border: `1px solid ${colors.border}`
                    }} />

                    {/* Lockdown pattern */}
                    {zone.lockdownLevel > 0 && (
                      <div className="absolute inset-0 opacity-40"
                        style={{
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, var(--color-warning) 2px, var(--color-warning) 4px)'
                        }} />
                    )}

                    <span className="text-[10px] font-mono font-bold leading-none truncate text-center mt-1 z-10"
                      style={{ color: colors.text, maxWidth: '40px' }}>
                      {zone.name.substring(0,3).toUpperCase()}
                    </span>
                    {zone.infected > 0 && (
                      <span className="text-[11px] font-black font-mono leading-none mt-1 z-10"
                        style={{ color: colors.text }}>
                        {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                      </span>
                    )}
                    {zone.lockdownLevel === 2 && (
                      <span className="absolute bottom-1 text-warning" style={{fontSize: '9px', fontWeight: 'bold'}}>LKDN</span>
                    )}
                  </div>

                  {/* Selection ring */}
                  {isSelected && (
                    <motion.div
                      layoutId="hex-selection"
                      className="absolute -inset-1"
                      style={{
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                        border: `2px solid #ffffff`,
                        zIndex: -2,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}

                  {/* Hover tooltip */}
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30
                    px-2 py-1 whitespace-nowrap" style={{background: 'var(--bg-core)', border: '1px solid var(--color-primary)'}}>
                    <span className="font-mono font-bold text-primary" style={{fontSize: '0.65rem'}}>[{zone.name.toUpperCase()}]</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2 relative z-10">
        {[
          { l: 'SECURE', c: 'var(--color-primary)' },
          { l: 'MINOR', c: '#ffff00' },
          { l: 'ELEVATED', c: 'var(--color-warning)' },
          { l: 'CRITICAL', c: 'var(--color-danger)' },
        ].map(({ l, c }) => (
          <div key={l} className="flex items-center gap-1">
            <div style={{ width: '8px', height: '8px', border: `1px solid ${c}` }} />
            <span className="font-mono font-bold uppercase tracking-widest text-muted" style={{fontSize: '0.55rem'}}>{l}</span>
          </div>
        ))}
      </div>

      {/* Selected Zone Detail */}
      <AnimatePresence>
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            border: '1px solid var(--color-primary)',
            background: 'var(--color-primary-dim)',
            padding: '12px',
            marginTop: '8px',
            position: 'relative'
          }}
          className="relative z-10"
        >
          {/* Tactical corners */}
          <div style={{position: 'absolute', top: '-1px', left: '-1px', width: '4px', height: '4px', background: 'var(--color-primary)'}} />
          <div style={{position: 'absolute', bottom: '-1px', right: '-1px', width: '4px', height: '4px', background: 'var(--color-primary)'}} />

          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold font-mono text-primary uppercase tracking-widest">&gt; TARGET: {selectedZone.name}</span>
            <span className="text-[9px] text-primary font-mono badge badge-outline">ID:{String(selectedZone.id).padStart(2,'0')}</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <MiniStat label="POP" value={selectedZone.population.toLocaleString()} color="var(--text-main)" />
            <MiniStat label="INFECTED" value={selectedZone.infected.toLocaleString()} color="var(--color-danger)" />
            <MiniStat label="RECOVERED" value={selectedZone.recovered.toLocaleString()} color="var(--color-primary)" />
            <MiniStat label="DECEASED" value={selectedZone.deceased.toLocaleString()} color="var(--text-muted)" />
          </div>
          {selectedZone.hospitalCapacity > 0 && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[9px] text-muted font-mono font-bold uppercase tracking-widest">MED:</span>
              <div className="flex-1" style={{height: '4px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-color)'}}>
                <div style={{ height: '100%', backgroundColor: selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'var(--color-danger)' : 'var(--color-primary)', width: `${Math.min(100, (selectedZone.hospitalOccupancy / selectedZone.hospitalCapacity) * 100)}%` }} />
              </div>
              <span className="text-[9px] font-mono font-bold text-muted">
                [{selectedZone.hospitalOccupancy}/{selectedZone.hospitalCapacity}]
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
      <div className="text-muted font-mono font-bold uppercase tracking-widest mb-1" style={{fontSize: '0.55rem'}}>{label}</div>
      <div className={`text-sm font-black font-mono`} style={{color}}>{value}</div>
    </div>
  );
}
