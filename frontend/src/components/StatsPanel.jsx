import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAnimatedNumber } from '../hooks/useEffects';
import { motion } from 'framer-motion';
import { BarChart3, Heart, TrendingUp, Users, Zap } from 'lucide-react';

export default function StatsPanel({ history, currentStats }) {
  if (!currentStats) return null;

  return (
    <div className="card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
          <BarChart3 size={14} className="text-emerald-600" />
        </div>
        <span className="text-sm font-bold text-slate-800">Live Intelligence</span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={<Zap size={14}/>} label="Active Cases" value={currentStats.totalInfected} color="text-red-600" bgColor="bg-red-50" />
        <MetricCard icon={<Heart size={14}/>} label="Recovered" value={currentStats.totalRecovered} color="text-emerald-600" bgColor="bg-emerald-50" />
        <MetricCard icon={<Users size={14}/>} label="Population" value={currentStats.totalSusceptible} color="text-blue-600" bgColor="bg-blue-50" />
        <MetricCard icon={<TrendingUp size={14}/>} label="Hospital" value={`${Math.round(currentStats.hospitalLoad / currentStats.hospitalCapacity * 100)}%`} 
          color={currentStats.hospitalLoad > currentStats.hospitalCapacity ? 'text-red-600' : 'text-emerald-600'} 
          bgColor={currentStats.hospitalLoad > currentStats.hospitalCapacity ? 'bg-red-50' : 'bg-emerald-50'} isString />
      </div>

      {/* Gauges */}
      <div className="space-y-3">
        <GaugeBar label="Economy" value={currentStats.economyIndex} color="#059669" />
        <GaugeBar label="Public Morale" value={currentStats.publicMorale} color="#0d9488" />
      </div>

      {/* Chart */}
      {history.length > 2 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2">
            <span className="label-sm">Infection Trend</span>
            <span className="text-[10px] text-slate-400 font-mono">Day {currentStats.day}</span>
          </div>
          <div className="h-28 bg-slate-50 rounded-xl p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history.slice(-50)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gInf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="url(#gInf)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gRec)" strokeWidth={2} dot={false} />
                <Tooltip content={<ChartTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-red-400" />
              <span className="text-[9px] text-slate-400">Infected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 rounded bg-emerald-400" />
              <span className="text-[9px] text-slate-400">Recovered</span>
            </div>
          </div>
        </div>
      )}

      {/* Zones */}
      <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
        <span>Affected: <span className="font-bold text-red-500">{currentStats.activeZones}/36</span></span>
        <span>Lockdown: <span className="font-bold text-amber-500">{currentStats.lockdownZones}</span></span>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, color, bgColor, isString }) {
  const animVal = useAnimatedNumber(typeof value === 'number' ? value : 0);
  return (
    <div className={`${bgColor} rounded-xl p-3 border border-white/60`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`${color} opacity-60`}>{icon}</span>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${color}`}>
        {isString ? value : animVal.toLocaleString()}
      </div>
    </div>
  );
}

function GaugeBar({ label, value, color }) {
  const w = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="text-xs font-bold font-mono" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }} animate={{ width: w }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          transition={{ duration: 0.8 }}
        />
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg text-xs">
      {payload.map((p, i) => (
        <div key={i} className="font-mono font-bold" style={{ color: p.color }}>
          {p.dataKey}: {p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  );
}
