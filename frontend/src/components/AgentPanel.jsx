import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Brain } from 'lucide-react';
import { AGENTS } from '../engine/agents';
import { useTypewriter } from '../hooks/useEffects';

function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  const { displayed, isDone } = useTypewriter(message?.text || '', 15);
  if (!message) return null;

  const colorMap = { 0: '#ef4444', 1: '#f59e0b', 2: '#6366f1', 3: '#a855f7' };
  const color = colorMap[agentId] || '#6b7280';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="border-b px-5 py-4" style={{ borderColor: '#1a1a1a' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 border flex items-center justify-center text-lg"
          style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
          {agent?.icon || '🤖'}
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-white">{agent?.name || 'Agent'}</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color }}>{agent?.role || 'Advisor'}</div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: isDone ? '#10b981' : color, opacity: isDone ? 1 : 0.5 }} />
      </div>

      {!isDone && displayed.length === 0 ? (
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: '#6b7280' }}>
          <Loader2 size={12} className="animate-spin" style={{ color }} />
          <span>thinking</span>
        </div>
      ) : (
        <div className={`text-[13px] leading-relaxed whitespace-pre-wrap ${!isDone ? 'cursor-blink' : ''}`}
          style={{ color: '#d1d5db' }}>
          {displayed}
        </div>
      )}
    </motion.div>
  );
}

export default function AgentPanel({ agentMessages, isDebating, userAdvisory }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="tac-panel-header">
        <span className="flex items-center gap-2">
          <Brain size={14} /> Agent Council
        </span>
        {isDebating && (
          <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-green-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Deliberating
          </span>
        )}
      </div>

      {/* Advisory banner */}
      <AnimatePresence>
        {userAdvisory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="px-5 py-3 border-b overflow-hidden" style={{ borderColor: '#1a1a1a', background: '#0f0f0f' }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.12em] mb-1" style={{ color: '#6b7280' }}>
              Your Advisory
            </div>
            <p className="text-xs italic" style={{ color: '#9ca3af' }}>"{userAdvisory}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-y">
        {agentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: '#3a3a3a' }}>
            <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center mb-4"
              style={{ borderColor: '#2a2a2a' }}>
              <Brain size={24} style={{ color: '#3a3a3a' }} />
            </div>
            <span className="text-sm font-mono" style={{ color: '#4b5563' }}>
              Advance the simulation or inject a crisis to trigger the agent council debate.
            </span>
          </div>
        ) : (
          agentMessages.map((msg, idx) => (
            <AgentMessage key={idx} agentId={msg.agentId} message={msg} />
          ))
        )}
      </div>
    </div>
  );
}
