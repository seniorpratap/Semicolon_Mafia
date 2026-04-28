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
  // We use icon + explicit label.
  let threatState = { level: 'Stable', icon: <CheckCircle size={20} className="text-safe" />, color: 'var(--color-safe)' };
  if (cs.totalInfected > 5000) threatState = { level: 'Critical Emergency', icon: <AlertTriangle size={20} className="text-danger" />, color: 'var(--color-danger)' };
  else if (cs.totalInfected > 2000) threatState = { level: 'Severe Risk', icon: <AlertTriangle size={20} className="text-orange" />, color: 'var(--color-orange)' };
  else if (cs.totalInfected > 500) threatState = { level: 'High Risk', icon: <Activity size={20} className="text-orange" />, color: 'var(--color-orange)' };
  else if (cs.totalInfected > 100) threatState = { level: 'Elevated', icon: <Activity size={20} className="text-info" />, color: 'var(--color-info)' };

  const animInf = useAnimatedNumber(cs.totalInfected);
  const animRec = useAnimatedNumber(cs.totalRecovered);
  const animDec = useAnimatedNumber(cs.totalDeceased);

  return (
    <div className="app-container">

      {/* ═══ ACCESSIBLE NAV ═══ */}
      <header className="main-nav">
        <div className="flex items-center gap-3">
          <Shield size={28} className="text-white" />
          <div>
            <h1 className="text-xl leading-none">SimulCrisis Dashboard</h1>
            <div className="text-xs text-white opacity-80 mt-1">Multi-Agent Response Simulator</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isDebating && (
            <div className="badge bg-orange">
              <Radio size={16} /> Council Deliberating
            </div>
          )}
          {isRunning && !isPaused && !isDebating && (
            <div className="badge bg-safe">
              <Play size={16} /> Simulation Active
            </div>
          )}
          
          <button onClick={() => setShowDecisions(!showDecisions)} className="btn btn-outline" style={{borderColor: 'white', color: 'white', padding: '8px 16px'}}>
            {showDecisions ? 'Back to Dashboard' : `View Decision Logs (${debates.length})`}
          </button>
          
          <div className="flex items-center gap-3 pl-6 border-l border-white border-opacity-20">
            <div className="text-right">
              <div className="text-xs text-white opacity-80 uppercase font-semibold">Current Day</div>
              <div className="text-2xl font-bold leading-none">
                Day {simState.day}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CRISIS ALERT ═══ */}
      <AnimatePresence>
        {crisisAlert && (
          <motion.div initial={{y:-20,opacity:0}} animate={{y:0,opacity:1}} exit={{y:-20,opacity:0}}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-50 card p-4 shadow-md flex items-center gap-4" style={{borderLeft: '6px solid var(--color-danger)'}}>
            <div className="p-2 rounded-full bg-danger bg-opacity-10">
              <AlertTriangle size={28} className="text-danger"/>
            </div>
            <div>
              <h3 className="text-sm text-danger font-bold uppercase tracking-wide">Emergency Alert</h3>
              <p className="text-lg font-semibold text-navy">{crisisAlert}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showDecisions ? (
        <main className="main-content">
          <DecisionLog debates={debates}/>
        </main>
      ) : (
        /* ═══ MAIN DASHBOARD ═══ */
        <main className="main-content">
          <div className="dashboard-container">

            {/* ── ROW 1: Metrics & Controls ── */}
            <div className="grid grid-cols-12 gap-6">

              {/* Status Card */}
              <div className="col-span-3 card p-6 flex flex-col justify-between" style={{borderTop: `6px solid ${threatState.color}`}}>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Current Threat Level</h3>
                </div>
                <div className="flex items-center gap-3">
                  {threatState.icon}
                  <span className="text-2xl font-bold" style={{color: threatState.color}}>{threatState.level}</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted mb-1">Active Cases</p>
                  <div className="text-4xl font-black text-navy">{animInf.toLocaleString()}</div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="col-span-4 card p-6 flex items-center justify-around">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Heart size={18} className="text-safe"/>
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Recovered</h3>
                  </div>
                  <div className="text-3xl font-bold text-safe">{animRec.toLocaleString()}</div>
                </div>
                <div style={{width: '1px', height: '60px', background: 'var(--border-color)'}} />
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Users size={18} className="text-muted"/>
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">Casualties</h3>
                  </div>
                  <div className="text-3xl font-bold text-navy">{animDec.toLocaleString()}</div>
                </div>
              </div>

              {/* Controls Card */}
              <div className="col-span-5 card p-6 flex flex-col justify-center">
                <div className="flex gap-4 mb-4">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn btn-navy flex-1">
                      <Play size={20}/> {simState.day === 0 ? 'Start Simulation' : 'Resume'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn btn-outline flex-1">
                      <Pause size={20}/> Pause
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating||!isRunning} className="btn btn-outline flex-1">
                    <FastForward size={20}/> Fast Forward
                  </button>
                  <button onClick={reset} className="btn btn-outline px-4" aria-label="Reset Simulation"><RotateCcw size={20}/></button>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn btn-orange flex-shrink-0">
                    <Zap size={20}/> Inject Event
                  </button>
                  <div className="flex-1 flex gap-2">
                    <input value={advisoryText} onChange={e=>setAdvisoryText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}}
                      placeholder="Type directive to agents..." disabled={isDebating}
                      className="input-field" aria-label="Directive input"/>
                    <button onClick={()=>{if(advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}} disabled={!advisoryText.trim()||isDebating}
                      className="btn btn-navy" aria-label="Send directive">
                      <Send size={20}/>
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-4 flex gap-2 flex-wrap overflow-hidden">
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={()=>{crisis(e);setShowCrisis(false);}} className="btn btn-outline py-2 px-3 text-sm">
                          {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── ROW 2: Map & Agents ── */}
            <div className="grid grid-cols-12 gap-6 min-h-[500px]">
              
              {/* City Map */}
              <div className="col-span-5 flex flex-col min-h-0">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </div>

              {/* Agent Communications */}
              <div className="col-span-7 flex flex-col min-h-0">
                <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
              </div>
            </div>

            {/* ── ROW 3: Charts & Indicators ── */}
            <div className="grid grid-cols-12 gap-6">
              
              {/* Epidemic Curve */}
              <div className="col-span-7 card p-6">
                <div className="mb-4">
                  <h3 className="text-lg">Epidemic Curve</h3>
                  <p className="text-sm text-muted">Infected vs Recovered populations over time.</p>
                </div>
                {history.length > 2 ? (
                  <div style={{height: '240px'}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history.slice(-60)} margin={{top:10,right:10,bottom:0,left:0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                        <XAxis dataKey="day" tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(val) => val > 1000 ? (val/1000).toFixed(0)+'k' : val} tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip/>}/>
                        <Area type="monotone" dataKey="infected" stroke="var(--color-danger)" fill="var(--color-danger)" fillOpacity={0.1} strokeWidth={3} />
                        <Area type="monotone" dataKey="recovered" stroke="var(--color-safe)" fill="var(--color-safe)" fillOpacity={0.1} strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-muted bg-main rounded-md border border-border-color">
                    Insufficient data for chart generation.
                  </div>
                )}
                <div className="flex gap-6 mt-4 justify-center">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-danger"/> <span className="text-sm font-medium">Infected</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-safe"/> <span className="text-sm font-medium">Recovered</span></div>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="col-span-5 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-6 flex-1">
                  <div className="card p-6 flex flex-col justify-center text-center">
                    <TrendingUp size={24} className="mx-auto text-info mb-2"/>
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Economy Index</h3>
                    <div className="text-3xl font-bold text-navy">{Math.round(cs.economyIndex)}/100</div>
                  </div>
                  <div className="card p-6 flex flex-col justify-center text-center">
                    <Shield size={24} className="mx-auto text-safe mb-2"/>
                    <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-1">Public Morale</h3>
                    <div className="text-3xl font-bold text-navy">{Math.round(cs.publicMorale)}/100</div>
                  </div>
                </div>

                <div className="card p-6 grid grid-cols-3 divide-x divide-border-color">
                  <div className="text-center px-2">
                    <h3 className="text-sm font-semibold text-muted mb-1">Infected Sectors</h3>
                    <div className="text-2xl font-bold text-navy">{cs.activeZones} <span className="text-sm font-normal text-muted">/ 36</span></div>
                  </div>
                  <div className="text-center px-2">
                    <h3 className="text-sm font-semibold text-muted mb-1">In Lockdown</h3>
                    <div className="text-2xl font-bold text-orange">{cs.lockdownZones}</div>
                  </div>
                  <div className="text-center px-2">
                    <h3 className="text-sm font-semibold text-muted mb-1">Hospital Load</h3>
                    <div className={`text-2xl font-bold ${cs.hospitalLoad > cs.hospitalCapacity ? 'text-danger' : 'text-safe'}`}>
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
    <div className="card p-4 shadow-md">
      <p className="font-bold mb-2">Day {payload[0].payload.day}</p>
      {payload.map((p,i) => (
        <div key={i} className="flex justify-between gap-4 mb-1 text-sm font-medium">
          <span style={{color: p.stroke}} className="capitalize">{p.dataKey}</span>
          <span>{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
