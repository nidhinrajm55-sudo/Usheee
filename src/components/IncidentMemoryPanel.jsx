import React from 'react'
import { Sparkles, Zap } from 'lucide-react'

export default function IncidentMemoryPanel({ memoryData }) {
  if (!memoryData) return null

  return (
    <div className="neomorph-card px-3.5 py-2.5 border border-amber-200/80 bg-amber-50/40 text-xs shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="font-bold text-slate-900 text-[11px]">
            Incident Memory Match (MEM-2):
          </span>
          <span className="text-slate-700 font-medium truncate max-w-md">
            {memoryData.suggested_hypothesis}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {Math.round((memoryData.similarity_score || 0.85) * 100)}% Match
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-600" /> Speedup Active
          </span>
        </div>
      </div>
    </div>
  )
}
