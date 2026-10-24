import React from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react'

export default function BeforeAfterCard({ verification, targetAsset, activePack }) {
  if (!verification) return null

  const isFixed = verification.verdict === 'FIXED'

  return (
    <div className="neomorph-card p-3.5 bg-white border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 text-slate-700">
            <RefreshCw className={`w-3.5 h-3.5 ${isFixed ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>
          <h4 className="text-xs font-bold text-slate-900">
            Verification Rerun (AGT-11)
          </h4>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isFixed
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {isFixed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
          Verdict: {verification.verdict}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {verification.checks_rerun?.map((chk, i) => (
          <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2">
            <div className="truncate">
              <span className="font-mono font-bold text-slate-800 text-[11px] block">{chk.check_name}</span>
              <p className="text-slate-500 text-[10px] truncate">{chk.reason}</p>
            </div>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase flex-shrink-0 ${
                chk.passed
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {chk.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
        <span>Target: <strong className="text-slate-700 font-medium">{targetAsset}</strong></span>
        <span className="text-emerald-700 font-bold flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Smoke Cleared · Safe
        </span>
      </div>
    </div>
  )
}
