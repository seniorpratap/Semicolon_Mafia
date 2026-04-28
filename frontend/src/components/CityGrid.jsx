import { motion, AnimatePresence } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin, Lock, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);

  const getStatus = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.15) return { level: 'Critical', bg: 'var(--color-danger)', border: '#C92A38', text: '#FFFFFF', icon: <AlertTriangle size={14}/> };
    if (rate > 0.08) return { level: 'Warning', bg: 'var(--color-orange)', border: '#E85B2A', text: '#FFFFFF', icon: <AlertTriangle size={14}/> };
    if (rate > 0.03) return { level: 'Elevated', bg: '#FF9F1C', border: '#E68A00', text: '#FFFFFF', icon: null };
    if (rate > 0.005 || zone.infected > 0) return { level: 'Tracked', bg: 'var(--color-info)', border: '#3148C9', text: '#FFFFFF', icon: null };
    return { level: 'Safe', bg: 'var(--bg-surface)', border: 'var(--border-color)', text: 'var(--color-navy)', icon: <ShieldCheck size={14} className="text-safe"/> };
  };

  return (
    <div className="card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 pb-3 border-b border-border-color">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shadow-lg shadow-navy/20">
            <MapPin size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-navy">Sector Analytics</h2>
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider mt-0.5">36 Tactical Units</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-muted tracking-widest">Active Cases</p>
            <p className="text-base font-black text-danger leading-none">{totalInfected.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Grid Table Format */}
      <div className="flex-1 min-h-0 relative">
        <div className="grid grid-cols-6 gap-2 h-full">
          {zones.map((zone) => {
            const status = getStatus(zone);
            const isSelected = selectedZone?.id === zone.id;

            return (
              <motion.div
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                whileHover={{ y: -4, scale: 1.02, zIndex: 50 }}
                whileTap={{ scale: 0.95 }}
                className={`cursor-pointer rounded-lg border-2 relative flex flex-col items-center justify-center overflow-hidden group transition-all duration-200 
                  ${isSelected ? 'ring-4 ring-orange ring-opacity-20 z-10 shadow-xl' : 'shadow-sm'}`}
                style={{
                  backgroundColor: status.bg,
                  borderColor: isSelected ? 'var(--color-orange)' : status.border,
                  color: status.text,
                }}
              >
                {/* Lockdown Overlay */}
                {zone.lockdownLevel > 0 && (
                  <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, currentColor 5px, currentColor 10px)'
                    }} />
                )}

                <div className="z-10 flex flex-col items-center w-full px-2 text-center">
                  <span className="text-[9px] font-black uppercase tracking-tight truncate w-full mb-1">
                    {zone.name}
                  </span>
                  
                  {zone.infected > 0 ? (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-black leading-none mb-1">
                        {zone.infected >= 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                      </span>
                      {status.icon}
                    </div>
                  ) : (
                    <div className="mt-1 opacity-80">{status.icon}</div>
                  )}
                </div>

                {zone.lockdownLevel > 0 && (
                  <div className="absolute top-1 right-1 z-20">
                    <Lock size={10} fill="currentColor" />
                  </div>
                )}

                {/* Tooltip Overlay (Premium) */}
                <div className="absolute inset-0 bg-navy opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                  <span className="text-[8px] font-black text-orange uppercase mb-1">{zone.name}</span>
                  <span className="text-[10px] font-bold text-white mb-1">{status.level}</span>
                  <div className="h-0.5 w-4 bg-orange rounded-full" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend & Active Selection Details */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-around p-2 bg-main rounded-lg border border-border-color">
          {[
            { l: 'Safe', c: 'var(--bg-surface)' },
            { l: 'Warning', c: 'var(--color-orange)' },
            { l: 'Critical', c: 'var(--color-danger)' },
            { l: 'Tracked', c: 'var(--color-info)' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full border border-border-color shadow-sm" style={{ backgroundColor: item.c }} />
              <span className="text-[9px] font-black uppercase text-muted tracking-wider">{item.l}</span>
            </div>
          ))}
        </div>

        {/* Compact Detail View */}
        <AnimatePresence>
          {selectedZone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-navy rounded-xl p-4 shadow-xl border-t-2 border-orange"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-orange" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">{selectedZone.name} Readout</h3>
                </div>
                <div className="text-[9px] font-bold text-white/40 uppercase">Sector ID_{selectedZone.id}</div>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <p className="text-[8px] font-black text-white/40 uppercase mb-1">Pop</p>
                  <p className="text-xs font-black text-white">{selectedZone.population >= 1000 ? (selectedZone.population/1000).toFixed(1)+'k' : selectedZone.population}</p>
                </div>
                <div className="bg-danger/10 rounded-lg p-2 border border-danger/20">
                  <p className="text-[8px] font-black text-danger uppercase mb-1">Inf</p>
                  <p className="text-xs font-black text-danger">{selectedZone.infected}</p>
                </div>
                <div className="bg-safe/10 rounded-lg p-2 border border-safe/20">
                  <p className="text-[8px] font-black text-safe uppercase mb-1">Rec</p>
                  <p className="text-xs font-black text-safe">{selectedZone.recovered}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                  <p className="text-[8px] font-black text-white/40 uppercase mb-1">Dec</p>
                  <p className="text-xs font-black text-white">{selectedZone.deceased}</p>
                </div>
              </div>
              
              {selectedZone.hospitalCapacity > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <Database size={12} className="text-info" />
                  <div className="flex-1">
                    <div className="flex justify-between text-[8px] font-black text-white/60 mb-1 uppercase tracking-widest">
                      <span>Facility Occupancy</span>
                      <span>{Math.round(selectedZone.hospitalOccupancy/selectedZone.hospitalCapacity*100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (selectedZone.hospitalOccupancy/selectedZone.hospitalCapacity)*100)}%` }} 
                        className={`h-full ${selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'bg-danger' : 'bg-info'}`} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
