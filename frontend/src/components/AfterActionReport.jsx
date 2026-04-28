import { AlertTriangle, BarChart3, CheckCircle2, ClipboardList, ShieldAlert } from 'lucide-react';

export default function AfterActionReport({ report }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <ClipboardList size={14} className="text-slate-400" />
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">After-Action Report</h3>
      </div>

      {!report ? (
        <div className="flex flex-col items-center justify-center py-16 opacity-40">
          <div className="text-4xl mb-4 animate-float">📄</div>
          <p className="text-xs text-slate-500 text-center max-w-[280px] leading-relaxed">
            Run the simulation and complete a few debates to generate an operational report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatChip label="Day" value={report.day} />
            <StatChip label="Debates" value={report.totalDebates} />
            <StatChip label="Peak Infected" value={report.peakInfected.toLocaleString()} />
            <StatChip label="Final Economy" value={`${report.finalEconomy}/100`} />
          </div>

          <Section icon={<BarChart3 size={12} className="text-cyan-400" />} title="Outcome Snapshot">
            <ul className="text-[11px] text-slate-300 space-y-1.5">
              <li>Final infected: {report.finalInfected.toLocaleString()}</li>
              <li>Total recovered: {report.totalRecovered.toLocaleString()}</li>
              <li>Total deceased: {report.totalDeceased.toLocaleString()}</li>
              <li>Hospital utilization: {report.hospitalUtilization}%</li>
              <li>Public morale: {report.finalMorale}/100</li>
            </ul>
          </Section>

          <Section icon={<CheckCircle2 size={12} className="text-emerald-400" />} title="What Worked">
            <ul className="text-[11px] text-slate-300 space-y-1.5">
              {report.successes.map(item => <li key={item}>- {item}</li>)}
            </ul>
          </Section>

          <Section icon={<AlertTriangle size={12} className="text-amber-400" />} title="Risks Observed">
            <ul className="text-[11px] text-slate-300 space-y-1.5">
              {report.risks.map(item => <li key={item}>- {item}</li>)}
            </ul>
          </Section>

          <Section icon={<ShieldAlert size={12} className="text-purple-400" />} title="Coordinator Pattern">
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {report.patternSummary}
            </p>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="bg-surface/40 rounded-xl border border-white/[0.05] p-3">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="bg-surface/45 rounded-xl border border-white/[0.05] p-2.5">
      <p className="text-[9px] text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-slate-200 mt-0.5">{value}</p>
    </div>
  );
}
