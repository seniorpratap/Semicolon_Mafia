import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, GitBranch } from 'lucide-react';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import StatsPanel from './components/StatsPanel';
import ControlPanel from './components/ControlPanel';
import DecisionLog from './components/DecisionLog';

import { createSimState, advanceDay, applyDecision, getStats } from './engine/simulation';
import { runAgentDebate, parseDecisionAction } from './engine/agents';

import './index.css';

// ─── Tabs ────────────────────────────────────────────────
const TABS = [
  { id: 'sim', label: 'Simulation', icon: Activity },
  { id: 'decisions', label: 'Decision Log', icon: GitBranch },
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
  const intervalRef = useRef(null);

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
      intervalRef.current = setInterval(tickSimulation, 800);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isDebating, tickSimulation]);

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
      }
    );

    // Parse and apply coordinator's decision
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
  };

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

          {/* Live Indicator */}
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
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onAdvance={handleAdvance}
                  onInjectCrisis={handleCrisis}
                  onUserAdvisory={handleAdvisory}
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
        </div>
      </div>
    </div>
  );
}
