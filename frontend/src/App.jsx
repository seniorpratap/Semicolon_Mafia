import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, GitBranch, AlertTriangle, Zap, Heart, Users, TrendingUp, Shield, Play, Pause, FastForward, RotateCcw, ChevronDown, Send, Brain, Radio, Sun, Moon, PanelLeftClose, PanelRightClose, PanelLeftOpen, PanelRightOpen, CheckCircle, Database } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import DecisionLog from './components/DecisionLog';
import ZoneDetail from './components/ZoneDetail';
import ResizeHandle from './components/ResizeHandle';
import CrisisGuidelines from './components/CrisisGuidelines';

import { createSimState, advanceDay, applyDecision, getStats, CRISIS_EVENTS, seedRandomOutbreak } from './engine/simulation';
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

  const triggerDebateRef = useRef(null);

  const tick = useCallback(() => {
    setSimState(p => {
      const next = advanceDay(p);
      // Auto-trigger council debate every 5 days during normal play
      if (next.day > 0 && next.day % 5 === 0 && !debateAbortRef.current) {
        setTimeout(() => triggerDebateRef.current?.(), 300);
      }
      return next;
    });
  }, []);

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
    // Save current messages as "previous" before clearing — set debating FIRST
    setIsDebating(true); setIsPaused(true);
    // Batch: save previous + clear current in same tick
    const prevMsgs = agentMessages.length > 0 ? [...agentMessages] : null;
    if (prevMsgs) setPreviousMessages(prevMsgs);
    setAgentMessages([]);
    setExecutedActions([]);
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
      setSimState(ns); setDebates(p => [...p, debate]); setIsDebating(false); setIsPaused(false); setLatestAdvisory('');
      setExecutedActions(actions);
    } catch (err) {
      if (!abortController.signal.aborted) console.error('[Debate]', err);
      setIsDebating(false); setIsPaused(false);
    } finally {
      debateAbortRef.current = null;
    }
  }, [simState, debates, latestAdvisory]);
  triggerDebateRef.current = triggerDebate;

  const handleAdvance = useCallback(async () => {
    let s = simState.outbreakSeeded ? simState : seedRandomOutbreak(simState);
    for (let i = 0; i < 5; i++) s = advanceDay(s);
    setSimState(s); setTimeout(() => triggerDebate(), 300);
  }, [simState, triggerDebate]);

  const play = () => { if (!simState.outbreakSeeded) setSimState(p => seedRandomOutbreak(p)); setIsRunning(true); setIsPaused(false); if (simState.day === 0) tick(); };
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
      setSimState(p => seedRandomOutbreak(p));
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
  const threatIcon = { CRITICAL: <AlertTriangle size={18}/>, SEVERE: <AlertTriangle size={18}/>, HIGH: <Activity size={18}/>, ELEVATED: <Activity size={18}/>, LOW: <CheckCircle size={18}/> }[threat];

  const dayStr = String(simState.day).padStart(3, '0');

  const suggestions = ['Quarantine hotspots immediately', 'Prioritize mass testing', 'Focus on economic stability', 'Deploy emergency vaccines', 'Set up field hospitals', 'Implement night curfew'];

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
  }, [darkMode]);

  const animInf = useAnimatedNumber(cs.totalInfected);
  const animRec = useAnimatedNumber(cs.totalRecovered);
  const animDec = useAnimatedNumber(cs.totalDeceased);

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
            <div style={{ color: threatColor }}>{threatIcon}</div>
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
            <div className="flex-1 border-t" style={{ borderColor: 'var(--t-border)' }}>
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
                      <Play size={12} fill="currentColor" /> Launch
                    </button>
                  ) : (
                    <button onClick={pause} className="tac-btn flex-1 flex items-center justify-center gap-2" style={{ borderColor: 'var(--t-accent)', color: 'var(--t-accent)' }}>
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

            {/* Metric Boxes (Premium Parth Grid) */}
            <div className="grid grid-cols-2 border-b" style={{ borderColor: 'var(--t-border)' }}>
              <div className="p-4 border-r border-b" style={{ borderColor: 'var(--t-border)' }}>
                <p className="text-[9px] font-black uppercase text-muted tracking-widest mb-1">Infected</p>
                <h4 className="text-2xl font-black text-red-500">{animInf.toLocaleString()}</h4>
              </div>
              <div className="p-4 border-b" style={{ borderColor: 'var(--t-border)' }}>
                <p className="text-[9px] font-black uppercase text-muted tracking-widest mb-1">Recovered</p>
                <h4 className="text-2xl font-black text-green-500">{animRec.toLocaleString()}</h4>
              </div>
              <div className="p-4 border-r" style={{ borderColor: 'var(--t-border)' }}>
                <p className="text-[9px] font-black uppercase text-muted tracking-widest mb-1">Casualties</p>
                <h4 className="text-2xl font-black" style={{ color: 'var(--t-text)' }}>{animDec.toLocaleString()}</h4>
              </div>
              <div className="p-4">
                <p className="text-[9px] font-black uppercase text-muted tracking-widest mb-1">Hospital Load</p>
                <h4 className="text-2xl font-black text-blue-500">{Math.round(cs.hospitalLoad / cs.hospitalCapacity * 100)}%</h4>
              </div>
            </div>

            {/* Stability Progress (Premium Parth Bars) */}
            <div className="px-5 py-5 space-y-5 border-b" style={{ borderColor: 'var(--t-border)' }}>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--t-text)' }}>Economic Stability</p>
                  <span className="text-sm font-black" style={{ color: 'var(--t-text)' }}>{Math.round(cs.economyIndex)}%</span>
                </div>
                <div className="h-2 w-full bg-main rounded-full overflow-hidden border" style={{ borderColor: 'var(--t-border)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cs.economyIndex}%` }} className="h-full bg-blue-500" />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--t-text)' }}>Public Confidence</p>
                  <span className="text-sm font-black" style={{ color: 'var(--t-text)' }}>{Math.round(cs.publicMorale)}%</span>
                </div>
                <div className="h-2 w-full bg-main rounded-full overflow-hidden border" style={{ borderColor: 'var(--t-border)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${cs.publicMorale}%` }} className="h-full bg-green-500" />
                </div>
              </div>
            </div>

            {/* Infection Curve (Premium Chart) */}
            <div className="px-5 py-5 flex-1 min-h-[250px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted">Transmission History</h3>
              </div>
              <div className="flex-1 min-h-0">
                {history.length > 2 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.slice(-60)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#222' : '#E2E8F0'} />
                      <XAxis dataKey="day" hide />
                      <YAxis width={30} tick={{ fontSize: 9, fontWeight: 700, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<div className="bg-panel border p-2 text-[10px] font-mono shadow-xl rounded-lg" style={{ borderColor: 'var(--t-border)' }}>Day {history[history.length-1]?.day} data</div>} />
                      <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                      <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl" style={{ borderColor: 'var(--t-border)' }}>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Awaiting stream data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          </>)}
        </main>
      ) : activeTab === 'decisions' ? (
        <main className="flex-1 overflow-hidden p-6">
          <DecisionLog debates={debates} />
        </main>
      ) : (
        <main className="flex-1 overflow-hidden bg-panel">
          <CrisisGuidelines />
        </main>
      ) : (
        <main className="flex-1 min-h-0 overflow-y-auto scroll-y">
          <CrisisGuidelines />
        </main>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="h-8 flex-shrink-0 flex items-center justify-between px-6 border-t font-mono text-[9px] uppercase tracking-[0.2em]" style={{ background: 'var(--t-bg)', borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5"><Brain size={10} /> Engine: SimulCrisis_v3_SIR</span>
          <span className="opacity-30">|</span>
          <span className="flex items-center gap-1.5"><Users size={10} /> Population: 1,200,000</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-green-500 font-bold">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE LINK SECURED
          </div>
        </div>
      </footer>
    </div>
  );
}
