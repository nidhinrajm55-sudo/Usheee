import React from 'react'
import { HardHat, Compass, Search, Flame, Droplets, Trophy, Radio, CheckCircle2 } from 'lucide-react'

export default function WorkerBadge({ workerState }) {
  const mode = workerState?.mode || 'IDLE'

  const getModeInfo = () => {
    switch (mode) {
      case 'PATROLLING':
        return {
          label: 'Patrolling Pipeline Village',
          desc: 'Inspecting endpoints in dependency order...',
          icon: Compass,
          color: 'text-slate-800',
          bg: 'bg-slate-50 border-slate-200'
        }
      case 'INSPECTING':
        return {
          label: 'Inspecting Asset Checks',
          desc: `Running checks on ${workerState?.current_house || 'house'}...`,
          icon: Search,
          color: 'text-slate-800',
          bg: 'bg-slate-50 border-slate-200'
        }
      case 'RUSHING_TO_FIRE':
        return {
          label: 'Rushing to House Fire!',
          desc: `Check failed on ${workerState?.target_house}! Triage commenced.`,
          icon: Flame,
          color: 'text-rose-700',
          bg: 'bg-rose-50/70 border-rose-200'
        }
      case 'WAITING_APPROVAL':
        return {
          label: 'Awaiting Human Approval Gate',
          desc: 'Fix dry-run ready. Extinguisher armed pending single-use token.',
          icon: HardHat,
          color: 'text-amber-800',
          bg: 'bg-amber-50/70 border-amber-200'
        }
      case 'EXTINGUISHING':
        return {
          label: 'Executing Approved Fix',
          desc: 'Spraying high-pressure fix into target asset...',
          icon: Droplets,
          color: 'text-slate-900',
          bg: 'bg-slate-100 border-slate-300'
        }
      case 'CELEBRATING':
        return {
          label: 'Safe & Verified!',
          desc: 'Checks rerun & confirmed passed. Fire extinguished!',
          icon: Trophy,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50/70 border-emerald-200'
        }
      case 'CALLING_BACKUP':
        return {
          label: 'Calling for Backup (Escalation)',
          desc: 'Unrecoverable upstream condition. Zero writes attempted.',
          icon: Radio,
          color: 'text-slate-900',
          bg: 'bg-slate-100 border-slate-200'
        }
      default:
        return {
          label: 'Tracer On Duty',
          desc: 'Standing by for scheduled patrol or incident injection.',
          icon: CheckCircle2,
          color: 'text-slate-700',
          bg: 'bg-white border-slate-200'
        }
    }
  }

  const info = getModeInfo()
  const Icon = info.icon

  return (
    <div className={`flex items-center justify-between px-3.5 py-2 rounded-xl border ${info.bg} transition-all text-xs shadow-2xs`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-1 rounded-lg bg-white border border-slate-200/80 shadow-2xs ${info.color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900">{info.label}</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">{info.desc}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
        <span>Target: <strong className="text-slate-700 font-sans">{workerState?.target_house || 'None'}</strong></span>
      </div>
    </div>
  )
}
