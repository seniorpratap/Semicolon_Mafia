import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Shield } from 'lucide-react';
import { useState } from 'react';
import { AGENTS } from '../engine/agents';

export default function DecisionLog({ debates }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!debates || debates.length === 0) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm">📋</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Decision History</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16 opacity-30">
          <div className="text-4xl mb-4 animate-float">📋</div>
          <p className="text-xs text-slate-500 text-center max-w-[250px] leading-relaxed">
            All council decisions and reasoning chains will be recorded here as the simulation progresses
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Decision History</h3>
        </div>
        <span className="text-[10px] text-slate-600 font-mono">{debates.length} decisions recorded</span>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 scrollbar-thin">
        {[...debates].reverse().map((debate, index) => {
          const realIndex = debates.length - 1 - index;
          const isExpanded = expandedId === realIndex;

          return (
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface/40 rounded-xl border border-white/[0.04] overflow-hidden"
            >
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : realIndex)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-slate-600" />
                  <span className="text-[11px] font-mono font-bold text-primary-light">Day {debate.day}</span>
                </div>

                {debate.userAdvisory && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/15 rounded-full">
                    <MessageSquare size={9} className="text-cyan-400" />
                    <span className="text-[9px] text-cyan-400 font-medium">Advisory</span>
                  </span>
                )}

                <span className="flex-1 text-[10px] text-slate-500 truncate px-2">
                  {debate.coordinator?.substring(0, 80)}...
                </span>

                {isExpanded
                  ? <ChevronDown size={13} className="text-slate-600 flex-shrink-0" />
                  : <ChevronRight size={13} className="text-slate-600 flex-shrink-0" />
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
                    <div className="px-4 pb-4 space-y-3">
                      {/* Advisory */}
                      {debate.userAdvisory && (
                        <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px]">🗣️</span>
                            <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wider">External Advisory</span>
                          </div>
                          <p className="text-[11px] text-cyan-300/70 leading-relaxed pl-4">"{debate.userAdvisory}"</p>
                        </div>
                      )}

                      {/* Agent Responses */}
                      {['health', 'economy', 'safety'].map(agentId => {
                        const msg = debate[agentId];
                        if (!msg || msg === 'thinking') return null;
                        const agent = AGENTS[agentId];

                        return (
                          <div
                            key={agentId}
                            className="p-3 rounded-xl border-l-2"
                            style={{
                              borderLeftColor: agent.color,
                              background: `${agent.color}05`,
                            }}
                          >
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[10px]">{agent.emoji}</span>
                              <span className="text-[10px] font-semibold" style={{ color: agent.color }}>
                                {agent.name}
                              </span>
                              <span className="text-[8px] text-slate-600">— {agent.role}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-[1.7] pl-5">{msg}</p>
                          </div>
                        );
                      })}

                      {/* Coordinator Final Decision */}
                      {debate.coordinator && debate.coordinator !== 'thinking' && (
                        <div className="p-4 bg-purple-500/5 border border-purple-500/15 rounded-xl glow-primary">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Shield size={12} className="text-purple-400" />
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                              Final Decision — Coordinator
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-[1.8] whitespace-pre-wrap pl-1">
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
