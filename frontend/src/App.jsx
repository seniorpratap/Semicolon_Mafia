import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, Radio, Shield, Zap, Heart, Users,
  TrendingUp, Play, Pause, FastForward, RotateCcw, Send, CheckCircle
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

  // Accessibility Requirement: Don't rely only on color for alerts.
  let threatState = { level: 'Stable', icon: <CheckCircle size={16} className="text-safe" />, color: 'var(--color-safe)' };
  if (cs.totalInfected > 5000) threatState = { level: 'Critical', icon: <AlertTriangle size={16} className="text-danger" />, color: 'var(--color-danger)' };
  else if (cs.totalInfected > 2000) threatState = { level: 'Severe', icon: <AlertTriangle size={16} className="text-orange" />, color: 'var(--color-orange)' };
  else if (cs.totalInfected > 500) threatState = { level: 'High Risk', icon: <Activity size={16} className="text-orange" />, color: 'var(--color-orange)' };
  else if (cs.totalInfected > 100) threatState = { level: 'Elevated', icon: <Activity size={16} className="text-info" />, color: 'var(--color-info)' };

  const animInf = useAnimatedNumber(cs.totalInfected);
  const animRec = useAnimatedNumber(cs.totalRecovered);
  const animDec = useAnimatedNumber(cs.totalDeceased);

  return (
    <div className="app-container">
      {/* ═══ ACCESSIBLE NAV ═══ */}
      <header className="main-nav">
        <div className="flex items-center gap-3">
          <Shield size={20} className="text-white" />
          <div>
            <h1 className="text-base leading-none">SimulCrisis Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDebating && (
            <div className="badge bg-orange">
              <Radio size={12} /> Council Deliberating
            </div>
          )}
          {isRunning && !isPaused && !isDebating && (
            <div className="badge bg-safe">
              <Play size={12} /> Simulation Active
            </div>
          )}
          
          <button onClick={() => setShowDecisions(!showDecisions)} className="btn btn-outline" style={{borderColor: 'white', color: 'white', padding: '4px 12px'}}>
            {showDecisions ? 'Dashboard' : `Logs (${debates.length})`}
          </button>
          
          <div className="flex items-center gap-2 pl-4 border-l border-white border-opacity-20">
            <div className="text-right">
              <div className="text-[10px] text-white opacity-80 uppercase font-semibold">Day</div>
              <div className="text-lg font-bold leading-none">{simState.day}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CRISIS ALERT ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-50 card p-3 shadow-md flex items-center gap-3" style={{borderLeft: '4px solid var(--color-danger)'}}>
            <div className="p-1 rounded-full bg-danger bg-opacity-10">
              <AlertTriangle size={20} className="text-danger"/>
            </div>
            <div>
              <h3 className="text-xs text-danger font-bold uppercase tracking-wide">Emergency</h3>
              <p className="text-sm font-semibold text-navy">{crisisAlert}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDecisions ? (
        <main className="main-content">
          <DecisionLog debates={debates}/>
        </main>
      ) : (
        /* ═══ CONDENSED MAIN DASHBOARD ═══ */
        <main className="main-content">
          <div className="dashboard-container">

            {/* ── ROW 1: Controls & Topline Stats (Compact) ── */}
            <div className="flex gap-4 flex-shrink-0">
              {/* Primary Stats */}
              <div className="card p-3 flex-1 flex items-center justify-between" style={{borderLeft: `4px solid ${threatState.color}`}}>
                <div>
                  <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 flex items-center gap-1">Threat {threatState.icon}</div>
                  <div className="text-xl font-bold" style={{color: threatState.color}}>{threatState.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">Infected</div>
                  <div className="text-2xl font-black text-navy">{animInf.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-safe uppercase tracking-wide mb-1">Recovered</div>
                  <div className="text-2xl font-bold text-safe">{animRec.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">Casualties</div>
                  <div className="text-2xl font-bold text-navy">{animDec.toLocaleString()}</div>
                </div>
              </div>

              {/* Controls */}
              <div className="card p-3 flex-1 flex flex-col justify-center gap-2">
                <div className="flex gap-2">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn btn-navy flex-1">
                      <Play size={14}/> {simState.day === 0 ? 'Start' : 'Resume'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn btn-outline flex-1">
                      <Pause size={14}/> Pause
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating||!isRunning} className="btn btn-outline flex-1">
                    <FastForward size={14}/> Skip
                  </button>
                  <button onClick={reset} className="btn btn-outline px-3" aria-label="Reset"><RotateCcw size={14}/></button>
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn btn-orange flex-shrink-0">
                    <Zap size={14}/> Event
                  </button>
                </div>
                <div className="flex gap-2">
                  <input value={advisoryText} onChange={e=>setAdvisoryText(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter'&&advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}}
                    placeholder="Type directive to agents..." disabled={isDebating}
                    className="input-field" aria-label="Directive input"/>
                  <button onClick={()=>{if(advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}} disabled={!advisoryText.trim()||isDebating}
                    className="btn btn-navy" aria-label="Send">
                    <Send size={14}/>
                  </button>
                </div>
                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="flex gap-2 flex-wrap overflow-hidden pt-1">
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={()=>{crisis(e);setShowCrisis(false);}} className="btn btn-outline py-1 px-2 text-xs">
                          {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── ROW 2: 100vh Flex Container for Map, Chat, and Charts ── */}
            <div className="flex gap-4 flex-1 min-h-0">
              
              {/* Left Column: Grid Map */}
              <div className="flex-1 flex flex-col min-w-0">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </div>

              {/* Middle Column: Chat */}
              <div className="flex-1 flex flex-col min-w-0">
                <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
              </div>

              {/* Right Column: Charts & Gauges */}
              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="card p-4 flex-1 flex flex-col min-h-0">
                  <div className="mb-2 flex-shrink-0">
                    <h3 className="text-sm font-bold">Epidemic Curve</h3>
                  </div>
                  <div className="flex-1 min-h-0">
                    {history.length > 2 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history.slice(-60)} margin={{top:5,right:5,bottom:0,left:0}}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                          <XAxis dataKey="day" tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={(val) => val > 1000 ? (val/1000).toFixed(0)+'k' : val} tick={{fontSize: 10, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} width={30} />
                          <Tooltip content={<ChartTooltip/>}/>
                          <Area type="monotone" dataKey="infected" stroke="var(--color-danger)" fill="var(--color-danger)" fillOpacity={0.1} strokeWidth={2} />
                          <Area type="monotone" dataKey="recovered" stroke="var(--color-safe)" fill="var(--color-safe)" fillOpacity={0.1} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted bg-main rounded border border-border-color">
                        No data yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Gauges */}
                <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                  <div className="card p-3 text-center">
                    <div className="flex justify-center gap-1 text-xs font-semibold text-muted mb-1"><TrendingUp size={14}/> Econ</div>
                    <div className="text-xl font-bold text-navy">{Math.round(cs.economyIndex)}</div>
                  </div>
                  <div className="card p-3 text-center">
                    <div className="flex justify-center gap-1 text-xs font-semibold text-muted mb-1"><Shield size={14}/> Morale</div>
                    <div className="text-xl font-bold text-navy">{Math.round(cs.publicMorale)}</div>
                  </div>
                </div>
                
                <div className="card p-3 grid grid-cols-3 divide-x divide-border-color flex-shrink-0 text-center">
                  <div className="px-1">
                    <div className="text-[10px] font-semibold text-muted">Infected</div>
                    <div className="text-lg font-bold text-navy">{cs.activeZones}/36</div>
                  </div>
                  <div className="px-1">
                    <div className="text-[10px] font-semibold text-muted">Lockdown</div>
                    <div className="text-lg font-bold text-orange">{cs.lockdownZones}</div>
                  </div>
                  <div className="px-1">
                    <div className="text-[10px] font-semibold text-muted">Hosp. Load</div>
                    <div className={`text-lg font-bold ${cs.hospitalLoad > cs.hospitalCapacity ? 'text-danger' : 'text-safe'}`}>
                      {Math.round(cs.hospitalLoad / cs.hospitalCapacity * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-2 shadow-md text-xs">
      <p className="font-bold mb-1">Day {payload[0].payload.day}</p>
      {payload.map((p,i) => (
        <div key={i} className="flex justify-between gap-3 font-medium">
          <span style={{color: p.stroke}} className="capitalize">{p.dataKey}</span>
          <span>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
