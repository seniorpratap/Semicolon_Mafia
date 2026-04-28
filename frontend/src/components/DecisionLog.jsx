import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Shield } from 'lucide-react';
import { useState } from 'react';
import { AGENTS } from '../engine/agents';

export default function DecisionLog({ debates }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!debates || debates.length === 0) {
    return (
      <div className="bento p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm">📋</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Decision History</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16" style={{opacity: 0.3}}>
          <div className="text-4xl mb-4" style={{animation: 'float 3s ease-in-out infinite'}}>📋</div>
          <p className="text-xs text-slate-400 text-center leading-relaxed" style={{maxWidth: '250px'}}>
            All council decisions and reasoning chains will be recorded here as the simulation progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bento p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Decision History</h3>
        </div>
        <span className="text-xs text-slate-500 font-mono" style={{fontSize: '0.65rem'}}>{debates.length} decisions recorded</span>
      </div>

      <div style={{maxHeight: 'calc(100vh - 220px)'}} className="overflow-y-auto space-y-2 pr-2">
        {[...debates].reverse().map((debate, index) => {
          const realIndex = debates.length - 1 - index;
          const isExpanded = expandedId === realIndex;

          return (
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden'}}
            >
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : realIndex)}
                className="w-full flex items-center p-3 text-left"
                style={{gap: '12px', background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent', transition: 'background 0.2s'}}
              >
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-slate-500" />
                  <span className="font-mono font-bold text-emerald-400" style={{fontSize: '0.75rem'}}>Day {debate.day}</span>
                </div>

                {debate.userAdvisory && (
                  <span className="badge badge-solid" style={{backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.6rem'}}>
                    <MessageSquare size={10} className="text-sky-400" />
                    <span>Advisory</span>
                  </span>
                )}

                <span className="flex-1 text-slate-400 truncate px-2" style={{fontSize: '0.7rem'}}>
                  {debate.coordinator?.substring(0, 80)}...
                </span>

                {isExpanded
                  ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />
                  : <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                }
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 mt-2" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      {/* Advisory */}
                      {debate.userAdvisory && (
                        <div style={{padding: '12px', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '12px'}}>
                          <div className="flex items-center mb-2" style={{gap: '6px'}}>
                            <span style={{fontSize: '0.75rem'}}>🗣️</span>
                            <span className="font-semibold text-sky-400 uppercase tracking-wider" style={{fontSize: '0.65rem'}}>External Advisory</span>
                          </div>
                          <p className="text-sky-200 leading-relaxed pl-5" style={{fontSize: '0.75rem'}}>"{debate.userAdvisory}"</p>
                        </div>
                      )}

                      {/* Agent Responses */}
                      {['health', 'economy', 'safety'].map(agentId => {
                        const msg = debate[agentId];
                        if (!msg || msg === 'thinking') return null;
                        const agent = AGENTS[agentId];

                        const colorMap = {
                          0: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)' },
                          1: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)' },
                          2: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.05)' },
                          3: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.05)' },
                        };
                        const c = colorMap[agentId] || { border: '#94a3b8', bg: 'rgba(148, 163, 184, 0.05)' };

                        return (
                          <div
                            key={agentId}
                            style={{
                              padding: '12px', borderRadius: '12px',
                              borderLeft: `2px solid ${c.border}`,
                              background: c.bg,
                            }}
                          >
                            <div className="flex items-center mb-2" style={{gap: '6px'}}>
                              <span style={{fontSize: '0.75rem'}}>{agent?.icon || '🤖'}</span>
                              <span className="font-semibold" style={{ color: c.border, fontSize: '0.75rem' }}>
                                {agent?.name || 'Agent'}
                              </span>
                              <span className="text-slate-500" style={{fontSize: '0.65rem'}}>— {agent?.role || 'Advisor'}</span>
                            </div>
                            <p className="text-slate-400 leading-relaxed pl-5" style={{fontSize: '0.75rem'}}>{msg}</p>
                          </div>
                        );
                      })}

                      {/* Coordinator Final Decision */}
                      {debate.coordinator && debate.coordinator !== 'thinking' && (
                        <div style={{padding: '16px', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '12px', boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)'}}>
                          <div className="flex items-center mb-3" style={{gap: '6px'}}>
                            <Shield size={14} className="text-violet-400" />
                            <span className="font-bold text-violet-400 uppercase tracking-wider" style={{fontSize: '0.65rem'}}>
                              Final Decision — Coordinator
                            </span>
                          </div>
                          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap pl-1" style={{fontSize: '0.75rem'}}>
                            {debate.coordinator}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
