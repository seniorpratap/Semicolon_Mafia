import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, MessageCircle, Users } from 'lucide-react';
import { AGENTS } from '../engine/agents';
import { useTypewriter } from '../hooks/useEffects';

function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  const { displayed, isDone } = useTypewriter(message?.text || '', 15);
  if (!message) return null;

  const colorMap = {
    0: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
    1: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
    2: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    3: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  };
  
  const colors = colorMap[agentId] || { border: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="chat-bubble"
      style={{
        borderLeft: `4px solid ${colors.border}`,
        backgroundColor: colors.bg,
        marginBottom: '16px'
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="agent-avatar" style={{background: 'rgba(0,0,0,0.3)', border: `1px solid ${colors.border}`}}>
          {agent?.icon || '🤖'}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{agent?.name || 'Agent'}</div>
          <div className="text-xs text-slate-400 font-medium">{agent?.role || 'Advisor'}</div>
        </div>
        {isDone && <CheckCircle2 size={16} className="text-emerald-400" />}
      </div>

      {!isDone && displayed.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={14} className="animate-spin text-emerald-400" />
          <span style={{fontSize: '0.8rem'}}>Analyzing data...</span>
        </div>
      ) : (
        <div className={`text-slate-300 leading-relaxed whitespace-pre-wrap ${!isDone ? 'cursor-blink' : ''}`} style={{fontSize: '0.85rem'}}>
          {displayed}
        </div>
      )}
    </motion.div>
  );
}

export default function AgentPanel({ agentMessages, isDebating, userAdvisory }) {
  return (
    <div className="bento flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
        <div className="flex items-center gap-3">
          <div className="logo-icon" style={{width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.1)', boxShadow: 'none', border: '1px solid rgba(139, 92, 246, 0.3)'}}>
            <Users size={16} className="text-violet-400" />
          </div>
          <span className="text-base font-bold text-white">Agent Council</span>
        </div>
        {isDebating && (
          <div className="badge badge-solid" style={{backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)', color: '#a78bfa'}}>
            <div style={{width:'6px', height:'6px', borderRadius:'3px', background:'#8b5cf6'}} className="animate-pulse" />
            <span>Deliberating</span>
          </div>
        )}
      </div>

      {/* Advisory */}
      <AnimatePresence>
        {userAdvisory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            style={{margin: '16px 20px 0', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', overflow: 'hidden'}}
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={12} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider" style={{fontSize: '0.65rem'}}>Your Advisory</span>
            </div>
            <p className="text-sm text-emerald-100 italic">"{userAdvisory}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5" style={{paddingRight: '12px'}}>
        {agentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <div style={{width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px'}}>
              <Users size={32} className="text-slate-600" />
            </div>
            <span className="text-sm font-medium text-slate-400">Awaiting simulation data</span>
            <span className="text-xs text-slate-500 mt-1">Launch and advance to trigger debate</span>
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
