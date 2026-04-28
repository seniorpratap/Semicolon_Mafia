import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Terminal, RadioReceiver } from 'lucide-react';
import { AGENTS } from '../engine/agents';
import { useTypewriter } from '../hooks/useEffects';

function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  const { displayed, isDone } = useTypewriter(message?.text || '', 15);
  if (!message) return null;

  const colorMap = {
    0: { color: 'var(--color-danger)' }, // Health
    1: { color: 'var(--color-warning)' }, // Economy
    2: { color: 'var(--color-accent)' }, // Safety/Military
    3: { color: 'var(--color-primary)' }, // Coordinator
  };
  
  const c = colorMap[agentId] || { color: 'var(--text-muted)' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="chat-bubble"
      style={{
        borderColor: c.color,
        marginBottom: '12px'
      }}
    >
      <div className="flex items-center gap-3 mb-2" style={{borderBottom: `1px dashed ${c.color}`, paddingBottom: '4px'}}>
        <div className="text-[10px] font-mono font-bold tracking-widest" style={{color: c.color}}>
          [{agent?.name || 'UNKNOWN'}]
        </div>
        <div className="text-[9px] font-mono tracking-widest text-muted uppercase">
          // {agent?.role || 'ADVISOR'}
        </div>
      </div>

      {!isDone && displayed.length === 0 ? (
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted uppercase tracking-widest">
          <Loader2 size={10} className="animate-spin text-primary" />
          <span>DECRYPTING TRANSMISSION...</span>
        </div>
      ) : (
        <div className={`font-mono leading-relaxed whitespace-pre-wrap ${!isDone ? 'cursor-blink' : ''}`} style={{fontSize: '0.75rem', color: 'var(--text-main)'}}>
          {displayed}
        </div>
      )}
    </motion.div>
  );
}

export default function AgentPanel({ agentMessages, isDebating, userAdvisory }) {
  return (
    <div className="bento flex-1 flex flex-col min-h-0 overflow-hidden" style={{borderTop: '2px solid var(--color-primary)'}}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.4)'}}>
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-primary" />
          <span className="text-[11px] font-mono font-bold text-primary tracking-widest uppercase">SECURE COMMS LINK</span>
        </div>
        {isDebating && (
          <div className="badge badge-solid text-warning" style={{borderColor: 'var(--color-warning)'}}>
            <RadioReceiver size={10} className="animate-pulse" />
            <span className="animate-pulse">RECEIVING...</span>
          </div>
        )}
      </div>

      {/* Advisory */}
      <AnimatePresence>
        {userAdvisory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            style={{margin: '12px 16px 0', padding: '10px', background: 'var(--color-accent-dim)', border: '1px solid var(--color-accent)', overflow: 'hidden'}}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest">&gt; DIRECTIVE OVERRIDE</span>
            </div>
            <p className="text-[11px] font-mono text-accent">"{userAdvisory}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" style={{paddingRight: '8px'}}>
        {agentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted font-mono">
            <div style={{border: '1px solid var(--border-color)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'}}>
              <Terminal size={24} className="text-primary opacity-50" />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase">CHANNEL IDLE</span>
            <span className="text-[9px] mt-1 opacity-50 tracking-widest uppercase">AWAITING INITIATION SEQUENCE</span>
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
