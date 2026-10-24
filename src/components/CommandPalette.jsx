import React, { useState, useEffect, useRef } from 'react'
import {
  Search,
  Sparkles,
  Flame,
  Shuffle,
  ShieldCheck,
  RotateCcw,
  BarChart3,
  Mail,
  Smartphone,
  PhoneCall,
  X,
  ArrowRight,
  Zap
} from 'lucide-react'

export default function CommandPalette({
  isOpen,
  onClose,
  onTriggerIncident,
  onTriggerRandomBreak,
  onReset,
  onSelectTab,
  onOpenNotifications,
  onSwitchTrack,
  activeTrack
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Handle Ctrl+K / Cmd+K global hotkey
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
      } else if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const allActions = [
    {
      id: 'random_break',
      title: 'Break Pipeline Randomly (Chaos Engineering)',
      subtitle: 'Simulates unpredictable latency spikes & schema drift across endpoints',
      icon: Shuffle,
      category: 'Chaos & Testing',
      action: () => {
        onTriggerRandomBreak()
        onClose()
      }
    },
    {
      id: 'patrol',
      title: 'Patrol Pipeline Village (Run Sentinel)',
      subtitle: 'Sequential automated check of all 5 endpoints in dependency order',
      icon: PhoneCall,
      category: 'Patrol & Diagnosis',
      action: () => {
        onTriggerIncident()
        onClose()
      }
    },
    {
      id: 'fintech_break',
      title: 'Inject $241,850 Partial Settlement Break',
      subtitle: 'Silent batch break: 69% row drop on bank_settlement_feed',
      icon: Flame,
      category: 'Incident Scenarios',
      action: () => {
        onSwitchTrack('fintech')
        onSelectTab('village')
        onTriggerIncident('incident_1_fintech_partial_file')
        onClose()
      }
    },
    {
      id: 'healthcare_break',
      title: 'Inject Healthcare Mapping Spike (428 Queued Msgs)',
      subtitle: 'HL7 OBX-5 rejection anomaly with deduplicated replay proposal',
      icon: Zap,
      category: 'Incident Scenarios',
      action: () => {
        onSwitchTrack('healthcare')
        onSelectTab('village')
        onTriggerIncident('incident_2_healthcare_mapping_reject')
        onClose()
      }
    },
    {
      id: 'malformed_break',
      title: 'Inject Malformed Partner Binary (Safe Escalation)',
      subtitle: 'AGT-9: Proves unrecoverable upstream corruption; 0 writes executed',
      icon: Flame,
      category: 'Incident Scenarios',
      action: () => {
        onSwitchTrack('fintech')
        onSelectTab('village')
        onTriggerIncident('incident_3_fintech_malformed_escalation')
        onClose()
      }
    },
    {
      id: 'notifications',
      title: 'Outbound Gateway & Pager Settings',
      subtitle: 'Configure Google Mail SMTP, Cellular SMS & Web Pager',
      icon: Smartphone,
      category: 'Configuration',
      action: () => {
        onOpenNotifications()
        onClose()
      }
    },
    {
      id: 'audit_trail',
      title: 'Verify Cryptographic Audit Trail (AUD-2)',
      subtitle: 'Inspect SHA-256 chained ledger with 100% mathematical integrity',
      icon: ShieldCheck,
      category: 'Security & Audit',
      action: () => {
        onSelectTab('audit')
        onClose()
      }
    },
    {
      id: 'eval_benchmark',
      title: 'Run Evaluation Benchmark Suite (EVAL-1 to 6)',
      subtitle: 'N=10 runs comparing Tracer vs Plain-LLM baseline',
      icon: BarChart3,
      category: 'Evaluation',
      action: () => {
        onSelectTab('eval')
        onClose()
      }
    },
    {
      id: 'reset',
      title: 'Reset Baseline to Clean State (ENV-4)',
      subtitle: 'One-click idempotent recovery in <5 seconds',
      icon: RotateCcw,
      category: 'System',
      action: () => {
        onReset()
        onClose()
      }
    }
  ]

  const filtered = allActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleKeyDownList = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <Sparkles className="w-4 h-4 text-slate-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDownList}
            placeholder="Type a command or search action (e.g. break, audit, eval, email)..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching actions found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon
              const isSelected = idx === selectedIndex

              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-slate-800 text-emerald-400'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className={`text-xs font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </p>
                      <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-slate-800 text-slate-300 border border-slate-700'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`} />
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">Enter</kbd> Execute</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-slate-700">Esc</kbd> Close</span>
          </div>
          <span className="font-bold text-slate-700">Tracer AI Autonomous Sentinel</span>
        </div>
      </div>
    </div>
  )
}
