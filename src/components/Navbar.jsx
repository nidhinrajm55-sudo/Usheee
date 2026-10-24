import React from 'react'
import {
  Flame,
  Shield,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Sliders,
  Play,
  CheckCircle2,
  Building2,
  Activity,
  Layers,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react'

export default function Navbar({
  activePack,
  onSwitchPack,
  selectedIncident,
  onSelectIncident,
  onReset,
  onPatrol,
  onRunIncident,
  isPatrolling,
  isInvestigating,
  soundMuted,
  onToggleSound,
  isOperationsView,
  onToggleOperationsView,
  reducedMotion,
  onToggleReducedMotion,
  activeTab,
  onSelectTab
}) {
  const isHealthcare = activePack === 'healthcare'

  // Pre-configured incidents per track
  const fintechIncidents = [
    {
      id: 'incident_1_fintech_partial_file',
      title: 'Incident 1: Partial Settlement File (Silent $241k Mismatch)',
      desc: 'Bank file truncated mid-transfer; scheduler green; row count -69%',
      badge: 'P0 · Happy Path Fix'
    },
    {
      id: 'incident_3_fintech_malformed_escalation',
      title: 'Incident 3: Malformed External File (Escalation Path)',
      desc: 'Partner delimiter corruption; proves unrecoverable; zero writes',
      badge: 'P0 · Safe Escalation'
    },
    {
      id: 'incident_4_fintech_column_rename',
      title: 'Incident 4: Upstream Column Rename (2-Hops Lineage)',
      desc: 'Schema mutation tx_amt -> transaction_amount breaks recon table',
      badge: 'P2 · Lineage Traversal'
    }
  ]

  const healthcareIncidents = [
    {
      id: 'incident_2_healthcare_mapping_reject',
      title: 'Incident 2: Mapping Change Mass Rejections (428 Queued)',
      desc: 'Deploy v1.8.2 rejects OBX-5; queue spikes; replay with dedupe',
      badge: 'P0 · Happy Path Fix'
    },
    {
      id: 'incident_5_healthcare_acks_stopped',
      title: 'Incident 5: Silent Channel Stall (340 Missing ACKs)',
      desc: 'Receiver socket thread deadlock; TCP green but 0 ACKs',
      badge: 'P2 · Silent Channel'
    }
  ]

  const currentIncidents = isHealthcare ? healthcareIncidents : fintechIncidents

  return (
    <header className="w-full glass-panel border-b border-slate-800 px-4 py-3 sticky top-0 z-30 mb-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Main Row: Logo, Primary Track Switcher, Action Tools */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Product Concept */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-amber-500 to-rose-600 p-0.5 shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-amber-400 fill-amber-400/30" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">TRACER</span>
                <span className="text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  The Pipeline Village
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Incident-Investigation Agent for Regulated Pipelines
              </p>
            </div>
          </div>

          {/* Primary Two-Track Interface Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner">
            {/* Fintech Track Button */}
            <button
              onClick={() => {
                onSwitchPack('fintech')
                onSelectIncident('incident_1_fintech_partial_file')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                !isHealthcare
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className={`w-4 h-4 ${!isHealthcare ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>💳 FINTECH TRACK</span>
              {!isHealthcare && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            {/* Healthcare Track Button */}
            <button
              onClick={() => {
                onSwitchPack('healthcare')
                onSelectIncident('incident_2_healthcare_mapping_reject')
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                isHealthcare
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/50 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className={`w-4 h-4 ${isHealthcare ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>🏥 HEALTHCARE TRACK</span>
              {isHealthcare && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              )}
            </button>
          </div>

          {/* Right Action Tools: One-Click Reset, Sound, Operations View */}
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
              title="ENV-4: Returns environment and village memory to clean baseline in <5 seconds"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Reset Baseline</span>
            </button>

            <button
              onClick={onToggleSound}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-slate-200 text-xs transition-all cursor-pointer"
              title={soundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={onToggleOperationsView}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                isOperationsView
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle between Pipeline Village Metaphor and Operations Topology View"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Row: Active Track Scenario Selector & Global View Tabs */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Active Track Incident Picker Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Scenario:
            </span>
            <select
              value={selectedIncident}
              onChange={(e) => onSelectIncident(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-900 border border-slate-700 text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-inner max-w-sm truncate"
            >
              {currentIncidents.map((inc) => (
                <option key={inc.id} value={inc.id} className="bg-slate-950 text-slate-200">
                  {inc.title}
                </option>
              ))}
            </select>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectTab('village')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'village'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Village & Incident Triage
            </button>
            <button
              onClick={() => onSelectTab('audit')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Audit Trail (Hash-Chained)
            </button>
            <button
              onClick={() => onSelectTab('eval')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'eval'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evaluation Benchmark
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
