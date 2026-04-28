import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Radio, Shield, Zap, Heart, Users,
  TrendingUp, Play, Pause, FastForward, RotateCcw, ChevronDown, Send, Crosshair
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

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

  const threat = cs.totalInfected > 5000 ? 'CRITICAL' : cs.totalInfected > 2000 ? 'SEVERE' : cs.totalInfected > 500 ? 'HIGH' : cs.totalInfected > 100 ? 'ELEVATED' : 'STABLE';

  const animInf = useAnimatedNumber(cs.totalInfected);
  const animRec = useAnimatedNumber(cs.totalRecovered);
  const animDec = useAnimatedNumber(cs.totalDeceased);

  return (
    <div className="app-container">
      <div className="scanlines" />
      <div className="crt-overlay" />

      {/* ═══ TOP NAV ═══ */}
      <nav className="tactical-nav">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center text-primary">
            <Crosshair size={24} />
          </div>
          <div>
            <div className="text-lg font-bold text-primary tracking-wider leading-none">DEFCON :: SIMUL-CRISIS</div>
            <div className="text-[10px] text-accent font-mono uppercase tracking-widest mt-1">Strategic Command Terminal</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDebating && (
            <span className="badge text-accent" style={{borderColor: 'var(--color-accent)'}}>
              <Shield size={10}/> DELIBERATING
            </span>
          )}
          {isRunning && !isPaused && (
            <span className="badge text-primary" style={{borderColor: 'var(--color-primary)'}}>
              <Radio size={10} className="animate-pulse"/> UPLINK ACTIVE
            </span>
          )}
          <button onClick={() => setShowDecisions(!showDecisions)}
            className="btn-soft" style={showDecisions ? {background: 'var(--color-primary)', color: 'var(--bg-core)'} : {}}>
            {showDecisions ? '[ RTB ]' : `[ LOGS: ${debates.length} ]`}
          </button>
          
          <div className="flex items-center gap-3 pl-4" style={{borderLeft: '1px solid var(--border-color)'}}>
            <div className="text-right">
              <div className="text-[10px] text-muted font-mono uppercase tracking-wider">SIMULATION DAY</div>
              <div className="text-2xl font-black font-mono text-primary leading-none">
                {String(simState.day).padStart(4, '0')}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ CRISIS TOAST ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className="crisis-toast">
            <AlertTriangle size={24} className="text-danger animate-pulse"/>
            <div>
              <div className="text-[10px] text-danger font-mono font-bold uppercase tracking-widest">CRITICAL ALERT DETECTED</div>
              <div className="text-sm font-bold text-white font-mono uppercase">{crisisAlert}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDecisions ? (
        <main className="main-content">
          <DecisionLog debates={debates}/>
        </main>
      ) : (
        /* ═══ TACTICAL DASHBOARD ═══ */
        <main className="main-content">
          <div className="dashboard-container">

            {/* ── ROW 1: Hero Metrics + Controls ── */}
            <div className="grid grid-cols-12 gap-4">

              {/* Hero: Active Cases */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="col-span-3 bento-hero p-5 flex flex-col justify-between" style={{minHeight:'140px'}}>
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-danger animate-pulse"/>
                  <span className="text-xs font-mono font-bold text-danger uppercase tracking-widest">ACTIVE THREATS</span>
                </div>
                <div className="text-4xl font-black font-mono text-white tracking-wider">
                  [{animInf.toLocaleString()}]
                </div>
                <div className="mt-2">
                  <span className="badge badge-solid" style={threat === 'STABLE' ? {color: 'var(--color-primary)'} : {color: 'var(--color-danger)'}}>
                    THREAT LVL: {threat}
                  </span>
                </div>
              </motion.div>

              {/* Recovered */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.05}} className="col-span-2 bento-accent p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Heart size={14} className="text-primary"/>
                  <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">RECOVERED</span>
                </div>
                <div className="text-3xl font-black font-mono text-primary">
                  {animRec.toLocaleString()}
                </div>
              </motion.div>

              {/* Casualties */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.1}} className="col-span-2 bento p-5 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-muted"/>
                  <span className="text-[10px] font-mono font-bold text-muted uppercase tracking-widest">CASUALTIES</span>
                </div>
                <div className="text-3xl font-black font-mono text-muted">
                  {animDec.toLocaleString()}
                </div>
              </motion.div>

              {/* Controls */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.15}} className="col-span-5 bento p-5 flex flex-col justify-center">
                <div className="flex gap-2 mb-3">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn-primary flex-1">
                      <Play size={14}/> {simState.day === 0 ? 'INITIATE SEQ' : 'RESUME SIM'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn-soft flex-1" style={{borderColor: 'var(--color-warning)', color: 'var(--color-warning)'}}>
                      <Pause size={14}/> HALT
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating||!isRunning} className="btn-soft flex-1">
                    <FastForward size={14}/> JUMP + CALL
                  </button>
                  <button onClick={reset} className="btn-icon" title="Reset"><RotateCcw size={14}/></button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn-danger flex-shrink-0">
                    <Zap size={14}/> INJECT THREAT
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input value={advisoryText} onChange={e=>setAdvisoryText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}}
                      placeholder="ENTER DIRECTIVE..." disabled={isDebating}
                      className="input-field"/>
                    <button onClick={()=>{if(advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}} disabled={!advisoryText.trim()||isDebating}
                      className="btn-primary" style={{padding: '0 12px'}}>
                      <Send size={14}/>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-2 flex gap-2 overflow-hidden" style={{flexWrap: 'wrap'}}>
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={()=>{crisis(e);setShowCrisis(false);}}
                          className="btn-danger" style={{padding: '4px 8px', fontSize: '0.7rem'}}>
                          {e.name.replace(/[^a-zA-Z0-9 ]/g, '')}
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
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="col-span-5">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </motion.div>

              {/* Agent Council — takes more space */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}} className="col-span-7 flex flex-col" style={{minHeight: 0}}>
                <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
              </motion.div>
            </div>

            {/* ── ROW 3: Charts + Gauges ── */}
            <div className="grid grid-cols-12 gap-4">
              {/* Infection Chart */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}} className="col-span-7 bento p-5">
                <div className="flex justify-between items-center mb-4 border-b border-color-primary pb-2" style={{borderColor: 'var(--border-color)'}}>
                  <span className="text-sm font-bold font-mono text-primary uppercase tracking-widest">TRAJECTORY ANALYSIS</span>
                  <span className="text-xs text-muted font-mono">T+{cs.day}</span>
                </div>
                {history.length > 2 ? (
                  <div style={{height: '160px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.slice(-60)} margin={{top:0,right:0,bottom:0,left:0}}>
                        <defs>
                          <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <Area type="step" dataKey="infected" stroke="var(--color-danger)" fill="url(#gI)" strokeWidth={2} dot={false} isAnimationActive={false}/>
                        <Area type="step" dataKey="recovered" stroke="var(--color-primary)" fill="url(#gR)" strokeWidth={2} dot={false} isAnimationActive={false}/>
                        <Tooltip content={<TT/>}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center font-mono text-sm text-muted" style={{height: '160px'}}>&gt; AWAITING DATA...</div>
                )}
                <div className="flex gap-6 mt-3 justify-center">
                  <div className="flex items-center gap-2"><div style={{width:'12px', height:'12px', border:'1px solid var(--color-danger)', background:'var(--color-danger-dim)'}}/><span className="text-[10px] font-mono text-muted uppercase tracking-widest">Infected</span></div>
                  <div className="flex items-center gap-2"><div style={{width:'12px', height:'12px', border:'1px solid var(--color-primary)', background:'var(--color-primary-dim)'}}/><span className="text-[10px] font-mono text-muted uppercase tracking-widest">Recovered</span></div>
                </div>
              </motion.div>

              {/* Gauges + Zone summary */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.35}} className="col-span-5 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <GaugeCard label="ECONOMY" value={cs.economyIndex} color="var(--color-primary)" icon={<TrendingUp size={16} className="text-primary"/>}/>
                  <GaugeCard label="MORALE" value={cs.publicMorale} color="var(--color-accent)" icon={<Shield size={16} style={{color: 'var(--color-accent)'}}/>}/>
                </div>
                <div className="bento p-5 flex items-center justify-between" style={{borderTop: '2px solid var(--color-primary)'}}>
                  <div>
                    <div className="text-[10px] text-muted font-mono uppercase tracking-widest mb-1">COMPROMISED</div>
                    <div className="text-2xl font-black text-white font-mono">{String(cs.activeZones).padStart(2,'0')} <span className="text-xs font-normal text-muted">/ 36</span></div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted font-mono uppercase tracking-widest mb-1">LOCKDOWN</div>
                    <div className="text-2xl font-black text-warning font-mono">{String(cs.lockdownZones).padStart(2,'0')}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted font-mono uppercase tracking-widest mb-1">MED CAPACITY</div>
                    <div className={`text-2xl font-black font-mono ${cs.hospitalLoad > cs.hospitalCapacity ? 'text-danger animate-pulse' : 'text-primary'}`}>
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
        [ SECURE TERMINAL ] // SIMUL-CRISIS // AUTH: OMEGA
      </footer>
    </div>
  );
}

function GaugeCard({ label, value, color, icon }) {
  const w = `${Math.max(0, Math.min(100, value))}%`;
  return (
    <div className="bento p-4 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">{icon}<span className="text-[10px] font-bold font-mono tracking-widest text-muted">{label}</span></div>
        <span className="text-xl font-black font-mono" style={{color}}>[{Math.round(value)}%]</span>
      </div>
      <div style={{height: '8px', border: `1px solid var(--border-color)`, background: 'rgba(0,0,0,0.5)', padding: '1px'}}>
        <motion.div initial={{width:0}} animate={{width:w}} style={{height:'100%', backgroundColor:color}} transition={{duration:0.8}}/>
      </div>
    </div>
  );
}

function TT({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background: 'var(--bg-core)', border: '1px solid var(--color-primary)', padding: '8px 12px', boxShadow: '0 0 15px var(--color-primary-dim)'}}>
      {payload.map((p,i) => <div key={i} className="font-mono font-bold text-xs mb-1" style={{color:p.color}}>&gt; {p.dataKey.toUpperCase()}: {p.value?.toLocaleString()}</div>)}
    </div>
  );
}
