import React from 'react'
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Link2,
  Terminal,
  Cpu,
  Sparkles,
  ArrowRight
} from 'lucide-react'

export default function LiveTimeline({ steps = [], onSelectEvidence, conclusion = null }) {
  return (
    <div className="neomorph-card p-4 flex flex-col h-full bg-white border border-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 text-slate-700">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 leading-tight">Live Investigation Stream</h3>
            <p className="text-[10px] text-slate-400">Hypotheses Formulation & Tool Citations (AGT-4)</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {steps.length} Steps
        </span>
      </div>

      {/* Steps List (Compact & Clean, Non-Brutalist) */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[480px]">
        {steps.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Cpu className="w-6 h-6 text-slate-300 mb-1.5 animate-pulse" />
            <p className="text-xs font-semibold text-slate-700">Investigation Stream Idle</p>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs">
              Trigger an incident to watch Tracer test hypotheses and cite evidence.
            </p>
          </div>
        ) : (
          steps.map((step, idx) => {
            const isSupported = step.verdict === 'SUPPORTED'
            const isRejected = step.verdict === 'REJECTED'

            return (
              <div
                key={step.result_id || idx}
                className={`p-2.5 rounded-xl border transition-all ${
                  isSupported
                    ? 'bg-emerald-50/30 border-emerald-200/80'
                    : isRejected
                    ? 'bg-rose-50/20 border-rose-200/80'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                {/* Row 1: Index, Category, Hypothesis, Verdict */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 flex-1 min-w-0">
                    <span className="w-4 h-4 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                      {step.step_index || idx + 1}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 flex-shrink-0">
                      {step.category || 'HYPOTHESIS'}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 leading-snug line-clamp-1">
                      {step.hypothesis}
                    </p>
                  </div>

                  {/* Verdict Badge */}
                  <div
                    className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isSupported
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRejected
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isSupported ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : isRejected ? (
                      <XCircle className="w-3 h-3 text-rose-600" />
                    ) : (
                      <HelpCircle className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{step.verdict}</span>
                  </div>
                </div>

                {/* Row 2: Tool Call & Clickable Citation & Finding */}
                <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-mono font-semibold text-slate-700">${step.tool_name}()</span>
                    {step.reason && (
                      <span className="text-slate-400 truncate italic">
                        — &ldquo;{step.reason}&rdquo;
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectEvidence(step)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-mono text-[9px] font-bold transition-all cursor-pointer flex-shrink-0 shadow-2xs"
                    title="Inspect tool payload"
                  >
                    <Link2 className="w-2.5 h-2.5 text-slate-400" />
                    {step.result_id}
                  </button>
                </div>
              </div>
            )
          })
        )}

        {/* Conclusion Card when reached (Compact & Sleek) */}
        {conclusion && (
          <div className="p-3 rounded-xl bg-slate-900 text-white shadow-md mt-2 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Root Cause Conclusion (AGT-8)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                Confidence: {Math.round((conclusion.confidence || 0.95) * 100)}%
              </span>
            </div>
            <p className="text-xs font-bold text-white leading-snug">
              {conclusion.root_cause}
            </p>
            {conclusion.factors && (
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                Factors: {conclusion.factors.join(' · ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
