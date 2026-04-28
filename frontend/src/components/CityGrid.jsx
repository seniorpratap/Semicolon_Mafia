import { motion, AnimatePresence } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

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

  return (
    <div className="card p-3 flex flex-col gap-3 relative h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-navy bg-opacity-10 flex items-center justify-center text-navy">
            <MapPin size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none">City Sector Map</h2>
            <p className="text-[10px] text-muted leading-none mt-1">Grid: 36 Sectors</p>
          </div>
        </div>
      </div>

      {/* Interactive Grid Table */}
      <div className="flex-1 min-h-0 flex flex-col relative">
        <div className="grid grid-cols-6 gap-1 h-full w-full">
          {zones.map((zone, idx) => {
            const status = getStatus(zone);
            const isSelected = selectedZone?.id === zone.id;

            return (
              <motion.div
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                className={`cursor-pointer rounded-sm border relative flex flex-col items-center justify-center overflow-hidden group transition-shadow ${isSelected ? 'shadow-md ring-2 ring-info' : ''}`}
                style={{
                  backgroundColor: status.bg,
                  borderColor: status.border,
                  color: status.text,
                }}
              >
                {/* Lockdown Pattern */}
                {zone.lockdownLevel > 0 && (
                  <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 4px, #000 4px, #000 8px)'
                    }} />
                )}

                <div className="z-10 flex flex-col items-center w-full px-1">
                  <span className="text-[10px] font-bold leading-tight truncate text-center w-full">
                    {zone.name.substring(0,6)}
                  </span>
                  
                  {zone.infected > 0 ? (
                    <span className="text-[10px] font-black leading-none mt-1">
                      {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                    </span>
                  ) : (
                    <span className="mt-1 opacity-50">{status.icon}</span>
                  )}
                </div>

                {zone.lockdownLevel > 0 && (
                  <div className="absolute top-0.5 right-0.5 z-20 opacity-70">
                    <Lock size={10} fill="currentColor"/>
                  </div>
                )}
                {zone.infected > 0 && status.icon && (
                  <div className="absolute top-0.5 left-0.5 z-20 opacity-70">
                    {status.icon}
                  </div>
                )}

                {/* Accessible Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30
                  bg-navy text-white px-2 py-1 rounded shadow-md whitespace-nowrap text-xs font-medium flex items-center gap-1">
                  <span>{zone.name}</span>
                  <span className="text-orange border-l border-white border-opacity-20 pl-1">{status.level}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Zone Detail Overlay (Compact) */}
      <AnimatePresence>
      {selectedZone && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border border-info rounded bg-info bg-opacity-5 p-2 flex-shrink-0"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-navy flex items-center gap-1"><MapPin size={12}/> {selectedZone.name}</h3>
            <span className="text-[10px] bg-main text-muted px-1 rounded border border-border-color">ID: {selectedZone.id}</span>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-main rounded border border-border-color p-1">
              <div className="text-[9px] font-semibold text-muted">Pop</div>
              <div className="text-xs font-bold">{selectedZone.population >= 1000 ? (selectedZone.population/1000).toFixed(0)+'k' : selectedZone.population}</div>
            </div>
            <div className="bg-danger bg-opacity-10 rounded border border-danger p-1">
              <div className="text-[9px] font-semibold text-danger">Inf</div>
              <div className="text-xs font-bold text-danger">{selectedZone.infected.toLocaleString()}</div>
            </div>
            <div className="bg-safe bg-opacity-10 rounded border border-safe p-1">
              <div className="text-[9px] font-semibold text-safe">Rec</div>
              <div className="text-xs font-bold text-safe">{selectedZone.recovered.toLocaleString()}</div>
            </div>
            <div className="bg-main rounded border border-border-color p-1">
              <div className="text-[9px] font-semibold text-muted">Dec</div>
              <div className="text-xs font-bold text-navy">{selectedZone.deceased.toLocaleString()}</div>
            </div>
          </div>
          
          {selectedZone.hospitalCapacity > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="text-[9px] font-semibold text-info">Hosp</div>
              <div className="flex-1 bg-main rounded-full h-1.5 overflow-hidden border border-border-color">
                <div className="h-full rounded-full" style={{ 
                  backgroundColor: selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'var(--color-danger)' : 'var(--color-safe)',
                  width: `${Math.min(100, (selectedZone.hospitalOccupancy / selectedZone.hospitalCapacity) * 100)}%` 
                }}></div>
              </div>
              <div className="text-[9px] font-semibold text-muted">{selectedZone.hospitalOccupancy}/{selectedZone.hospitalCapacity}</div>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
