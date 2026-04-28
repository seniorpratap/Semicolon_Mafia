import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, GitBranch, AlertTriangle, Zap, Heart, Users, TrendingUp, Shield, Play, Pause, FastForward, RotateCcw, ChevronDown, Send, Brain, Radio, Sun, Moon, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import DecisionLog from './components/DecisionLog';
import ZoneDetail from './components/ZoneDetail';
import ResizeHandle from './components/ResizeHandle';
import CrisisGuidelines from './components/CrisisGuidelines';

import { createSimState, advanceDay, applyDecision, getStats, CRISIS_EVENTS } from './engine/simulation';
import { runAgentDebate, parseDecisionAction } from './engine/agents';
import { isGeminiReady } from './services/gemini';
import { useAnimatedNumber } from './hooks/useEffects';

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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartMode, setChartMode] = useState(0);
  const [latestAdvisory, setLatestAdvisory] = useState('');
  const [crisisAlert, setCrisisAlert] = useState(null);
  const [executedActions, setExecutedActions] = useState([]);
  const [previousMessages, setPreviousMessages] = useState([]);
  const [advisoryText, setAdvisoryText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [actionToast, setActionToast] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [leftW, setLeftW] = useState(380);
  const [rightW, setRightW] = useState(360);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const intervalRef = useRef(null);
  const demoRef = useRef(false);
  const demoAbortRef = useRef(null);
  const debateAbortRef = useRef(null);

  const cs = getStats(simState);

  useEffect(() => {
    if (simState.day > 0) {
      const s = getStats(simState);
      setHistory(p => [...p, { day: simState.day, infected: s.totalInfected, recovered: s.totalRecovered, deceased: s.totalDeceased, susceptible: s.totalSusceptible, economy: s.economyIndex, morale: s.publicMorale, hospLoad: s.hospitalLoad, hospCap: s.hospitalCapacity, hospPct: Math.round(s.hospitalLoad / Math.max(1, s.hospitalCapacity) * 100), activeZones: s.activeZones, lockdownZones: s.lockdownZones }]);
    }
  }, [simState.day]);

  const tick = useCallback(() => setSimState(p => advanceDay(p)), []);

  useEffect(() => {
    if (isRunning && !isPaused && !isDebating) intervalRef.current = setInterval(tick, 1000);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isDebating, tick]);

  const triggerDebate = useCallback(async (adv = '') => {
    // Guard: don't start a parallel debate
    if (debateAbortRef.current) {
      // If advisory given while debating, store it for next time
      if (adv) setLatestAdvisory(adv);
      return;
    }
    // Save current messages as "previous" before clearing
    setIsDebating(true); setIsPaused(true);
    if (agentMessages.length > 0) setPreviousMessages([...agentMessages]);
    setAgentMessages([]); setExecutedActions([]);
    if (adv) setLatestAdvisory(adv);
    const abortController = new AbortController();
    debateAbortRef.current = abortController;
    try {
      const s = getStats(simState);
      const rd = debates.slice(-3).map(d => ({ day: d.day, summary: d.coordinator?.substring(0, 100) || '' }));
      const msgs = [];
      const debate = await runAgentDebate(s, simState.zones, simState.day, rd, adv || latestAdvisory,
        (id, text) => {
          if (abortController.signal.aborted) return;
          const idx = msgs.findIndex(m => m.agentId === id);
          if (idx >= 0) { msgs[idx] = { agentId: id, text }; }
          else { msgs.push({ agentId: id, text }); }
          setAgentMessages([...msgs]);
        }
      );
      if (abortController.signal.aborted) return;
      const actions = parseDecisionAction(debate.coordinator, simState.zones);
      let ns = simState;
      actions.forEach(a => { ns = applyDecision(ns, a); });
      setSimState(ns); setDebates(p => [...p, debate]); setIsDebating(false); setLatestAdvisory('');
      setExecutedActions(actions);
    } catch (err) {
      if (!abortController.signal.aborted) console.error('[Debate]', err);
      setIsDebating(false);
    } finally {
      debateAbortRef.current = null;
    }
  }, [simState, debates, latestAdvisory]);

  const handleAdvance = useCallback(async () => {
    let s = simState; for (let i = 0; i < 5; i++) s = advanceDay(s);
    setSimState(s); setTimeout(() => triggerDebate(), 300);
  }, [simState, triggerDebate]);

  const play = () => { setIsRunning(true); setIsPaused(false); if (simState.day === 0) tick(); };
  const pause = () => setIsPaused(true);
  const crisis = (e) => {
    setSimState(p => e.apply(p));
    setCrisisAlert(e.name);
    setTimeout(() => setCrisisAlert(null), 4000);
    // Only trigger debate if one isn't already running
    if (!debateAbortRef.current) {
      setTimeout(() => triggerDebate(), 500);
    }
  };
  const advisory = (t) => {
    if (isDebating) {
      // Store advisory for display, will be used in next debate
      setLatestAdvisory(t);
      return;
    }
    setIsPaused(true); triggerDebate(t);
  };
  const reset = () => { stopDemo(); clearInterval(intervalRef.current); setSimState(createSimState()); setHistory([]); setAgentMessages([]); setDebates([]); setIsRunning(false); setIsPaused(false); setIsDebating(false); setSelectedZone(null); setLatestAdvisory(''); };

  // ─── Demo Mode ───────────────────────────────────────────
  const sleep = (ms) => new Promise((resolve, reject) => {
    const id = setTimeout(resolve, ms);
    // Store abort function so we can cancel on demo stop
    demoAbortRef.current = () => { clearTimeout(id); reject(new Error('demo_stopped')); };
  });

  const stopDemo = useCallback(() => {
    demoRef.current = false;
    setDemoMode(false);
    setDemoStep('');
    setIsDebating(false);
    setIsPaused(false);
    // Cancel any in-flight debate
    if (debateAbortRef.current) { debateAbortRef.current.abort(); debateAbortRef.current = null; }
    // Cancel any sleep timer
    if (demoAbortRef.current) { demoAbortRef.current(); demoAbortRef.current = null; }
  }, []);

  const startDemo = useCallback(async () => {
    demoRef.current = true;
    setDemoMode(true);

    try {
      // Phase 1: Start simulation
      setDemoStep('Initializing simulation...');
      setIsRunning(true); setIsPaused(false);
      await sleep(2000);
      if (!demoRef.current) return;

      // Phase 2: Let it run for a few days, then advance + debate
      setDemoStep('Advancing 5 days...');
      setSimState(prev => {
        let s = prev;
        for (let i = 0; i < 5; i++) s = advanceDay(s);
        return s;
      });
      await sleep(1500);
      if (!demoRef.current) return;

      // Phase 3: First agent debate
      setDemoStep('Agent council deliberating...');
      setIsDebating(true); setIsPaused(true); setAgentMessages([]);
      const s1 = getStats(simState);
      const debate1 = await runAgentDebate(s1, simState.zones, simState.day, [], '',
        (id, text) => {
          setAgentMessages(prev => {
            const idx = prev.findIndex(m => m.agentId === id);
            const updated = [...prev];
            if (idx >= 0) { updated[idx] = { agentId: id, text }; }
            else { updated.push({ agentId: id, text }); }
            return updated;
          });
        }
      );
      if (!demoRef.current) return;
      const actions1 = parseDecisionAction(debate1.coordinator);
      setSimState(prev => { let ns = prev; actions1.forEach(a => { ns = applyDecision(ns, a); }); return ns; });
      setDebates(p => [...p, debate1]);
      setIsDebating(false);
      setExecutedActions(actions1);
      await sleep(3000);
      if (!demoRef.current) return;

      // Demo loop: crisis → advance → debate
      const crisisQueue = [...CRISIS_EVENTS];
      let cycleCount = 0;

      while (demoRef.current && cycleCount < 5) {
        cycleCount++;

        // Inject crisis
        if (crisisQueue.length > 0) {
          const crisisEvent = crisisQueue.shift();
          setDemoStep(`Crisis: ${crisisEvent.name}`);
          setSimState(prev => crisisEvent.apply(prev));
          setCrisisAlert(crisisEvent.name);
          setTimeout(() => setCrisisAlert(null), 4000);
          await sleep(3000);
          if (!demoRef.current) return;
        }

        // Advance days
        setDemoStep(`Cycle ${cycleCount}: Advancing 5 days...`);
        setSimState(prev => {
          let s = prev;
          for (let i = 0; i < 5; i++) s = advanceDay(s);
          return s;
        });
        await sleep(1500);
        if (!demoRef.current) return;

        // Agent debate
        setDemoStep(`Cycle ${cycleCount}: Council debate...`);
        setIsDebating(true); setIsPaused(true); setAgentMessages([]);

        // Use a ref-stable way to get latest state
        const currentState = await new Promise(resolve => {
          setSimState(prev => { resolve(prev); return prev; });
        });
        const stats = getStats(currentState);
        const rd = debates.slice(-3).map(d => ({ day: d.day, summary: d.coordinator?.substring(0, 100) || '' }));

        const debate = await runAgentDebate(stats, currentState.zones, currentState.day, rd, '',
          (id, text) => {
            setAgentMessages(prev => {
              const idx = prev.findIndex(m => m.agentId === id);
              const updated = [...prev];
              if (idx >= 0) { updated[idx] = { agentId: id, text }; }
              else { updated.push({ agentId: id, text }); }
              return updated;
            });
          }
        );
        if (!demoRef.current) return;

        const actions = parseDecisionAction(debate.coordinator);
        setSimState(prev => { let ns = prev; actions.forEach(a => { ns = applyDecision(ns, a); }); return ns; });
        setDebates(p => [...p, debate]);
        setIsDebating(false);
        setExecutedActions(actions);

        setDemoStep(`Cycle ${cycleCount} complete. Next in 4s...`);
        await sleep(4000);
        if (!demoRef.current) return;
      }

      // Demo finished
      setDemoStep('Demo complete.');
      await sleep(2000);
      stopDemo();

    } catch (err) {
      if (err.message !== 'demo_stopped') console.error('[Demo]', err);
      // demo was stopped by user — clean exit
    }
  }, [simState, debates, stopDemo]);

  const threat = cs.totalInfected > 5000 ? 'CRITICAL' : cs.totalInfected > 2000 ? 'SEVERE' : cs.totalInfected > 500 ? 'HIGH' : cs.totalInfected > 100 ? 'ELEVATED' : 'LOW';
  const threatColor = { CRITICAL: '#ef4444', SEVERE: '#f97316', HIGH: '#f59e0b', ELEVATED: '#eab308', LOW: '#10b981' }[threat];

  const dayStr = String(simState.day).padStart(3, '0');

  const suggestions = ['Quarantine hotspots immediately', 'Prioritize mass testing', 'Focus on economic stability', 'Deploy emergency vaccines', 'Set up field hospitals', 'Implement night curfew'];

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
  }, [darkMode]);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--t-bg)' }}>

      {/* ═══ HEADER ═══ */}
      <header className="h-[52px] flex-shrink-0 flex items-center justify-between px-5 border-b" style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: 'var(--t-border)' }}>
            <Brain size={16} className="text-red-500" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--t-text)' }}>SimulCrisis</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: 'var(--t-muted)' }}>Multi-Agent Crisis Intelligence</div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 border ml-2" style={{ borderColor: isGeminiReady() ? '#10b981' : '#f59e0b', background: isGeminiReady() ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isGeminiReady() ? '#10b981' : '#f59e0b' }} />
            <span className="text-[8px] font-mono font-bold uppercase tracking-[0.1em]" style={{ color: isGeminiReady() ? '#10b981' : '#f59e0b' }}>
              {isGeminiReady() ? 'Gemini Live' : 'Mock Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Threat pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: threatColor }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: threatColor }} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: threatColor }}>
              Threat · {threat}
            </span>
          </div>

          {/* Tabs */}
          {['DASHBOARD', 'DECISION LOG', 'GUIDELINES'].map(tab => {
            const id = tab === 'DASHBOARD' ? 'dashboard' : tab === 'DECISION LOG' ? 'decisions' : 'guidelines';
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="relative pb-1 text-xs font-mono font-bold uppercase tracking-[0.12em] transition-colors"
                style={{ color: active ? 'var(--t-text)' : 'var(--t-muted)', borderBottom: active ? '2px solid var(--t-text)' : '2px solid transparent' }}>
                {tab}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {/* Dark/Light toggle */}
          <button onClick={() => setDarkMode(!darkMode)}
            className="w-8 h-8 border flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ borderColor: 'var(--t-border)' }}>
            {darkMode ? <Sun size={14} style={{ color: '#f59e0b' }} /> : <Moon size={14} style={{ color: '#6366f1' }} />}
          </button>
          <div className="text-right">
            <div className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: 'var(--t-muted)' }}>Day</div>
            <div className="text-2xl font-black font-mono tracking-tighter leading-none" style={{ color: 'var(--t-text)' }}>{dayStr}</div>
          </div>
        </div>
      </header>

      {/* ═══ CRISIS TOAST ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 border"
            style={{ background: 'var(--t-panel)', borderColor: '#ef4444' }}>
            <AlertTriangle size={16} className="text-red-500" />
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-red-500">Crisis Injected</div>
              <div className="text-sm font-bold" style={{ color: 'var(--t-text)' }}>{crisisAlert}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      {activeTab === 'dashboard' ? (
        <main className="flex-1 min-h-0 flex relative">

          {/* ── LEFT COLUMN ── */}
          {leftCollapsed ? (
            <div className="flex-shrink-0 flex flex-col items-center border-r cursor-pointer hover:bg-white/5 transition-colors"
              style={{ width: '36px', borderColor: 'var(--t-border)' }}
              onClick={() => setLeftCollapsed(false)}>
              <div className="py-3"><PanelRightOpen size={14} style={{ color: 'var(--t-muted)' }} /></div>
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--t-muted)', writingMode: 'vertical-rl' }}>City Grid</span>
            </div>
          ) : (<>
          <div className="flex-shrink-0 flex flex-col border-r scroll-y" style={{ width: `${leftW}px`, minWidth: '280px', maxWidth: '500px', borderColor: 'var(--t-border)' }}>
            {/* City Grid */}
            <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone} />

            {/* Command Center */}
            <div className="flex-1 border-t" style={{ borderColor: '#2a2a2a' }}>
              <div className="tac-panel-header">
                <span>Command Center</span>
                <button onClick={() => setLeftCollapsed(true)} className="p-0.5 hover:bg-white/10 transition-colors" title="Collapse panel">
                  <PanelLeftClose size={12} style={{ color: 'var(--t-muted)' }} />
                </button>
              </div>

              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--t-muted)' }}>Simulation Day</span>
                  <span className="text-xl font-black font-mono" style={{ color: 'var(--t-text)' }}>{dayStr}</span>
                </div>

                <div className="flex gap-2">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="tac-btn-primary flex-1 flex items-center justify-center gap-2">
                      <Play size={12} fill="black" /> Launch
                    </button>
                  ) : (
                    <button onClick={pause} className="tac-btn flex-1 flex items-center justify-center gap-2" style={{ borderColor: '#f59e0b', color: '#f59e0b' }}>
                      <Pause size={12} /> Pause
                    </button>
                  )}
                  <button onClick={reset} className="tac-btn px-3"><RotateCcw size={12} /></button>
                </div>

                <button onClick={handleAdvance} disabled={isDebating || !isRunning || demoMode}
                  className="tac-btn-danger w-full flex items-center justify-center gap-2">
                  <FastForward size={12} /> Advance 5 Days + Council Debate
                </button>

                {/* Demo Mode */}
                {!demoMode ? (
                  <button onClick={startDemo} disabled={isDebating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase font-mono transition-all"
                    style={{ letterSpacing: '0.12em', border: '1px solid #8b5cf6', color: '#8b5cf6', background: 'transparent' }}
                    onMouseEnter={e => { e.target.style.background = '#8b5cf6'; e.target.style.color = '#fff'; }}
                    onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = '#8b5cf6'; }}>
                    <Radio size={12} /> Demo Mode — Auto Pilot
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button onClick={stopDemo}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase font-mono"
                      style={{ letterSpacing: '0.12em', border: '1px solid #ef4444', color: '#fff', background: '#ef4444' }}>
                      <Pause size={12} /> Stop Demo
                    </button>
                    <div className="flex items-center gap-2 px-3 py-2 border" style={{ borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.06)' }}>
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#8b5cf6' }} />
                      <span className="text-[9px] font-mono uppercase tracking-[0.1em]" style={{ color: '#8b5cf6' }}>
                        {demoStep || 'Demo active...'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Crisis injection */}
                <button onClick={() => setShowCrisis(!showCrisis)} className="tac-btn w-full flex items-center justify-between">
                  <span className="flex items-center gap-2"><Zap size={12} /> Inject Crisis Event</span>
                  <ChevronDown size={12} className={`transition-transform ${showCrisis ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={() => { crisis(e); setShowCrisis(false); }}
                          className="w-full text-left px-3 py-2 border transition-all hover:border-red-500/50"
                          style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}>
                          <div className="text-xs font-bold" style={{ color: 'var(--t-text)' }}>{e.name}</div>
                          <div className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>{e.description}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          </>)}

          {/* ── LEFT RESIZE HANDLE ── */}
          {!leftCollapsed && (
          <div className="resize-handle" onMouseDown={e => {
            e.preventDefault();
            const startX = e.clientX;
            const startW = leftW;
            const onMove = ev => setLeftW(Math.max(280, Math.min(500, startW + ev.clientX - startX)));
            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }} />
          )}

          {/* ── CENTER: Agent Council ── */}
          <div className="flex-1 flex flex-col min-h-0">
            <AgentPanel
              agentMessages={agentMessages}
              isDebating={isDebating}
              executedActions={executedActions}
              previousMessages={previousMessages}
              userAdvisory={latestAdvisory}
              advisoryText={advisoryText}
              setAdvisoryText={setAdvisoryText}
              onAdvisory={(t) => { advisory(t); setAdvisoryText(''); }}
              suggestions={suggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
            />
          </div>

          {/* ── RIGHT RESIZE HANDLE ── */}
          {!rightCollapsed && (
          <div className="resize-handle" onMouseDown={e => {
            e.preventDefault();
            const startX = e.clientX;
            const startW = rightW;
            const onMove = ev => setRightW(Math.max(280, Math.min(500, startW - (ev.clientX - startX))));
            const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; };
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
          }} />
          )}

          {/* ── RIGHT: Live Intelligence ── */}
          {rightCollapsed ? (
            <div className="flex-shrink-0 flex flex-col items-center border-l cursor-pointer hover:bg-white/5 transition-colors"
              style={{ width: '36px', borderColor: 'var(--t-border)' }}
              onClick={() => setRightCollapsed(false)}>
              <div className="py-3"><PanelLeftOpen size={14} style={{ color: 'var(--t-muted)' }} /></div>
              <span className="text-[8px] font-mono font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--t-muted)', writingMode: 'vertical-rl' }}>Intelligence</span>
            </div>
          ) : (<>
          <div className="flex-shrink-0 flex flex-col border-l scroll-y" style={{ width: `${rightW}px`, minWidth: '280px', maxWidth: '500px', borderColor: 'var(--t-border)' }}>
            <div className="tac-panel-header">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live Intelligence
              </span>
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: 'var(--t-muted)' }} />
                <button onClick={() => setRightCollapsed(true)} className="p-0.5 hover:bg-white/10 transition-colors" title="Collapse panel">
                  <PanelRightClose size={12} style={{ color: 'var(--t-muted)' }} />
                </button>
              </div>
            </div>

            {/* Metric Boxes */}
            <div className="grid grid-cols-2">
              <MetricBox label="Active Cases" value={cs.totalInfected} color="#ef4444" icon={<Zap size={12} />} />
              <MetricBox label="Casualties" value={cs.totalDeceased} color="#6b7280" icon={<Users size={12} />} />
              <MetricBox label="Recovered" value={cs.totalRecovered} color="#10b981" icon={<Heart size={12} />} />
              <MetricBox label="Hospital Load" value={`${Math.round(cs.hospitalLoad / cs.hospitalCapacity * 100)} %`} color="#8b5cf6" icon={<Shield size={12} />} isStr />
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-2 border-t" style={{ borderColor: 'var(--t-border)' }}>
              <GaugeRow label="Economy" value={Math.round(cs.economyIndex)} color="#f59e0b" />
              <GaugeRow label="Morale" value={Math.round(cs.publicMorale)} color="#8b5cf6" />
            </div>

            {/* ── CHART SWITCHER ── */}
            <div className="border-t px-4 py-2 flex items-center gap-1" style={{ borderColor: 'var(--t-border)' }}>
              {['SIR Curve', 'Stacked Bar', 'Stability', 'Radar', 'Pie'].map((label, i) => (
                <button key={i} onClick={() => setChartMode(i)}
                  className="px-2 py-1 text-[8px] font-mono font-bold uppercase tracking-[0.1em] border transition-all"
                  style={{
                    borderColor: chartMode === i ? 'var(--t-accent)' : 'var(--t-border)',
                    color: chartMode === i ? 'var(--t-accent)' : 'var(--t-muted)',
                    background: chartMode === i ? 'var(--t-input)' : 'transparent'
                  }}>{label}</button>
              ))}
            </div>

            {/* ── CHART AREA ── */}
            <div className="border-t px-4 py-3" style={{ borderColor: 'var(--t-border)' }}>
              <div className="h-44">
                {history.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === 0 ? (
                      /* SIR AREA CHART */
                      <AreaChart data={history.slice(-60)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="gInf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                          <linearGradient id="gDec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} /><stop offset="95%" stopColor="#6b7280" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
                        <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={35} />
                        <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="url(#gInf)" strokeWidth={1.5} dot={false} name="Infected" />
                        <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gRec)" strokeWidth={1.5} dot={false} name="Recovered" />
                        <Area type="monotone" dataKey="deceased" stroke="#6b7280" fill="url(#gDec)" strokeWidth={1.5} dot={false} name="Deceased" />
                        <Tooltip content={<TacTooltip />} />
                      </AreaChart>
                    ) : chartMode === 1 ? (
                      /* STACKED BAR — SIR breakdown */
                      <BarChart data={history.slice(-30)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
                        <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={35} />
                        <Bar dataKey="infected" stackId="a" fill="#ef4444" name="Infected" />
                        <Bar dataKey="recovered" stackId="a" fill="#10b981" name="Recovered" />
                        <Bar dataKey="deceased" stackId="a" fill="#6b7280" name="Deceased" />
                        <Tooltip content={<TacTooltip />} />
                      </BarChart>
                    ) : chartMode === 2 ? (
                      /* STABILITY — Economy + Morale line chart */
                      <LineChart data={history.slice(-60)} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--t-border)" />
                        <XAxis dataKey="day" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                        <Line type="monotone" dataKey="economy" stroke="#f59e0b" strokeWidth={2} dot={false} name="Economy" />
                        <Line type="monotone" dataKey="morale" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Morale" />
                        <Line type="monotone" dataKey="hospPct" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Hospital %" />
                        <Tooltip content={<TacTooltip />} />
                      </LineChart>
                    ) : chartMode === 3 ? (
                      /* RADAR — current situation snapshot */
                      <RadarChart outerRadius={60} data={[
                        { stat: 'Infected', val: Math.min(100, Math.round(cs.totalInfected / 12000 * 100)), full: 100 },
                        { stat: 'Hospital', val: Math.min(100, Math.round(cs.hospitalLoad / Math.max(1, cs.hospitalCapacity) * 100)), full: 100 },
                        { stat: 'Deceased', val: Math.min(100, Math.round(cs.totalDeceased / 5000 * 100)), full: 100 },
                        { stat: 'Economy', val: Math.round(cs.economyIndex), full: 100 },
                        { stat: 'Morale', val: Math.round(cs.publicMorale), full: 100 },
                        { stat: 'Zones Hit', val: Math.round(cs.activeZones / 36 * 100), full: 100 },
                      ]}>
                        <PolarGrid stroke="var(--t-border)" />
                        <PolarAngleAxis dataKey="stat" tick={{ fontSize: 8, fill: '#9ca3af', fontFamily: 'JetBrains Mono' }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Current" dataKey="val" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} strokeWidth={2} />
                        <Tooltip content={<TacTooltip />} />
                      </RadarChart>
                    ) : (
                      /* PIE — current population distribution */
                      <PieChart>
                        <Pie data={[
                          { name: 'Susceptible', value: cs.totalSusceptible || 1, fill: '#3b82f6' },
                          { name: 'Infected', value: cs.totalInfected || 0, fill: '#ef4444' },
                          { name: 'Recovered', value: cs.totalRecovered || 0, fill: '#10b981' },
                          { name: 'Deceased', value: cs.totalDeceased || 0, fill: '#6b7280' },
                        ].filter(d => d.value > 0)} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} strokeWidth={0}>
                          {[{ fill: '#3b82f6' }, { fill: '#ef4444' }, { fill: '#10b981' }, { fill: '#6b7280' }].map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<TacTooltip />} />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono' }} />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] font-mono" style={{ color: 'var(--t-border)' }}>Awaiting data</div>
                )}
              </div>
            </div>

            {/* Zone Summary */}
            <div className="border-t px-4 py-3 flex justify-between" style={{ borderColor: 'var(--t-border)' }}>
              <span className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>Zones affected: <span style={{ color: 'var(--t-text)' }} className="font-bold">{cs.activeZones}/36</span></span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--t-muted)' }}>Under lockdown: <span style={{ color: 'var(--t-text)' }} className="font-bold">{cs.lockdownZones}</span></span>
            </div>
          </div>
          </>)}

          {/* ── ZONE DETAIL OVERLAY ── */}
          <AnimatePresence>
            {selectedZone && (
              <ZoneDetail
                zone={simState.zones.find(z => z.id === selectedZone.id) || selectedZone}
                onClose={() => setSelectedZone(null)}
                onAction={(action) => {
                  setSimState(prev => applyDecision(prev, action));
                  setSelectedZone(null);
                  setActionToast(action.summary || action.action);
                  setTimeout(() => setActionToast(null), 2000);
                }}
              />
            )}
          </AnimatePresence>

          {/* ── ACTION TOAST ── */}
          <AnimatePresence>
            {actionToast && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 border"
                style={{ background: 'var(--t-bg)', borderColor: '#10b981', boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}
              >
                <span className="text-xs font-mono font-bold text-green-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  ✓ {actionToast}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      ) : activeTab === 'decisions' ? (
        <main className="flex-1 min-h-0 overflow-y-auto scroll-y p-6">
          <DecisionLog debates={debates} />
        </main>
      ) : (
        <main className="flex-1 min-h-0 overflow-y-auto scroll-y">
          <CrisisGuidelines />
        </main>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="h-[32px] flex-shrink-0 flex items-center justify-between px-5 border-t text-[9px] font-mono uppercase tracking-[0.15em]"
        style={{ borderColor: 'var(--t-border)', color: 'var(--t-dim)' }}>
        <span>SIR Model v2.0 · Grid: 6×6 (36 Zones) · Pop: 1,200,000</span>
        <span>Agents: 4 Active · Decisions: {debates.length} · TechFusion 2.0 — Intelligent Systems</span>
      </footer>
    </div>
  );
}

function MetricBox({ label, value, color, icon, isStr }) {
  const animVal = useAnimatedNumber(typeof value === 'number' ? value : 0);
  return (
    <div className="metric-box">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: '#9ca3af' }}>{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-black font-mono" style={{ color }}>
        {isStr ? value : animVal.toLocaleString()}
      </div>
    </div>
  );
}

function GaugeRow({ label, value, color }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: '#9ca3af' }}>
          <span className="w-2 h-2" style={{ background: color }} /> {label}
        </span>
        <span className="text-sm font-black font-mono" style={{ color }}>{value}</span>
      </div>
      <div className="gauge-track">
        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          className="h-full" style={{ background: color }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function TacTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border px-3 py-2 text-[10px] font-mono" style={{ background: '#0f0f0f', borderColor: '#2a2a2a' }}>
      {payload.map((p, i) => (
        <div key={i} className="font-bold" style={{ color: p.color }}>{p.dataKey}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</div>
      ))}
    </div>
  );
}
