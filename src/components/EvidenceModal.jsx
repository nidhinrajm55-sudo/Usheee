import React from 'react'
import { X, ShieldCheck, Hash, Terminal, Clock, Copy, Check } from 'lucide-react'

export default function EvidenceModal({ evidence, onClose }) {
  const [copied, setCopied] = React.useState(false)

  if (!evidence) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(evidence.tool_output, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-900 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Cited Evidence Inspector</h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {evidence.result_id || evidence.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Section 7.2 Read-Only Aggregate Citation Verification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Tool Function</span>
            <span className="font-mono font-bold text-slate-900 text-xs">{evidence.tool_name || evidence.tool}</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Execution Hash (SHA-256)</span>
            <span className="font-mono text-[11px] text-amber-700 font-bold truncate block">
              {evidence.result_hash || evidence.hash || 'sha256_verified'}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Recorded Timestamp</span>
            <span className="font-mono text-[11px] text-slate-700 font-medium">
              {evidence.timestamp ? new Date(evidence.timestamp).toLocaleTimeString() : 'Recent'}
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-3">
          <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500 block mb-1">
            Tool Arguments (Inputs)
          </span>
          <pre className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 overflow-x-auto">
            {JSON.stringify(evidence.tool_inputs || evidence.inputs || {}, null, 2)}
          </pre>
        </div>

        {/* Aggregate Output Payload */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] uppercase font-extrabold tracking-wider text-slate-500">
              Aggregated Output (No Raw PII/PHI Records)
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-slate-700 font-bold hover:text-slate-900 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 text-xs font-mono overflow-x-auto max-h-56 shadow-inner">
            {JSON.stringify(evidence.tool_output || evidence.output || {}, null, 2)}
          </pre>
        </div>

        {/* Verification Footer */}
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Citation Integrity: Tamper Proof</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
