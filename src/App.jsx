import React, { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'

import Sidebar from './components/Sidebar'
import HeaderBar from './components/HeaderBar'
import WorkflowCanvas from './components/WorkflowCanvas'
import WorkerBadge from './components/WorkerBadge'
import LiveTimeline from './components/LiveTimeline'
import EvidenceModal from './components/EvidenceModal'
import ApprovalModal from './components/ApprovalModal'
import BeforeAfterCard from './components/BeforeAfterCard'
import EscalationCard from './components/EscalationCard'
import ReportViewModal from './components/ReportViewModal'
import NotificationModal from './components/NotificationModal'
import DependencyGraph from './components/DependencyGraph'
import AuditLogTab from './components/AuditLogTab'
import EvalHarnessTab from './components/EvalHarnessTab'
import IncidentMemoryPanel from './components/IncidentMemoryPanel'
import EndpointGrid from './components/EndpointGrid'
import CommandPalette from './components/CommandPalette'
import { soundEffects } from './components/AudioEffects'

import {
  Flame,
  Shield,
  Play,
  RotateCcw,
  Sparkles,
  Mail,
  Bell,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Send,
  FileText,
  Activity,
  Building2,
  Scale,
  Check,
  Radio,
  FileDiff,
  AlertOctagon,
  Clock,
  Layers,
  LayoutGrid,
  Filter,
  Plus,
  Shuffle,
  Menu,
  X,
  Monitor,
  ShieldCheck,
  BarChart3
} from 'lucide-react'

const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '') || (
  typeof window !== 'undefined'
    ? (window.location.port === '5173' ? 'http://127.0.0.1:8000' : '')
    : ''
)

