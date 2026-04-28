import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, MessageSquare, Shield, FileText, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { AGENTS } from '../engine/agents';

export default function DecisionLog({ debates }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!debates || debates.length === 0) {
    return (
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-8 border-b border-border-color pb-4">
          <FileText size={24} className="text-navy" />
          <h2 className="text-xl font-bold text-navy">Decision History</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-muted">
          <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center mb-4">
            <FileText size={32} className="text-muted opacity-50" />
          </div>
          <h3 className="text-lg font-semibold text-navy mb-2">No Records Found</h3>
          <p className="text-sm">Action logs will appear here once the simulation starts generating decisions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center justify-between mb-8 border-b border-border-color pb-4">
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-navy" />
          <h2 className="text-xl font-bold text-navy">Decision History</h2>
        </div>
        <div className="badge bg-main text-muted border border-border-color">
          {debates.length} Records
        </div>
      </div>

      <div style={{maxHeight: 'calc(100vh - 240px)'}} className="overflow-y-auto space-y-4 pr-4">
        {[...debates].reverse().map((debate, index) => {
          const realIndex = debates.length - 1 - index;
          const isExpanded = expandedId === realIndex;

          return (
            <motion.div
              key={realIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border-color rounded-lg overflow-hidden bg-surface transition-shadow hover:shadow-sm"
            >
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : realIndex)}
                className={`w-full flex items-center p-4 text-left transition-colors ${isExpanded ? 'bg-main' : 'hover:bg-main'}`}
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-2 w-24 flex-shrink-0">
                  <Clock size={16} className="text-muted" />
                  <span className="font-semibold text-navy">Day {debate.day}</span>
                </div>

                {debate.userAdvisory && (
                  <div className="flex-shrink-0 mr-4">
                    <span className="badge bg-orange bg-opacity-10 text-orange border border-orange border-opacity-20">
                      <MessageSquare size={12} /> User Directive
                    </span>
                  </div>
                )}

                <div className="flex-1 text-muted text-sm truncate px-4 font-medium">
                  {debate.coordinator?.substring(0, 80)}...
                </div>

                <div className="flex-shrink-0 w-8 flex justify-end">
                  {isExpanded
                    ? <ChevronDown size={20} className="text-navy" />
                    : <ChevronRight size={20} className="text-muted" />
                  }
                </div>
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
                    <div className="p-6 border-t border-border-color bg-surface flex flex-col gap-6">
                      
                      {/* Advisory */}
                      {debate.userAdvisory && (
                        <div className="p-4 bg-orange bg-opacity-5 border border-orange border-opacity-20 rounded-md">
                          <h4 className="text-sm font-bold text-orange uppercase tracking-wide mb-2 flex items-center gap-2">
                            <MessageSquare size={16} /> Commander Directive
                          </h4>
                          <p className="text-navy font-medium">"{debate.userAdvisory}"</p>
                        </div>
                      )}

                      {/* Agent Responses */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['health', 'economy', 'safety'].map(agentId => {
                          const msg = debate[agentId];
                          if (!msg || msg === 'thinking') return null;
                          const agent = AGENTS[agentId];

                          const colorMap = {
                            0: { color: 'var(--color-danger)' },
                            1: { color: 'var(--color-orange)' },
                            2: { color: 'var(--color-navy)' },
                          };
                          const c = colorMap[agentId] || { color: 'var(--color-navy)' };

                          return (
                            <div key={agentId} className="p-4 rounded-md border border-border-color bg-main">
                              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border-color">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: c.color}}></span>
                                <span className="font-bold text-navy text-sm">{agent?.name}</span>
                              </div>
                              <p className="text-muted text-sm leading-relaxed">{msg}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Coordinator Final Decision */}
                      {debate.coordinator && debate.coordinator !== 'thinking' && (
                        <div className="p-6 bg-info bg-opacity-5 border border-info border-opacity-20 rounded-md">
                          <h4 className="text-sm font-bold text-info uppercase tracking-wide mb-3 flex items-center gap-2">
                            <CheckCircle size={18} /> Final Coordinator Decision
                          </h4>
                          <p className="text-navy font-medium leading-relaxed whitespace-pre-wrap">
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
