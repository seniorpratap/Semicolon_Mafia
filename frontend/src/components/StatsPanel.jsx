import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAnimatedNumber } from '../hooks/useEffects';
import { motion } from 'framer-motion';

/**
 * StatsPanel — Premium live dashboard with animated metrics and charts
 */
export default function StatsPanel({ history, currentStats }) {
  if (!currentStats) return null;

  return (
    <div className="glass rounded-2xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm">📊</span>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live Intelligence</h3>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon="🦠" label="Active Cases" value={currentStats.totalInfected} color="#ef4444" />
        <MetricCard icon="💀" label="Casualties" value={currentStats.totalDeceased} color="#64748b" />
        <MetricCard icon="💚" label="Recovered" value={currentStats.totalRecovered} color="#10b981" />
        <MetricCard icon="🏥" label="Hospital Load" value={`${Math.round(currentStats.hospitalLoad / currentStats.hospitalCapacity * 100)}%`} color={currentStats.hospitalLoad > currentStats.hospitalCapacity ? '#ef4444' : '#10b981'} isPercent />
      </div>

      {/* Gauges Row */}
      <div className="grid grid-cols-2 gap-2">
        <GaugeCard label="Economy" value={currentStats.economyIndex} icon="📈" color="#f59e0b" />
        <GaugeCard label="Morale" value={currentStats.publicMorale} icon="👥" color="#8b5cf6" />
      </div>

      {/* Infection Curve */}
      {history.length > 2 && (
        <div className="bg-surface/40 rounded-xl p-3 border border-white/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Infection Curve</span>
            <span className="text-[9px] text-slate-600 font-mono">Day {currentStats.day}</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={history.slice(-40)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="gInf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="url(#gInf)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gRec)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1.5 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-[2px] bg-red-500 rounded-full" />
              <span className="text-[8px] text-slate-600">Infected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-[2px] bg-emerald-500 rounded-full" />
              <span className="text-[8px] text-slate-600">Recovered</span>
            </div>
          </div>
        </div>
      )}

      {/* Economy + Morale Trend */}
      {history.length > 2 && (
        <div className="bg-surface/40 rounded-xl p-3 border border-white/[0.03]">
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Stability Index</span>
          <ResponsiveContainer width="100%" height={65} className="mt-2">
            <LineChart data={history.slice(-40)} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="economy" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              <Line type="monotone" dataKey="morale" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-1 justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-[2px] bg-amber-500 rounded-full" style={{ borderBottom: '1px dashed' }} />
              <span className="text-[8px] text-slate-600">Economy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-[2px] bg-purple-500 rounded-full" />
              <span className="text-[8px] text-slate-600">Morale</span>
            </div>
          </div>
        </div>
      )}

      {/* Active zones info */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
        <span>Zones affected: <span className="text-red-400 font-medium">{currentStats.activeZones}/36</span></span>
        <span>Under lockdown: <span className="text-yellow-400 font-medium">{currentStats.lockdownZones}</span></span>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color, isPercent }) {
  const animatedValue = useAnimatedNumber(typeof value === 'number' ? value : 0);
  const displayValue = isPercent ? value : animatedValue.toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface/50 rounded-xl p-2.5 border border-white/[0.03]"
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px]">{icon}</span>
        <span className="text-[9px] text-slate-600 uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-base font-bold font-mono animate-count-up" style={{ color }}>
        {displayValue}
      </span>
    </motion.div>
  );
}

function GaugeCard({ label, value, icon, color }) {
  const animVal = useAnimatedNumber(Math.round(value));
  const width = `${Math.max(0, Math.min(100, value))}%`;

  return (
    <div className="bg-surface/50 rounded-xl p-2.5 border border-white/[0.03]">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px]">{icon}</span>
          <span className="text-[9px] text-slate-600 uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-[11px] font-bold font-mono" style={{ color }}>{animVal}</span>
      </div>
      <div className="h-1 bg-surface-lighter rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, width }}
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-light/95 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-slate-400 mb-1">Day {label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[10px] font-mono" style={{ color: p.color }}>
          {p.dataKey}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
}
