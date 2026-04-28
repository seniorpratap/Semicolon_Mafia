import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Shield } from 'lucide-react';
import { AGENTS } from '../engine/agents';

/**
 * DecisionLog — tactical-themed decision history.
 * Matches the dark command center aesthetic with #2a2a2a borders, Inter/JetBrains Mono fonts.
 */
export default function DecisionLog({ debates }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!debates || debates.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="tac-panel-header" style={{ borderBottom: 'none' }}>
          <span>Decision History</span>
        </div>
        <div className="flex flex-col items-center justify-center py-20" style={{ color: '#3a3a3a' }}>
          <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center mb-4"
            style={{ borderColor: '#2a2a2a' }}>
            <Shield size={24} style={{ color: '#3a3a3a' }} />
          </div>
          <span className="text-sm font-mono" style={{ color: '#4b5563' }}>
            Council decisions will be recorded here as the simulation progresses.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="tac-panel-header" style={{ borderBottom: 'none', padding: 0 }}>
          <span>Decision History</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color: '#6b7280' }}>
          {debates.length} decision{debates.length !== 1 ? 's' : ''} recorded
        </span>
      </div>

      <div className="space-y-2">
        {[...debates].reverse().map((debate, index) => {
          const realIndex = debates.length - 1 - index;
          const isExpanded = expandedId === realIndex;

          return (
            <div key={realIndex} className="border" style={{ borderColor: '#2a2a2a', background: '#0a0a0a' }}>
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : realIndex)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-1.5">
                  <Clock size={11} style={{ color: '#6b7280' }} />
                  <span className="text-[11px] font-mono font-bold text-white">Day {debate.day}</span>
                </div>

                {debate.userAdvisory && (
                  <span className="flex items-center gap-1 px-2 py-0.5 border" style={{ borderColor: '#2a2a2a' }}>
                    <MessageSquare size={9} style={{ color: '#3b82f6' }} />
                    <span className="text-[8px] font-mono font-bold uppercase" style={{ color: '#3b82f6' }}>Advisory</span>
                  </span>
                )}

                <span className="flex-1 text-[10px] font-mono truncate px-2" style={{ color: '#6b7280' }}>
                  {debate.coordinator?.substring(0, 80)}...
                </span>

                {isExpanded
                  ? <ChevronDown size={13} style={{ color: '#6b7280', flexShrink: 0 }} />
                  : <ChevronRight size={13} style={{ color: '#6b7280', flexShrink: 0 }} />
                }
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: '#2a2a2a' }}>
                      {/* Advisory */}
                      {debate.userAdvisory && (
                        <div className="mt-3 px-3 py-2 border-l-2" style={{ borderLeftColor: '#3b82f6', background: '#0f0f0f' }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px]">🗣️</span>
                            <span className="text-[9px] font-mono font-bold uppercase tracking-[0.1em]" style={{ color: '#3b82f6' }}>
                              External Advisory
                            </span>
                          </div>
                          <p className="text-[11px] font-mono leading-relaxed pl-4" style={{ color: '#9ca3af' }}>
                            "{debate.userAdvisory}"
                          </p>
                        </div>
                      )}

                      {/* Agent Responses */}
                      {['health', 'economy', 'safety'].map(agentId => {
                        const msg = debate[agentId];
                        if (!msg || msg === 'thinking') return null;
                        const agent = AGENTS[agentId];

                        return (
                          <div key={agentId} className="mt-2 px-3 py-3 border-l-2" style={{
                            borderLeftColor: agent.color,
                            background: '#0f0f0f'
                          }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[11px]">{agent.emoji}</span>
                              <span className="text-[10px] font-bold" style={{ color: agent.color }}>
                                {agent.name}
                              </span>
                              <span className="text-[8px] font-mono" style={{ color: '#6b7280' }}>— {agent.role}</span>
                            </div>
                            <p className="text-[11px] font-mono leading-[1.7] pl-5" style={{ color: '#9ca3af' }}>{msg}</p>
                          </div>
                        );
                      })}

                      {/* Coordinator Final Decision */}
                      {debate.coordinator && debate.coordinator !== 'thinking' && (
                        <div className="mt-2 px-4 py-3 border" style={{ borderColor: '#8b5cf6', background: 'rgba(139,92,246,0.04)' }}>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Shield size={12} style={{ color: '#8b5cf6' }} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: '#8b5cf6' }}>
                              Final Decision — Coordinator
                            </span>
                          </div>
                          <p className="text-[11px] font-mono leading-[1.8] whitespace-pre-wrap" style={{ color: '#d1d5db' }}>
                            {debate.coordinator}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
