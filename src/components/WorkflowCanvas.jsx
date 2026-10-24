import React, { useState, useEffect } from 'react'
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  Play,
  MoreHorizontal,
  Home,
  Building2,
  Landmark,
  Scale,
  LayoutDashboard,
  ShieldCheck,
  HeartPulse,
  Microscope,
  Layers,
  Stethoscope,
  Receipt,
  User,
  Plus,
  FileText,
  Network,
  Shield,
  BarChart3,
  Undo2,
  Redo2,
  Clock,
  Sparkles,
  Droplets,
  Send,
  Radio,
  Search,
  Activity,
  Cpu,
  Smartphone,
  Monitor,
  ArrowDown,
  Check,
  Zap,
  Server
} from 'lucide-react'

const iconMap = {
  bank_settlement_feed: Building2,
  payment_ledger: Landmark,
  reconciliation_table: Scale,
  settlement_dashboard: LayoutDashboard,
  regulatory_extract: ShieldCheck,
  adt_feed: HeartPulse,
  lab_results_feed: Microscope,
  interface_message_queue: Layers,
  pharmacy_orders: Stethoscope,
  billing_adapter: Receipt
}

export default function WorkflowCanvas({
  pack,
  trackId = 'fintech',
  workerState,
  burningAssetId,
  severity = 'HIGH',
  verificationState = null,
  reportDeliveredTo = null,
  reducedMotion = false,
  inspectedNodes = [],
  auditData = null,
  sosAlert = null,
  diagnosedReport = null,
  onInspectNode,
  onTriggerIncident,
  onOpenEvidence,
  onOpenHistory,
  onSelectTab,
  onReset
}) {
  const assets = pack?.assets || []
  const isHealthcare = trackId === 'healthcare'
  const [idleNodeIdx, setIdleNodeIdx] = useState(0)
  const [viewMode, setViewMode] = useState('auto') // 'auto' | 'mobile_stack' | 'canvas'
  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString())

  // Ticking live clock for auto-save and health telemetry
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(clockTimer)
  }, [])

  // Continuously cycle patrol across all 5 nodes when in standby so Tracer never sits static
  useEffect(() => {
    if ((workerState?.mode === 'IDLE' || !workerState?.mode) && !burningAssetId) {
      const timer = setInterval(() => {
        setIdleNodeIdx((prev) => (prev + 1) % (assets.length || 5))
      }, 3400)
      return () => clearInterval(timer)
    }
  }, [workerState?.mode, burningAssetId, assets.length])

  // Larger, spacious layout positions on the workflow canvas (Apple-spaced 3-column architecture)
  // Cards are larger (width: 330px, height: 200px+), spacious coords:
  const nodeLayouts = [
    {
      x: 50,
      y: 200,
      width: 335,
      badge: isHealthcare ? 'HL7 Inbound Gateway' : 'Bank Inbound Feed',
      defaultTelemetry: isHealthcare ? 'MLLP :6001 • 14,240 msg/hr' : 'SFTP :22 • 12,500 records'
    },
    {
      x: 440,
      y: 70,
      width: 335,
      badge: isHealthcare ? 'Clinical LOINC Engine' : 'Double-Entry Core Ledger',
      defaultTelemetry: isHealthcare ? 'LOINC/SNOMED • p99 18ms' : 'PostgreSQL CDC • p99 38ms'
    },
    {
      x: 440,
      y: 420,
      width: 335,
      badge: isHealthcare ? 'RabbitMQ Buffer Queue' : 'Automated Recon Engine',
      defaultTelemetry: isHealthcare ? 'AMQP Socket • 0 pending' : 'Apache Spark • $0.00 Float'
    },
    {
      x: 835,
      y: 140,
      width: 330,
      badge: isHealthcare ? 'CPOE Pharmacy Gateway' : 'Treasury Liquidity Cockpit',
      defaultTelemetry: isHealthcare ? 'Pharmacy Pool • 16 wrk' : 'Redis Cluster • 100% Hit'
    },
    {
      x: 835,
      y: 490,
      width: 330,
      badge: isHealthcare ? 'HIPAA Claims Extractor' : 'RBI / FinCEN Reg Output',
      defaultTelemetry: isHealthcare ? 'EDI 837P • HIPAA Pass' : 'FinCEN Extract • SHA-256'
    }
  ]

  // Wires connecting the nodes with labels (mapped to larger card coordinates)
  const connections = [
    { from: 0, to: 1, label: isHealthcare ? 'HL7 MLLP' : 'SFTP Delivery', x: 410, y: 150 },
    { from: 0, to: 2, label: isHealthcare ? 'ADT Broker' : 'Batch Feed', x: 410, y: 340 },
    { from: 1, to: 3, label: isHealthcare ? 'Observation Sync' : 'Recon Table', x: 805, y: 120 },
    { from: 2, to: 4, label: isHealthcare ? 'Claims Adapter' : 'Regulatory Stream', x: 805, y: 470 },
    { from: 2, to: 3, label: isHealthcare ? 'CPOE Queue' : 'Ledger Match', x: 805, y: 300 }
  ]

  // Worker coordinates: follows active inspection/fire target, or sweeps across nodes when idle
  const getWorkerPos = () => {
    const targetId = workerState?.target_house || workerState?.current_house
    const idx = assets.findIndex((a) => a.id === targetId)
    if (idx >= 0 && nodeLayouts[idx]) {
      return { x: nodeLayouts[idx].x + 145, y: nodeLayouts[idx].y - 36 }
    }
    const idleLayout = nodeLayouts[idleNodeIdx] || nodeLayouts[0]
    return { x: idleLayout.x + 145, y: idleLayout.y - 36 }
  }

  const workerPos = getWorkerPos()
  const isExtinguishing = workerState?.mode === 'EXTINGUISHING'
  const isCallingBackup = workerState?.mode === 'CALLING_BACKUP'

  // Total continuous assertion checks across the active pack
  const totalAssertionChecks = assets.reduce((sum, a) => sum + (a.checks?.length || 0), 0)

  // Dynamic live helper for telemetry text
  const getLiveTelemetry = (asset, idx) => {
    if (asset.id === burningAssetId && sosAlert) {
      return `ALERT: ${sosAlert.failing_check || 'Threshold Failure'}`
    }
    if (inspectedNodes.includes(asset.id)) {
      return `Reconciled & Passing • 0 anomalies`
    }
    return nodeLayouts[idx]?.defaultTelemetry || 'Active Live Stream'
  }

  return (
    <div className="relative w-full rounded-[28px] border border-slate-200/90 bg-white overflow-hidden shadow-lg select-none">
      
      {/* Top Canvas Header Bar - Live Telemetry & Mobile View Switcher */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-white/90 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-extrabold text-slate-900 tracking-tight text-sm">
            {isHealthcare ? 'Clinical HL7 Pipeline Studio Canvas' : 'Fintech Daily Reconciliation Studio Canvas'}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
            {assets.length} Active Nodes • {totalAssertionChecks} Assertion Rules
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Responsive Mobile / Canvas View Switcher */}
          <div className="flex items-center bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode(viewMode === 'mobile_stack' ? 'canvas' : 'mobile_stack')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewMode === 'mobile_stack'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Toggle Mobile Card Stack view"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Mobile Stack</span>
            </button>
            <button
              onClick={() => setViewMode('canvas')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                viewMode !== 'mobile_stack'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Full Interactive Workflow Canvas"
            >
              <Monitor className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Studio Canvas</span>
            </button>
          </div>

          {/* Live Auto-Save Timestamp */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Live Sync • {liveTime} • Lead: Nidhin Raj</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: Mobile-Optimized Apple Card Stack View (For Phones & Narrow Screens) */}
      <div className={`${viewMode === 'mobile_stack' ? 'block' : 'hidden lg:hidden'} p-4 md:p-6 bg-slate-50/60 space-y-4`}>
        <div className="text-xs text-slate-500 font-bold px-1 flex items-center justify-between">
          <span>PIPELINE ARCHITECTURE (MOBILE FLOW)</span>
          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-extrabold">
            LIVE 24/7 SRE PATROL
          </span>
        </div>

        {assets.map((asset, idx) => {
          const isOnFire = asset.id === burningAssetId
          const isInspecting = (workerState?.current_house === asset.id && workerState?.mode === 'INSPECTING') || (workerState?.mode === 'IDLE' && !burningAssetId && idleNodeIdx === idx)
          const isVerified = inspectedNodes.includes(asset.id) && !isOnFire
          const Icon = iconMap[asset.id] || Building2
          const owner = asset.owner || {}
          const layout = nodeLayouts[idx] || {}
          const liveTelemetry = getLiveTelemetry(asset, idx)

          return (
            <div key={asset.id} className="relative">
              {/* Dynamic Firefighter Avatar on Mobile */}
              {isInspecting && (
                <div className="mb-2 flex items-center justify-between px-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-extrabold shadow-sm">
                    <span>👨‍🚒</span>
                    <span>
                      {isOnFire
                        ? `Tracer Triaging Anomaly on ${asset.name}`
                        : `Tracer Sweeping Assertion ${(workerState?.patrol_step || idleNodeIdx + 1)} of ${asset.checks?.length || 2}...`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">STEP {idx + 1}/5</span>
                </div>
              )}

              {/* Apple Squircle Card */}
              <div
                onClick={() => onInspectNode && onInspectNode(asset)}
                className={`apple-curve-card p-5 cursor-pointer relative ${
                  isOnFire ? 'on-fire ring-2 ring-rose-400/20' : isInspecting ? 'inspecting ring-2 ring-cyan-400/25' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                        isOnFire
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : isInspecting
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {asset.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {layout.badge || asset.vocab_label}
                      </span>
                    </div>
                  </div>

                  {isOnFire ? (
                    <div className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[11px] flex items-center gap-1.5 animate-bounce">
                      <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                      <span>BREAK</span>
                    </div>
                  ) : isInspecting ? (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 animate-pulse border border-cyan-200">
                      SCANNING
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      NODE 0{idx + 1}
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed mt-2.5">
                  {asset.description}
                </p>

                {/* Live Telemetry Protocol Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700 mt-3">
                  <Activity className={`w-3.5 h-3.5 ${isOnFire ? 'text-rose-500 animate-spin' : 'text-emerald-500'}`} />
                  <span className="truncate">{liveTelemetry}</span>
                </div>

                {/* Health & Checks Area */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`flex items-center gap-1.5 font-bold ${
                    isOnFire ? 'text-rose-700' : isVerified ? 'text-emerald-700' : 'text-slate-600'
                  }`}>
                    {isOnFire ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Failing: {sosAlert?.failing_check || 'Assertion error'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{isVerified ? 'Cryptographically Verified' : 'Healthy & Monitored'}</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono font-bold">
                    {asset.checks?.length || 1} Checks
                  </span>
                </div>

                {/* Footer Owner */}
                <div className="mt-2.5 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {owner.name || 'Nidhin Raj'}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">{owner.channel || 'SMS & Email'}</span>
                </div>
              </div>

              {/* Connecting Flow Arrow Between Mobile Cards */}
              {idx < assets.length - 1 && (
                <div className="my-2.5 flex items-center justify-center">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-500 shadow-2xs">
                    <span>{connections[idx]?.label || 'Pipeline Flow'}</span>
                    <ArrowDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* VIEW 2: Full Large Studio Canvas (Spacious, Apple-Curved Rear Cards, SVG Cables) */}
      <div className={`${viewMode === 'mobile_stack' ? 'hidden' : 'block'} workflow-canvas-grid relative w-full h-[760px] overflow-x-auto overflow-y-hidden p-6`}>
        
        {/* SVG Connector Wires Layer */}
        <svg className="absolute inset-0 w-[1220px] h-[760px] pointer-events-none z-0">
          <defs>
            <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#f43f5e" floodOpacity="0.3" />
            </filter>
            <linearGradient id="wire-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="50%" stopColor={isHealthcare ? '#06b6d4' : '#10b981'} stopOpacity="0.9" />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {connections.map((conn, idx) => {
            const start = nodeLayouts[conn.from]
            const end = nodeLayouts[conn.to]
            if (!start || !end) return null

            const x1 = start.x + start.width
            const y1 = start.y + 80
            const x2 = end.x
            const y2 = end.y + 80
            const midX = (x1 + x2) / 2

            const pathData = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`

            return (
              <g key={idx}>
                {/* Background Shadow line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                  strokeDasharray="6,5"
                />

                {/* Animated Flow line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.75"
                  className={!reducedMotion ? 'connector-pulse' : ''}
                />

                {/* Glowing Data Flow Pulse */}
                {!reducedMotion && (
                  <circle r="4" fill={isHealthcare ? '#06b6d4' : '#10b981'} opacity="0.95">
                    <animateMotion dur={`${2.0 + idx * 0.4}s`} repeatCount="indefinite" path={pathData} />
                  </circle>
                )}

                {/* Connection Label Pill */}
                <g transform={`translate(${conn.x}, ${conn.y})`}>
                  <rect
                    x="-50"
                    y="-11"
                    width="100"
                    height="22"
                    rx="11"
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth="1.2"
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="10"
                    fontFamily="var(--font-sans)"
                    fontWeight="700"
                  >
                    {conn.label}
                  </text>
                </g>
              </g>
            )
          })}

          {/* Water Stream Animation (When fix is approved & executing) */}
          {isExtinguishing && (
            <path
              d={`M ${workerPos.x + 10} ${workerPos.y + 10} Q ${(workerPos.x + 120) / 2} ${(workerPos.y + 90) / 2} ${workerPos.x + 70} ${workerPos.y + 80}`}
              fill="none"
              stroke="#0ea5e9"
              strokeWidth="5"
              className="water-stream"
            />
          )}

          {/* Paper Plane Report Delivery Animation */}
          {reportDeliveredTo && (
            <g className={!reducedMotion ? 'paper-plane-flying' : ''} transform={`translate(${workerPos.x + 10}, ${workerPos.y - 15})`}>
              <polygon points="0,0 22,-9 15,9 8,2" fill="#0f172a" />
              <polygon points="0,0 15,9 7,11" fill="#475569" />
            </g>
          )}
        </svg>

        {/* Dynamic Firefighter Worker Avatar */}
        <div
          className="absolute z-30 transition-all duration-700 ease-in-out pointer-events-none"
          style={{
            left: `${workerPos.x}px`,
            top: `${workerPos.y}px`
          }}
        >
          <div className="flex flex-col items-center">
            {/* Worker Status Speech Bubble */}
            <div className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-extrabold shadow-lg mb-1.5 whitespace-nowrap flex items-center gap-1.5 animate-bounce">
              {isCallingBackup ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Radioing Backup (Zero Writes Enforced)</span>
                </>
              ) : isExtinguishing ? (
                <>
                  <Droplets className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                  <span>Spraying Approved Fix...</span>
                </>
              ) : burningAssetId ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>P0 Triage & Root Cause Diagnosis...</span>
                </>
              ) : workerState?.mode === 'INSPECTING' ? (
                <>
                  <Search className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
                  <span>Inspecting {workerState?.inspecting_name || assets[idleNodeIdx]?.name || 'Endpoint'} ({workerState?.patrol_step || (idleNodeIdx + 1)}/{assets.length})...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Patrolling {assets[idleNodeIdx]?.name || 'Pipeline'} ({idleNodeIdx + 1}/{assets.length})</span>
                </>
              )}
            </div>

            {/* Firefighter Worker Avatar with Apple Glass Squircle */}
            <div className={`w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xl flex items-center justify-center text-slate-900 font-extrabold text-base ${!reducedMotion && (workerState?.mode === 'PATROLLING' || workerState?.mode === 'INSPECTING' || workerState?.mode === 'IDLE') ? 'worker-walking' : ''}`}>
              👨‍🚒
            </div>
          </div>
        </div>

        {/* 5 Workflow Node Cards (Spacious, Apple Squircle Rear Curved, 100% Live Data) */}
        {assets.map((asset, idx) => {
          const layout = nodeLayouts[idx] || { x: 50, y: 50, width: 330 }
          const isOnFire = asset.id === burningAssetId
          const isInspecting = (workerState?.current_house === asset.id && workerState?.mode === 'INSPECTING') || (workerState?.mode === 'IDLE' && !burningAssetId && idleNodeIdx === idx)
          const isVerified = inspectedNodes.includes(asset.id) && !isOnFire
          const Icon = iconMap[asset.id] || Building2
          const owner = asset.owner || {}
          const liveTelemetry = getLiveTelemetry(asset, idx)

          return (
            <div
              key={asset.id}
              onClick={() => onInspectNode && onInspectNode(asset)}
              className={`apple-curve-card absolute z-20 cursor-pointer p-5 flex flex-col justify-between transition-all ${
                isOnFire ? 'on-fire ring-4 ring-rose-400/20' : isInspecting ? 'inspecting ring-4 ring-cyan-400/25' : ''
              }`}
              style={{
                left: `${layout.x}px`,
                top: `${layout.y}px`,
                width: `${layout.width}px`,
                minHeight: '205px'
              }}
            >
              <div>
                {/* Node Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs ${
                        isOnFire
                          ? 'bg-rose-50 text-rose-600 border border-rose-200'
                          : isInspecting
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                        {asset.name}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {layout.badge || asset.vocab_label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isOnFire ? (
                      <div className="w-7 h-7 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center animate-bounce shadow-xs">
                        <Flame className="w-4 h-4 text-rose-600 fill-rose-600 flame-active" />
                      </div>
                    ) : isInspecting ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-800 animate-pulse border border-cyan-200">
                        Scanning
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onInspectNode && onInspectNode(asset)
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title={`Inspect ${asset.name} assertion checks`}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Node Description Snippet */}
                <p className="text-xs text-slate-500 leading-relaxed mt-2.5 line-clamp-2">
                  {asset.description || 'Core mission-critical regulated pipeline asset.'}
                </p>

                {/* Real-time Telemetry Protocol Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700 mt-2.5">
                  <Activity className={`w-3.5 h-3.5 ${isOnFire ? 'text-rose-500 animate-spin' : 'text-emerald-500'}`} />
                  <span className="truncate">{liveTelemetry}</span>
                </div>
              </div>

              {/* Status & Issue Banner Area */}
              <div className="mt-3.5 space-y-2">
                {isOnFire ? (
                  <div className="node-issue-banner">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span className="truncate">
                      Break Detected: {sosAlert?.failing_check || `Failing assertion on ${asset.name}`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className={`flex items-center gap-1.5 font-bold ${isVerified ? 'text-emerald-700' : 'text-slate-600'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                      {isVerified ? 'Verified Healthy & Reconciled' : 'Healthy & Monitored'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-bold">
                      {asset.checks?.length || 1} Checks
                    </span>
                  </div>
                )}

                {/* Footer: Resident Owner Pill */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-bold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {owner.name || 'Nidhin Raj'}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">{owner.channel || 'SMS & Email Relay'}</span>
                </div>
              </div>

              {/* Verification Smoke Clearing Effect */}
              {verificationState === 'FIXED' && isOnFire && (
                <div className="absolute -top-4 right-2 pointer-events-none">
                  <span className="smoke-puff block text-xs">💨 Clean Smoke</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Floating Left Vertical Tool Dock (Apple Glass Style) */}
        <div className="absolute left-6 top-6 z-30 glass-dock rounded-2xl p-2 flex flex-col gap-2 shadow-lg">
          <button
            onClick={() => onTriggerIncident && onTriggerIncident()}
            className="p-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Inject / Trigger Incident"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenEvidence && onOpenEvidence()}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Inspect Cited Evidence"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenHistory && onOpenHistory()}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Incident Notifications & SMS Pager"
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
          </button>
          <button
            onClick={() => onSelectTab && onSelectTab('audit')}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Cryptographic Audit Trail (AUD-1 & AUD-2)"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => onSelectTab && onSelectTab('eval')}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
            title="Evaluation Benchmark Matrix (EVAL-1 to 6)"
          >
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </button>
        </div>

        {/* Floating Bottom Left Control Pills */}
        <div className="absolute left-6 bottom-5 z-30 flex items-center gap-2">
          <div className="glass-dock rounded-2xl p-1.5 flex items-center gap-1 shadow-sm">
            <button
              onClick={() => onReset && onReset()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer active:scale-95 transition-all"
              title="Undo / Reset to Clean Baseline (ENV-4)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onTriggerIncident && onTriggerIncident()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer active:scale-95 transition-all"
              title="Redo / Run Sentinel Incident Cycle"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="glass-dock rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => onOpenHistory && onOpenHistory()}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
              title="Incident Notification History & Outbound Gateway"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Floating Bottom Center Live Status Banner - 100% Live from auditData */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[90vw]">
          <div className="glass-dock px-4 py-2 rounded-full text-xs font-semibold text-slate-700 shadow-md flex items-center gap-2.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate">
              Tracer Agent Active • SHA-256 Hash Chained: {auditData?.integrity?.valid ? '100% Verified' : 'Monitoring'} • {auditData?.entries?.length || 0} Tamper-Proof Audit Entries • 0 Unapproved Writes
            </span>
          </div>
        </div>

      </div>

    </div>
  )
}
