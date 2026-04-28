import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { AGENTS } from '../engine/agents';
import { useTypewriter } from '../hooks/useEffects';

/**
 * Single agent message with typewriter effect
 */
function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  const isThinking = message === 'thinking';
  const { displayed, isDone } = useTypewriter(isThinking ? '' : message, 12, !isThinking);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl p-3 border-l-[3px] bg-gradient-to-r"
      style={{
        borderLeftColor: agent.color,
        backgroundImage: `linear-gradient(to right, ${agent.color}08, transparent)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: `${agent.color}20` }}
        >
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold" style={{ color: agent.color }}>
              {agent.name}
            </span>
            {isThinking && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-0.5"
              >
                <span className="w-1 h-1 rounded-full" style={{ background: agent.color }} />
                <span className="w-1 h-1 rounded-full" style={{ background: agent.color }} />
                <span className="w-1 h-1 rounded-full" style={{ background: agent.color }} />
              </motion.div>
            )}
          </div>
          <span className="text-[9px] text-slate-600">{agent.role} · {agent.priority.slice(0, 40)}...</span>
        </div>
        {!isThinking && isDone && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
            style={{ background: `${agent.color}20`, color: agent.color }}
          >
            ✓
          </motion.div>
        )}
      </div>

      {/* Body */}
      {isThinking ? (
        <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-9">
          <Loader2 size={11} className="animate-spin" style={{ color: agent.color }} />
          <span>Analyzing situation data...</span>
        </div>
      ) : (
        <div className="pl-9">
          <p className={`text-[11px] text-slate-300/90 leading-[1.6] whitespace-pre-wrap ${!isDone ? 'cursor-blink' : ''}`}>
            {displayed}
          </p>
        </div>
      )}
    </motion.div>
  );
}

/**
 * AgentPanel — The debate arena
 */
export default function AgentPanel({ agentMessages, isDebating, userAdvisory }) {
  const agentOrder = ['health', 'economy', 'safety', 'coordinator'];
  const hasMessages = Object.keys(agentMessages).length > 0;

  return (
    <div className="glass rounded-2xl p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">🧠</span>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Agent Council</h3>
        </div>
        {isDebating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-[10px] text-purple-300 font-medium">Deliberating</span>
          </motion.div>
        )}
      </div>

      {/* User Advisory Banner */}
      <AnimatePresence>
        {userAdvisory && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="mb-3 flex-shrink-0"
          >
            <div className="p-3 bg-cyan-500/8 border border-cyan-500/15 rounded-xl">
              <div className="flex items-start gap-2">
                <span className="text-xs mt-0.5">🗣️</span>
                <div>
                  <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">External Advisory</span>
                  <p className="text-[11px] text-cyan-300/80 mt-0.5 leading-relaxed">"{userAdvisory}"</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 scrollbar-thin">
        <AnimatePresence mode="popLayout">
          {agentOrder.map((agentId) => {
            const message = agentMessages[agentId];
            if (!message) return null;
            return <AgentMessage key={agentId} agentId={agentId} message={message} />;
          })}
        </AnimatePresence>

        {/* Empty State */}
        {!hasMessages && !isDebating && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12 opacity-40">
            <div className="text-4xl mb-3 animate-float">🧠</div>
            <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">
              Advance the simulation or inject a crisis to trigger the agent council debate
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
