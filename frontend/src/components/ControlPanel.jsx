import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, FastForward, Zap, Send, RotateCcw, ChevronDown, Keyboard } from 'lucide-react';
import { CRISIS_EVENTS } from '../engine/simulation';

export default function ControlPanel({
  isRunning, isPaused, day, onPlay, onPause, onAdvance,
  onInjectCrisis, onUserAdvisory, onReset, isDebating,
}) {
  const [advisoryText, setAdvisoryText] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleAdvisory = () => {
    if (!advisoryText.trim()) return;
    onUserAdvisory(advisoryText.trim());
    setAdvisoryText('');
  };

  const presets = [
    'Close all schools and colleges immediately',
    'Deploy military for medical supply distribution',
    'Prioritize economy — avoid full lockdowns',
    'Start mass vaccination in worst-hit zones',
    'Evacuate the hotspot zones to safer areas',
    'Set up field hospitals in parking lots',
    'Enforce night curfew across all zones',
    'Open borders for humanitarian aid',
  ];

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-sm">⚙️</span>
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Command Center</h3>
      </div>

      {/* Day Display */}
      <div className="text-center py-2 bg-surface/40 rounded-xl border border-white/[0.03]">
        <span className="text-[9px] text-slate-600 uppercase tracking-widest">Simulation Day</span>
        <motion.div
          key={day}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold font-mono text-white mt-0.5"
        >
          {day}
        </motion.div>
      </div>

      {/* Controls Row */}
      <div className="grid grid-cols-3 gap-1.5">
        {!isRunning || isPaused ? (
          <button onClick={onPlay} disabled={isDebating}
            className="btn-primary col-span-2 flex items-center justify-center gap-1.5 disabled:opacity-30">
            <Play size={13} /> {day === 0 ? 'Launch' : 'Resume'}
          </button>
        ) : (
          <button onClick={onPause}
            className="btn-ghost col-span-2 flex items-center justify-center gap-1.5 text-amber-400 border-amber-500/20 bg-amber-500/5">
            <Pause size={13} /> Pause
          </button>
        )}
        <button onClick={onReset} className="btn-ghost flex items-center justify-center text-slate-500">
          <RotateCcw size={13} />
        </button>
      </div>

      <button onClick={onAdvance} disabled={isDebating}
        className="w-full btn-ghost flex items-center justify-center gap-1.5 text-primary-light border-primary/20 bg-primary/5 disabled:opacity-30">
        <FastForward size={13} /> Advance 5 Days + Council Debate
      </button>

      {/* Divider */}
      <div className="border-t border-white/[0.04]" />

      {/* Crisis Injection */}
      <div>
        <button
          onClick={() => setShowCrisis(!showCrisis)}
          className="w-full btn-danger flex items-center justify-center gap-1.5"
        >
          <Zap size={13} /> Inject Crisis Event
          <ChevronDown size={12} className={`ml-auto transition-transform ${showCrisis ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showCrisis && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-1 overflow-hidden"
            >
              {CRISIS_EVENTS.map(event => (
                <motion.button
                  key={event.id}
                  whileHover={{ x: 4 }}
                  onClick={() => { onInjectCrisis(event); setShowCrisis(false); }}
                  className="w-full text-left p-2.5 bg-surface/50 rounded-lg border border-white/[0.03] hover:border-red-500/20 transition-all"
                >
                  <div className="text-[11px] font-medium text-white">{event.name}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{event.description}</div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.04]" />

      {/* User Advisory */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px]">💬</span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Your Advisory</span>
        </div>
        <div className="flex gap-1.5">
          <input
            value={advisoryText}
            onChange={(e) => setAdvisoryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdvisory()}
            placeholder="Advise the council..."
            disabled={isDebating}
            className="flex-1 bg-surface/50 rounded-lg px-3 py-2 text-[11px] text-white placeholder-slate-600
                       outline-none border border-white/[0.04] focus:border-cyan-500/30 transition-colors disabled:opacity-30"
          />
          <button
            onClick={handleAdvisory}
            disabled={!advisoryText.trim() || isDebating}
            className="px-3 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20
                       hover:bg-cyan-500/20 transition-all disabled:opacity-30"
          >
            <Send size={12} />
          </button>
        </div>

        {/* Preset Toggle */}
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="mt-2 flex items-center gap-1 text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          <Keyboard size={10} />
          {showPresets ? 'Hide' : 'Show'} quick suggestions
        </button>

        <AnimatePresence>
          {showPresets && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1.5 flex flex-wrap gap-1 overflow-hidden"
            >
              {presets.map(p => (
                <button
                  key={p}
                  onClick={() => { onUserAdvisory(p); setShowPresets(false); }}
                  disabled={isDebating}
                  className="px-2 py-1 bg-surface/40 text-[9px] text-slate-500 rounded-md
                             border border-white/[0.03] hover:border-cyan-500/20 hover:text-cyan-400
                             transition-all disabled:opacity-30"
                >
                  {p}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
