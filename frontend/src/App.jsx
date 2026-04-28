import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Radio, Shield, Zap, Heart, Users,
  TrendingUp, Play, Pause, FastForward, RotateCcw, Send, CheckCircle, Database
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis } from 'recharts';

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
  const [showDecisions, setShowDecisions] = useState(false);
  const [latestAdvisory, setLatestAdvisory] = useState('');
  const [crisisAlert, setCrisisAlert] = useState(null);
  const [advisoryText, setAdvisoryText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const intervalRef = useRef(null);

  const cs = getStats(simState);

  useEffect(() => {
    if (simState.day > 0) {
      const s = getStats(simState);
      setHistory(p => [...p, { day: simState.day, infected: s.totalInfected, recovered: s.totalRecovered, deceased: s.totalDeceased }]);
    }
  }, [simState.day]);

  const tick = useCallback(() => setSimState(p => advanceDay(p)), []);

  useEffect(() => {
    if (isRunning && !isPaused && !isDebating) intervalRef.current = setInterval(tick, 1500);
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
  const crisis = (e) => { setSimState(p => e.apply(p)); setCrisisAlert(e.name); setTimeout(() => setCrisisAlert(null), 5000); setTimeout(() => triggerDebate(), 500); };
  const advisory = (t) => { setIsPaused(true); triggerDebate(t); };
  const reset = () => { clearInterval(intervalRef.current); setSimState(createSimState()); setHistory([]); setAgentMessages([]); setDebates([]); setIsRunning(false); setIsPaused(false); setIsDebating(false); setSelectedZone(null); setLatestAdvisory(''); };

  useEffect(() => { if (simState.day > 0 && simState.day % 10 === 0 && isRunning && !isDebating) triggerDebate(); }, [simState.day]);

  // Accessibility: Strict Color Hierarchy
  let threatState = { level: 'Stable', icon: <CheckCircle size={18} />, color: 'var(--color-safe)' };
  if (cs.totalInfected > 5000) threatState = { level: 'Critical', icon: <AlertTriangle size={18} />, color: 'var(--color-danger)' };
  else if (cs.totalInfected > 2000) threatState = { level: 'Severe', icon: <AlertTriangle size={18} />, color: 'var(--color-orange)' };
  else if (cs.totalInfected > 500) threatState = { level: 'High Risk', icon: <Activity size={18} />, color: 'var(--color-orange)' };
  else if (cs.totalInfected > 100) threatState = { level: 'Elevated', icon: <Activity size={18} />, color: 'var(--color-info)' };

  const animInf = useAnimatedNumber(cs.totalInfected);
  const animRec = useAnimatedNumber(cs.totalRecovered);
  const animDec = useAnimatedNumber(cs.totalDeceased);

  return (
    <div className="app-container">
      {/* ═══ TOP NAVIGATION ═══ */}
      <header className="main-nav">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Shield size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none tracking-tight">SimulCrisis v3</h1>
            <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mt-1">Advanced Tactical Command</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-white/10 pr-6 mr-6">
            {isDebating && (
              <div className="badge bg-orange animate-pulse">
                <Radio size={12} /> Council Active
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold opacity-60 uppercase">Threat:</span>
              <span className="badge" style={{ backgroundColor: threatState.color, color: 'white' }}>
                {threatState.icon} {threatState.level}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] opacity-60 uppercase font-black">Simulation Day</div>
            <div className="text-2xl font-black leading-none">{simState.day}</div>
          </div>
        </div>
      </header>

      {/* ═══ CRISIS OVERLAY ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-[200] card p-4 shadow-2xl flex items-center gap-4 border-t-4 border-danger">
            <div className="p-3 rounded-full bg-danger/10 text-danger">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-xs font-black text-danger uppercase tracking-widest">Emergency Alert</h3>
              <p className="text-lg font-bold text-navy">{crisisAlert}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="main-content">
        <div className="dashboard-container h-full">
          <div className="grid grid-cols-12 gap-4 h-full min-h-0">
            
            {/* ── LEFT: Map & Command (3/12) ── */}
            <div className="col-span-3 flex flex-col gap-4 min-h-0 h-full">
              <div className="flex-1 min-h-0">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </div>

              <div className="card p-5 bg-navy text-white border-none">
                <h3 className="text-xs font-black uppercase tracking-widest opacity-60 mb-4 flex items-center gap-2">
                  <Database size={14} /> Command Controls
                </h3>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn btn-orange w-full">
                      <Play size={18} fill="white" /> {simState.day === 0 ? 'Launch' : 'Resume'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn btn-outline border-white text-white hover:bg-white/10 w-full">
                      <Pause size={18} fill="white" /> Pause
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating || !isRunning} className="btn btn-outline border-white/20 text-white hover:bg-white/10 w-full text-xs">
                    <FastForward size={14} /> Next Phase
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn btn-outline border-orange text-orange hover:bg-orange/10 w-full text-xs">
                    <Zap size={14} /> Events
                  </button>
                  <button onClick={reset} className="btn btn-outline border-white/10 text-white/40 hover:bg-white/5 w-full text-xs">
                    <RotateCcw size={14} /> Reset
                  </button>
                </div>

                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="flex flex-col gap-1 overflow-hidden pb-4">
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={() => { crisis(e); setShowCrisis(false); }} className="p-2 text-xs font-bold hover:bg-white/10 rounded transition-colors text-left flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange" /> {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative group">
                  <input value={advisoryText} onChange={e => setAdvisoryText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && advisoryText.trim()) { advisory(advisoryText.trim()); setAdvisoryText(''); } }}
                    placeholder="Enter directive..." disabled={isDebating}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-orange transition-all pr-12" />
                  <button onClick={() => { if (advisoryText.trim()) { advisory(advisoryText.trim()); setAdvisoryText(''); } }} disabled={!advisoryText.trim() || isDebating}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-orange hover:scale-110 disabled:opacity-0 transition-all">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* ── CENTER: Agent Hub (5/12) ── */}
            <div className="col-span-5 flex flex-col min-h-0 h-full">
              <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
            </div>

            {/* ── RIGHT: Intelligence (4/12) ── */}
            <div className="col-span-4 flex flex-col gap-4 min-h-0 h-full">
              <div className="flex items-center justify-between flex-shrink-0">
                <h2 className="text-sm font-black uppercase tracking-widest text-navy flex items-center gap-2">
                  <Activity size={16} /> Live Intelligence
                </h2>
                <button onClick={() => setShowDecisions(!showDecisions)} className="btn btn-outline py-1.5 px-4 text-xs">
                  {showDecisions ? 'Dashboard' : `Audit Logs (${debates.length})`}
                </button>
              </div>

              {showDecisions ? (
                <div className="flex-1 min-h-0">
                  <DecisionLog debates={debates}/>
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                    <div className="card p-4 border-l-4 border-danger">
                      <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Infected</p>
                      <h4 className="text-3xl font-black text-danger">{animInf.toLocaleString()}</h4>
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-muted">
                        <TrendingUp size={10} /> Active Cases
                      </div>
                    </div>
                    <div className="card p-4 border-l-4 border-safe">
                      <p className="text-[10px] font-black uppercase text-muted tracking-widest mb-1">Recovered</p>
                      <h4 className="text-3xl font-black text-safe">{animRec.toLocaleString()}</h4>
                      <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-muted">
                        <Heart size={10} /> Survival Rate
                      </div>
                    </div>
                  </div>

                  {/* Stability Progress Bars */}
                  <div className="card p-5 space-y-5">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase text-navy tracking-widest">Economic Stability</p>
                        <span className="text-lg font-black text-navy">{Math.round(cs.economyIndex)}%</span>
                      </div>
                      <div className="h-3 w-full bg-main rounded-full overflow-hidden border border-border-color">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${cs.economyIndex}%` }} className="h-full bg-info" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase text-navy tracking-widest">Public Confidence</p>
                        <span className="text-lg font-black text-navy">{Math.round(cs.publicMorale)}%</span>
                      </div>
                      <div className="h-3 w-full bg-main rounded-full overflow-hidden border border-border-color">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${cs.publicMorale}%` }} className="h-full bg-safe" />
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="card flex-1 p-5 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h3 className="text-xs font-black uppercase tracking-widest text-muted">Transmission History</h3>
                    </div>
                    <div className="flex-1 min-h-0">
                      {history.length > 2 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history.slice(-60)}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="day" hide />
                            <YAxis width={40} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="infected" stroke="var(--color-danger)" fill="var(--color-danger)" fillOpacity={0.1} strokeWidth={3} />
                            <Area type="monotone" dataKey="recovered" stroke="var(--color-safe)" fill="var(--color-safe)" fillOpacity={0.1} strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center bg-main rounded-lg border-2 border-dashed border-border-color">
                          <p className="text-xs font-bold text-muted">Awaiting stream data...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="footer-bar">
        <div className="flex items-center gap-6">
          <span>Simulation Engine: SimulCrisis_v3_SIR</span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1"><Users size={10} /> Population: 1,200,000</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-safe">
            <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
            LIVE LINK SECURED
          </div>
        </div>
      </footer>
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 shadow-xl border-navy/10 text-xs">
      <p className="font-black mb-2 text-navy">METRIC READOUT: DAY {payload[0].payload.day}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 font-bold py-1 border-t border-border-color first:border-none">
          <span style={{ color: p.stroke }} className="uppercase text-[10px] tracking-wider">{p.dataKey}</span>
          <span className="text-navy">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
