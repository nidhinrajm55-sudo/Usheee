import React from 'react'
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Fingerprint,
  FileDiff,
  Flame,
  ArrowRight,
  ShieldCheck
} from 'lucide-react'

export default function ApprovalModal({ proposal, onApprove, onReject, isExecuting }) {
  const [rejecting, setRejecting] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState('Operator requires further investigation before writing')
  const [approverName, setApproverName] = React.useState('Sarah Chen (Recon Ops Lead)')

  if (!proposal) return null

  const dry = proposal.dry_run || {}

  const handleApprove = () => {
    onApprove(approverName)
  }

  const handleReject = () => {
    onReject(rejectReason)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Human Approval Gate</h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                Single-Use Token (APR-2)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Code-level security guard strictly prevents unapproved database mutations.
            </p>
          </div>
        </div>

        {/* Action & Target Asset Header */}
        <div className="p-3.5 my-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Proposed Action</span>
            <p className="text-sm font-mono font-extrabold text-slate-900">{proposal.action}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Target Endpoint</span>
            <p className="text-sm font-extrabold text-slate-900">{proposal.target_asset}</p>
          </div>
        </div>

        {/* Dry Run Predictions Card */}
        <div className="mb-4 p-4 rounded-2xl bg-slate-900 text-white shadow-md">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <FileDiff className="w-4 h-4 text-emerald-400" />
              Dry Run Simulation Predictions (ACT-1)
            </span>
            <span className="text-[10px] font-mono text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              Hash: {proposal.dry_run_hash}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            {dry.predicted_rows_to_add !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Predicted Rows to Add</span>
                <span className="font-extrabold text-emerald-400 text-sm">+{dry.predicted_rows_to_add.toLocaleString()}</span>
              </div>
            )}
            {dry.predicted_rows_to_replace !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Staging Rows to Replace</span>
                <span className="font-extrabold text-slate-200 text-sm">{dry.predicted_rows_to_replace.toLocaleString()}</span>
              </div>
            )}
            {dry.messages_to_replay !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Messages to Replay</span>
                <span className="font-extrabold text-slate-200 text-sm">{dry.messages_to_replay}</span>
              </div>
            )}
            {dry.residual_duplicate_risk !== undefined && (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Residual Duplicate Risk</span>
                <span className="font-extrabold text-emerald-400 text-sm">{dry.residual_duplicate_risk}</span>
              </div>
            )}
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="font-extrabold text-amber-400 text-[10px] uppercase">Risks:</span>
              <span className="text-slate-400 text-[11px]">{proposal.risks || 'No structural risks identified.'}</span>
            </div>
            <div className="flex items-start gap-1.5 text-slate-300">
              <span className="font-extrabold text-slate-300 text-[10px] uppercase">Trade-offs:</span>
              <span className="text-slate-400 text-[11px]">{proposal.trade_offs || 'Standard pipeline partition swap.'}</span>
            </div>
          </div>
        </div>

        {/* Approver Name Input */}
        <div className="mb-4">
          <label className="text-[11px] uppercase font-extrabold text-slate-500 block mb-1">
            Authorizing Approver (Audit Log Signature)
          </label>
          <input
            type="text"
            value={approverName}
            onChange={(e) => setApproverName(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white font-semibold"
          />
        </div>

        {/* Rejection Path */}
        {rejecting && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 mb-4 animate-in fade-in">
            <label className="text-xs font-bold text-rose-800 block mb-1">
              Reason for Rejection (Audit Logged)
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-rose-300 text-xs text-slate-800 focus:outline-none h-16 resize-none mb-2"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setRejecting(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Confirm Rejection & Stop
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!rejecting && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setRejecting(true)}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-rose-500" />
              Reject Proposal
            </button>

            <button
              onClick={handleApprove}
              disabled={isExecuting}
              className={`btn-primary-obsidian cursor-pointer ${
                isExecuting ? 'opacity-70 cursor-not-allowed animate-pulse' : ''
              }`}
            >
              <Fingerprint className="w-4 h-4 text-emerald-400" />
              <span>{isExecuting ? 'Minting Token & Executing...' : 'Mint Token & Execute Fix'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
