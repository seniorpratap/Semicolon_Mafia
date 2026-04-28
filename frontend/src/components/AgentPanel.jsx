import { Brain } from 'lucide-react';
import { AGENTS } from '../engine/agents';

/**
 * DotsLoader — three pulsing dots for the "thinking" state.
 * Replaces the old spinning Loader2 which caused visual flashing.
 */
function DotsLoader({ color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="dots-loader" style={{ color }}>
        <span /><span /><span />
      </div>
      <span className="text-xs font-mono" style={{ color: '#6b7280' }}>analyzing</span>
    </div>
  );
}

/**
 * AgentMessage — individual agent's response block.
 * Uses NO entrance animation — messages persist across tab switches.
 * Text is displayed directly (streaming is handled upstream by the debate loop).
 */
function AgentMessage({ agentId, message }) {
  const agent = AGENTS[agentId];
  if (!message) return null;

  const isThinking = message.text === 'thinking';

  return (
    <div className="border-b px-5 py-4" style={{ borderColor: '#1a1a1a' }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 border flex items-center justify-center text-lg"
          style={{ borderColor: '#2a2a2a', background: '#0f0f0f' }}>
          {agent?.emoji || '🤖'}
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-white">{agent?.name || 'Agent'}</div>
          <div className="text-[9px] font-mono uppercase tracking-[0.12em]" style={{ color: agent?.color || '#6b7280' }}>
            {agent?.role || 'Advisor'}
          </div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{
          background: isThinking ? (agent?.color || '#6b7280') : '#10b981',
          opacity: isThinking ? 0.5 : 1
        }} />
      </div>

      {isThinking ? (
        <DotsLoader color={agent?.color || '#6b7280'} />
      ) : (
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: '#d1d5db' }}>
          {message.text}
        </div>
      )}
    </div>
  );
}

/**
 * AgentPanel — the center column showing agent council debate.
 *
 * Key design decisions:
 * - NO AnimatePresence / motion.div on messages — prevents re-animation on tab switch
 * - Messages render instantly as plain divs — they persist until a new cycle starts
 * - Advisory input moved here (center column, below messages)
 */
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

      {/* Advisory banner (when active) */}
      {userAdvisory && (
        <div className="px-5 py-3 border-b" style={{ borderColor: '#1a1a1a', background: '#0f0f0f' }}>
          <div className="text-[9px] font-mono uppercase tracking-[0.12em] mb-1" style={{ color: '#6b7280' }}>
            Your Advisory
          </div>
          <p className="text-xs italic" style={{ color: '#9ca3af' }}>"{userAdvisory}"</p>
        </div>
      )}

      {/* Messages — NO animation wrappers, renders as static divs */}
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
            <AgentMessage key={`${msg.agentId}-${idx}`} agentId={msg.agentId} message={msg} />
          ))
        )}
      </div>

      {/* ── Advisory Input (moved to center) ── */}
      <div className="border-t px-5 py-3" style={{ borderColor: '#2a2a2a' }}>
        <div className="text-[9px] font-mono font-bold uppercase tracking-[0.12em] mb-2 flex items-center gap-1.5" style={{ color: '#6b7280' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-white" /> Advise the Council
        </div>
        <div className="flex gap-2">
          <input
            value={advisoryText || ''}
            onChange={e => setAdvisoryText?.(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && advisoryText?.trim()) { onAdvisory?.(advisoryText.trim()); setAdvisoryText?.(''); } }}
            placeholder="Type your advisory for the council..."
            className="flex-1 px-3 py-2 text-xs font-mono border outline-none transition-colors"
            style={{ background: '#0f0f0f', borderColor: '#2a2a2a', color: '#e5e5e5' }}
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
        {/* Quick suggestions toggle */}
        <button onClick={() => setShowSuggestions?.(!showSuggestions)}
          className="text-[9px] font-mono uppercase tracking-[0.12em] mt-2 flex items-center gap-1 transition-colors"
          style={{ color: '#6b7280' }}>
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
                style={{ borderColor: '#2a2a2a', color: '#9ca3af' }}>{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
