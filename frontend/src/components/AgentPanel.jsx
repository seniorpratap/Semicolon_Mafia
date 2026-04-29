import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, MessageSquare, Shield, Activity, Zap, Send, ChevronDown } from 'lucide-react';
import { AGENTS } from '../engine/agents';

const ACTION_META = {
  lockdown: { icon: '🔒', label: 'FULL LOCKDOWN', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  partial_lockdown: { icon: '🔶', label: 'PARTIAL LOCKDOWN', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  vaccinate: { icon: '💉', label: 'VACCINATION DRIVE', color: '#10b981', bg: 'rgba(16,185,129,0.10)' },
  expand_hospital: { icon: '🏥', label: 'HOSPITAL EXPANSION', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  testing: { icon: '🔬', label: 'MASS TESTING', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  deploy_military: { icon: '🛡️', label: 'MILITARY DEPLOYED', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  monitoring: { icon: '📡', label: 'ENHANCED MONITORING', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
};

function DotsLoader({ color }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="dots-loader" style={{ color }}>
        <span /><span /><span />
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Analyzing</span>
    </div>
  );
}

function StreamingText({ text, color }) {
  const prevLen = useRef(0);
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    if (text.length > prevLen.current) {
      setOldText(text.substring(0, prevLen.current));
      setNewText(text.substring(prevLen.current));
    } else {
      setOldText(text);
      setNewText('');
    }
    prevLen.current = text.length;
  }, [text]);

  return (
    <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium" style={{ color: 'var(--t-text)' }}>
      {oldText}
      {newText && <span className="stream-fade-in">{newText}</span>}
      <span className="cursor-blink" />
    </div>
  );
}

function AgentMessage({ agentId, message, isStreaming }) {
  const agent = AGENTS[agentId];
  if (!message) return null;
  const isThinking = message.text === 'thinking';

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-l-4 mb-4 p-4 rounded-r-xl transition-all"
      style={{ 
        borderColor: agent?.color || 'var(--t-accent)', 
        background: 'rgba(255,255,255,0.02)',
        borderWidth: '0 0 0 4px'
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 border flex items-center justify-center text-xl rounded-lg shadow-sm"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg)' }}>
          {agent?.emoji || '🤖'}
        </div>
        <div className="flex-1">
          <div className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--t-text)' }}>{agent?.name || 'Agent'}</div>
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: agent?.color || 'var(--t-muted)' }}>
            {agent?.role || 'Advisor'}
          </div>
        </div>
        <div className="w-1.5 h-1.5 rounded-full" style={{
          background: isThinking ? (agent?.color || 'var(--t-muted)') : '#10b981',
          boxShadow: isThinking ? 'none' : '0 0 8px #10b981'
        }} />
      </div>

      <div className="pl-1">
        {isThinking ? (
          <DotsLoader color={agent?.color || 'var(--t-muted)'} />
        ) : isStreaming ? (
          <StreamingText text={message.text} />
        ) : (
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap font-medium" style={{ color: 'var(--t-text)' }}>
            {message.text}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentPanel({ 
  agentMessages, isDebating, userAdvisory,
  advisoryText, setAdvisoryText, onAdvisory, 
  suggestions, showSuggestions, setShowSuggestions 
}) {
  return (
    <div className="flex flex-col h-full bg-panel">
      {/* Header */}
      <div className="tac-panel-header border-b" style={{ borderColor: 'var(--t-border)' }}>
        <span className="flex items-center gap-2">
          <Brain size={14} className="text-accent" /> Council Deliberation
        </span>
        {isDebating && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-green-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Stream
          </span>
        )}
      </div>

      {/* Advisory banner */}
      <AnimatePresence>
        {userAdvisory && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="px-6 py-4 border-b overflow-hidden" 
            style={{ borderColor: 'var(--t-border)', background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2" style={{ color: 'var(--t-muted)' }}>
              <Zap size={10} className="text-orange-500" /> Executive Directive
            </div>
            <p className="text-sm font-bold italic" style={{ color: 'var(--t-text)' }}>"{userAdvisory}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scroll-y p-6">
        {agentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20">
            <MessageSquare size={48} className="mb-4" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Awaiting Transmission</span>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto w-full">
            {agentMessages.map((msg, idx) => {
              const isLast = idx === agentMessages.length - 1;
              const streaming = isDebating && isLast && msg.text !== 'thinking';
              return (
                <AgentMessage
                  key={msg.agentId}
                  agentId={msg.agentId}
                  message={msg}
                  isStreaming={streaming}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Advisory Input */}
      <div className="border-t p-6 shadow-2xl" style={{ borderColor: 'var(--t-border)', background: 'var(--t-bg)' }}>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2" style={{ color: 'var(--t-muted)' }}>
          <Activity size={12} /> Directive Input
        </div>
        
        <div className="relative group">
          <input
            value={advisoryText || ''}
            onChange={e => setAdvisoryText?.(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && advisoryText?.trim()) { onAdvisory?.(advisoryText.trim()); setAdvisoryText?.(''); } }}
            placeholder="Broadcast orders to the council..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white outline-none focus:border-accent transition-all pr-14 font-medium"
            disabled={isDebating}
          />
          <button
            onClick={() => { if (advisoryText?.trim()) { onAdvisory?.(advisoryText.trim()); setAdvisoryText?.(''); } }}
            disabled={!advisoryText?.trim() || isDebating}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-accent hover:scale-110 disabled:opacity-0 transition-all"
          >
            <Send size={18} />
          </button>
        </div>

        <button onClick={() => setShowSuggestions?.(!showSuggestions)}
          className="text-[9px] font-black uppercase tracking-[0.2em] mt-4 flex items-center gap-2 transition-all hover:text-white"
          style={{ color: 'var(--t-muted)' }}>
          <ChevronDown size={12} className={`transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
          Tactical Suggestions
        </button>
        
        <AnimatePresence>
          {showSuggestions && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 flex flex-wrap gap-2 overflow-hidden"
            >
              {(suggestions || []).map(s => (
                <button key={s} onClick={() => onAdvisory?.(s)} disabled={isDebating}
                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border rounded-lg transition-all hover:bg-white/5 hover:border-accent"
                  style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>{s}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
