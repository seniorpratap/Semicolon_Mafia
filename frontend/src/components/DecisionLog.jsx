import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Shield, Activity, Zap, FileText } from 'lucide-react';
import { AGENTS } from '../engine/agents';

export default function DecisionLog({ debates }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!debates || debates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-12">
        <div className="w-20 h-20 border-2 border-dashed border-white/10 rounded-full flex items-center justify-center mb-6">
          <FileText size={32} className="opacity-20" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-[0.3em] opacity-30">Archive Empty</h2>
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest mt-4 opacity-50 text-center max-w-xs">
          Council decisions will be recorded here as the simulation progresses.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8 border-b pb-4" style={{ borderColor: 'var(--t-border)' }}>
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-accent" />
          <h2 className="text-lg font-black uppercase tracking-widest" style={{ color: 'var(--t-text)' }}>Decision Archive</h2>
        </div>
        <div className="text-[10px] font-mono font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 rounded-full border border-white/10" style={{ color: 'var(--t-muted)' }}>
          {debates.length} Records Secured
        </div>
      </div>

      <div className="space-y-3">
        {[...debates].reverse().map((debate, index) => {
          const realIndex = debates.length - 1 - index;
          const isExpanded = expandedId === realIndex;

          return (
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border rounded-xl overflow-hidden transition-all"
              style={{ 
                borderColor: isExpanded ? 'var(--t-accent)' : 'var(--t-border)', 
                background: isExpanded ? 'rgba(255,255,255,0.02)' : 'var(--t-panel)',
                boxShadow: isExpanded ? '0 10px 30px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : realIndex)}
                className="w-full flex items-center gap-6 px-6 py-5 text-left transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Clock size={14} className="text-muted" />
                  <span className="text-sm font-black font-mono tracking-tighter" style={{ color: 'var(--t-text)' }}>DAY_{String(debate.day).padStart(3, '0')}</span>
                </div>

                {debate.userAdvisory && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 border border-orange-500/30 rounded text-orange-500 flex-shrink-0">
                    <Zap size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Directive</span>
                  </div>
                )}

                <div className="flex-1 text-[11px] font-mono font-bold opacity-60 truncate">
                  {debate.coordinator?.substring(0, 100)}...
                </div>

                <div className="flex-shrink-0 w-8 flex justify-end">
                  {isExpanded
                    ? <ChevronDown size={18} className="text-accent" />
                    : <ChevronRight size={18} className="opacity-30" />
                  }
                </div>
              </button>

              {/* Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-8 space-y-6 border-t" style={{ borderColor: 'var(--t-border)' }}>
                      {/* Advisory */}
                      {debate.userAdvisory && (
                        <div className="mt-6 p-4 border-l-4 border-orange-500 bg-orange-500/5 rounded-r-lg">
                          <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 text-orange-500 flex items-center gap-2">
                            <MessageSquare size={10} /> Commander's Directive
                          </div>
                          <p className="text-sm font-bold italic" style={{ color: 'var(--t-text)' }}>"{debate.userAdvisory}"</p>
                        </div>
                      )}

                      {/* Agent Analysis */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {['health', 'economy', 'safety'].map(agentId => {
                          const msg = debate[agentId];
                          if (!msg || msg === 'thinking') return null;
                          const agent = AGENTS[agentId];

                          return (
                            <div key={agentId} className="p-4 rounded-xl border bg-white/5" style={{ borderColor: 'var(--t-border)' }}>
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'var(--t-border)' }}>
                                <span className="text-lg">{agent.emoji}</span>
                                <div>
                                  <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: agent.color }}>{agent.name}</div>
                                  <div className="text-[8px] font-mono font-bold uppercase tracking-widest opacity-40">{agent.role}</div>
                                </div>
                              </div>
                              <p className="text-[11px] font-mono leading-relaxed opacity-70" style={{ color: 'var(--t-text)' }}>{msg}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coordinator Final Decision */}
                      {debate.coordinator && debate.coordinator !== 'thinking' && (
                        <div className="p-6 border-2 rounded-xl" style={{ borderColor: 'var(--t-accent)', background: 'var(--t-accent-low)' }}>
                          <div className="flex items-center gap-2 mb-4">
                            <Shield size={16} className="text-accent" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: 'var(--t-text)' }}>Tactical Execution Order — Coordinator</span>
                          </div>
                          <p className="text-xs font-mono font-bold leading-loose whitespace-pre-wrap" style={{ color: 'var(--t-text)' }}>
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
