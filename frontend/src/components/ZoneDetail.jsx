import { motion } from 'framer-motion';
import { X, Shield, Heart, Users, Building, Syringe, Lock, Unlock, TrendingUp, AlertTriangle } from 'lucide-react';

/**
 * ZoneDetail — Full-screen overlay showing detailed stats for a selected zone.
 * Appears when a grid cell is clicked. Click outside or X to dismiss.
 * Uses CSS theme variables for light/dark mode support.
 */
export default function ZoneDetail({ zone, onClose, onAction }) {
  if (!zone) return null;

  const infRate = zone.population > 0 ? (zone.infected / zone.population * 100) : 0;
  const hospPct = zone.hospitalCapacity > 0 ? (zone.hospitalOccupancy / zone.hospitalCapacity * 100) : 0;
  const isHospOverloaded = hospPct > 100;

  const lockdownLabels = ['NONE', 'PARTIAL', 'FULL'];
  const lockdownColors = ['#10b981', '#f59e0b', '#ef4444'];

  const popSegments = [
    { label: 'Susceptible', value: zone.susceptible, color: '#6b7280' },
    { label: 'Infected', value: zone.infected, color: '#ef4444' },
    { label: 'Recovered', value: zone.recovered, color: '#10b981' },
    { label: 'Deceased', value: zone.deceased, color: '#6366f1' },
  ];
  const totalPop = zone.population || 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="border relative w-full max-w-md mx-4"
        style={{ background: 'var(--t-bg)', borderColor: 'var(--t-border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--t-border)' }}>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--t-text)' }}>{zone.name}</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--t-muted)' }}>
              Zone {zone.id} · Row {zone.row} · Col {zone.col}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 border" style={{
              borderColor: lockdownColors[zone.lockdownLevel],
              color: lockdownColors[zone.lockdownLevel],
              background: `${lockdownColors[zone.lockdownLevel]}10`
            }}>
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.1em]">
                {zone.lockdownLevel > 0 ? '🔒' : '🔓'} {lockdownLabels[zone.lockdownLevel]}
              </span>
            </div>
            <button onClick={onClose} className="p-1 transition-colors" style={{ color: 'var(--t-muted)' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 gap-px border-b" style={{ borderColor: 'var(--t-border)', background: 'var(--t-border)' }}>
          {[
            { icon: Users, label: 'Population', value: zone.population.toLocaleString(), color: 'var(--t-text)' },
            { icon: AlertTriangle, label: 'Infected', value: zone.infected.toLocaleString(), color: '#ef4444', sub: `${infRate.toFixed(1)}% rate` },
            { icon: Heart, label: 'Recovered', value: zone.recovered.toLocaleString(), color: '#10b981' },
            { icon: Shield, label: 'Deceased', value: zone.deceased.toLocaleString(), color: '#6366f1' },
          ].map(({ icon: Icon, label, value, color, sub }) => (
            <div key={label} className="px-4 py-3" style={{ background: 'var(--t-bg)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={10} style={{ color: 'var(--t-muted)' }} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--t-muted)' }}>{label}</span>
              </div>
              <div className="text-lg font-black font-mono" style={{ color }}>{value}</div>
              {sub && <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--t-muted)' }}>{sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Population Breakdown Bar ── */}
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--t-border)' }}>
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--t-muted)' }}>
            Population Breakdown
          </div>
          <div className="flex h-3 overflow-hidden" style={{ background: 'var(--t-input)' }}>
            {popSegments.map(seg => (
              seg.value > 0 && (
                <div
                  key={seg.label}
                  style={{
                    width: `${(seg.value / totalPop) * 100}%`,
                    backgroundColor: seg.color,
                    transition: 'width 0.5s ease'
                  }}
                />
              )
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            {popSegments.map(seg => (
              <div key={seg.label} className="flex items-center gap-1">
                <div className="w-2 h-2" style={{ backgroundColor: seg.color }} />
                <span className="text-[8px] font-mono" style={{ color: 'var(--t-muted)' }}>
                  {seg.label} ({((seg.value / totalPop) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hospital & Economy ── */}
        <div className="grid grid-cols-2 gap-px border-b" style={{ borderColor: 'var(--t-border)', background: 'var(--t-border)' }}>
          {/* Hospital Gauge */}
          <div className="px-4 py-3" style={{ background: 'var(--t-bg)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <Building size={10} style={{ color: 'var(--t-muted)' }} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--t-muted)' }}>Hospital</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-black font-mono" style={{ color: isHospOverloaded ? '#ef4444' : '#10b981' }}>
                {zone.hospitalOccupancy}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>/ {zone.hospitalCapacity}</span>
            </div>
            <div className="mt-2 h-1.5" style={{ background: 'var(--t-input)' }}>
              <div className="h-full transition-all duration-500" style={{
                width: `${Math.min(hospPct, 100)}%`,
                backgroundColor: hospPct > 90 ? '#ef4444' : hospPct > 60 ? '#f59e0b' : '#10b981'
              }} />
            </div>
            <div className="text-[9px] font-mono mt-1" style={{ color: isHospOverloaded ? '#ef4444' : 'var(--t-muted)' }}>
              {isHospOverloaded ? `⚠️ OVERLOADED ${Math.round(hospPct)}%` : `${Math.round(hospPct)}% capacity`}
            </div>
          </div>

          {/* Economy + Vaccination */}
          <div className="px-4 py-3" style={{ background: 'var(--t-bg)' }}>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={10} style={{ color: 'var(--t-muted)' }} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--t-muted)' }}>Economy</span>
            </div>
            <div className="text-base font-black font-mono" style={{ color: 'var(--t-text)' }}>{zone.economicValue}</div>
            <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--t-muted)' }}>economic value units</div>

            <div className="flex items-center gap-1.5 mt-3 mb-1">
              <Syringe size={10} style={{ color: 'var(--t-muted)' }} />
              <span className="text-[9px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--t-muted)' }}>Vaccination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5" style={{ background: 'var(--t-input)' }}>
                <div className="h-full transition-all duration-500" style={{
                  width: `${zone.vaccinationRate * 100}%`,
                  backgroundColor: '#8b5cf6'
                }} />
              </div>
              <span className="text-[10px] font-mono font-bold" style={{ color: '#8b5cf6' }}>
                {(zone.vaccinationRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="px-5 py-3">
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] mb-2" style={{ color: 'var(--t-muted)' }}>
            Quick Actions
          </div>
          <div className="grid grid-cols-3 gap-2">
            {zone.lockdownLevel < 2 ? (
              <button
                onClick={() => onAction?.({ action: 'lockdown', targetZones: [zone.id], level: 2, summary: `Full lockdown: ${zone.name}` })}
                className="flex flex-col items-center gap-1 px-2 py-2 border transition-all hover:border-red-500/50"
                style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}
              >
                <Lock size={12} className="text-red-400" />
                <span className="text-[8px] font-mono font-bold uppercase" style={{ color: '#ef4444' }}>Lockdown</span>
              </button>
            ) : (
              <button
                onClick={() => onAction?.({ action: 'lift_lockdown', targetZones: [zone.id], summary: `Lockdown lifted: ${zone.name}` })}
                className="flex flex-col items-center gap-1 px-2 py-2 border transition-all hover:border-green-500/50"
                style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}
              >
                <Unlock size={12} className="text-green-400" />
                <span className="text-[8px] font-mono font-bold uppercase" style={{ color: '#10b981' }}>Unlock</span>
              </button>
            )}
            <button
              onClick={() => onAction?.({ action: 'vaccinate', targetZones: [zone.id], summary: `Vaccination: ${zone.name}` })}
              className="flex flex-col items-center gap-1 px-2 py-2 border transition-all hover:border-violet-500/50"
              style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}
            >
              <Syringe size={12} className="text-violet-400" />
              <span className="text-[8px] font-mono font-bold uppercase" style={{ color: '#8b5cf6' }}>Vaccinate</span>
            </button>
            <button
              onClick={() => onAction?.({ action: 'expand_hospital', targetZones: [zone.id], summary: `Hospital expanded: ${zone.name}` })}
              className="flex flex-col items-center gap-1 px-2 py-2 border transition-all hover:border-blue-500/50"
              style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}
            >
              <Building size={12} className="text-blue-400" />
              <span className="text-[8px] font-mono font-bold uppercase" style={{ color: '#3b82f6' }}>Expand</span>
            </button>
          </div>
        </div>

        {/* ── Military Status ── */}
        {zone.militaryDeployed && (
          <div className="px-5 py-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--t-border)' }}>
            <Shield size={10} className="text-blue-400" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.1em]" style={{ color: '#3b82f6' }}>
              Military Deployed
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
