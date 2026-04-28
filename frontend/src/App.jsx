import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Leaf, Radio, Shield, Zap, Heart, Users,
  TrendingUp, Play, Pause, FastForward, RotateCcw, ChevronDown, Send
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

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

  const threat = cs.totalInfected > 5000 ? 'Critical' : cs.totalInfected > 2000 ? 'Severe' : cs.totalInfected > 500 ? 'High' : cs.totalInfected > 100 ? 'Elevated' : 'Stable';

  const animInf = useAnimatedNumber(cs.totalInfected);
  const animRec = useAnimatedNumber(cs.totalRecovered);
  const animDec = useAnimatedNumber(cs.totalDeceased);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface">
      {/* ═══ TOP NAV ═══ */}
      <nav className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-slate-100 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200/40">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">SimulCrisis</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">AI Crisis Engine</span>
        </div>

        <div className="flex items-center gap-3">
          {isDebating && (
            <motion.span initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-50 text-violet-600 border border-violet-200 flex items-center gap-1.5">
              <Shield size={11}/> Deliberating
            </motion.span>
          )}
          {isRunning && !isPaused && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
              <Radio size={11} className="animate-pulse"/> Live
            </span>
          )}
          <button onClick={() => setShowDecisions(!showDecisions)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${showDecisions ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}>
            {showDecisions ? '← Back to Dashboard' : `Decision Log (${debates.length})`}
          </button>
          <div className="w-px h-6 bg-slate-100"/>
          <div className="text-right">
            <div className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Day</div>
            <div className="text-lg font-black font-mono text-slate-900 leading-none">{simState.day}</div>
          </div>
        </div>
      </nav>

      {/* ═══ CRISIS TOAST ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 bg-white rounded-2xl shadow-2xl border border-red-200 flex items-center gap-3">
            <AlertTriangle size={18} className="text-red-500"/>
            <div><div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Crisis</div><div className="text-sm font-bold text-slate-900">{crisisAlert}</div></div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDecisions ? (
        <main className="flex-1 overflow-y-auto scroll-y p-6"><DecisionLog debates={debates}/></main>
      ) : (
        /* ═══ BENTO GRID DASHBOARD ═══ */
        <main className="flex-1 min-h-0 overflow-y-auto scroll-y">
          <div className="max-w-[1600px] mx-auto p-5 space-y-4">

            {/* ── ROW 1: Hero Metrics + Controls ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* Hero: Active Cases */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} className="col-span-3 bento-hero p-6 flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-white/70"/>
                  <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Active Cases</span>
                </div>
                <div className="text-4xl font-black font-mono text-white tracking-tight">{animInf.toLocaleString()}</div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit ${threat === 'Stable' ? 'bg-white/20 text-white' : 'bg-red-500/30 text-white'}`}>
                  ● {threat}
                </div>
              </motion.div>

              {/* Recovered */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.05}} className="col-span-2 bento-accent p-5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5"><Heart size={13} className="text-emerald-500"/><span className="text-[10px] font-semibold text-emerald-600/70 uppercase tracking-wider">Recovered</span></div>
                <div className="text-2xl font-black font-mono text-emerald-700">{animRec.toLocaleString()}</div>
              </motion.div>

              {/* Casualties */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.1}} className="col-span-2 bento p-5 flex flex-col justify-between">
                <div className="flex items-center gap-1.5"><Users size={13} className="text-slate-400"/><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Casualties</span></div>
                <div className="text-2xl font-black font-mono text-slate-600">{animDec.toLocaleString()}</div>
              </motion.div>

              {/* Controls */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.15}} className="col-span-5 bento p-5">
                <div className="flex gap-2 mb-3">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                      <Play size={14} fill="white"/> {simState.day === 0 ? 'Launch' : 'Resume'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn-soft flex-1 flex items-center justify-center gap-2 !border-amber-300 !text-amber-600 !bg-amber-50">
                      <Pause size={14}/> Pause
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating||!isRunning} className="btn-soft flex-1 flex items-center justify-center gap-2">
                    <FastForward size={14}/> Jump + Debate
                  </button>
                  <button onClick={reset} className="btn-soft px-3" title="Reset"><RotateCcw size={14}/></button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn-danger flex-shrink-0 flex items-center gap-1.5">
                    <Zap size={12}/> Crisis <ChevronDown size={12} className={`transition-transform ${showCrisis ? 'rotate-180' : ''}`}/>
                  </button>
                  <div className="flex-1 flex gap-1.5">
                    <input value={advisoryText} onChange={e=>setAdvisoryText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}}
                      placeholder="Advise the AI council..." disabled={isDebating}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all bg-white"/>
                    <button onClick={()=>{if(advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}} disabled={!advisoryText.trim()||isDebating}
                      className="px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-30">
                      <Send size={13}/>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-2 flex flex-wrap gap-1.5 overflow-hidden">
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={()=>{crisis(e);setShowCrisis(false);}}
                          className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-semibold transition-all">
                          {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ── ROW 2: Grid + Agent Council ── */}
            <div className="grid grid-cols-12 gap-4" style={{minHeight:'420px'}}>

              {/* City Grid — wide */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.2}} className="col-span-5">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </motion.div>

              {/* Agent Council — takes more space */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.25}} className="col-span-7 flex flex-col min-h-0">
                <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
              </motion.div>
            </div>

            {/* ── ROW 3: Charts + Gauges ── */}
            <div className="grid grid-cols-12 gap-4">
              {/* Infection Chart */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}} className="col-span-7 bento p-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-bold text-slate-700">Outbreak Trajectory</span>
                  <span className="text-[10px] text-slate-400 font-mono">Day {cs.day}</span>
                </div>
                {history.length > 2 ? (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.slice(-60)} margin={{top:0,right:0,bottom:0,left:0}}>
                        <defs>
                          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="url(#gI)" strokeWidth={2.5} dot={false}/>
                        <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gR)" strokeWidth={2} dot={false}/>
                        <Tooltip content={<TT/>}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-36 flex items-center justify-center text-sm text-slate-300">Run simulation to see trends</div>
                )}
                <div className="flex gap-6 mt-2 justify-center">
                  <div className="flex items-center gap-1.5"><div className="w-4 h-1 rounded bg-red-400"/><span className="text-[10px] text-slate-400">Infected</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-4 h-1 rounded bg-emerald-400"/><span className="text-[10px] text-slate-400">Recovered</span></div>
                </div>
              </motion.div>

              {/* Gauges + Zone summary */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.35}} className="col-span-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <GaugeCard label="Economy" value={cs.economyIndex} color="#059669" icon={<TrendingUp size={14} className="text-emerald-500"/>}/>
                  <GaugeCard label="Morale" value={cs.publicMorale} color="#7c3aed" icon={<Shield size={14} className="text-violet-500"/>}/>
                </div>
                <div className="bento p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Zones Compromised</div>
                    <div className="text-lg font-black text-slate-800 font-mono">{cs.activeZones} <span className="text-sm font-normal text-slate-400">/ 36</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Under Lockdown</div>
                    <div className="text-lg font-black text-amber-600 font-mono">{cs.lockdownZones}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hospital Load</div>
                    <div className={`text-lg font-black font-mono ${cs.hospitalLoad > cs.hospitalCapacity ? 'text-red-500' : 'text-emerald-600'}`}>
                      {Math.round(cs.hospitalLoad / cs.hospitalCapacity * 100)}%
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </main>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="h-8 flex-shrink-0 flex items-center justify-center bg-white border-t border-slate-100 text-[10px] text-emerald-600 font-semibold tracking-wider">
        SimulCrisis · TechFusion 2.0 — Intelligent Systems
      </footer>
    </div>
  );
}

function GaugeCard({ label, value, color, icon }) {
  const w = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="bento p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">{icon}<span className="text-xs font-bold text-slate-600">{label}</span></div>
        <span className="text-sm font-black font-mono" style={{color}}>{Math.round(value)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div initial={{width:0}} animate={{width:w}} className="h-full rounded-full" style={{backgroundColor:color}} transition={{duration:0.8}}/>
      </div>
    </div>
  );
}

function TT({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2 text-xs">
      {payload.map((p,i) => <div key={i} className="font-mono font-bold" style={{color:p.color}}>{p.dataKey}: {p.value?.toLocaleString()}</div>)}
    </div>
  );
}
