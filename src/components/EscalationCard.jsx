import React from 'react'
import { Radio, AlertOctagon, Link2, UserCheck } from 'lucide-react'

export default function EscalationCard({ escalation, onSelectEvidence }) {
  if (!escalation) return null

  const owner = escalation.recommended_owner || {}

  return (
    <div className="neomorph-card p-3.5 bg-white border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 text-slate-800">
            <Radio className="w-3.5 h-3.5 animate-pulse text-amber-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              Calling for Backup: Safe Escalation (AGT-9)
            </h4>
            <p className="text-[10px] text-slate-500">
              Escalate-Instead-of-Guess · Zero Writes Executed
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
          {escalation.severity || 'CRITICAL'}
        </span>
      </div>

      <p className="text-xs text-slate-800 mb-2.5 leading-relaxed font-medium">
        {escalation.root_cause}
      </p>

      {/* Cited Evidence Bundle */}
      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 mb-2 text-xs">
        <span className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
          Evidence Bundle
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(escalation.evidence_bundle || []).map((evId, idx) => (
            <button
              key={idx}
              onClick={() => onSelectEvidence && onSelectEvidence({ result_id: evId, tool_name: 'Aggregated Evidence' })}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 font-mono text-[9px] border border-slate-200 font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Link2 className="w-2.5 h-2.5 text-slate-400" />
              {evId}
            </button>
          ))}
        </div>
      </div>

      {/* Routing Target */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-xs">
        <div className="flex items-center gap-1.5 truncate">
          <UserCheck className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
          <span className="text-slate-500 text-[10px]">Target:</span>
          <span className="font-bold text-slate-800 text-[11px] truncate">{owner.name || 'External Liaison'}</span>
          <span className="text-slate-400 text-[10px]">({owner.channel || '#fin-recon'})</span>
        </div>
        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded flex-shrink-0">
          0 Writes
        </span>
      </div>
    </div>
  )
}
