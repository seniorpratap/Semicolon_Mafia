import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, GitBranch, AlertTriangle, Leaf, Radio, Shield, Zap, Heart, Users, TrendingUp } from 'lucide-react';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import StatsPanel from './components/StatsPanel';
import ControlPanel from './components/ControlPanel';
import DecisionLog from './components/DecisionLog';

import { createSimState, advanceDay, applyDecision, getStats } from './engine/simulation';
import { runAgentDebate, parseDecisionAction } from './engine/agents';

import './index.css';

export default function App() {
  const [simState, setSimState] = useState(() => createSimState());
  const [history, setHistory] = useState([]);
  const [agentMessages, setAgentMessages] = useState([]);
  const [isDebating, setIsDebating] = useState(false);
  const [debates, setDebates] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [latestAdvisory, setLatestAdvisory] = useState('');
  const [crisisAlert, setCrisisAlert] = useState(null);
  const intervalRef = useRef(null);

  const currentStats = getStats(simState);

  useEffect(() => {
    if (simState.day > 0) {
      const stats = getStats(simState);
      setHistory(prev => [...prev, {
        day: simState.day, infected: stats.totalInfected,
        recovered: stats.totalRecovered, deceased: stats.totalDeceased,
        economy: stats.economyIndex, morale: stats.publicMorale,
      }]);
    }
  }, [simState.day]);

  const tickSimulation = useCallback(() => { setSimState(prev => advanceDay(prev)); }, []);

  useEffect(() => {
    if (isRunning && !isPaused && !isDebating) {
      intervalRef.current = setInterval(tickSimulation, 1000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isDebating, tickSimulation]);

  const triggerDebate = useCallback(async (advisory = '') => {
    setIsDebating(true); setIsPaused(true); setAgentMessages([]);
    if (advisory) setLatestAdvisory(advisory);
    const stats = getStats(simState);
    const recentDecisions = debates.slice(-3).map(d => ({ day: d.day, summary: d.coordinator?.substring(0, 100) || '' }));
    const messages = [];
    const debate = await runAgentDebate(stats, simState.zones, simState.day, recentDecisions, advisory || latestAdvisory,
      (agentId, text) => { messages.push({ agentId, text }); setAgentMessages([...messages]); }
    );
    const actions = parseDecisionAction(debate.coordinator);
    let newState = simState;
    actions.forEach(a => { newState = applyDecision(newState, a); });
    setSimState(newState); setDebates(prev => [...prev, debate]);
    setIsDebating(false); setLatestAdvisory('');
  }, [simState, debates, latestAdvisory]);

  const handleAdvance = useCallback(async () => {
    let state = simState;
    for (let i = 0; i < 5; i++) state = advanceDay(state);
    setSimState(state);
    setTimeout(() => triggerDebate(), 300);
  }, [simState, triggerDebate]);

  const handlePlay = () => { setIsRunning(true); setIsPaused(false); if (simState.day === 0) tickSimulation(); };
  const handlePause = () => setIsPaused(true);
  const handleCrisis = (event) => {
    setSimState(prev => event.apply(prev));
    setCrisisAlert(event.name);
    setTimeout(() => setCrisisAlert(null), 4000);
    setTimeout(() => triggerDebate(), 500);
  };
  const handleAdvisory = (text) => { setIsPaused(true); triggerDebate(text); };
  const handleReset = () => {
    clearInterval(intervalRef.current);
    setSimState(createSimState()); setHistory([]); setAgentMessages([]); setDebates([]);
    setIsRunning(false); setIsPaused(false); setIsDebating(false);
    setSelectedZone(null); setLatestAdvisory('');
  };

  useEffect(() => {
    if (simState.day > 0 && simState.day % 10 === 0 && isRunning && !isDebating) triggerDebate();
  }, [simState.day]);

  const threatLevel = currentStats.totalInfected > 5000 ? 'Critical'
    : currentStats.totalInfected > 2000 ? 'Severe'
    : currentStats.totalInfected > 500 ? 'High'
    : currentStats.totalInfected > 100 ? 'Elevated' : 'Stable';

  const threatStyle = {
    Critical: 'bg-red-100 text-red-700 border-red-200',
    Severe: 'bg-orange-100 text-orange-700 border-orange-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Elevated: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Stable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }[threatLevel];

  return (
    <div className="flex flex-col h-screen bg-surface overflow-hidden">

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="flex-shrink-0 bg-white border-b border-slate-100 shadow-sm z-50">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <Leaf size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">SimulCrisis</h1>
              <p className="text-[10px] text-slate-400">Multi-Agent Crisis Decision Engine</p>
            </div>
          </div>

          {/* Center: View toggles */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
            {[
              { id: 'dashboard', label: 'Command Center', icon: Activity },
              { id: 'decisions', label: 'Decision Log', icon: GitBranch },
            ].map(v => (
              <button key={v.id} onClick={() => setActiveView(v.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all
                  ${activeView === v.id ? 'bg-white text-emerald-700 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
                <v.icon size={14} />{v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${threatStyle}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${threatLevel === 'Stable' ? 'bg-emerald-500' : 'bg-current animate-pulse'}`} />
              {threatLevel}
            </div>
            {isDebating && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-600 text-xs font-semibold">
                <Shield size={12} /> Deliberating
              </motion.div>
            )}
            {isRunning && !isPaused && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <Radio size={12} className="animate-pulse" /> Live
              </div>
            )}
            <div className="pl-4 border-l border-slate-100">
              <div className="text-[10px] text-slate-400">Day</div>
              <div className="text-xl font-bold font-mono text-slate-900 leading-none">{simState.day}</div>
            </div>
          </div>
        </div>

        {/* ── Metric Ticker Bar ── */}
        <div className="h-12 flex items-center gap-6 px-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-t border-emerald-100/50">
          <TickerStat icon={<Zap size={13} className="text-red-500"/>} label="Active Cases" value={currentStats.totalInfected.toLocaleString()} valueColor="text-red-600" />
          <div className="w-px h-6 bg-emerald-200/50" />
          <TickerStat icon={<Heart size={13} className="text-emerald-500"/>} label="Recovered" value={currentStats.totalRecovered.toLocaleString()} valueColor="text-emerald-600" />
          <div className="w-px h-6 bg-emerald-200/50" />
          <TickerStat icon={<Users size={13} className="text-blue-500"/>} label="Population" value={currentStats.totalSusceptible.toLocaleString()} valueColor="text-blue-600" />
          <div className="w-px h-6 bg-emerald-200/50" />
          <TickerStat icon={<TrendingUp size={13} className="text-amber-500"/>} label="Economy" value={`${Math.round(currentStats.economyIndex)}%`} valueColor="text-amber-600" />
          <div className="w-px h-6 bg-emerald-200/50" />
          <TickerStat icon={<Shield size={13} className="text-violet-500"/>} label="Morale" value={`${Math.round(currentStats.publicMorale)}%`} valueColor="text-violet-600" />
          <div className="flex-1" />
          <div className="flex items-center gap-3 text-[10px] text-emerald-600 font-medium">
            <span>Zones: <strong className="text-red-500">{currentStats.activeZones}</strong>/36 affected</span>
            <span>·</span>
            <span>Lockdown: <strong className="text-amber-500">{currentStats.lockdownZones}</strong></span>
            <span>·</span>
            <span>Decisions: <strong>{debates.length}</strong></span>
          </div>
        </div>
      </header>

      {/* ═══════════════ CRISIS TOAST ═══════════════ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-white rounded-xl shadow-xl border border-red-200 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <div>
              <div className="text-[10px] text-red-500 font-semibold uppercase tracking-wider">Crisis Injected</div>
              <div className="text-sm font-bold text-slate-900">{crisisAlert}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      {activeView === 'dashboard' ? (
        <main className="flex-1 min-h-0 flex">
          {/* ── Left Sidebar: Controls ── */}
          <motion.aside
            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            className="w-64 flex-shrink-0 border-r border-slate-100 bg-white p-4 overflow-y-auto scroll-thin"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Activity size={12} className="text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Operations</span>
            </div>
            <ControlPanel
              isRunning={isRunning} isPaused={isPaused} day={simState.day}
              onPlay={handlePlay} onPause={handlePause} onAdvance={handleAdvance}
              onInjectCrisis={handleCrisis} onUserAdvisory={handleAdvisory}
              onReset={handleReset} isDebating={isDebating}
            />
          </motion.aside>

          {/* ── Center: Grid (Hero) + Charts ── */}
          <div className="flex-1 min-h-0 flex flex-col overflow-y-auto scroll-thin">
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="p-5 flex-shrink-0"
            >
              <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone} />
            </motion.div>

            {/* Charts below grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="px-5 pb-5"
            >
              <StatsPanel history={history} currentStats={currentStats} />
            </motion.div>
          </div>

          {/* ── Right: Agent Council Chat ── */}
          <motion.aside
            initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}
            className="w-[420px] flex-shrink-0 flex flex-col min-h-0 border-l border-slate-100"
          >
            <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory} />
          </motion.aside>
        </main>
      ) : (
        <main className="flex-1 min-h-0 overflow-y-auto scroll-thin p-6">
          <DecisionLog debates={debates} />
        </main>
      )}
    </div>
  );
}

function TickerStat({ icon, label, value, valueColor }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wider leading-none">{label}</div>
        <div className={`text-sm font-bold font-mono leading-none mt-0.5 ${valueColor}`}>{value}</div>
      </div>
    </div>
  );
}
