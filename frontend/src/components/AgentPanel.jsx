import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, MessageCircle, Users } from 'lucide-react';
import { AGENTS } from '../engine/agents';
import { useTypewriter } from '../hooks/useEffects';

function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  const { displayed, isDone } = useTypewriter(message?.text || '', 15);
  if (!message) return null;

  const colorMap = {
    0: 'border-l-red-400 bg-red-50/40',
    1: 'border-l-amber-400 bg-amber-50/40',
    2: 'border-l-blue-400 bg-blue-50/40',
    3: 'border-l-violet-400 bg-violet-50/40',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-slate-100 border-l-4 ${colorMap[agentId] || 'border-l-slate-300'} p-4`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-lg">
          {agent?.icon || '🤖'}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-slate-800">{agent?.name || 'Agent'}</div>
          <div className="text-[10px] text-slate-400 font-medium">{agent?.role || 'Advisor'}</div>
        </div>
        {isDone && <CheckCircle2 size={16} className="text-emerald-500" />}
      </div>

      {!isDone && displayed.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={14} className="animate-spin text-emerald-500" />
          <span>Analyzing data...</span>
        </div>
      ) : (
        <div className={`text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap ${!isDone ? 'cursor-blink' : ''}`}>
          {displayed}
        </div>
      )}
    </motion.div>
  );
}

export default function AgentPanel({ agentMessages, isDebating, userAdvisory }) {
  return (
    <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Users size={14} className="text-violet-600" />
          </div>
          <span className="text-sm font-bold text-slate-800">Agent Council</span>
        </div>
        {isDebating && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-violet-600">Deliberating</span>
          </div>
        )}
      </div>

      {/* Advisory */}
      <AnimatePresence>
        {userAdvisory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="mx-5 mt-4 p-3 bg-teal-50 border border-teal-200 rounded-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle size={12} className="text-teal-600" />
              <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">Your Advisory</span>
            </div>
            <p className="text-xs text-teal-800 italic">"{userAdvisory}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-thin p-5 space-y-4">
        {agentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-4">
              <Users size={28} className="text-slate-300" />
            </div>
            <span className="text-sm font-medium text-slate-400">Awaiting simulation data</span>
            <span className="text-xs text-slate-300 mt-1">Launch and advance to trigger debate</span>
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
