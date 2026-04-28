import { useRef, useEffect, useState } from 'react';
import { Brain } from 'lucide-react';
import { AGENTS } from '../engine/agents';

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

/**
 * StreamingText — renders text with a fade-in on the latest chunk.
 * Tracks previous text length to know what's "new".
 */
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
      {newText && (
        <span className="stream-fade-in">{newText}</span>
      )}
      {/* Blinking cursor while streaming */}
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

export default function AgentPanel({ agentMessages, isDebating, userAdvisory,
  advisoryText, setAdvisoryText, onAdvisory, suggestions, showSuggestions, setShowSuggestions }) {
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

      {/* Messages — each agent appears only once */}
      <div className="flex-1 overflow-y-auto scroll-y">
        {agentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center" style={{ color: 'var(--t-ghost)' }}>
            <div className="w-16 h-16 border-2 border-dashed flex items-center justify-center mb-4"
              style={{ borderColor: 'var(--t-border)' }}>
              <Brain size={24} style={{ color: 'var(--t-ghost)' }} />
            </div>
            <span className="text-sm font-mono" style={{ color: 'var(--t-dim)' }}>
              Advance the simulation or inject a crisis to trigger the agent council debate.
            </span>
          </div>
        ) : (
          agentMessages.map((msg, idx) => {
            // Last message from this agent + still debating = streaming
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
          })
        )}
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
            disabled={isDebating}
          />
          <button
            onClick={() => { if (advisoryText?.trim()) { onAdvisory?.(advisoryText.trim()); setAdvisoryText?.(''); } }}
            disabled={!advisoryText?.trim() || isDebating}
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
              <button key={s} onClick={() => onAdvisory?.(s)} disabled={isDebating}
                className="text-[9px] font-mono px-2 py-1 border transition-all hover:border-white/30"
                style={{ borderColor: 'var(--t-border)', color: 'var(--t-muted)' }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
