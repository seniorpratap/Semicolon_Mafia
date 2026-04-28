import { motion, AnimatePresence } from 'framer-motion';
import { useAnimatedNumber } from '../hooks/useEffects';
import { MapPin, AlertCircle, X, Maximize2, Minimize2 } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';

const HEX_W = 72;
const HEX_H = 62;

const NODE_POSITIONS = [
  {x:300,y:200},{x:370,y:160},{x:370,y:240},{x:230,y:160},{x:230,y:240},{x:300,y:130},
  {x:300,y:270},{x:420,y:200},{x:180,y:200},{x:340,y:100},{x:260,y:100},{x:420,y:130},
  {x:160,y:130},{x:440,y:270},{x:160,y:270},{x:440,y:130},{x:300,y:50},{x:300,y:340},
  {x:500,y:200},{x:100,y:200},{x:200,y:310},{x:400,y:310},{x:200,y:80},{x:400,y:80},
  {x:80,y:130},{x:520,y:130},{x:80,y:270},{x:520,y:270},{x:140,y:50},{x:460,y:50},
  {x:140,y:350},{x:460,y:350},{x:50,y:200},{x:550,y:200},{x:300,y:380},{x:300,y:20},
];

const CONNECTIONS = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],
  [1,5],[1,11],[2,6],[2,13],[3,4],[3,8],[4,6],[5,10],
  [7,1],[7,11],[7,15],[8,3],[8,12],[8,14],
  [9,5],[9,10],[9,16],[10,16],[10,22],
  [11,15],[11,23],[12,19],[12,24],[13,14],[13,20],
  [15,25],[14,26],[16,35],[17,6],[17,20],[17,30],
  [18,7],[18,25],[19,8],[19,32],[21,18],[21,27],
  [22,9],[22,28],[23,21],[23,29],
];

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const animInfected = useAnimatedNumber(totalInfected);

  const getNodeStyle = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.15) return { fill: '#ef4444', glow: '#ef4444', intensity: 0.8 };
    if (rate > 0.08) return { fill: '#f97316', glow: '#f97316', intensity: 0.6 };
    if (rate > 0.03) return { fill: '#eab308', glow: '#eab308', intensity: 0.4 };
    if (rate > 0.005 || zone.infected > 0) return { fill: '#84cc16', glow: '#84cc16', intensity: 0.25 };
    return { fill: '#34d399', glow: '#34d399', intensity: 0.15 };
  };

  const getNodeSize = (zone) => {
    const base = 14;
    const popScale = (zone.population / 50000) * 6;
    const infScale = zone.infected > 0 ? Math.min((zone.infected / 200) * 3, 8) : 0;
    return base + popScale + infScale;
  };

  const handleCardClick = (e) => {
    // Don't toggle if clicking a zone node
    if (e.target.closest('.zone-node')) return;
    setIsExpanded(!isExpanded);
  };

  const handleBackdropClick = () => {
    setIsExpanded(false);
  };

  const renderMap = (expanded) => (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <svg viewBox="0 0 600 400" className="w-full" style={{ height: expanded ? '70vh' : '340px', transition: 'height 0.5s ease' }}>
        <defs>
          {zones.map((zone, i) => {
            const style = getNodeStyle(zone);
            return (
              <filter key={`glow-${i}`} id={`glow${expanded?'e':'c'}-${i}`} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation={zone.infected > 0 ? 4 + style.intensity * 6 : 2} result="blur" />
                <feFlood floodColor={style.glow} floodOpacity={style.intensity} result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            );
          })}
        </defs>

        {/* Connection lines */}
        {CONNECTIONS.map(([a, b], i) => {
          if (!NODE_POSITIONS[a] || !NODE_POSITIONS[b]) return null;
          const pa = NODE_POSITIONS[a], pb = NODE_POSITIONS[b];
          const hot = zones[a]?.infected > 0 && zones[b]?.infected > 0;
          return (
            <line key={`c-${i}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
              stroke={hot ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.08)'}
              strokeWidth={hot ? 1.5 : 0.5} />
          );
        })}

        {/* Nodes */}
        {zones.map((zone, i) => {
          if (!NODE_POSITIONS[i]) return null;
          const pos = NODE_POSITIONS[i];
          const style = getNodeStyle(zone);
          const size = getNodeSize(zone);
          const isSelected = selectedZone?.id === zone.id;
          const isPulsing = zone.infected > 100;

          return (
            <g key={zone.id} className="zone-node cursor-pointer" onClick={(e) => { e.stopPropagation(); onZoneClick?.(zone); }}>
              {isPulsing && (
                <circle cx={pos.x} cy={pos.y} r={size + 6} fill="none" stroke={style.fill} strokeWidth="1" opacity="0.4">
                  <animate attributeName="r" from={size + 2} to={size + 14} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {isSelected && (
                <circle cx={pos.x} cy={pos.y} r={size + 4} fill="none" stroke="white" strokeWidth="2" strokeDasharray="3,3" opacity="0.6">
                  <animateTransform attributeName="transform" type="rotate" from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`} dur="8s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={pos.x} cy={pos.y} r={size} fill={style.fill}
                filter={`url(#glow${expanded?'e':'c'}-${i})`} opacity={0.9} className="transition-all duration-500" />
              <circle cx={pos.x - size * 0.2} cy={pos.y - size * 0.2} r={size * 0.4} fill="white" opacity="0.15" />
              <text x={pos.x} y={pos.y - 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={expanded ? "8" : "7"} fontWeight="700" fontFamily="Montserrat" opacity="0.9">
                {zone.name.length > 7 ? zone.name.substring(0, 6) : zone.name}
              </text>
              {zone.infected > 0 && (
                <text x={pos.x} y={pos.y + 8} textAnchor="middle"
                  fill="white" fontSize={expanded ? "9" : "8"} fontWeight="900" fontFamily="JetBrains Mono" opacity="0.95">
                  {zone.infected > 1000 ? `${(zone.infected / 1000).toFixed(1)}k` : zone.infected}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none" />

      {/* Expand/Collapse hint */}
      <div className="absolute top-3 right-3 text-white/30 hover:text-white/70 transition-colors">
        {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </div>
    </div>
  );

  return (
    <>
      {/* Normal (collapsed) card */}
      <motion.div
        className="bento overflow-hidden cursor-pointer"
        onClick={handleCardClick}
        layoutId="city-grid-card"
        style={{ opacity: isExpanded ? 0 : 1, pointerEvents: isExpanded ? 'none' : 'auto' }}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <MapPin size={14} className="text-emerald-600" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800">City Network</span>
              <span className="text-[10px] text-slate-400 ml-2">Click to expand</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black font-mono text-red-500">{animInfected.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">infected</span>
          </div>
        </div>

        <div className="mx-3 mb-3">
          {renderMap(false)}
        </div>

        <div className="flex justify-center gap-5 px-5 pb-3">
          {[
            { l: 'Safe', c: '#34d399' }, { l: 'Low', c: '#84cc16' },
            { l: 'Medium', c: '#eab308' }, { l: 'High', c: '#f97316' }, { l: 'Critical', c: '#ef4444' },
          ].map(({ l, c }) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}40` }} />
              <span className="text-[9px] text-slate-400 font-medium">{l}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Expanded overlay */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />

            {/* Expanded Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-6 z-[201] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={handleCardClick}
            >
              {/* Expanded Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <MapPin size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-lg font-bold text-slate-900">City Network Map</span>
                    <span className="text-xs text-slate-400 ml-3">36 sectors · Interactive</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-5">
                    {[
                      { l: 'Safe', c: '#34d399' }, { l: 'Low', c: '#84cc16' },
                      { l: 'Medium', c: '#eab308' }, { l: 'High', c: '#f97316' }, { l: 'Critical', c: '#ef4444' },
                    ].map(({ l, c }) => (
                      <div key={l} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}40` }} />
                        <span className="text-[10px] text-slate-500 font-medium">{l}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono text-red-500">{animInfected.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">infected</span>
                  </div>
                  <button onClick={handleBackdropClick} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Expanded Map */}
              <div className="flex-1 flex min-h-0">
                <div className="flex-1 p-4">
                  {renderMap(true)}
                </div>

                {/* Side panel for selected zone */}
                <div className="w-80 border-l border-slate-100 p-5 overflow-y-auto">
                  {selectedZone ? (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle size={16} className="text-emerald-500" />
                        <span className="text-lg font-bold text-slate-900">{selectedZone.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mb-4">SECTOR-{String(selectedZone.id).padStart(3, '0')}</div>

                      <div className="space-y-4">
                        <StatRow label="Population" value={selectedZone.population.toLocaleString()} color="text-slate-800" />
                        <StatRow label="Infected" value={selectedZone.infected.toLocaleString()} color="text-red-600" />
                        <StatRow label="Recovered" value={selectedZone.recovered.toLocaleString()} color="text-emerald-600" />
                        <StatRow label="Deceased" value={selectedZone.deceased.toLocaleString()} color="text-slate-500" />

                        {selectedZone.hospitalCapacity > 0 && (
                          <div className="pt-3 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-semibold text-slate-500">Hospital Capacity</span>
                              <span className="text-xs font-mono font-bold text-slate-700">
                                {selectedZone.hospitalOccupancy}/{selectedZone.hospitalCapacity}
                              </span>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${selectedZone.hospitalOccupancy > selectedZone.hospitalCapacity ? 'bg-red-500' : 'bg-emerald-400'}`}
                                style={{ width: `${Math.min(100, (selectedZone.hospitalOccupancy / selectedZone.hospitalCapacity) * 100)}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-slate-500">Lockdown Level</span>
                            <span className={`text-xs font-bold ${selectedZone.lockdownLevel > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {selectedZone.lockdownLevel === 0 ? 'None' : selectedZone.lockdownLevel === 1 ? 'Partial' : 'Full'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-500">Vaccination</span>
                            <span className="text-xs font-bold text-blue-500">
                              {selectedZone.vaccinationRate ? `${Math.round(selectedZone.vaccinationRate * 100)}%` : '0%'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                      <MapPin size={32} className="mb-3 text-slate-200" />
                      <span className="text-sm font-medium text-slate-400">Select a sector</span>
                      <span className="text-[10px] text-slate-300 mt-1">Click any node on the map</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-base font-black font-mono ${color}`}>{value}</span>
    </div>
  );
}
