import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MessageCircle, AlertCircle, ShieldAlert } from 'lucide-react';
import { AGENTS } from '../engine/agents';
import { useTypewriter } from '../hooks/useEffects';

function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  const { displayed, isDone } = useTypewriter(message?.text || '', 15);
  if (!message) return null;

  // Navy/Orange/Red theme mappings
  const colorMap = {
    0: { border: 'var(--color-danger)', icon: <AlertCircle size={16} className="text-danger"/> }, // Health
    1: { border: 'var(--color-orange)', icon: <AlertCircle size={16} className="text-orange"/> }, // Economy
    2: { border: 'var(--color-navy)', icon: <ShieldAlert size={16} className="text-navy"/> }, // Safety/Military
    3: { border: 'var(--color-info)', icon: <MessageCircle size={16} className="text-info"/> }, // Coordinator
  };
  
  const c = colorMap[agentId] || { border: 'var(--border-color)', icon: null };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="chat-bubble chat-bubble-agent"
      style={{ borderLeftColor: c.border }}
    >
      <div className="flex items-center gap-2 mb-2">
        {c.icon}
        <span className="font-bold text-sm text-navy">{agent?.name || 'Agent'}</span>
        <span className="text-xs text-muted ml-2 px-2 py-0.5 bg-main rounded-full border border-border-color">{agent?.role || 'Advisor'}</span>
      </div>

      {!isDone && displayed.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted py-2">
          <Loader2 size={16} className="animate-spin text-info" />
          <span>Generating analysis...</span>
        </div>
      ) : (
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {displayed}
          {!isDone && <span className="inline-block w-2 h-4 ml-1 bg-navy animate-pulse align-middle" />}
        </div>
      )}
    </motion.div>
  );
}

export default function AgentPanel({ agentMessages, isDebating, userAdvisory }) {
  return (
    <div className="card flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-border-color bg-main">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-navy" />
          <h2 className="text-lg font-bold text-navy">Agent Council Communications</h2>
        </div>
        {isDebating && (
          <div className="badge bg-orange">
            <Loader2 size={14} className="animate-spin" /> Processing
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-main">
        <div className="flex flex-col max-w-3xl mx-auto w-full">
          {agentMessages.length === 0 && !userAdvisory ? (
            <div className="my-auto flex flex-col items-center justify-center text-muted py-12">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-border-color shadow-sm mb-4">
                <MessageCircle size={32} className="text-muted opacity-50" />
              </div>
              <p className="font-semibold text-lg text-navy">No Active Debates</p>
              <p className="text-sm">Start the simulation or inject an event to see agent recommendations.</p>
            </div>
          ) : (
            <>
              {/* User Directive */}
              <AnimatePresence>
                {userAdvisory && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="chat-bubble chat-bubble-user"
                  >
                    <div className="flex items-center justify-end gap-2 mb-2">
                      <span className="text-xs text-muted px-2 py-0.5 bg-white rounded-full border border-border-color">Commander</span>
                      <span className="font-bold text-sm text-navy">You</span>
                    </div>
                    <p className="text-sm">"{userAdvisory}"</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Agent Messages */}
              {agentMessages.map((msg, idx) => (
                <AgentMessage key={idx} agentId={msg.agentId} message={msg} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
