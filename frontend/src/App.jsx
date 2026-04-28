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
    <div className="app-container">
      {/* ═══ TOP NAV ═══ */}
      <nav className="glass-nav">
        <div className="flex items-center gap-3">
          <div className="logo-icon">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="text-base font-bold text-white tracking-tight">SimulCrisis</span>
          <span className="text-xs text-slate-400 hidden uppercase tracking-wider font-semibold" style={{display:'inline-block'}}>AI Crisis Engine</span>
        </div>

        <div className="flex items-center gap-3">
          {isDebating && (
            <motion.span initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
              className="badge badge-solid" style={{color: 'var(--color-accent-light)', backgroundColor: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)'}}>
              <Shield size={12}/> Deliberating
            </motion.span>
          )}
          {isRunning && !isPaused && (
            <span className="badge badge-outline text-emerald-400" style={{borderColor: 'rgba(16, 185, 129, 0.3)'}}>
              <Radio size={12} className="animate-pulse"/> Live
            </span>
          )}
          <button onClick={() => setShowDecisions(!showDecisions)}
            className={`btn-soft ${showDecisions ? '' : ''}`} style={showDecisions ? {background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-primary-light)', borderColor: 'rgba(16, 185, 129, 0.4)'} : {}}>
            {showDecisions ? '← Back to Dashboard' : `Decision Log (${debates.length})`}
          </button>
          <div className="nav-divider"/>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Day</div>
            <div className="text-xl font-black font-mono text-white leading-none">{simState.day}</div>
          </div>
        </div>
      </nav>

      {/* ═══ CRISIS TOAST ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className="crisis-toast">
            <AlertTriangle size={20} className="text-red-500"/>
            <div>
              <div className="text-xs text-red-400 font-bold uppercase tracking-wider">Crisis Detected</div>
              <div className="text-sm font-bold text-white">{crisisAlert}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDecisions ? (
        <main className="main-content">
          <DecisionLog debates={debates}/>
        </main>
      ) : (
        /* ═══ BENTO GRID DASHBOARD ═══ */
        <main className="main-content">
          <div className="dashboard-container">

            {/* ── ROW 1: Hero Metrics + Controls ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* Hero: Active Cases */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} className="col-span-3 bento-hero p-6 flex flex-col justify-between" style={{minHeight:'150px'}}>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-emerald-400"/>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Active Cases</span>
                </div>
                <div className="text-4xl font-black font-mono text-white tracking-tight">{animInf.toLocaleString()}</div>
                <div className="mt-2">
                  <span className="badge badge-solid" style={threat === 'Stable' ? {backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399'} : {backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171'}}>
                    ● {threat}
                  </span>
                </div>
              </motion.div>

              {/* Recovered */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.05}} className="col-span-2 bento-accent p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-emerald-400"/>
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recovered</span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-400">{animRec.toLocaleString()}</div>
              </motion.div>

              {/* Casualties */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.1}} className="col-span-2 bento p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-500"/>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Casualties</span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-400">{animDec.toLocaleString()}</div>
              </motion.div>

              {/* Controls */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.15}} className="col-span-5 bento p-5 flex flex-col justify-center">
                <div className="flex gap-3 mb-4">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn-primary flex-1">
                      <Play size={16} fill="white"/> {simState.day === 0 ? 'Launch Sim' : 'Resume'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn-soft flex-1" style={{borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24'}}>
                      <Pause size={16}/> Pause
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating||!isRunning} className="btn-soft flex-1">
                    <FastForward size={16}/> Jump + Debate
                  </button>
                  <button onClick={reset} className="btn-icon" title="Reset"><RotateCcw size={16}/></button>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn-danger flex-shrink-0">
                    <Zap size={14}/> Crisis <ChevronDown size={14} style={{transform: showCrisis ? 'rotate(180deg)' : 'rotate(0)'}}/>
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input value={advisoryText} onChange={e=>setAdvisoryText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}}
                      placeholder="Advise AI council..." disabled={isDebating}
                      className="input-field"/>
                    <button onClick={()=>{if(advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}} disabled={!advisoryText.trim()||isDebating}
                      className="btn-primary" style={{padding: '0 16px'}}>
                      <Send size={14}/>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-3 flex gap-2 overflow-hidden" style={{flexWrap: 'wrap'}}>
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={()=>{crisis(e);setShowCrisis(false);}}
                          className="btn-soft" style={{color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)'}}>
                          {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* ── ROW 2: Grid + Agent Council ── */}
            <div className="grid grid-cols-12 gap-4" style={{minHeight:'440px'}}>

              {/* City Grid — wide */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.2}} className="col-span-5">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </motion.div>

              {/* Agent Council — takes more space */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.25}} className="col-span-7 flex flex-col" style={{minHeight: 0}}>
                <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
              </motion.div>
            </div>

            {/* ── ROW 3: Charts + Gauges ── */}
            <div className="grid grid-cols-12 gap-4">
              {/* Infection Chart */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}} className="col-span-7 bento p-5">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Outbreak Trajectory</span>
                  <span className="text-xs text-slate-500 font-mono">Day {cs.day}</span>
                </div>
                {history.length > 2 ? (
                  <div style={{height: '160px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.slice(-60)} margin={{top:0,right:0,bottom:0,left:0}}>
                        <defs>
                          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="infected" stroke="#ef4444" fill="url(#gI)" strokeWidth={3} dot={false}/>
                        <Area type="monotone" dataKey="recovered" stroke="#10b981" fill="url(#gR)" strokeWidth={2} dot={false}/>
                        <Tooltip content={<TT/>}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-sm text-slate-500" style={{height: '160px'}}>Run simulation to see trends</div>
                )}
                <div className="flex gap-6 mt-3 justify-center">
                  <div className="flex items-center gap-2"><div style={{width:'12px', height:'4px', borderRadius:'2px', background:'#f87171'}}/><span className="text-xs text-slate-400">Infected</span></div>
                  <div className="flex items-center gap-2"><div style={{width:'12px', height:'4px', borderRadius:'2px', background:'#34d399'}}/><span className="text-xs text-slate-400">Recovered</span></div>
                </div>
              </motion.div>

              {/* Gauges + Zone summary */}
              <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.35}} className="col-span-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <GaugeCard label="Economy" value={cs.economyIndex} color="#10b981" icon={<TrendingUp size={16} className="text-emerald-400"/>}/>
                  <GaugeCard label="Morale" value={cs.publicMorale} color="#818cf8" icon={<Shield size={16} style={{color: '#818cf8'}}/>}/>
                </div>
                <div className="bento p-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Compromised</div>
                    <div className="text-xl font-black text-white font-mono">{cs.activeZones} <span className="text-sm font-normal text-slate-500">/ 36</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Lockdown</div>
                    <div className="text-xl font-black text-amber-500 font-mono">{cs.lockdownZones}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Hospital Load</div>
                    <div className={`text-xl font-black font-mono ${cs.hospitalLoad > cs.hospitalCapacity ? 'text-red-500' : 'text-emerald-400'}`}>
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
      <footer className="footer">
        SimulCrisis · TechFusion 2.0 — Intelligent Systems
      </footer>
    </div>
  );
}

function GaugeCard({ label, value, color, icon }) {
  const w = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="bento p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">{icon}<span className="text-sm font-bold text-slate-300">{label}</span></div>
        <span className="text-lg font-black font-mono" style={{color}}>{Math.round(value)}%</span>
      </div>
      <div style={{height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden'}}>
        <motion.div initial={{width:0}} animate={{width:w}} style={{height:'100%', borderRadius:'3px', backgroundColor:color, boxShadow:`0 0 10px ${color}`}} transition={{duration:0.8}}/>
      </div>
    </div>
  );
}

function TT({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)'}}>
      {payload.map((p,i) => <div key={i} className="font-mono font-bold text-sm mb-1" style={{color:p.color}}>{p.dataKey.toUpperCase()}: {p.value?.toLocaleString()}</div>)}
    </div>
  );
}
