import { motion, AnimatePresence } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

const HEX_W = 72;
const HEX_H = 62;
const ROW_OFFSET = HEX_W * 0.52;
const COL_GAP = HEX_W * 1.04;
const ROW_GAP = HEX_H * 0.78;

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const animInfected = useAnimatedNumber(totalInfected);

  const getStatus = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.15) return { level: 'Critical', bg: 'var(--color-danger)', border: '#C92A38', text: '#FFFFFF', icon: <AlertTriangle size={12}/> };
    if (rate > 0.08) return { level: 'Warning', bg: 'var(--color-orange)', border: '#E85B2A', text: '#FFFFFF', icon: <AlertTriangle size={12}/> };
    if (rate > 0.03) return { level: 'Elevated', bg: '#F6AD55', border: '#DD6B20', text: '#FFFFFF', icon: null };
    if (rate > 0.005 || zone.infected > 0) return { level: 'Tracked', bg: 'var(--color-info)', border: '#3148C9', text: '#FFFFFF', icon: null };
    return { level: 'Safe', bg: 'var(--bg-main)', border: 'var(--border-color)', text: 'var(--color-navy)', icon: <ShieldCheck size={12} className="text-safe"/> };
  };

  const rows = [];
  for (let r = 0; r < 6; r++) {
    rows.push(zones.slice(r * 6, r * 6 + 6));
  }

  const gridW = 6 * COL_GAP + ROW_OFFSET + 20;
  const gridH = 6 * ROW_GAP + HEX_H + 10;

  return (
    <div className="card p-6 flex flex-col gap-6 relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-navy bg-opacity-10 flex items-center justify-center text-navy">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold">City Sector Map</h2>
            <p className="text-sm text-muted">Select a sector to view details</p>
          </div>
        </div>
      </div>

      {/* Hex Grid */}
      <div className="flex justify-center my-4 z-10">
        <div className="relative" style={{ width: gridW, height: gridH }}>
          {rows.map((row, ri) =>
            row.map((zone, ci) => {
              const x = ci * COL_GAP + (ri % 2 === 1 ? ROW_OFFSET : 0) + 10;
              const y = ri * ROW_GAP + 5;
              const status = getStatus(zone);
              const isSelected = selectedZone?.id === zone.id;

              return (
                <motion.div
                  key={zone.id}
                  onClick={() => onZoneClick?.(zone)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (ri * 6 + ci) * 0.015, duration: 0.2 }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: x, top: y,
                    width: HEX_W, height: HEX_H,
                  }}
                >
                  {/* Hex shape */}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center relative transition-shadow duration-300"
                    style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                      backgroundColor: status.bg,
                      color: status.text,
                      boxShadow: isSelected ? '0 0 0 4px var(--color-info)' : 'none',
                    }}
                  >
                    {/* Inner Border for styling */}
                    <div className="absolute inset-0 m-[1px]" style={{
                      clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                      border: `1px solid ${status.border}`,
                      backgroundColor: 'transparent',
                      pointerEvents: 'none'
                    }} />

                    {/* Lockdown Pattern */}
                    {zone.lockdownLevel > 0 && (
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #000 4px, #000 8px)'
                        }} />
                    )}

                    <div className="z-10 flex flex-col items-center">
                      <span className="text-xs font-bold leading-none truncate text-center mb-1 max-w-[50px]">
                        {zone.name.substring(0,3)}
                      </span>
                      {status.icon && <div className="mb-1">{status.icon}</div>}
                    </div>

                    {zone.lockdownLevel > 0 && (
                      <div className="absolute top-1 right-2 z-20">
                        <Lock size={12} fill="currentColor"/>
                      </div>
                    )}
                  </div>

                  {/* Selection Outline */}
                  {isSelected && (
                    <motion.div
                      layoutId="hex-selection-accessible"
                      className="absolute -inset-[3px]"
                      style={{
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                        backgroundColor: 'var(--color-info)',
                        zIndex: -1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}

                  {/* Accessible Tooltip */}
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30
                    bg-navy text-white px-3 py-2 rounded shadow-md whitespace-nowrap text-sm font-medium flex items-center gap-2">
                    <span>{zone.name}</span>
                    <span className="text-orange border-l border-white border-opacity-20 pl-2">{status.level}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend - Explicit text for accessibility */}
      <div className="flex flex-wrap justify-center gap-6 mt-auto z-10 p-4 bg-main rounded-md border border-border-color">
        {[
          { l: 'Safe Sector', c: 'var(--bg-main)', b: 'var(--border-color)', icon: <ShieldCheck size={14} className="text-safe"/> },
          { l: 'Monitored', c: 'var(--color-info)', b: '#3148C9', icon: null },
          { l: 'Warning', c: 'var(--color-orange)', b: '#E85B2A', icon: <AlertTriangle size={14} className="text-white"/> },
          { l: 'Critical', c: 'var(--color-danger)', b: '#C92A38', icon: <AlertTriangle size={14} className="text-white"/> },
          { l: 'Lockdown', pattern: true, icon: <Lock size={14} className="text-muted"/> }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            {item.pattern ? (
              <div className="w-5 h-5 border border-border-color rounded" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 4px)', opacity: 0.5}} />
            ) : (
              <div className="w-5 h-5 border rounded flex items-center justify-center" style={{ backgroundColor: item.c, borderColor: item.b }}>
                {item.icon}
              </div>
            )}
            <span className="text-sm font-medium">{item.l}</span>
          </div>
        ))}
      </div>

      {/* Selected Zone Detail Overlay */}
      <AnimatePresence>
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="card p-4 shadow-md mt-4 border-l-4"
          style={{ borderLeftColor: 'var(--color-info)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-navy">{selectedZone.name} Details</h3>
            <span className="badge bg-main text-muted border border-border-color">Sector {selectedZone.id}</span>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="p-3 bg-main rounded border border-border-color text-center">
              <div className="text-xs font-semibold text-muted mb-1">Population</div>
              <div className="text-lg font-bold">{selectedZone.population.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-danger bg-opacity-10 rounded border border-danger text-center">
              <div className="text-xs font-semibold text-danger mb-1">Infected</div>
              <div className="text-lg font-bold text-danger">{selectedZone.infected.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-safe bg-opacity-10 rounded border border-safe text-center">
              <div className="text-xs font-semibold text-safe mb-1">Recovered</div>
              <div className="text-lg font-bold text-safe">{selectedZone.recovered.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-main rounded border border-border-color text-center">
              <div className="text-xs font-semibold text-muted mb-1">Deceased</div>
              <div className="text-lg font-bold text-navy">{selectedZone.deceased.toLocaleString()}</div>
            </div>
          </div>
          
          {selectedZone.hospitalCapacity > 0 && (
            <div className="mt-4 p-3 border border-border-color rounded flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-info bg-opacity-10 flex items-center justify-center">
                <span className="text-info font-bold text-xs">H</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1 font-semibold">
                  <span>Hospital Capacity</span>
                  <span>{selectedZone.hospitalOccupancy} / {selectedZone.hospitalCapacity}</span>
                </div>
                <div className="w-full bg-main rounded-full h-2.5 overflow-hidden border border-border-color">
                  <div className="h-2.5 rounded-full" style={{ 
                    backgroundColor: selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'var(--color-danger)' : 'var(--color-safe)',
                    width: `${Math.min(100, (selectedZone.hospitalOccupancy / selectedZone.hospitalCapacity) * 100)}%` 
                  }}></div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
