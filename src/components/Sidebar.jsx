import React, { useState } from 'react'
import {
  ArrowLeft,
  Search,
  Plus,
  LayoutGrid,
  GitBranch,
  ShieldCheck,
  BarChart3,
  MoreVertical,
  BookOpen,
  HelpCircle,
  Settings,
  Flame,
  ChevronDown,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  FileCheck,
  Zap,
  Check
} from 'lucide-react'

export default function Sidebar({
  activeTrack,
  onSwitchTrack,
  activeTab,
  onSelectTab,
  onTriggerIncident,
  burningAssetId,
  className = '',
  onCloseMobile
}) {
  const isHealthcare = activeTrack === 'healthcare'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const flows = [
    {
      id: 'fintech',
      track: 'fintech',
      tab: 'village',
      name: 'Fintech Reconciliation',
      icon: LayoutGrid,
      tag: 'Primary',
      status: !isHealthcare ? 'On' : 'Off',
      active: activeTab === 'village' && !isHealthcare
    },
    {
      id: 'healthcare',
      track: 'healthcare',
      tab: 'village',
      name: 'Healthcare HL7 Flow',
      icon: GitBranch,
      tag: 'Clinical',
      status: isHealthcare ? 'On' : 'Off',
      active: activeTab === 'village' && isHealthcare
    },
    {
      id: 'audit',
      tab: 'audit',
      name: 'Audit Trail (AUD-1)',
      icon: ShieldCheck,
      tag: 'Tamper Proof',
      status: 'SHA-256',
      active: activeTab === 'audit'
    },
    {
      id: 'eval',
      tab: 'eval',
      name: 'Evaluation Matrix',
      icon: BarChart3,
      tag: 'N=10 Runs',
      status: 'Benchmark',
      active: activeTab === 'eval'
    }
  ]

  const filteredFlows = flows.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tag.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-full md:w-64'
      } flex-shrink-0 bg-white border-r border-slate-200/90 h-full min-h-0 md:min-h-screen flex flex-col justify-between p-3.5 transition-all duration-200 select-none ${className}`}
    >
      <div>
        {/* Top Header: Tracer Studio / Toggle Collapse */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          {!isCollapsed && (
            <button
              onClick={() => onSelectTab('village')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-display font-extrabold tracking-tight">Tracer Studio</span>
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search Input */}
        {!isCollapsed && (
          <div className="mt-3.5 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flows..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-slate-400 text-slate-800 placeholder-slate-400 font-medium"
            />
          </div>
        )}

        {/* Flows List Section */}
        <div className="mt-4 space-y-3">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-display font-extrabold text-slate-800 tracking-tight">
                {isHealthcare ? 'Dave Miller / Flows' : 'Sarah Chen / Flows'}
              </span>
              <button
                onClick={() =>
                  onTriggerIncident(
                    isHealthcare
                      ? 'incident_2_healthcare_mapping_reject'
                      : 'incident_1_fintech_partial_file'
                  )
                }
                className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Trigger Incident Test"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-1.5">
            {filteredFlows.map((flow) => {
              const Icon = flow.icon
              const isSelected = flow.active

              return (
                <div
                  key={flow.id}
                  onClick={() => {
                    if (flow.track) onSwitchTrack(flow.track)
                    if (flow.tab) onSelectTab(flow.tab)
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-50 border-slate-300 shadow-xs ring-1 ring-slate-900/5'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                  title={flow.name}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {!isCollapsed && (
                        <span className="text-xs font-display font-extrabold text-slate-900 tracking-tight truncate">
                          {flow.name}
                        </span>
                      )}
                    </div>
                    {!isCollapsed && <MoreVertical className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  </div>

                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5 ml-7 text-[10px] font-bold mt-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                        {flow.tag}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {flow.status}
                      </span>
                      {flow.track && burningAssetId && activeTrack === flow.track && (
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
                          <Flame className="w-2.5 h-2.5 fill-rose-600" /> Break
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Seeded Incident Fast Launchers */}
          {!isCollapsed && (
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 block mb-1.5">
                Seeded Incident Tests
              </span>
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    onSwitchTrack('fintech')
                    onSelectTab('village')
                    onTriggerIncident('incident_1_fintech_partial_file')
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-700 text-left transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 group-hover:animate-ping flex-shrink-0"></span>
                  <span className="truncate text-[11px] font-medium">Fintech: $241k Partial Break</span>
                </button>

                <button
                  onClick={() => {
                    onSwitchTrack('healthcare')
                    onSelectTab('village')
                    onTriggerIncident('incident_2_healthcare_mapping_reject')
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-left transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 group-hover:animate-ping flex-shrink-0"></span>
                  <span className="truncate text-[11px] font-medium">Healthcare: 428 Queued Msgs</span>
                </button>

                <button
                  onClick={() => {
                    onSwitchTrack('fintech')
                    onSelectTab('village')
                    onTriggerIncident('incident_3_fintech_malformed_escalation')
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-left transition-colors cursor-pointer group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0"></span>
                  <span className="truncate text-[11px] font-medium">Fintech: Upstream 0-Writes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Items (Docs & Help & Resident Lead) */}
      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <button
          onClick={() => onSelectTab('eval')}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          title="Docs & Benchmark Methodology"
        >
          <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
          {!isCollapsed && <span>Docs & Benchmark</span>}
        </button>

        <button
          onClick={() => onSelectTab('audit')}
          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors text-left cursor-pointer"
          title="Cryptographic Audit Trail"
        >
          <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
          {!isCollapsed && <span>Audit & Help</span>}
        </button>

        {/* User Card */}
        <div
          onClick={() => onSwitchTrack(isHealthcare ? 'fintech' : 'healthcare')}
          className="pt-2 border-t border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all"
          title="Click to toggle between Sarah Chen and Dave Miller"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {isHealthcare ? 'DM' : 'SC'}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <p className="text-xs font-extrabold text-slate-900 leading-tight truncate">
                  {isHealthcare ? 'Dave Miller' : 'Sarah Chen'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {isHealthcare ? 'Clinical Integration' : 'Reconciliation Lead'}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
        </div>
      </div>
    </aside>
  )
}
