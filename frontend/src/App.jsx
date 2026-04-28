import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, GitBranch, ClipboardList, Moon, Sun } from 'lucide-react';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import StatsPanel from './components/StatsPanel';
import ControlPanel from './components/ControlPanel';
import DecisionLog from './components/DecisionLog';
import AfterActionReport from './components/AfterActionReport';

import { createSimState, advanceDay, applyDecision, getStats } from './engine/simulation';
import { runAgentDebate, parseDecisionAction } from './engine/agents';

import './index.css';

// ─── Tabs ────────────────────────────────────────────────
const TABS = [
  { id: 'sim', label: 'Simulation', icon: Activity },
  { id: 'decisions', label: 'Decision Log', icon: GitBranch },
  { id: 'report', label: 'After-Action', icon: ClipboardList },
];

export default function App() {
  // ── State ──
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
  const [agentMemory, setAgentMemory] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem('simulcrisis-theme') || 'dark');
  const [tickMs, setTickMs] = useState(() => {
    const saved = Number(localStorage.getItem('simulcrisis-tick-ms'));
    return Number.isFinite(saved) && saved > 0 ? saved : 800;
  });
  const intervalRef = useRef(null);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('simulcrisis-theme', theme);
  }, [theme]);
  useEffect(() => {
    localStorage.setItem('simulcrisis-tick-ms', String(tickMs));
  }, [tickMs]);


  const currentStats = getStats(simState);

  // ── Record history each day ──
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

  // ── Auto-advance simulation ──
  const tickSimulation = useCallback(() => {
    setSimState(prev => advanceDay(prev));
  }, []);

  useEffect(() => {
    if (isRunning && !isPaused && !isDebating) {
      intervalRef.current = setInterval(tickSimulation, tickMs);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isDebating, tickSimulation, tickMs]);

  // ── Trigger agent debate ──
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
      stats,
      simState.zones,
      simState.day,
      recentDecisions,
      advisory || latestAdvisory,
      (agentId, message) => {
        setAgentMessages(prev => ({ ...prev, [agentId]: message }));
      },
      agentMemory,
    );

    // Parse and apply coordinator's decision
    const actions = parseDecisionAction(debate.coordinator);
    let newState = simState;
    actions.forEach(action => {
      newState = applyDecision(newState, action);
    });
    setSimState(newState);

    setDebates(prev => [...prev, debate]);
    if (debate.updatedMemory) {
      setAgentMemory(debate.updatedMemory);
    }
    setIsDebating(false);
    setLatestAdvisory('');
  }, [simState, debates, latestAdvisory, agentMemory]);

  // ── Advance 5 days + trigger debate ──
  const handleAdvance = useCallback(async () => {
    let state = simState;
    for (let i = 0; i < 5; i++) {
      state = advanceDay(state);
    }
    setSimState(state);
    // Small delay so UI updates before debate starts
    setTimeout(() => triggerDebate(), 300);
  }, [simState, triggerDebate]);

  // ── Play / Pause ──
  const handlePlay = () => {
    setIsRunning(true);
    setIsPaused(false);
    if (simState.day === 0) tickSimulation();
  };

  const handlePause = () => setIsPaused(true);

  // ── Inject crisis ──
  const handleCrisis = (event) => {
    setSimState(prev => event.apply(prev));
    // Auto-trigger debate after crisis
    setTimeout(() => triggerDebate(), 500);
  };

  // ── User advisory ──
  const handleAdvisory = (text) => {
    setIsPaused(true);
    triggerDebate(text);
  };

  // ── Reset ──
  const handleReset = () => {
    clearInterval(intervalRef.current);
    setSimState(createSimState());
    setHistory([]);
    setAgentMessages({});
    setDebates([]);
    setIsRunning(false);
    setIsPaused(false);
    setIsDebating(false);
    setSelectedZone(null);
    setLatestAdvisory('');
    setAgentMemory({});
  };

  const report = useMemo(() => {
    if (!history.length) return null;

    const peakInfected = history.reduce((max, row) => Math.max(max, row.infected), 0);
    const final = history[history.length - 1];
    const hospitalUtilization = Math.round((currentStats.hospitalLoad / currentStats.hospitalCapacity) * 100);
    const coordinatorDecisions = debates.map(d => d.coordinator?.toLowerCase() || '');
    const lockdownLean = coordinatorDecisions.filter(text => text.includes('lockdown')).length;
    const healthEmergencyLean = coordinatorDecisions.filter(text => text.includes('hospital') || text.includes('capacity')).length;

    const successes = [];
    if (final.infected < peakInfected * 0.7) successes.push('Infection curve cooled down after interventions.');
    if (final.deceased < peakInfected * 0.15) successes.push('Fatality growth remained relatively controlled.');
    if (final.economy > 70) successes.push('Economic index stayed above high-risk collapse territory.');
    if (currentStats.lockdownZones <= 10) successes.push('Restrictions remained targeted rather than city-wide.');
    if (successes.length === 0) successes.push('Council kept the system operational under sustained pressure.');

    const risks = [];
    if (hospitalUtilization > 90) risks.push('Hospitals are close to saturation; surge capacity remains a risk.');
    if (final.economy < 60) risks.push('Economic resilience is weak and may destabilize compliance.');
    if (final.morale < 60) risks.push('Low public morale can reduce policy compliance.');
    if (currentStats.totalInfected > 15000) risks.push('Community transmission remains widespread.');
    if (risks.length === 0) risks.push('No critical system-level red flags at this point in the run.');

    let patternSummary = 'Coordinator balanced inputs across health, economy, and safety.';
    if (lockdownLean >= Math.ceil(Math.max(1, debates.length) * 0.6)) {
      patternSummary = 'Coordinator repeatedly favored containment-heavy decisions, prioritizing outbreak suppression.';
    } else if (healthEmergencyLean >= Math.ceil(Math.max(1, debates.length) * 0.5)) {
      patternSummary = 'Coordinator emphasized hospital capacity protection in most decisions.';
    }

    return {
      day: currentStats.day,
      totalDebates: debates.length,
      peakInfected,
      finalInfected: currentStats.totalInfected,
      totalRecovered: currentStats.totalRecovered,
      totalDeceased: currentStats.totalDeceased,
      finalEconomy: currentStats.economyIndex,
      finalMorale: currentStats.publicMorale,
      hospitalUtilization,
      successes,
      risks,
      patternSummary,
    };
  }, [history, currentStats, debates]);

  // ── Auto-trigger debate every 10 days ──
  useEffect(() => {
    if (simState.day > 0 && simState.day % 10 === 0 && isRunning && !isDebating) {
      triggerDebate();
    }
  }, [simState.day]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-surface">
      {/* Background Orbs */}
      <div className="bg-orb" style={{ width: 500, height: 500, top: '-10%', left: '-8%', background: '#6366f1' }} />
      <div className="bg-orb" style={{ width: 400, height: 400, bottom: '-5%', right: '-5%', background: '#ef4444', animationDelay: '-7s' }} />
      <div className="bg-orb" style={{ width: 300, height: 300, top: '40%', left: '60%', background: '#06b6d4', animationDelay: '-14s' }} />

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-4 h-screen flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 flex-shrink-0"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-purple-600 flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">SimulCrisis</h1>
              <p className="text-[10px] text-slate-500">Multi-Agent Crisis Decision Simulator</p>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 glass rounded-full p-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Live Indicator + Theme */}
          <div className="flex items-center gap-2">
            {isRunning && !isPaused && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            )}
            {isDebating && (
              <span className="text-xs text-purple-400">🧠 Agents deliberating...</span>
            )}
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="btn-ghost px-2.5 py-1.5 text-slate-400 flex items-center gap-1.5"
              aria-label="Toggle light or dark mode"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
              <span className="text-[10px]">{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'sim' && (
            <div className="grid grid-cols-12 gap-3 h-full">
              {/* Left Column: Map + Controls */}
              <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
                <CityGrid
                  zones={simState.zones}
                  onZoneClick={setSelectedZone}
                  selectedZone={selectedZone}
                />
                <ControlPanel
                  isRunning={isRunning}
                  isPaused={isPaused}
                  day={simState.day}
                  tickMs={tickMs}
                  onTickSpeedChange={setTickMs}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onAdvance={handleAdvance}
                  onInjectCrisis={handleCrisis}
                  onReset={handleReset}
                  isDebating={isDebating}
                />
              </div>

              {/* Center Column: Agent Panel */}
              <div className="col-span-6 overflow-hidden">
                <AgentPanel
                  agentMessages={agentMessages}
                  isDebating={isDebating}
                  userAdvisory={latestAdvisory}
                  onUserAdvisory={handleAdvisory}
                />
              </div>

              {/* Right Column: Stats */}
              <div className="col-span-3 overflow-y-auto">
                <StatsPanel
                  history={history}
                  currentStats={currentStats}
                />
              </div>
            </div>
          )}

          {activeTab === 'decisions' && (
            <div className="max-w-4xl mx-auto h-full overflow-y-auto">
              <DecisionLog debates={debates} />
            </div>
          )}

          {activeTab === 'report' && (
            <div className="max-w-4xl mx-auto h-full overflow-y-auto">
              <AfterActionReport report={report} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
