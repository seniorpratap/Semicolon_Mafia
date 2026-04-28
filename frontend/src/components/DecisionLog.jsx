import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Shield, FileText } from 'lucide-react';
import { useState } from 'react';
import { AGENTS } from '../engine/agents';

export default function DecisionLog({ debates }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!debates || debates.length === 0) {
    return (
      <div className="bento p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-color-primary pb-2" style={{borderColor: 'var(--border-color)'}}>
          <FileText size={16} className="text-primary" />
          <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest">ACTION REPORT ARCHIVE</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-16" style={{opacity: 0.5}}>
          <FileText size={32} className="text-primary mb-4 animate-pulse" />
          <p className="text-[10px] font-mono text-muted text-center tracking-widest uppercase">
            NO RECORDS FOUND.<br/>ARCHIVE WILL POPULATE DURING SIMULATION RUN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bento p-6">
      <div className="flex items-center justify-between mb-6 border-b border-color-primary pb-2" style={{borderColor: 'var(--border-color)'}}>
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-primary" />
          <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-widest">ACTION REPORT ARCHIVE</h3>
        </div>
        <span className="text-[10px] text-muted font-mono tracking-widest uppercase">RECORDS: {debates.length}</span>
      </div>

      <div style={{maxHeight: 'calc(100vh - 220px)'}} className="overflow-y-auto space-y-3 pr-2">
        {[...debates].reverse().map((debate, index) => {
          const realIndex = debates.length - 1 - index;
          const isExpanded = expandedId === realIndex;

          return (
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{background: 'var(--bg-core)', border: '1px solid var(--border-color)', position: 'relative'}}
            >
              <div style={{position: 'absolute', top: 0, left: 0, bottom: 0, width: '4px', background: isExpanded ? 'var(--color-primary)' : 'var(--color-primary-dim)'}} />
              
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : realIndex)}
                className="w-full flex items-center p-3 text-left pl-4"
                style={{gap: '12px', background: isExpanded ? 'rgba(57, 255, 20, 0.05)' : 'transparent'}}
              >
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-primary" />
                  <span className="font-mono font-bold text-primary" style={{fontSize: '0.75rem'}}>T+{String(debate.day).padStart(4,'0')}</span>
                </div>

                {debate.userAdvisory && (
                  <span className="badge badge-solid" style={{borderColor: 'var(--color-accent)', color: 'var(--color-accent)'}}>
                    <MessageSquare size={10} />
                    <span>DIRECTIVE</span>
                  </span>
                )}

                <span className="flex-1 text-muted font-mono truncate px-2" style={{fontSize: '0.7rem'}}>
                  {debate.coordinator?.substring(0, 80)}...
                </span>

                {isExpanded
                  ? <ChevronDown size={14} className="text-primary flex-shrink-0" />
                  : <ChevronRight size={14} className="text-primary flex-shrink-0" />
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
                    <div className="px-4 pb-4 mt-2 pl-6" style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                      {/* Advisory */}
                      {debate.userAdvisory && (
                        <div style={{padding: '10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)'}}>
                          <div className="flex items-center mb-1" style={{gap: '8px'}}>
                            <span className="font-mono font-bold text-accent uppercase tracking-widest" style={{fontSize: '0.65rem'}}>&gt; EXTERNAL DIRECTIVE</span>
                          </div>
                          <p className="text-accent font-mono leading-relaxed" style={{fontSize: '0.75rem'}}>"{debate.userAdvisory}"</p>
                        </div>
                      )}

                      {/* Agent Responses */}
                      {['health', 'economy', 'safety'].map(agentId => {
                        const msg = debate[agentId];
                        if (!msg || msg === 'thinking') return null;
                        const agent = AGENTS[agentId];

                        const colorMap = {
                          0: { border: 'var(--color-danger)' },
                          1: { border: 'var(--color-warning)' },
                          2: { border: 'var(--color-accent)' },
                          3: { border: 'var(--color-primary)' },
                        };
                        const c = colorMap[agentId] || { border: 'var(--border-color)' };

                        return (
                          <div
                            key={agentId}
                            style={{
                              padding: '10px',
                              borderLeft: `2px solid ${c.border}`,
                              background: 'rgba(0,0,0,0.3)',
                            }}
                          >
                            <div className="flex items-center mb-1" style={{gap: '8px'}}>
                              <span className="font-bold font-mono tracking-widest" style={{ color: c.border, fontSize: '0.65rem' }}>
                                [{agent?.name || 'AGENT'}]
                              </span>
                              <span className="text-muted font-mono uppercase tracking-widest" style={{fontSize: '0.6rem'}}>// {agent?.role || 'ADVISOR'}</span>
                            </div>
                            <p className="text-main font-mono leading-relaxed" style={{fontSize: '0.75rem'}}>{msg}</p>
                          </div>
                        );
                      })}

                      {/* Coordinator Final Decision */}
                      {debate.coordinator && debate.coordinator !== 'thinking' && (
                        <div style={{padding: '12px', background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)'}}>
                          <div className="flex items-center mb-2" style={{gap: '8px'}}>
                            <Shield size={12} className="text-primary" />
                            <span className="font-bold font-mono text-primary uppercase tracking-widest" style={{fontSize: '0.65rem'}}>
                              EXECUTION ORDER // COORDINATOR
                            </span>
                          </div>
                          <p className="text-bright font-mono leading-relaxed whitespace-pre-wrap" style={{fontSize: '0.75rem'}}>
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
