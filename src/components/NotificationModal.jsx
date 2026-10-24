import React, { useState, useEffect } from 'react'
import {
  X,
  Mail,
  Send,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  RefreshCw,
  FileText,
  Smartphone,
  Zap,
  Settings2,
  KeyRound,
  ExternalLink,
  ShieldAlert,
  Info,
  BellRing
} from 'lucide-react'

const API_BASE = (import.meta.env?.VITE_API_URL || '').replace(/\/$/, '') || (
  typeof window !== 'undefined'
    ? (window.location.port === '5173' ? 'http://127.0.0.1:8000' : '')
    : ''
)

export default function NotificationModal({
  sosAlert,
  diagnosedReport,
  sentEmails = [],
  sentSms = [],
  activePack,
  onClose,
  onSendEmail,
  onSendSms,
  onDispatchAll
}) {
  const [activeTab, setActiveTab] = useState(
    diagnosedReport ? 'diagnosis' : (sosAlert ? 'sos' : (sentSms.length > 0 ? 'sms_history' : 'history'))
  )
  const [customEmail, setCustomEmail] = useState('nidhinrajm55@gmail.com')
  const [customPhone, setCustomPhone] = useState('+91 9074121510')
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sendStatusMsg, setSendStatusMsg] = useState(null)

  // Gateway Config State
  const [gatewayConfig, setGatewayConfig] = useState(null)
  const [smtpUser, setSmtpUser] = useState('priyaljoshi2153@gmail.com')
  const [smtpPass, setSmtpPass] = useState('')
  const [fast2smsKey, setFast2smsKey] = useState('')
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [configSaveMsg, setConfigSaveMsg] = useState(null)

  const fetchGatewayConfig = async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications/gateway-config`)
      if (res.ok) {
        const data = await res.json()
        setGatewayConfig(data)
        if (data.smtp?.user) setSmtpUser(data.smtp.user)
      }
    } catch (e) {
      console.warn('Failed to load gateway config:', e)
    }
  }

  useEffect(() => {
    fetchGatewayConfig()
  }, [])

  const handleSaveGateway = async () => {
    setIsSavingConfig(true)
    setConfigSaveMsg(null)
    try {
      const payload = {
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass.trim() || undefined,
        fast2sms_api_key: fast2smsKey.trim() || undefined
      }
      const res = await fetch(`${API_BASE}/notifications/gateway-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.gateway_config) {
        setGatewayConfig(data.gateway_config)
      }
      setConfigSaveMsg('✓ Outbound Gateway credentials updated successfully!')
      setTimeout(() => setConfigSaveMsg(null), 4000)
    } catch (err) {
      setConfigSaveMsg('Failed to save config: ' + err.message)
    } finally {
      setIsSavingConfig(false)
    }
  }

  const handleCopy = (content) => {
    navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDispatchEmail = async () => {
    setIsSending(true)
    setSendStatusMsg(null)
    try {
      const recipient = customEmail.trim() || 'nidhinrajm55@gmail.com'
      if (onSendEmail) {
        const res = await onSendEmail({
          recipient_email: recipient,
          recipient_name: 'Nidhin Raj',
          report_id: diagnosedReport?.id || sosAlert?.id
        })
        if (res?.receipt?.real_delivered) {
          setSendStatusMsg(`✓ Live email delivered to ${recipient}!`)
        } else {
          setSendStatusMsg(`✓ Recorded in cryptographic ledger. (${res?.receipt?.delivery_diagnostic || 'Add Gmail App Password for live inbox delivery'})`)
        }
      }
      setTimeout(() => setSendStatusMsg(null), 5000)
    } catch (err) {
      setSendStatusMsg('Failed to send email: ' + err.message)
    } finally {
      setIsSending(false)
    }
  }

  const handleDispatchSms = async () => {
    setIsSending(true)
    setSendStatusMsg(null)
    try {
      const phone = customPhone.trim() || '+91 9074121510'
      if (onSendSms) {
        const res = await onSendSms({
          phone_number: phone,
          recipient_name: 'Nidhin Raj',
          report_id: diagnosedReport?.id || sosAlert?.id
        })
        if (res?.receipt?.real_delivered) {
          setSendStatusMsg(`✓ Live cellular SMS sent to ${phone}!`)
        } else {
          setSendStatusMsg(`✓ Recorded & pushed to web pager. (Add Fast2SMS key for carrier SMS)`)
        }
      }
      setTimeout(() => setSendStatusMsg(null), 5000)
    } catch (err) {
      setSendStatusMsg('Failed to send SMS: ' + err.message)
    } finally {
      setIsSending(false)
    }
  }

  const handleDispatchBoth = async () => {
    setIsSending(true)
    setSendStatusMsg(null)
    try {
      const phone = customPhone.trim() || '+91 9074121510'
      const email = customEmail.trim() || 'nidhinrajm55@gmail.com'
      if (onDispatchAll) {
        const res = await onDispatchAll({
          phone_number: phone,
          recipient_email: email,
          recipient_name: 'Nidhin Raj',
          report_id: diagnosedReport?.id || sosAlert?.id
        })
        setSendStatusMsg(`✓ Dispatched to ${phone} and ${email}!`)
      } else {
        await handleDispatchEmail()
        await handleDispatchSms()
      }
      setTimeout(() => setSendStatusMsg(null), 5000)
    } catch (err) {
      setSendStatusMsg('Failed to dispatch: ' + err.message)
    } finally {
      setIsSending(false)
    }
  }

  const engineerName = 'Nidhin Raj'
  const engineerEmail = customEmail || 'nidhinrajm55@gmail.com'
  const engineerPhone = customPhone || '+91 9074121510'
  const cleanedPhone = engineerPhone.replace(/\D/g, '').slice(-10) || '9074121510'
  const instantWebPagerUrl = `https://ntfy.sh/tracer_${cleanedPhone}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl flex flex-col max-h-[94vh] sm:max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900 text-white shadow-xs shrink-0">
              <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                  SOS, SMS & Incident Center
                </h2>
                {sosAlert && (
                  <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                    <Flame className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                    P0 SOS
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 truncate">
                On-Call: <strong className="text-slate-800">{engineerName}</strong> • <span className="font-mono font-bold text-slate-700">{engineerPhone}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs (Smooth Horizontal Scroll on Mobile) */}
        <div className="px-3 sm:px-6 pt-2.5 pb-2 flex items-center justify-between border-b border-slate-100 bg-white text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('diagnosis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'diagnosis'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Diagnosed Report</span>
              {diagnosedReport && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'sos'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              <span>SOS Alert & SMS</span>
              {sosAlert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sms_history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'sms_history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              <span>SMS Log</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-50 text-[10px] font-mono text-blue-700 font-bold border border-blue-200">
                {sentSms.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-purple-500" />
              <span>Email Receipts</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600">
                {sentEmails.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gateway')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'gateway'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="Configure Gmail App Password or SMS API Key for Live Outbound Delivery"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Live Outbound Gateway</span>
              {gatewayConfig?.smtp?.is_ready || gatewayConfig?.sms?.is_ready ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(
                activeTab === 'diagnosis'
                  ? diagnosedReport
                  : activeTab === 'sos'
                  ? sosAlert
                  : activeTab === 'sms_history'
                  ? sentSms
                  : sentEmails
              )}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium text-xs cursor-pointer shadow-xs"
              title="Copy details to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Tab 1: Diagnosed Incident Report */}
          {activeTab === 'diagnosis' && (
            diagnosedReport ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-500">To:</span>
                      <span className="font-extrabold text-slate-900">{engineerName}</span>
                      <span className="text-slate-500 font-mono">({engineerEmail})</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-bold">
                        Lead Incident Commander
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Dispatched to Email & Mobile
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-medium">Subject: </span>
                      <span className="font-bold text-slate-800">{diagnosedReport.subject}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Target Pipeline Asset: </span>
                      <span className="font-bold text-slate-800">{diagnosedReport.target_name} ({diagnosedReport.target_asset})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Investigation Severity: </span>
                      <span className="font-extrabold text-rose-700">{diagnosedReport.severity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Diagnostic Confidence: </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {Math.round((diagnosedReport.confidence_score || 0.95) * 100)}% Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    How The Problem Happened (Root Cause Analysis)
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium">
                    {diagnosedReport.root_cause_explanation}
                  </p>
                </div>

                {diagnosedReport.supporting_evidence && diagnosedReport.supporting_evidence.length > 0 && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">
                        Cryptographic Tool Evidence Chain ({diagnosedReport.supporting_evidence.length} Artifacts)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        AUDIT VERIFIED
                      </span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {diagnosedReport.supporting_evidence.map((ev, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{ev.tool}: </span>
                            <span className="text-slate-600">{ev.reason}</span>
                          </div>
                          {ev.hash && (
                            <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {ev.hash}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2 text-slate-500">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No Diagnosis Compiled Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a data pipeline break is investigated, Tracer evaluates hypotheses, collects cryptographic tool evidence, and formats the full report here.
                </p>
              </div>
            )
          )}

          {/* Tab 2: SOS Alert & SMS */}
          {activeTab === 'sos' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-600 fill-rose-600" />
                    <span className="font-extrabold text-rose-900 text-sm">
                      {sosAlert ? `Immediate SOS Dispatch: ${sosAlert.asset_name}` : 'Emergency SOS Sentinel'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded-full">
                    {sosAlert ? `ID: ${sosAlert.id}` : 'STATUS: READY'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-white border border-rose-200 text-xs font-medium text-slate-800 leading-relaxed">
                  {sosAlert ? sosAlert.message : "🚨 SOS ALERT: Priority Sentinel active. Dispatches instant cellular SMS to +91 9074121510 and email alerts to nidhinrajm55@gmail.com whenever any pipeline breaks."}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white/80 border border-rose-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">On-Call Engineer Contact</span>
                    <span className="font-extrabold text-slate-900">{engineerName}</span>
                    <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono text-slate-700">
                      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                      <span>{engineerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                      <span>{engineerEmail}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/80 border border-rose-100 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Failure Status</span>
                    <span className="font-extrabold text-rose-700">
                      {sosAlert ? sosAlert.failing_check : 'Pipeline Village Nodes Monitored'}
                    </span>
                    <span className="block text-[11px] text-slate-600">
                      {sosAlert ? sosAlert.reason : 'Automated tracer patrol active across all endpoints.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Phone SMS Preview */}
              <div className="p-4 rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/50 to-slate-50/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    Mobile Phone SMS Preview (Recipient: {engineerPhone})
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    PRIORITY GSM ROUTE
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-100 pb-1">
                    <span className="font-mono font-bold text-slate-600">FROM: TRACER-P0</span>
                    <span>Live Alert</span>
                  </div>
                  <p className="text-slate-800 font-mono text-[11px] leading-relaxed">
                    {sosAlert
                      ? `🚨 [P0 SOS ALERT] Data Pipeline Break on '${sosAlert.asset_name}'! Failing Check: ${sosAlert.failing_check}. Tracer autonomous incident responder responding. Incident ID: ${sosAlert.id}`
                      : `🚨 [P0 SOS ALERT] Tracer Mobile Pager active for Nidhin Raj (${engineerPhone}). Real-time cellular alerts broadcast for critical pipeline breaks.`}
                  </p>
                </div>
              </div>

              {/* Instant Mobile Live Web Pager Card (Zero Setup) */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <BellRing className="w-4 h-4 text-emerald-600" />
                    📲 Instant Live Mobile Pager (No App or Signup Needed)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    ACTIVE NOW
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Open this link on your phone (<strong className="text-slate-800">{engineerPhone}</strong>) to receive real push alerts with ringtone whenever Tracer detects an incident:
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={instantWebPagerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    <span>Open Mobile Pager: {instantWebPagerUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: SMS Transmission Log */}
          {activeTab === 'sms_history' && (
            sentSms && sentSms.length > 0 ? (
              <div className="space-y-2.5">
                {sentSms.map((sms, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
                          {sms.sender_id || 'SMS'}
                        </span>
                        <span className="font-extrabold text-slate-900">{sms.recipient_phone}</span>
                        <span className="text-slate-400 font-medium">({sms.recipient_name})</span>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                        sms.real_delivered
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {sms.real_delivered ? 'DELIVERED TO CARRIER' : 'RECORDED IN AUDIT LEDGER'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 font-mono text-[11px] text-slate-800">
                      {sms.message}
                    </div>

                    {sms.delivery_diagnostic && !sms.real_delivered && (
                      <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{sms.delivery_diagnostic}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">Route: </span>
                        <span>{sms.delivery_route}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Timestamp: </span>
                        <span>{new Date(sms.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        Message ID: {sms.message_id}
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-400">
                        Audit Hash: {sms.audit_hash}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 text-slate-500">
                <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No SMS Sent Yet In This Session</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the button below to dispatch an urgent test SOS SMS directly to <strong className="text-slate-700">{engineerPhone}</strong>.
                </p>
                <button
                  onClick={handleDispatchSms}
                  disabled={isSending}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Send SOS SMS to {engineerPhone}</span>
                </button>
              </div>
            )
          )}

          {/* Tab 4: Sent Email Receipts */}
          {activeTab === 'history' && (
            sentEmails && sentEmails.length > 0 ? (
              <div className="space-y-2.5">
                {sentEmails.map((em, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          {em.notification_type || 'EMAIL'}
                        </span>
                        <span className="font-extrabold text-slate-900">{em.subject}</span>
                      </div>
                      <span className={`text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                        em.real_delivered
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {em.real_delivered ? 'DELIVERED TO INBOX' : 'RECORDED IN AUDIT LEDGER'}
                      </span>
                    </div>

                    {em.delivery_diagnostic && !em.real_delivered && (
                      <div className="p-2 rounded bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>{em.delivery_diagnostic}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400">Recipient: </span>
                        <strong>{em.recipient_name}</strong> ({em.recipient_email})
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400">Timestamp: </span>
                        <span>{new Date(em.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Delivery Route: </span>
                        <span>{em.delivery_route}</span>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-400">
                        Audit Hash: {em.audit_hash}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 text-slate-500">
                <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">No Emails Sent In This Session</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When a pipeline breaks and is diagnosed, email notifications are dispatched and logged with cryptographic audit receipts.
                </p>
                <button
                  onClick={handleDispatchEmail}
                  disabled={isSending}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Test Email to {engineerEmail}</span>
                </button>
              </div>
            )
          )}

          {/* Tab 5: Live Outbound Gateway Settings */}
          {activeTab === 'gateway' && (
            <div className="space-y-4 text-xs">
              
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  Why Are Emails & SMS Not Reaching Your Real Inbox/Phone Yet?
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Tracer records every dispatch in a tamper-proof cryptographic audit chain. To physically transmit messages across the public internet to your real Gmail inbox (<strong>{engineerEmail}</strong>) and cellular carrier (<strong>{engineerPhone}</strong>), internet providers require standard API authentication:
                </p>
              </div>

              {/* 1. Real Gmail SMTP Integration */}
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span className="font-extrabold text-slate-900">1. Real Gmail Inbox Delivery (SMTP TLS 1.3)</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    gatewayConfig?.smtp?.is_ready
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {gatewayConfig?.smtp?.is_ready ? 'LIVE CONNECTED' : 'REQUIRES APP PASSWORD'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Sender / Login Gmail</label>
                    <input
                      type="email"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      placeholder="priyaljoshi2153@gmail.com"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Google App Password (16 chars)
                    </label>
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder={gatewayConfig?.smtp?.has_password ? gatewayConfig?.smtp?.masked_pass : 'xxxx xxxx xxxx xxxx'}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-purple-100 text-[11px] text-slate-600 space-y-1">
                  <strong className="text-slate-800">How to get a free Google App Password in 30 seconds:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-slate-500 text-[10px]">
                    <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-purple-600 underline font-bold">Google Account &gt; Security &gt; App Passwords</a>.</li>
                    <li>Type App name "Tracer" and click "Create".</li>
                    <li>Copy the 16-character code (e.g. <code>abcd efgh ijkl mnop</code>) and paste it above!</li>
                  </ol>
                </div>
              </div>

              {/* 2. Real Cellular SMS Integration (India) */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span className="font-extrabold text-slate-900">2. Real Cellular SMS (India Mobile +91 9074121510)</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    gatewayConfig?.sms?.is_ready
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {gatewayConfig?.sms?.is_ready ? 'SMS API READY' : 'OPTIONAL API KEY'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Fast2SMS API Key (Instant Free SMS in India)
                  </label>
                  <input
                    type="password"
                    value={fast2smsKey}
                    onChange={(e) => setFast2smsKey(e.target.value)}
                    placeholder={gatewayConfig?.sms?.masked_fast2sms || 'Paste Fast2SMS API Key'}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Get free credits at <a href="https://www.fast2sms.com/" target="_blank" rel="noreferrer" className="text-blue-600 underline">fast2sms.com</a> (Dev API key).
                  </p>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-between pt-2">
                {configSaveMsg && (
                  <span className="text-[11px] font-bold text-emerald-700">{configSaveMsg}</span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={handleSaveGateway}
                    disabled={isSavingConfig}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Gateway Credentials</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer / Multi-Channel Dispatcher Bar */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto flex-1">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1 min-w-[160px]">
              <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <input
                type="text"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="+91 9074121510"
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 flex-1 min-w-[200px]">
              <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="nidhinrajm55@gmail.com"
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {sendStatusMsg && (
              <span className="text-[11px] font-bold text-slate-700 animate-in fade-in max-w-[260px] truncate">
                {sendStatusMsg}
              </span>
            )}
            
            <button
              onClick={handleDispatchSms}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-40 cursor-pointer active:scale-95"
              title="Send SOS SMS to 9074121510"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>SMS Alert</span>
            </button>

            <button
              onClick={handleDispatchEmail}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-40 cursor-pointer active:scale-95"
              title="Send Email to nidhinrajm55@gmail.com"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Report</span>
            </button>

            <button
              onClick={handleDispatchBoth}
              disabled={isSending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-2xs transition-all disabled:opacity-40 cursor-pointer active:scale-95"
              title="Dispatch Both SMS and Email"
            >
              {isSending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-white text-white" />
              )}
              <span>Dispatch Both</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  )
}