export default function App() {
  // Navigation & Track Selection (Two Dedicated Interfaces)
  const [activeTab, setActiveTab] = useState('village') // 'village', 'audit', 'eval'
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)
  const [activeTrack, setActiveTrack] = useState('fintech') // 'fintech' or 'healthcare'
  const [selectedIncident, setSelectedIncident] = useState('incident_1_fintech_partial_file')
  const [isOperationsView, setIsOperationsView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [soundMuted, setSoundMuted] = useState(false)

  // Simulation & Village State
  const [packs, setPacks] = useState({})
  const [workerState, setWorkerState] = useState({
    mode: 'IDLE',
    current_house: null,
    target_house: null,
    patrol_step: 0
  })
  const [burningAssetId, setBurningAssetId] = useState(null)
  const [incidentSeverity, setIncidentSeverity] = useState('HIGH')
  const [isPatrolling, setIsPatrolling] = useState(false)
  const [isInvestigating, setIsInvestigating] = useState(false)
  const [isExecutingFix, setIsExecutingFix] = useState(false)
  const [inspectedNodes, setInspectedNodes] = useState([])

  // Investigation Artifacts
  const [steps, setSteps] = useState([])
  const [conclusion, setConclusion] = useState(null)
  const [proposal, setProposal] = useState(null)
  const [hasApprovedOrRejected, setHasApprovedOrRejected] = useState(false)
  const [escalation, setEscalation] = useState(null)
  const [verification, setVerification] = useState(null)
  const [report, setReport] = useState(null)
  const [reportDeliveredTo, setReportDeliveredTo] = useState(null)
  const [inspectingEvidence, setInspectingEvidence] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [memoryData, setMemoryData] = useState(null)

  // Incident Notifications & Email Dispatch
  const [sosAlert, setSosAlert] = useState(null)
  const [diagnosedReport, setDiagnosedReport] = useState(null)
  const [sentEmails, setSentEmails] = useState([])
  const [sentSms, setSentSms] = useState([])
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)

  // Audit & Eval
  const [auditData, setAuditData] = useState({ entries: [], integrity: { valid: true } })
  const [evalResults, setEvalResults] = useState(null)
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false)

  // Sync Audio Mute
  useEffect(() => {
    soundEffects.setMuted(soundMuted)
  }, [soundMuted])

  // Initial Load
  useEffect(() => {
    fetchPacks()
    fetchAudit()
    fetchEvalResults()
  }, [])

  // Establish SSE Connection
  useEffect(() => {
    let evtSource = null
    try {
      evtSource = new EventSource(`${API_BASE}/incidents/stream`)
      evtSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data)
          handleIncomingEvent(parsed)
        } catch (e) {
          console.error('SSE JSON error:', e)
        }
      }
    } catch (err) {
      console.warn('SSE fallback mode active.')
    }

    return () => {
      if (evtSource) evtSource.close()
    }
  }, [activeTrack])

  // Background Status Polling for 100% sync reliability
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchCurrentStatus()
    }, 1200)

    return () => clearInterval(pollInterval)
  }, [burningAssetId, isPatrolling, isInvestigating, activeTrack, hasApprovedOrRejected])

  const handleIncomingEvent = (evt) => {
    const type = evt.event_type || evt.type
    const data = evt.data || evt

    if (evt.worker_state) {
      setWorkerState(evt.worker_state)
    }

    if (type === 'FIRE_DISCOVERED') {
      const assetId = data.asset_id || data.check_failure?.target_asset
      setBurningAssetId(assetId)
      setIncidentSeverity(data.severity || 'HIGH')
      if (data.sos_alert) {
        setSosAlert(data.sos_alert)
      }
      soundEffects.playSiren()
    } else if (type === 'SOS_ALERT_SENT') {
      const alertPayload = data.data || data
      setSosAlert(alertPayload)
      soundEffects.playSiren()
    } else if (type === 'DIAGNOSED_REPORT_READY') {
      const diagReport = data.data || data
      setDiagnosedReport(diagReport)
    } else if (type === 'EMAIL_DISPATCHED') {
      const emailRecord = data.data || data
      setSentEmails((prev) => [emailRecord, ...prev])
    } else if (type === 'SMS_DISPATCHED') {
      const smsRecord = data.data || data
      setSentSms((prev) => [smsRecord, ...prev])
    } else if (type === 'INVESTIGATION_STEP') {
      if (data.step) {
        setSteps((prev) => {
          if (prev.some((s) => s.result_id === data.step.result_id)) return prev
          return [...prev, data.step]
        })
      }
    } else if (type === 'CONCLUSION_REACHED') {
      setConclusion(data.conclusion)
    } else if (type === 'PROPOSAL_READY') {
      // Ask approval only ONCE per incident
      if (!hasApprovedOrRejected) {
        setProposal(data.proposal)
      }
    } else if (type === 'CALL_FOR_BACKUP') {
      setEscalation(data.data || data)
      soundEffects.playRadioChirp()
    } else if (type === 'APPROVAL_GRANTED') {
      soundEffects.playExtinguisher()
      setIsExecutingFix(true)
      setProposal(null)
      setHasApprovedOrRejected(true)
    } else if (type === 'VERIFICATION_COMPLETED') {
      const vRes = data.verification || data
      setVerification(vRes)
      setIsExecutingFix(false)
      if (vRes.verdict === 'FIXED') {
        soundEffects.playVictoryChime()
        if (!reducedMotion) {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } })
        }
      }
    } else if (type === 'REPORT_DELIVERED') {
      const rep = data.report || data
      setReport(rep)
      const recipientId = rep.recipient_owner?.id || (activeTrack === 'healthcare' ? 'owner_dave' : 'owner_sarah')
      setReportDeliveredTo(recipientId)
      soundEffects.playPaperPlane()
      fetchAudit()
      // Auto-open delivered report modal
      setShowReportModal(true)
    } else if (type === 'NODE_VERIFIED_HEALTHY') {
      const assetId = data.asset_id
      if (assetId) {
        setInspectedNodes((prev) => (prev.includes(assetId) ? prev : [...prev, assetId]))
      }
    } else if (type === 'MEMORY_RETRIEVAL') {
      setMemoryData(data.data || data)
    } else if (type === 'RESET_COMPLETED') {
      resetLocalUiState()
    }
  }

  const resetLocalUiState = () => {
    setBurningAssetId(null)
    setWorkerState({ mode: 'IDLE', current_house: null, target_house: null, patrol_step: 0 })
    setSteps([])
    setConclusion(null)
    setProposal(null)
    setHasApprovedOrRejected(false)
    setEscalation(null)
    setVerification(null)
    setReport(null)
    setReportDeliveredTo(null)
    setInspectedNodes([])
    setShowReportModal(false)
    setSosAlert(null)
    setDiagnosedReport(null)
    setShowNotificationModal(false)
    setIsPatrolling(false)
    setIsInvestigating(false)
    setIsExecutingFix(false)
    setMemoryData(null)
  }

  const fetchCurrentStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents/current`)
      if (!res.ok) return
      const data = await res.json()
      if (data.worker_state) setWorkerState(data.worker_state)
      if (data.steps && data.steps.length > 0) setSteps(data.steps)
      // Never re-prompt if already approved, executing, or verified
      if (data.proposal && !hasApprovedOrRejected && !isExecutingFix && !verification) {
        setProposal(data.proposal)
      }
      if (data.sos_alert) {
        setSosAlert(data.sos_alert)
      }
      if (data.diagnosed_report) {
        setDiagnosedReport(data.diagnosed_report)
      }
      if (data.sent_emails && data.sent_emails.length > 0) {
        setSentEmails(data.sent_emails)
      }
      if (data.sent_sms && data.sent_sms.length > 0) {
        setSentSms(data.sent_sms)
      }
      if (data.report) {
        setReport(data.report)
        setReportDeliveredTo(data.report.recipient_owner?.id || (activeTrack === 'healthcare' ? 'owner_dave' : 'owner_sarah'))
      }
    } catch (e) {
      // background
    }
  }

  const handleSendEmail = async (params = {}) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      if (!res.ok) {
        throw new Error(`Email dispatch failed with status ${res.status}`)
      }
      const data = await res.json()
      if (data.receipt) {
        setSentEmails((prev) => [data.receipt, ...prev])
      }
      fetchAudit()
      return data
    } catch (err) {
      console.error('Send email error:', err)
      throw err
    }
  }

  const handleSendSms = async (params = {}) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/send-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      if (!res.ok) {
        throw new Error(`SMS dispatch failed with status ${res.status}`)
      }
      const data = await res.json()
      if (data.receipt) {
        setSentSms((prev) => [data.receipt, ...prev])
      }
      fetchAudit()
      return data
    } catch (err) {
      console.error('Send SMS error:', err)
      throw err
    }
  }

  const handleDispatchAll = async (params = {}) => {
    try {
      const res = await fetch(`${API_BASE}/notifications/dispatch-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })
      if (!res.ok) {
        throw new Error(`Multi-channel dispatch failed with status ${res.status}`)
      }
      const data = await res.json()
      if (data.sms_receipt) {
        setSentSms((prev) => [data.sms_receipt, ...prev])
      }
      if (data.email_receipt) {
        setSentEmails((prev) => [data.email_receipt, ...prev])
      }
      fetchAudit()
      return data
    } catch (err) {
      console.error('Dispatch all error:', err)
      throw err
    }
  }

  const fetchPacks = async () => {
    try {
      const res = await fetch(`${API_BASE}/packs`)
      const data = await res.json()
      setPacks(data.available_packs || {})
    } catch (e) {
      console.warn('Fetch packs:', e)
    }
  }

  const fetchAudit = async () => {
    try {
      const res = await fetch(`${API_BASE}/audit`)
      const data = await res.json()
      setAuditData(data)
    } catch (e) {
      console.warn('Fetch audit:', e)
    }
  }

  const fetchEvalResults = async () => {
    try {
      const res = await fetch(`${API_BASE}/eval/results`)
      const data = await res.json()
      setEvalResults(data)
    } catch (e) {
      console.warn('Fetch eval:', e)
    }
  }

  // Switch Track (Fintech <-> Healthcare)
  const handleSwitchTrack = async (track) => {
    try {
      await fetch(`${API_BASE}/packs/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack_id: track })
      })
      setActiveTrack(track)
      setSelectedIncident(
        track === 'healthcare'
          ? 'incident_2_healthcare_mapping_reject'
          : 'incident_1_fintech_partial_file'
      )
      resetLocalUiState()
      fetchAudit()
    } catch (e) {
      console.error('Switch track error:', e)
    }
  }

  const handleReset = async () => {
    try {
      await fetch(`${API_BASE}/env/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: 42, pack_id: activeTrack })
      })
      resetLocalUiState()
      fetchAudit()
    } catch (e) {
      console.error('Reset error:', e)
    }
  }

  // Run full cycle: injects, patrols, discovers fire, investigates, proposes fix
  const handleTriggerIncident = async (incidentType) => {
    const inc = incidentType || selectedIncident
    setSelectedIncident(inc)
    try {
      resetLocalUiState()
      setIsPatrolling(true)
      setIsInvestigating(true)
      await fetch(`${API_BASE}/agent/run-cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_type: inc, pack: activeTrack })
      })
    } catch (e) {
      console.error('Trigger incident error:', e)
    }
  }

  // Trigger random endpoint break: worker inspects every endpoint sequentially to diagnose it
  const handleTriggerRandomBreak = async () => {
    try {
      resetLocalUiState()
      setIsPatrolling(true)
      setIsInvestigating(true)
      const res = await fetch(`${API_BASE}/agent/trigger-random-break`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await res.json()
      if (data.incident_type) {
        setSelectedIncident(data.incident_type)
      }
    } catch (e) {
      console.error('Trigger random break error:', e)
    }
  }

  const handleApproveFix = async (approverName) => {
    try {
      setHasApprovedOrRejected(true)
      setProposal(null)
      setIsExecutingFix(true)
      await fetch(`${API_BASE}/incidents/current/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approver: approverName })
      })
    } catch (e) {
      console.error('Approve fix error:', e)
    }
  }

  const handleRejectFix = async (reason) => {
    try {
      setHasApprovedOrRejected(true)
      setProposal(null)
      await fetch(`${API_BASE}/incidents/current/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      fetchAudit()
    } catch (e) {
      console.error('Reject fix error:', e)
    }
  }

  const handleRunBenchmark = async (incidentType, nRuns) => {
    setIsRunningBenchmark(true)
    try {
      const res = await fetch(`${API_BASE}/eval/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_type: incidentType, n_runs: nRuns })
      })
      const data = await res.json()
      setEvalResults(data)
    } catch (e) {
      console.error('Benchmark error:', e)
    } finally {
      setIsRunningBenchmark(false)
    }
  }

  const activePack = packs[activeTrack] || {
    name: activeTrack === 'healthcare' ? 'Healthcare HL7 Monitoring' : 'Fintech Reconciliation',
    assets: []
  }

  const isHealthcare = activeTrack === 'healthcare'

  return (
    <div className={`min-h-screen bg-[#f4f5f8] text-slate-800 flex flex-row ${reducedMotion ? 'reduced-motion' : ''}`}>
      {/* 1. Left Workflow Studio Sidebar (Desktop >= md) */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          activeTrack={activeTrack}
          onSwitchTrack={handleSwitchTrack}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onTriggerIncident={handleTriggerIncident}
          burningAssetId={burningAssetId}
        />
      </div>

      {/* 1b. Mobile Slide-in Offcanvas Drawer (Bootstrap / iOS Style) */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
              <span className="font-display font-extrabold text-sm text-slate-900">Tracer Sentinel Studio</span>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar
                activeTrack={activeTrack}
                onSwitchTrack={(track) => {
                  handleSwitchTrack(track)
                  setIsMobileDrawerOpen(false)
                }}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveTab(tab)
                  setIsMobileDrawerOpen(false)
                }}
                onTriggerIncident={(inc) => {
                  handleTriggerIncident(inc)
                  setIsMobileDrawerOpen(false)
                }}
                burningAssetId={burningAssetId}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Studio Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <HeaderBar
          soundMuted={soundMuted}
          onToggleSound={() => setSoundMuted(!soundMuted)}
          onReset={handleReset}
          isOperationsView={isOperationsView}
          onToggleOperationsView={(val) => setIsOperationsView(val !== undefined ? val : !isOperationsView)}
          activeTrack={activeTrack}
          burningAssetId={burningAssetId}
          onTriggerTest={() => handleTriggerIncident(selectedIncident)}
          onTriggerRandomBreak={handleTriggerRandomBreak}
          report={report}
          onOpenNotifications={() => setShowNotificationModal(true)}
          sosAlert={sosAlert}
          diagnosedReport={diagnosedReport}
          hasNotifications={Boolean(sosAlert || diagnosedReport || sentEmails.length > 0 || sentSms.length > 0)}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onToggleMobileMenu={() => setIsMobileDrawerOpen(true)}
        />

        {/* Studio Workspace Content (Short, Clean, Non-Brutalist) */}
        <main className="flex-1 p-3 md:p-6 w-full max-w-[1440px] mx-auto space-y-3.5 min-w-0 pb-24 md:pb-6">
          {activeTab === 'village' ? (
            <>
              {/* SOS Alert & Diagnostic Pager Banner */}
              {(sosAlert || diagnosedReport) && (
                <div className="px-4 py-3 rounded-2xl bg-white border border-rose-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
                      <Flame className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                          {diagnosedReport ? 'Diagnostic Incident Report Ready' : 'Emergency SOS Dispatched'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 font-extrabold text-rose-700">
                          {diagnosedReport?.target_name || sosAlert?.asset_name}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          ✓ Paged via SMS (+91 9074121510) & Email (nidhinrajm55@gmail.com)
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5 font-medium">
                        {diagnosedReport
                          ? `Root cause diagnosed: "${diagnosedReport.root_cause_explanation?.slice(0, 110)}..."`
                          : `Critical break paged to Nidhin Raj (+91 9074121510 • nidhinrajm55@gmail.com). Tracer responding.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowNotificationModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{diagnosedReport ? 'View Diagnosed Report & Email' : 'View SOS Alert & Send'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. The Interactive Workflow Canvas or Operations Grid */}
              {isOperationsView ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-xs">
                    <span className="font-extrabold text-slate-800 tracking-tight">
                      HIGH-DENSITY SRE ENDPOINT OPERATIONS GRID ({activePack.assets?.length || 5} ENDPOINTS)
                    </span>
                    <button
                      onClick={() => setIsOperationsView(false)}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      ← Switch back to Studio Canvas
                    </button>
                  </div>
                  <EndpointGrid
                    assets={activePack.assets}
                    burningAssetId={burningAssetId}
                    workerState={workerState}
                    onInspectEndpoint={(asset) => {
                      handleTriggerIncident(selectedIncident)
                    }}
                    trackId={activeTrack}
                  />
                </div>
              ) : (
                <WorkflowCanvas
                  pack={activePack}
                  trackId={activeTrack}
                  workerState={workerState}
                  burningAssetId={burningAssetId}
                  severity={incidentSeverity}
                  verificationState={verification ? verification.verdict : null}
                  reportDeliveredTo={reportDeliveredTo}
                  reducedMotion={reducedMotion}
                  inspectedNodes={inspectedNodes}
                  auditData={auditData}
                  sosAlert={sosAlert}
                  diagnosedReport={diagnosedReport}
                  onTriggerIncident={() => handleTriggerIncident(selectedIncident)}
                  onInspectNode={(asset) => {
                    if (asset.id === burningAssetId) {
                      handleTriggerIncident(selectedIncident)
                    }
                  }}
                  onOpenEvidence={() => {
                    if (steps.length > 0) setInspectingEvidence(steps[0])
                  }}
                  onOpenHistory={() => setShowNotificationModal(true)}
                  onSelectTab={setActiveTab}
                  onReset={handleReset}
                />
              )}

              {/* Fast Track Scenario Bar (Bootstrap Flex & Grid Mobile Compact) */}
              <div className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900 text-white shrink-0">
                    {isHealthcare ? 'Healthcare Track' : 'Fintech Track'}
                  </span>
                  <span className="text-slate-600 font-medium text-[11px] truncate hidden sm:inline">
                    {isHealthcare ? 'Interface Queue & Mapping Spike Scenarios' : 'Daily Settlement & Clearing Reconciliation'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Random Break Button - Prominent & Dynamic */}
                  <button
                    onClick={handleTriggerRandomBreak}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                    title="Randomly breaks any pipeline endpoint and sends worker to inspect all endpoints"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Break Randomly</span>
                  </button>

                  {!isHealthcare ? (
                    <>
                      <button
                        onClick={() => handleTriggerIncident('incident_1_fintech_partial_file')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Silent failure: scheduler green, $241,850 break, row count dropped 69%"
                      >
                        <Flame className="w-3 h-3 fill-white" />
                        <span>Partial ($241k Break)</span>
                      </button>

                      <button
                        onClick={() => handleTriggerIncident('incident_3_fintech_malformed_escalation')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Malformed partner binary file: proves unrecoverable, escalates with 0 writes"
                      >
                        <Radio className="w-3 h-3 text-slate-600" />
                        <span>Malformed (0 Writes)</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleTriggerIncident('incident_2_healthcare_mapping_reject')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Mapping v1.8.2 rejects OBX-5; queue depth hits 428; replay with dedupe"
                      >
                        <Flame className="w-3 h-3 fill-white" />
                        <span>Mapping Spike (428)</span>
                      </button>

                      <button
                        onClick={() => handleTriggerIncident('incident_5_healthcare_acks_stopped')}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-semibold text-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Channel receiver thread deadlock: TCP connected but 340 pending ACKs"
                      >
                        <Zap className="w-3 h-3 text-slate-600" />
                        <span>Acks Stall (340)</span>
                      </button>
                    </>
                  )}

                  {report && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Owner Report</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Delivered Owner Report Banner (Ultra Clean, Non-Brutalist) */}
              {report && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-xs">
                          Owner Incident Report Generated & Dispatched
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-emerald-800 border border-emerald-300 font-bold">
                          Hash: {report.report_hash}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Delivered to <span className="font-bold text-slate-900">{report.recipient_owner?.name || (!isHealthcare ? 'Sarah Chen' : 'Dave Miller')}</span> ({report.recipient_owner?.role || 'Lead'}) via <span className="font-bold text-slate-900">{report.channel || report.delivery_channel || report.simulated_channel || 'Urgent Mobile SMS (+91 9074121510) & Google SMTP'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowReportModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-2xs transition-all active:scale-95 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Inspect Full Report
                    </button>
                  </div>
                </div>
              )}

              {/* Real-Time Metrics Strip (Bootstrap Grid Row/Col, Sleek & Compact) */}
              <div className="row g-2 text-xs">
                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs h-full">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      {!isHealthcare ? 'Clearing Batch Status' : 'Inbound Message Rate'}
                    </span>
                    <span className={`font-mono font-bold text-[11px] mt-0.5 block truncate ${burningAssetId ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {!isHealthcare
                        ? (burningAssetId ? '3,842 / 12,500 (-69%)' : '12,540 Rows (Normal)')
                        : (burningAssetId ? '18.6% Spike' : '0.02% (Healthy)')}
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs h-full">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      {!isHealthcare ? 'Ledger Balance Variance' : 'Broker Queue Depth'}
                    </span>
                    <span className={`font-mono font-bold text-[11px] mt-0.5 block truncate ${burningAssetId ? 'text-amber-700' : 'text-slate-800'}`}>
                      {!isHealthcare
                        ? (burningAssetId ? '$241,850 Net Break' : '$0.00 Cleared')
                        : (burningAssetId ? '428 Pending' : '4 Normal (<50)')}
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs h-full">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      Accountable Resident
                    </span>
                    <span className="font-bold text-slate-800 text-[11px] truncate mt-0.5 block">
                      {!isHealthcare ? 'Sarah Chen (Ops)' : 'Dave Miller (Lead)'}
                    </span>
                  </div>
                </div>

                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs h-full">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      Security Gate
                    </span>
                    <span className="font-bold text-emerald-700 text-[11px] flex items-center gap-1 mt-0.5 truncate">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" /> Token Guard (0 Violations)
                    </span>
                  </div>
                </div>
              </div>

              {/* Worker Status Banner (Slim) */}
              <WorkerBadge workerState={workerState} />

              {/* Incident Memory Banner (Compact) */}
              <IncidentMemoryPanel memoryData={memoryData} />

              {/* 4 Proof Moments Ticker (Compact & Clean) */}
              <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2 shadow-2xs">
                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">Proof Moments:</span>
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span className={`flex items-center gap-1 ${steps.some(s => s.verdict === 'REJECTED') ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3 text-emerald-600" /> 1. Rejected Distractor
                  </span>
                  <span className={`flex items-center gap-1 ${hasApprovedOrRejected || proposal || verification ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3 text-emerald-600" /> 2. Approval Gate with Dry Run
                  </span>
                  <span className={`flex items-center gap-1 ${verification?.verdict === 'FIXED' ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3 text-emerald-600" /> 3. Verified Fix & Smoke Cleared
                  </span>
                  <span className={`flex items-center gap-1 ${report ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                    <Check className="w-3 h-3 text-emerald-600" /> 4. Owner Report Delivered
                  </span>
                </div>
              </div>

              {/* Lower Half: Split Screen Live Investigation Stream & DAG Lineage */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                {/* Timeline (7 cols) */}
                <div className="lg:col-span-7 space-y-3">
                  <LiveTimeline
                    steps={steps}
                    onSelectEvidence={(ev) => setInspectingEvidence(ev)}
                    conclusion={conclusion}
                  />

                  {/* Before and After Verification Card */}
                  {verification && (
                    <BeforeAfterCard
                      verification={verification}
                      targetAsset={burningAssetId || (!isHealthcare ? 'bank_settlement_feed' : 'lab_results_feed')}
                      activePack={activeTrack}
                    />
                  )}
                </div>

                {/* Topology Lineage & Escalation (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  {/* Incident 3 Escalation Card (When Calling for Backup) */}
                  {escalation && (
                    <EscalationCard
                      escalation={escalation}
                      onSelectEvidence={(ev) => setInspectingEvidence(ev)}
                    />
                  )}

                  {/* Pipeline Dependency DAG */}
                  <DependencyGraph pack={activePack} burningAssetId={burningAssetId} />
                </div>
              </div>
            </>
          ) : activeTab === 'audit' ? (
            <AuditLogTab auditData={auditData} onRefresh={fetchAudit} />
          ) : (
            <EvalHarnessTab
              evalResults={evalResults}
              onRunBenchmark={handleRunBenchmark}
              isRunningBenchmark={isRunningBenchmark}
            />
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      {/* 1. Human Approval Gate Modal */}
      {proposal && !hasApprovedOrRejected && (
        <ApprovalModal
          proposal={proposal}
          onApprove={handleApproveFix}
          onReject={handleRejectFix}
          isExecuting={isExecutingFix}
        />
      )}

      {/* 2. Evidence Inspector Modal */}
      {inspectingEvidence && (
        <EvidenceModal
          evidence={inspectingEvidence}
          onClose={() => setInspectingEvidence(null)}
        />
      )}

      {/* 3. Owner Incident Report Modal */}
      {showReportModal && report && (
        <ReportViewModal
          report={report}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* 4. Incident Notifications & Email Dispatch Modal */}
      {showNotificationModal && (
        <NotificationModal
          sosAlert={sosAlert}
          diagnosedReport={diagnosedReport}
          sentEmails={sentEmails}
          sentSms={sentSms}
          activePack={activeTrack}
          onClose={() => setShowNotificationModal(false)}
          onSendEmail={handleSendEmail}
          onSendSms={handleSendSms}
          onDispatchAll={handleDispatchAll}
        />
      )}

      {/* 5. Startup Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onTriggerIncident={handleTriggerIncident}
        onTriggerRandomBreak={handleTriggerRandomBreak}
        onReset={handleReset}
        onSelectTab={setActiveTab}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onSwitchTrack={handleSwitchTrack}
        activeTrack={activeTrack}
      />

      {/* 6. Accessible Mobile Bottom Navigation Dock (Bootstrap Grid Compatible) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-lg pb-safe">
        <button
          onClick={() => { setActiveTab('village'); setIsOperationsView(false); }}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'village' && !isOperationsView ? 'text-blue-600 bg-blue-50/80 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span>Pipeline</span>
        </button>

        <button
          onClick={() => { setActiveTab('village'); setIsOperationsView(true); }}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'village' && isOperationsView ? 'text-emerald-600 bg-emerald-50/80 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Grid</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'audit' ? 'text-purple-600 bg-purple-50/80 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('eval')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
            activeTab === 'eval' ? 'text-amber-600 bg-amber-50/80 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Benchmark</span>
        </button>

        <button
          onClick={() => setShowNotificationModal(true)}
          className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-900 cursor-pointer relative"
        >
          <Bell className="w-4 h-4" />
          {Boolean(sosAlert || diagnosedReport || sentEmails.length > 0 || sentSms.length > 0) && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
          <span>Alerts</span>
        </button>
      </nav>
    </div>
  )
}
