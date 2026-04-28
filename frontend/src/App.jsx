import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, GitBranch, AlertTriangle, Zap, Heart, Users, TrendingUp, Shield, Play, Pause, FastForward, RotateCcw, ChevronDown, Send, Brain } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

import CityGrid from './components/CityGrid';
import AgentPanel from './components/AgentPanel';
import DecisionLog from './components/DecisionLog';

import { createSimState, advanceDay, applyDecision, getStats, CRISIS_EVENTS } from './engine/simulation';
import { runAgentDebate, parseDecisionAction } from './engine/agents';
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
  const [latestAdvisory, setLatestAdvisory] = useState('');
  const [crisisAlert, setCrisisAlert] = useState(null);
  const [advisoryText, setAdvisoryText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const intervalRef = useRef(null);

  const cs = getStats(simState);

  useEffect(() => {
    if (simState.day > 0) {
      const s = getStats(simState);
      setHistory(p => [...p, { day: simState.day, infected: s.totalInfected, recovered: s.totalRecovered, deceased: s.totalDeceased, economy: s.economyIndex, morale: s.publicMorale }]);
    }
  }, [simState.day]);

  const tick = useCallback(() => setSimState(p => advanceDay(p)), []);

  useEffect(() => {
    if (isRunning && !isPaused && !isDebating) intervalRef.current = setInterval(tick, 1000);
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused, isDebating, tick]);

  const triggerDebate = useCallback(async (adv = '') => {
    setIsDebating(true); setIsPaused(true); setAgentMessages([]);
    if (adv) setLatestAdvisory(adv);
    const s = getStats(simState);
    const rd = debates.slice(-3).map(d => ({ day: d.day, summary: d.coordinator?.substring(0, 100) || '' }));
    const msgs = [];
    const debate = await runAgentDebate(s, simState.zones, simState.day, rd, adv || latestAdvisory,
      (id, text) => { msgs.push({ agentId: id, text }); setAgentMessages([...msgs]); }
    );
    const actions = parseDecisionAction(debate.coordinator);
    let ns = simState;
    actions.forEach(a => { ns = applyDecision(ns, a); });
    setSimState(ns); setDebates(p => [...p, debate]); setIsDebating(false); setLatestAdvisory('');
  }, [simState, debates, latestAdvisory]);

  const handleAdvance = useCallback(async () => {
    let s = simState; for (let i = 0; i < 5; i++) s = advanceDay(s);
    setSimState(s); setTimeout(() => triggerDebate(), 300);
  }, [simState, triggerDebate]);

  const play = () => { setIsRunning(true); setIsPaused(false); if (simState.day === 0) tick(); };
  const pause = () => setIsPaused(true);
  const crisis = (e) => { setSimState(p => e.apply(p)); setCrisisAlert(e.name); setTimeout(() => setCrisisAlert(null), 4000); setTimeout(() => triggerDebate(), 500); };
  const advisory = (t) => { setIsPaused(true); triggerDebate(t); };
  const reset = () => { clearInterval(intervalRef.current); setSimState(createSimState()); setHistory([]); setAgentMessages([]); setDebates([]); setIsRunning(false); setIsPaused(false); setIsDebating(false); setSelectedZone(null); setLatestAdvisory(''); };

  useEffect(() => { if (simState.day > 0 && simState.day % 10 === 0 && isRunning && !isDebating) triggerDebate(); }, [simState.day]);

  const threat = cs.totalInfected > 5000 ? 'CRITICAL' : cs.totalInfected > 2000 ? 'SEVERE' : cs.totalInfected > 500 ? 'HIGH' : cs.totalInfected > 100 ? 'ELEVATED' : 'LOW';
  const threatColor = { CRITICAL: '#ef4444', SEVERE: '#f97316', HIGH: '#f59e0b', ELEVATED: '#eab308', LOW: '#10b981' }[threat];

  const dayStr = String(simState.day).padStart(3, '0');

  const suggestions = ['Quarantine hotspots immediately', 'Prioritize mass testing', 'Focus on economic stability', 'Deploy emergency vaccines', 'Set up field hospitals', 'Implement night curfew'];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#000' }}>

      {/* ═══ HEADER ═══ */}
      <header className="h-[52px] flex-shrink-0 flex items-center justify-between px-5 border-b" style={{ borderColor: '#2a2a2a' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border flex items-center justify-center" style={{ borderColor: '#2a2a2a' }}>
            <Brain size={16} className="text-red-500" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight">SimulCrisis</div>
            <div className="text-[9px] font-mono uppercase tracking-[0.15em]" style={{ color: '#6b7280' }}>Multi-Agent Crisis Intelligence</div>
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
          {['DASHBOARD', 'DECISION LOG'].map(tab => {
            const id = tab === 'DASHBOARD' ? 'dashboard' : 'decisions';
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="relative pb-1 text-xs font-mono font-bold uppercase tracking-[0.12em] transition-colors"
                style={{ color: active ? '#fff' : '#6b7280', borderBottom: active ? '2px solid #fff' : '2px solid transparent' }}>
                {tab}
              </button>
            );
          })}
        </div>

        <div className="text-right">
          <div className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: '#6b7280' }}>Day</div>
          <div className="text-2xl font-black font-mono text-white tracking-tighter leading-none">{dayStr}</div>
        </div>
      </header>

      {/* ═══ CRISIS TOAST ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 border"
            style={{ background: '#0a0000', borderColor: '#ef4444' }}>
            <AlertTriangle size={16} className="text-red-500" />
            <div>
              <div className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-red-500">Crisis Injected</div>
              <div className="text-sm font-bold text-white">{crisisAlert}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CONTENT ═══ */}
      {activeTab === 'dashboard' ? (
        <main className="flex-1 min-h-0 flex">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-shrink-0 flex flex-col border-r scroll-y" style={{ width: '380px', borderColor: '#2a2a2a' }}>
            {/* City Grid */}
            <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone} />

            {/* Command Center */}
            <div className="flex-1 border-t" style={{ borderColor: '#2a2a2a' }}>
              <div className="tac-panel-header">
                <span>Command Center</span>
              </div>

              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: '#6b7280' }}>Simulation Day</span>
                  <span className="text-xl font-black font-mono text-white">{dayStr}</span>
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

                <button onClick={handleAdvance} disabled={isDebating || !isRunning}
                  className="tac-btn-danger w-full flex items-center justify-center gap-2">
                  <FastForward size={12} /> Advance 5 Days + Council Debate
                </button>

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
                          style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
                          <div className="text-xs font-bold text-white">{e.name}</div>
                          <div className="text-[10px] font-mono" style={{ color: '#6b7280' }}>{e.description}</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Advisory */}
                <div className="pt-1">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] mb-2 flex items-center gap-1.5" style={{ color: '#6b7280' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Your Advisory
                  </div>
                  <div className="flex gap-2">
                    <input value={advisoryText} onChange={e => setAdvisoryText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && advisoryText.trim()) { advisory(advisoryText.trim()); setAdvisoryText(''); } }}
                      placeholder="Advise the council..."
                      className="flex-1 px-3 py-2 text-xs font-mono border outline-none transition-colors"
                      style={{ background: '#0f0f0f', borderColor: '#2a2a2a', color: '#e5e5e5' }}
                      disabled={isDebating} />
                    <button onClick={() => { if (advisoryText.trim()) { advisory(advisoryText.trim()); setAdvisoryText(''); } }}
                      disabled={!advisoryText.trim() || isDebating}
                      className="tac-btn px-3"><Send size={12} /></button>
                  </div>
                  <button onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-[9px] font-mono uppercase tracking-[0.12em] mt-2 flex items-center gap-1 transition-colors"
                    style={{ color: '#6b7280' }}>
                    <ChevronDown size={10} className={`transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                    Show Quick Suggestions
                  </button>
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-1.5 flex flex-wrap gap-1">
                        {suggestions.map(s => (
                          <button key={s} onClick={() => advisory(s)} disabled={isDebating}
                            className="text-[9px] font-mono px-2 py-1 border transition-all hover:border-white/30"
                            style={{ borderColor: '#2a2a2a', color: '#9ca3af' }}>{s}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* ── CENTER: Agent Council ── */}
          <div className="flex-1 flex flex-col min-h-0">
            <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory} />
          </div>

          {/* ── RIGHT: Live Intelligence ── */}
          <div className="flex-shrink-0 flex flex-col border-l scroll-y" style={{ width: '360px', borderColor: '#2a2a2a' }}>
            <div className="tac-panel-header">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Live Intelligence
              </span>
              <Activity size={14} style={{ color: '#6b7280' }} />
            </div>

            {/* Metric Boxes */}
            <div className="grid grid-cols-2">
              <MetricBox label="Active Cases" value={cs.totalInfected} color="#ef4444" icon={<Zap size={12} />} />
              <MetricBox label="Casualties" value={cs.totalDeceased} color="#6b7280" icon={<Users size={12} />} />
              <MetricBox label="Recovered" value={cs.totalRecovered} color="#10b981" icon={<Heart size={12} />} />
              <MetricBox label="Hospital Load" value={`${Math.round(cs.hospitalLoad / cs.hospitalCapacity * 100)} %`} color="#8b5cf6" icon={<Shield size={12} />} isStr />
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-2 border-t" style={{ borderColor: '#2a2a2a' }}>
              <GaugeRow label="Economy" value={Math.round(cs.economyIndex)} color="#f59e0b" />
              <GaugeRow label="Morale" value={Math.round(cs.publicMorale)} color="#8b5cf6" />
            </div>

            {/* Infection Curve */}
            <div className="border-t px-4 py-3" style={{ borderColor: '#2a2a2a' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: '#9ca3af' }}>Infection Curve</span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: '#ef4444' }}>■ Infected</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: '#10b981' }}>■ Recovered</span>
                </div>
              </div>
              <div className="h-24">
                {history.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history.slice(-50)} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="gInf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                        <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="url(#gInf)" strokeWidth={1.5} dot={{ r: 2, fill: '#ef4444' }} />
                      <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gRec)" strokeWidth={1.5} dot={{ r: 2, fill: '#10b981' }} />
                      <YAxis tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={30} />
                      <Tooltip content={<TacTooltip />} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] font-mono" style={{ color: '#3a3a3a' }}>Awaiting data</div>
                )}
              </div>
            </div>

            {/* Stability Index */}
            <div className="border-t px-4 py-3" style={{ borderColor: '#2a2a2a' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: '#9ca3af' }}>Stability Index</span>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: '#f59e0b' }}>— Economy</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono" style={{ color: '#8b5cf6' }}>— Morale</span>
                </div>
              </div>
              <div className="h-20">
                {history.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history.slice(-50)} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                      <Line type="monotone" dataKey="economy" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 2, fill: '#f59e0b' }} />
                      <Line type="monotone" dataKey="morale" stroke="#8b5cf6" strokeWidth={1.5} dot={{ r: 2, fill: '#8b5cf6' }} />
                      <YAxis tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} width={30} domain={[0, 100]} />
                      <Tooltip content={<TacTooltip />} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] font-mono" style={{ color: '#3a3a3a' }}>Awaiting data</div>
                )}
              </div>
            </div>

            {/* Zone Summary */}
            <div className="border-t px-4 py-3 flex justify-between" style={{ borderColor: '#2a2a2a' }}>
              <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>Zones affected: <span className="text-white font-bold">{cs.activeZones}/36</span></span>
              <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>Under lockdown: <span className="text-white font-bold">{cs.lockdownZones}</span></span>
            </div>
          </div>
        </main>
      ) : (
        <main className="flex-1 min-h-0 overflow-y-auto scroll-y p-6">
          <DecisionLog debates={debates} />
        </main>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="h-[32px] flex-shrink-0 flex items-center justify-between px-5 border-t text-[9px] font-mono uppercase tracking-[0.15em]"
        style={{ borderColor: '#2a2a2a', color: '#4b5563' }}>
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
