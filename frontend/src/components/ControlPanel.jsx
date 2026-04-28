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
    'Quarantine hotspots', 'Mass testing now', 'Economy first',
    'Deploy vaccines', 'Field hospitals', 'Night curfew',
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Play / Pause */}
      {!isRunning || isPaused ? (
        <button onClick={onPlay} disabled={isDebating} className="btn-green w-full flex items-center justify-center gap-2">
          <Play size={14} fill="white" /> {day === 0 ? 'Launch Simulation' : 'Resume'}
        </button>
      ) : (
        <button onClick={onPause} className="btn-outline w-full flex items-center justify-center gap-2 !border-amber-300 !text-amber-700 !bg-amber-50">
          <Pause size={14} /> Pause
        </button>
      )}

      {/* Advance */}
      <button onClick={onAdvance} disabled={isDebating || !isRunning}
        className="btn-outline w-full flex items-center justify-center gap-2 text-xs">
        <FastForward size={14} /> Advance + Debate
      </button>

      {/* Reset */}
      <button onClick={onReset} className="btn-outline w-full flex items-center justify-center gap-1.5 text-xs !text-slate-400">
        <RotateCcw size={12} /> Reset
      </button>

      <div className="h-px bg-slate-100" />

      {/* Crisis */}
      <button onClick={() => setShowCrisis(!showCrisis)}
        className="btn-danger-outline w-full flex items-center justify-center gap-2 text-xs">
        <Zap size={14} /> Inject Crisis
        <ChevronDown size={12} className={`ml-auto transition-transform ${showCrisis ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {showCrisis && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-1 overflow-hidden">
            {CRISIS_EVENTS.map(e => (
              <button key={e.id} onClick={() => { onInjectCrisis(e); setShowCrisis(false); }}
                className="w-full text-left p-2 rounded-lg bg-red-50 border border-red-100 hover:border-red-300 transition-all text-xs">
                <div className="font-semibold text-red-700">{e.name}</div>
                <div className="text-[10px] text-red-400 mt-0.5">{e.description}</div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-px bg-slate-100" />

      {/* Advisory */}
      <div className="space-y-2">
        <span className="label-sm">Your Advisory</span>
        <div className="flex gap-1.5">
          <input value={advisoryText} onChange={e => setAdvisoryText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdvisory()}
            placeholder="Advise the council..."
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all" />
          <button onClick={handleAdvisory} disabled={!advisoryText.trim() || isDebating}
            className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-30">
            <Send size={13} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map(p => (
            <button key={p} onClick={() => onUserAdvisory(p)} disabled={isDebating}
              className="btn-chip text-[10px]">{p}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
