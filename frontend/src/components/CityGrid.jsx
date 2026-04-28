import { useAnimatedNumber } from '../hooks/useEffects';

export default function CityGrid({ zones, onZoneClick, selectedZone }) {
  const gridSize = 6;
  const totalInfected = zones.reduce((s, z) => s + z.infected, 0);
  const totalDeceased = zones.reduce((s, z) => s + z.deceased, 0);
  const animInf = useAnimatedNumber(totalInfected);
  const animDec = useAnimatedNumber(totalDeceased);

  const getCellClass = (zone) => {
    const rate = zone.infected / zone.population;
    if (rate > 0.08) return 'grid-cell-hi';
    if (rate > 0.02) return 'grid-cell-med';
    if (zone.infected > 0) return 'grid-cell-low';
    return 'grid-cell-clr';
  };

  return (
    <div>
      {/* Header */}
      <div className="tac-panel-header">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> City Grid
        </span>
        <div className="flex gap-4 text-[10px] font-mono">
          <span>INF <span className="text-red-500 font-bold">{animInf.toLocaleString()}</span></span>
          <span>DEC <span className="font-bold" style={{ color: 'var(--t-text)' }}>{animDec.toLocaleString()}</span></span>
        </div>
      </div>

      {/* Grid */}
      <div className="p-1">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
          {zones.map(zone => {
            const isSelected = selectedZone?.id === zone.id;
            return (
              <button
                key={zone.id}
                onClick={() => onZoneClick?.(zone)}
                className={`grid-cell relative px-1.5 py-2 text-left transition-all cursor-pointer ${getCellClass(zone)}`}
                style={{
                  ...(isSelected ? {
                    boxShadow: 'inset 0 0 0 2px var(--t-accent)',
                    background: 'var(--t-hover)',
                  } : {}),
                  ...(zone.lockdownLevel === 2 ? {
                    boxShadow: `inset 0 0 0 2px #ef4444, 0 0 8px rgba(239,68,68,0.3)`,
                    background: 'rgba(239,68,68,0.08)',
                  } : zone.lockdownLevel === 1 ? {
                    boxShadow: `inset 0 0 0 2px #f59e0b`,
                    background: 'rgba(245,158,11,0.06)',
                  } : {}),
                }}
              >
                {/* Zone Name + Status Icons */}
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-mono font-bold truncate leading-none" style={{ color: 'var(--t-text)', opacity: 0.8 }}>
                    {zone.name.length > 8 ? zone.name.substring(0, 7) + '…' : zone.name}
                  </span>
                  {zone.lockdownLevel > 0 && (
                    <span className="text-[7px] font-mono font-black px-1 rounded-sm" style={{
                      background: zone.lockdownLevel === 2 ? '#ef4444' : '#f59e0b',
                      color: '#fff',
                      lineHeight: '14px',
                    }}>
                      🔒{zone.lockdownLevel === 2 ? 'F' : 'P'}
                    </span>
                  )}
                  {zone.vaccinationRate > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6' }} title={`Vaccinated: ${(zone.vaccinationRate * 100).toFixed(0)}%`} />
                  )}
                </div>

                {/* Infected Count */}
                <div className="text-[11px] font-mono font-bold mt-0.5 leading-none" style={{ color: 'var(--t-text)' }}>
                  {zone.infected > 0 ? zone.infected.toLocaleString() : '0'}
                </div>

                {/* Military deployed indicator */}
                {zone.militaryDeployed && (
                  <div className="absolute top-0.5 right-0.5 text-[8px]" title="Military Deployed">🛡️</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t" style={{ borderColor: 'var(--t-border-light)' }}>
        {[
          { l: 'CLR', c: 'var(--t-bg)', b: 'var(--t-border)' },
          { l: 'LOW', c: 'rgba(16,185,129,0.20)', b: 'rgba(16,185,129,0.3)' },
          { l: 'MED', c: 'rgba(245,158,11,0.22)', b: 'rgba(245,158,11,0.3)' },
          { l: 'HI', c: 'rgba(239,68,68,0.28)', b: 'rgba(239,68,68,0.3)' },
        ].map(({ l, c, b }) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-3 border" style={{ background: c, borderColor: b }} />
            <span className="text-[9px] font-mono font-bold tracking-[0.1em]" style={{ color: 'var(--t-muted)' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
