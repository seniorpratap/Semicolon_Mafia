import { useRef, useEffect, useState } from 'react';
import { Brain, AlertTriangle, ChevronDown } from 'lucide-react';
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
    <div className="flex items-center gap-2">
      <div className="dots-loader" style={{ color }}>
        <span /><span /><span />
      </div>
      <span className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>analyzing</span>
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
    <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color }}>
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
    <div className="border-b px-5 py-4" style={{ borderColor: 'var(--t-border-light)' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 border flex items-center justify-center text-lg"
          style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}>
          {agent?.emoji || '🤖'}
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold" style={{ color: 'var(--t-text)' }}>{agent?.name || 'Agent'}</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color: agent?.color || 'var(--t-muted)' }}>
            {agent?.role || 'Advisor'}
          </div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{
          background: isThinking ? (agent?.color || 'var(--t-muted)') : '#10b981',
          opacity: isThinking ? 0.5 : 1
        }} />
      </div>
      {isThinking ? (
        <DotsLoader color={agent?.color || 'var(--t-muted)'} />
      ) : isStreaming ? (
        <StreamingText text={message.text} color="var(--t-text2)" />
      ) : (
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--t-text2)' }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

function ExecutedActions({ actions }) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="border-b px-5 py-4" style={{ borderColor: 'var(--t-border)', background: 'var(--t-input)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={14} className="text-green-500" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-green-500">
          Actions Executed
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
      </div>
      <div className="space-y-2">
        {actions.map((action, i) => {
          const meta = ACTION_META[action.action] || { icon: '⚡', label: action.action.toUpperCase(), color: 'var(--t-muted)', bg: 'var(--t-hover)' };
          return (
            <div key={i} className="flex items-start gap-3 px-3 py-3 border action-card-enter"
              style={{ borderColor: meta.color, background: meta.bg, borderLeftWidth: '3px', animationDelay: `${i * 150}ms` }}>
              <span className="text-lg mt-0.5">{meta.icon}</span>
              <div className="flex-1">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.12em]" style={{ color: meta.color }}>
                  {meta.label}
                </div>
                <div className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--t-text)' }}>
                  {action.summary}
                </div>
                {action.detail && (
                  <div className="text-[10px] font-mono mt-1" style={{ color: 'var(--t-muted)' }}>
                    ↳ {action.detail}
                  </div>
                )}
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 border mt-0.5" style={{ borderColor: meta.color, color: meta.color }}>
                APPLIED
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * CycleSeparator — divider between old messages and new cycle
 */
function CycleSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 px-5 py-2" style={{ background: 'var(--t-hover)' }}>
      <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
      <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--t-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
    </div>
  );
}

export default function AgentPanel({ agentMessages, isDebating, executedActions, previousMessages,
  userAdvisory, advisoryText, setAdvisoryText, onAdvisory, suggestions, showSuggestions, setShowSuggestions }) {

  // Auto-scroll — only if user is already near bottom (not fighting their scroll)
  const scrollRef = useRef(null);
  const [showOldMessages, setShowOldMessages] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [agentMessages, executedActions]);

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
      {userAdvisory && (
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--t-border-light)', background: 'var(--t-input)' }}>
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] mb-1" style={{ color: 'var(--t-muted)' }}>
            Your Advisory
          </div>
          <p className="text-xs italic" style={{ color: 'var(--t-dim)' }}>"{userAdvisory}"</p>
        </div>
      )}

      {/* Messages + Actions */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-y">
        {agentMessages.length === 0 && (!previousMessages || previousMessages.length === 0) && !isDebating ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--t-ghost)' }}>
            <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center mb-4"
              style={{ borderColor: 'var(--t-border)' }}>
              <Brain size={24} style={{ color: 'var(--t-ghost)' }} />
            </div>
            <span className="text-sm font-mono text-center px-8" style={{ color: 'var(--t-dim)' }}>
              Advance the simulation or inject a crisis to trigger the agent council debate.
            </span>
          </div>
        ) : agentMessages.length === 0 && isDebating ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--t-ghost)' }}>
            <div className="dots-loader mb-3" style={{ color: '#10b981' }}><span /><span /><span /></div>
            <span className="text-xs font-mono" style={{ color: 'var(--t-muted)' }}>Council convening...</span>
          </div>
        ) : (<>
          {/* Previous cycle messages (collapsible) */}
          {previousMessages && previousMessages.length > 0 && (
            <>
              <button
                onClick={() => setShowOldMessages(!showOldMessages)}
                className="w-full flex items-center gap-2 px-5 py-2 transition-colors hover:bg-white/5"
                style={{ background: 'var(--t-hover)' }}>
                <ChevronDown size={12} className={`transition-transform ${showOldMessages ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--t-muted)' }} />
                <span className="text-[9px] font-mono font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--t-muted)' }}>
                  Previous Council Session ({previousMessages.length} messages)
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--t-border)' }} />
              </button>
              {showOldMessages && (
                <div style={{ opacity: 0.6 }}>
                  {previousMessages.map((msg, idx) => (
                    <AgentMessage key={`prev-${msg.agentId}-${idx}`} agentId={msg.agentId} message={msg} isStreaming={false} />
                  ))}
                </div>
              )}
              <CycleSeparator label="Current Session" />
            </>
          )}

          {/* Current cycle messages */}
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
          <ExecutedActions actions={executedActions} />
        </>)}
      </div>

      {/* Advisory Input */}
      <div className="border-t px-5 py-3" style={{ borderColor: 'var(--t-border)' }}>
        <div className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] mb-2 flex items-center gap-1.5" style={{ color: 'var(--t-muted)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--t-text)' }} /> Advise the Council
        </div>
        <div className="flex gap-2">
          <input
            value={advisoryText || ''}
            onChange={e => setAdvisoryText?.(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && advisoryText?.trim()) { onAdvisory?.(advisoryText.trim()); setAdvisoryText?.(''); } }}
            placeholder="Type your advisory for the council..."
            className="flex-1 px-3 py-2 text-xs font-mono border outline-none transition-colors"
            style={{ background: 'var(--t-input)', borderColor: 'var(--t-border)', color: 'var(--t-text2)' }}
          />
          <button
            onClick={() => { if (advisoryText?.trim()) { onAdvisory?.(advisoryText.trim()); setAdvisoryText?.(''); } }}
            disabled={!advisoryText?.trim()}
            className="tac-btn px-3"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
        <button onClick={() => setShowSuggestions?.(!showSuggestions)}
          className="text-[9px] font-mono uppercase tracking-[0.12em] mt-2 flex items-center gap-1 transition-colors"
          style={{ color: 'var(--t-muted)' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`transition-transform ${showSuggestions ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
          Quick Suggestions
        </button>
        {showSuggestions && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {(suggestions || []).map(s => (
              <button key={s} onClick={() => onAdvisory?.(s)}
                className="text-[9px] font-mono px-2 py-1 border transition-all hover:border-white/30"
                style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
