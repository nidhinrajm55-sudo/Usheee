import React from 'react'
import {
  X,
  Send,
  FileText,
  Code,
  Download,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  User
} from 'lucide-react'

export default function ReportViewModal({ report, onClose }) {
  const [activeView, setActiveView] = React.useState('summary')
  const [copied, setCopied] = React.useState(false)

  if (!report) return null

  const handleCopy = () => {
    const textToCopy =
      activeView === 'summary'
        ? report.summary_view
        : JSON.stringify(report.technical_view, null, 2)
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2))
    const dlAnchor = document.createElement('a')
    dlAnchor.setAttribute('href', dataStr)
    dlAnchor.setAttribute('download', `${report.id}_incident_report.json`)
    dlAnchor.click()
  }

  const owner = report.recipient_owner || {}
  const tech = report.technical_view || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-xs">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Owner Incident Report</h3>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                  Delivered (Simulated)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Delivered to: <span className="text-slate-900 font-extrabold">{owner.name}</span> ({owner.role}) via{' '}
                <span className="text-slate-900 font-bold">{report.simulated_channel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs (NTF-4) */}
        <div className="flex items-center justify-between my-3 pb-2 border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('summary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeView === 'summary'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Plain-Language Summary (Owner)
            </button>
            <button
              onClick={() => setActiveView('technical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeView === 'technical'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Technical View (Engineers)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1">
          {activeView === 'summary' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs leading-relaxed">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-700" />
                    <span className="font-extrabold text-slate-900">To: {owner.name}</span>
                    <span className="text-slate-500">({owner.channel})</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Hash: {report.report_hash}
                  </span>
                </div>

                <div className="whitespace-pre-line text-slate-800 font-sans font-medium">{report.summary_view}</div>
              </div>

              {/* Status Checklist Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold">Verification Outcome</span>
                  <span className="font-extrabold text-emerald-700 flex items-center gap-1 mt-1 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {tech.verification_status || 'Verified Safe'}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-extrabold">Residual System Risk</span>
                  <span className="font-extrabold text-slate-800 block mt-1 text-xs">{tech.residual_risk || 'None'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[380px] shadow-inner">
                {JSON.stringify(tech, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Chained in tamper-evident audit ledger</span>
          </div>
          <button
            onClick={onClose}
            className="btn-primary-obsidian cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
