import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, GitBranch, AlertTriangle, Shield, Radio } from 'lucide-react';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import StatsPanel from './components/StatsPanel';
import ControlPanel from './components/ControlPanel';
import DecisionLog from './components/DecisionLog';

import { createSimState, advanceDay, applyDecision, getStats } from './engine/simulation';
import { runAgentDebate, parseDecisionAction } from './engine/agents';

import './index.css';

const TABS = [
  { id: 'sim', label: 'Dashboard', icon: Activity },
  { id: 'decisions', label: 'Decision Log', icon: GitBranch },
];

export default function App() {
  const [simState, setSimState] = useState(() => createSimState());
  const [history, setHistory] = useState([]);
  const [agentMessages, setAgentMessages] = useState({});
  const [isDebating, setIsDebating] = useState(false);
  const [debates, setDebates] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTab, setActiveTab] = useState('sim');
  const [latestAdvisory, setLatestAdvisory] = useState('');
  const [crisisAlert, setCrisisAlert] = useState(null);
  const intervalRef = useRef(null);

  const currentStats = getStats(simState);

  // Record history
  useEffect(() => {
    if (simState.day > 0) {
      const stats = getStats(simState);
      setHistory(prev => [...prev, {
        day: simState.day,
        infected: stats.totalInfected,
        recovered: stats.totalRecovered,
        deceased: stats.totalDeceased,
        economy: stats.economyIndex,
        morale: stats.publicMorale,
      }]);
    }
  }, [simState.day]);

  // Auto-advance
  const tickSimulation = useCallback(() => {
    setSimState(prev => advanceDay(prev));
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && !isDebating) {
      intervalRef.current = setInterval(tickSimulation, 800);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isDebating, tickSimulation]);

  // Trigger debate
  const triggerDebate = useCallback(async (advisory = '') => {
    setIsDebating(true);
    setIsPaused(true);
    setAgentMessages({});
    if (advisory) setLatestAdvisory(advisory);

    const stats = getStats(simState);
    const recentDecisions = debates.slice(-3).map(d => ({
      day: d.day,
      summary: d.coordinator?.substring(0, 100) || 'Decision pending',
    }));

    const debate = await runAgentDebate(
      stats, simState.zones, simState.day, recentDecisions,
      advisory || latestAdvisory,
      (agentId, message) => {
        setAgentMessages(prev => ({ ...prev, [agentId]: message }));
      }
    );

    const actions = parseDecisionAction(debate.coordinator);
    let newState = simState;
    actions.forEach(action => {
      newState = applyDecision(newState, action);
    });
    setSimState(newState);
    setDebates(prev => [...prev, debate]);
    setIsDebating(false);
    setLatestAdvisory('');
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
    setSimState(createSimState());
    setHistory([]); setAgentMessages({}); setDebates([]);
    setIsRunning(false); setIsPaused(false); setIsDebating(false);
    setSelectedZone(null); setLatestAdvisory('');
  };

  // Auto-debate every 10 days
  useEffect(() => {
    if (simState.day > 0 && simState.day % 10 === 0 && isRunning && !isDebating) {
      triggerDebate();
    }
  }, [simState.day]);

  const threatLevel = currentStats.totalInfected > 5000 ? 'CRITICAL'
    : currentStats.totalInfected > 2000 ? 'SEVERE'
    : currentStats.totalInfected > 500 ? 'HIGH'
    : currentStats.totalInfected > 100 ? 'ELEVATED'
    : 'LOW';

  const threatColor = {
    CRITICAL: 'text-red-500', SEVERE: 'text-red-400',
    HIGH: 'text-orange-400', ELEVATED: 'text-amber-400', LOW: 'text-emerald-400',
  }[threatLevel];

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* ═══ HEADER BAR ═══ */}
      <header className="flex-shrink-0 glass-strong border-b border-white/[0.04] px-5 py-2.5 flex items-center justify-between relative z-50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Brain size={18} className="text-white" />
            </div>
            {isRunning && !isPaused && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-surface animate-pulse" />
            )}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              <span className="gradient-text">SimulCrisis</span>
            </h1>
            <p className="text-[9px] text-slate-600 tracking-wider uppercase">Multi-Agent Crisis Intelligence</p>
          </div>
        </div>

        {/* Center: Threat Level + Tabs */}
        <div className="flex items-center gap-6">
          {/* Threat Level Badge */}
          <motion.div
            key={threatLevel}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
              threatLevel === 'CRITICAL' || threatLevel === 'SEVERE'
                ? 'bg-red-500/10 border-red-500/20' : 'bg-surface-lighter/50 border-white/[0.06]'
            }`}
          >
            <AlertTriangle size={11} className={threatColor} />
            <span className={`text-[10px] font-bold tracking-wider ${threatColor}`}>
              THREAT: {threatLevel}
            </span>
          </motion.div>

          {/* Tabs */}
          <nav className="flex gap-0.5 glass-subtle rounded-full p-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right: Status */}
        <div className="flex items-center gap-4">
          {isDebating && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/15"
            >
              <Shield size={11} className="text-purple-400" />
              <span className="text-[10px] text-purple-300 font-medium">Council Active</span>
            </motion.div>
          )}
          {isRunning && !isPaused && (
            <div className="flex items-center gap-1.5">
              <Radio size={11} className="text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 tracking-wider">LIVE</span>
            </div>
          )}
          <div className="text-right">
            <div className="text-[9px] text-slate-600 uppercase tracking-wider">Day</div>
            <div className="text-sm font-bold font-mono text-white">{simState.day}</div>
          </div>
        </div>
      </header>

      {/* ═══ CRISIS ALERT BANNER ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-500/10 border-b border-red-500/20 px-5 py-2 flex items-center justify-center gap-2 overflow-hidden"
          >
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-xs font-semibold text-red-300 tracking-wide">
              CRISIS INJECTED: {crisisAlert}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 min-h-0 relative bg-grid">
        {activeTab === 'sim' && (
          <div className="h-full grid grid-cols-12 gap-3 p-3">
            {/* LEFT: Map + Controls */}
            <div className="col-span-3 flex flex-col gap-3 overflow-y-auto scrollbar-thin">
              <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone} />
              <ControlPanel
                isRunning={isRunning} isPaused={isPaused} day={simState.day}
                onPlay={handlePlay} onPause={handlePause} onAdvance={handleAdvance}
                onInjectCrisis={handleCrisis} onUserAdvisory={handleAdvisory}
                onReset={handleReset} isDebating={isDebating}
              />
            </div>

            {/* CENTER: Agent Council */}
            <div className="col-span-6 overflow-hidden">
              <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory} />
            </div>

            {/* RIGHT: Intelligence */}
            <div className="col-span-3 overflow-y-auto scrollbar-thin">
              <StatsPanel history={history} currentStats={currentStats} />
            </div>
          </div>
        )}

        {activeTab === 'decisions' && (
          <div className="h-full p-3 overflow-y-auto">
            <div className="max-w-5xl mx-auto">
              <DecisionLog debates={debates} />
            </div>
          </div>
        )}
      </div>

      {/* ═══ FOOTER STATUS BAR ═══ */}
      <footer className="flex-shrink-0 border-t border-white/[0.04] px-5 py-1.5 flex items-center justify-between bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 text-[9px] text-slate-600">
          <span>SIR Model v2.0</span>
          <span>•</span>
          <span>Grid: 6×6 ({simState.zones.length} zones)</span>
          <span>•</span>
          <span>Pop: {currentStats.totalSusceptible?.toLocaleString() || '—'}</span>
        </div>
        <div className="flex items-center gap-4 text-[9px] text-slate-600">
          <span>Agents: 4 active</span>
          <span>•</span>
          <span>Decisions: {debates.length}</span>
          <span>•</span>
          <span className="text-primary-light font-medium">TechFusion 2.0 — Intelligent Systems</span>
        </div>
      </footer>
    </div>
  );
}
