import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, FastForward, Zap, RotateCcw, ChevronDown } from 'lucide-react';
import { CRISIS_EVENTS } from '../engine/simulation';

export default function ControlPanel({
  isRunning, isPaused, day, onPlay, onPause, onAdvance,
  onInjectCrisis, onReset, isDebating, tickMs, onTickSpeedChange,
}) {
  const [showCrisis, setShowCrisis] = useState(false);
  const speedPresets = [
    { label: '0.5x', value: 1600 },
    { label: '1x', value: 800 },
    { label: '2x', value: 400 },
    { label: '4x', value: 200 },
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

      {/* Tick Speed */}
      <div className="bg-surface/40 rounded-xl border border-white/[0.03] p-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-wider">Tick Speed</span>
          <span className="text-[9px] font-mono text-slate-400">{(800 / tickMs).toFixed(tickMs === 1600 ? 1 : 0)}x</span>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {speedPresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onTickSpeedChange?.(preset.value)}
              className={`px-2 py-1 rounded-md text-[10px] border transition-all ${
                tickMs === preset.value
                  ? 'bg-primary/20 border-primary/40 text-primary-light'
                  : 'bg-surface/50 border-white/[0.05] text-slate-500 hover:text-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

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

    </div>
  );
}
