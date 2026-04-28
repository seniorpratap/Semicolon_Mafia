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
          
          <div className="flex items-center gap-2 pl-4 border-l border-white border-opacity-20">
            <div className="text-right flex items-center gap-2">
              <div className="text-xs text-white opacity-80 uppercase font-semibold">Threat Level:</div>
              <div className="badge bg-surface" style={{color: threatState.color}}>
                {threatState.icon} {threatState.level}
              </div>
            </div>
          </div>

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

      <main className="main-content">
        <div className="dashboard-container h-full">

          {/* ── 3-COLUMN LAYOUT ── */}
          <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 h-full">
            
            {/* ── LEFT COLUMN (3/12): Map & Controls ── */}
            <div className="col-span-3 flex flex-col gap-4 min-h-0 h-full">
              {/* City Map */}
              <div className="flex-1 min-h-0 flex flex-col">
                <CityGrid zones={simState.zones} onZoneClick={setSelectedZone} selectedZone={selectedZone}/>
              </div>

              {/* Controls Panel */}
              <div className="card p-4 flex-shrink-0 flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wide text-muted border-b border-border-color pb-2">Sim Controls</h3>
                <div className="grid grid-cols-2 gap-2">
                  {!isRunning || isPaused ? (
                    <button onClick={play} disabled={isDebating} className="btn btn-navy">
                      <Play size={14}/> {simState.day === 0 ? 'Start' : 'Resume'}
                    </button>
                  ) : (
                    <button onClick={pause} className="btn btn-outline">
                      <Pause size={14}/> Pause
                    </button>
                  )}
                  <button onClick={handleAdvance} disabled={isDebating||!isRunning} className="btn btn-outline">
                    <FastForward size={14}/> Skip 5 Days
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setShowCrisis(!showCrisis)} className="btn btn-orange col-span-1">
                    <Zap size={14}/> Inject Event
                  </button>
                  <button onClick={reset} className="btn btn-outline col-span-1" aria-label="Reset"><RotateCcw size={14}/> Reset</button>
                </div>
                
                <AnimatePresence>
                  {showCrisis && (
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="flex flex-col gap-2 overflow-hidden pt-1">
                      {CRISIS_EVENTS.map(e => (
                        <button key={e.id} onClick={()=>{crisis(e);setShowCrisis(false);}} className="btn btn-outline py-1 px-2 text-xs text-left justify-start">
                          <AlertTriangle size={12}/> {e.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="border-t border-border-color pt-2 mt-1">
                  <div className="flex flex-col gap-2">
                    <input value={advisoryText} onChange={e=>setAdvisoryText(e.target.value)}
                      onKeyDown={e=>{ if(e.key==='Enter'&&advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}}
                      placeholder="Commander directive..." disabled={isDebating}
                      className="input-field" aria-label="Directive input"/>
                    <button onClick={()=>{if(advisoryText.trim()){advisory(advisoryText.trim());setAdvisoryText('');}}} disabled={!advisoryText.trim()||isDebating}
                      className="btn btn-navy" aria-label="Send">
                      <Send size={14}/> Send Directive
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── CENTER COLUMN (5/12): Agent Hub ── */}
            <div className="col-span-5 flex flex-col min-h-0 h-full">
              <AgentPanel agentMessages={agentMessages} isDebating={isDebating} userAdvisory={latestAdvisory}/>
            </div>

            {/* ── RIGHT COLUMN (4/12): Intelligence & KPIs ── */}
            <div className="col-span-4 flex flex-col gap-4 min-h-0 h-full">
              
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-navy">Live Intelligence</h2>
                <button onClick={() => setShowDecisions(!showDecisions)} className="btn btn-outline py-1 px-3 text-xs">
                  {showDecisions ? 'Hide Logs' : `Decision Logs (${debates.length})`}
                </button>
              </div>

              {showDecisions ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <DecisionLog debates={debates}/>
                </div>
              ) : (
                <>
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                    <div className="card p-3">
                      <div className="text-xs font-semibold text-danger uppercase tracking-wide mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Infected</div>
                      <div className="text-2xl font-black text-danger">{animInf.toLocaleString()}</div>
                    </div>
                    <div className="card p-3">
                      <div className="text-xs font-semibold text-safe uppercase tracking-wide mb-1 flex items-center gap-1"><Heart size={12}/> Recovered</div>
                      <div className="text-2xl font-bold text-safe">{animRec.toLocaleString()}</div>
                    </div>
                    <div className="card p-3">
                      <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-1 flex items-center gap-1"><Users size={12}/> Casualties</div>
                      <div className="text-2xl font-bold text-navy">{animDec.toLocaleString()}</div>
                    </div>
                    <div className="card p-3">
                      <div className="text-xs font-semibold text-navy uppercase tracking-wide mb-1 flex items-center gap-1"><Database size={12}/> Hospital Load</div>
                      <div className={`text-2xl font-bold ${cs.hospitalLoad > cs.hospitalCapacity ? 'text-danger' : 'text-safe'}`}>
                        {Math.round(cs.hospitalLoad / cs.hospitalCapacity * 100) || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Stability Gauges */}
                  <div className="card p-4 flex-shrink-0 flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wide text-muted">Stability Metrics</h3>
                    
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="flex items-center gap-1 text-info"><TrendingUp size={12}/> Economy</span>
                        <span className="text-navy">{Math.round(cs.economyIndex)}/100</span>
                      </div>
                      <div className="w-full bg-main rounded-full h-2 overflow-hidden border border-border-color">
                        <div className="h-full bg-info" style={{width: `${cs.economyIndex}%`}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1 mt-2">
                        <span className="flex items-center gap-1 text-safe"><Shield size={12}/> Public Morale</span>
                        <span className="text-navy">{Math.round(cs.publicMorale)}/100</span>
                      </div>
                      <div className="w-full bg-main rounded-full h-2 overflow-hidden border border-border-color">
                        <div className="h-full bg-safe" style={{width: `${cs.publicMorale}%`}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Epidemic Curve Chart */}
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
                          Insufficient simulation data.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="h-8 flex-shrink-0 bg-navy text-white flex items-center justify-between px-6 text-[10px] uppercase font-semibold tracking-wider opacity-90">
        <div>System: SimulCrisis Engine v2.4</div>
        <div className="flex gap-4">
          <span>Sectors: 36</span>
          <span>Population Model: SIR Advanced</span>
        </div>
        <div>Status: {isRunning ? 'ONLINE' : 'STANDBY'}</div>
      </footer>
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
