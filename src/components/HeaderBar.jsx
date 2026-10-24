import React, { useState } from 'react'
import {
  Sparkles,
  PhoneCall,
  Rocket,
  Settings,
  Sun,
  Moon,
  Bell,
  Volume2,
  VolumeX,
  RotateCcw,
  Flame,
  ChevronDown,
  Layers,
  ShieldCheck,
  Shuffle,
  LayoutGrid,
  Monitor,
  Check,
  Download,
  UserCheck
} from 'lucide-react'

export default function HeaderBar({
  soundMuted,
  onToggleSound,
  onReset,
  isOperationsView,
  onToggleOperationsView,
  activeTrack,
  burningAssetId,
  onTriggerTest,
  onTriggerRandomBreak,
  report,
  onOpenNotifications,
  hasNotifications,
  sosAlert,
  diagnosedReport,
  onOpenCommandPalette
}) {
  const isHealthcare = activeTrack === 'healthcare'
  const [showPublishMenu, setShowPublishMenu] = useState(false)
  const [showUserPopover, setShowUserPopover] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-3 md:px-6 flex items-center justify-between gap-3 sticky top-0 z-40 select-none">
      {/* Left: Workflow Name Title & Operations View Switcher */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm md:text-base font-display font-extrabold text-slate-900 tracking-tight whitespace-nowrap flex items-center gap-2">
            <span>{isHealthcare ? 'Clinical HL7 Interface Workflow' : 'Default Reconciliation Workflow'}</span>
          </h1>
          {burningAssetId ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] md:text-[11px] font-extrabold animate-pulse whitespace-nowrap">
              <Flame className="w-3 h-3 text-rose-600 fill-rose-600" />
              Incident Active
            </span>
          ) : (
            <span className="hidden sm:inline-block text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 uppercase tracking-wider">
              Live SRE
            </span>
          )}
        </div>

        {/* View Switcher: Studio Canvas vs Operations Grid */}
        <div className="hidden lg:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 ml-1">
          <button
            onClick={() => onToggleOperationsView && onToggleOperationsView(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              !isOperationsView
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Studio Interactive Canvas with Squircle Nodes"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-600" />
            <span>Studio Canvas</span>
          </button>
          <button
            onClick={() => onToggleOperationsView && onToggleOperationsView(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              isOperationsView
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="High-Density SRE Operations Grid"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operations Grid</span>
          </button>
        </div>
      </div>

      {/* Center: ✦ Ask AI pill with Ctrl+K badge (Flexibly adapts to screen width) */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-2 min-w-0">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-700 shadow-xs hover:border-slate-300 hover:bg-slate-100/70 transition-colors w-full cursor-pointer text-left truncate"
          title="Open Command Palette (Ctrl+K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-slate-700 shrink-0" />
          <span className="text-slate-500 font-medium truncate">Ask Tracer AI or type /...</span>
          <span className="ml-auto text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right: Actions, Settings, Icons, Avatar */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Reset Baseline Button */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          title="ENV-4: Reset clean baseline in <5 seconds"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span className="hidden xl:inline">Reset Baseline</span>
        </button>

        {/* Break Randomly Button */}
        <button
          onClick={onTriggerRandomBreak}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-2xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          title="Randomly breaks any pipeline endpoint and sends worker to inspect all endpoints"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Break Randomly</span>
        </button>

        {/* Test Pipeline Button */}
        <button
          onClick={onTriggerTest}
          className="hidden sm:flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          title="Inject seeded incident break and run patrol"
        >
          <PhoneCall className="w-3.5 h-3.5 text-slate-700" />
          <span className="hidden lg:inline">Test Pipeline</span>
        </button>

        {/* Publish / Patrol Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setShowPublishMenu(!showPublishMenu)}
            className="btn-primary-obsidian text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1.5"
            title="Sentinel deployment & automated patrol options"
          >
            <Rocket className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">Deploy Sentinel</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {showPublishMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 text-xs space-y-1 animate-in fade-in slide-in-from-top-1">
              <button
                onClick={() => {
                  setShowPublishMenu(false)
                  onTriggerTest()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-800 font-bold cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <div>
                  <p className="leading-tight">Run Automated Patrol</p>
                  <p className="text-[10px] text-slate-400 font-normal">Runs 5-step dependency sweep</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowPublishMenu(false)
                  onTriggerRandomBreak()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-800 font-bold cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-amber-500" />
                <div>
                  <p className="leading-tight">Chaos Monkey Break</p>
                  <p className="text-[10px] text-slate-400 font-normal">Inject stochastic failure</p>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowPublishMenu(false)
                  onOpenNotifications()
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-slate-50 text-slate-800 font-bold cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <div>
                  <p className="leading-tight">Verify Outbound Gateway</p>
                  <p className="text-[10px] text-slate-400 font-normal">Google SMTP & SMS Pager</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Audio Mute Toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          title={soundMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Settings Gear -> Opens Gateway & Config Modal */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Outbound Gateway & Notification Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={handleToggleTheme}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
          title="Toggle High-Contrast Mode"
        >
          {isDarkMode ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer relative"
          title="Incident Notifications & Diagnosed Reports"
        >
          <Bell className="w-4 h-4" />
          {(burningAssetId || sosAlert || diagnosedReport) && (
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-1 right-1 ring-2 ring-white animate-pulse"></span>
          )}
        </button>

        {/* User Portrait Avatar with Profile Popover */}
        <div className="relative">
          <button
            onClick={() => setShowUserPopover(!showUserPopover)}
            className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center shadow-xs hover:ring-2 hover:ring-slate-400 transition-all cursor-pointer"
            title="On-Call Incident Lead"
          >
            {isHealthcare ? 'DM' : 'SC'}
          </button>

          {showUserPopover && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 text-xs animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center">
                  {isHealthcare ? 'DM' : 'SC'}
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 leading-tight">
                    {isHealthcare ? 'Dave Miller' : 'Sarah Chen'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {isHealthcare ? 'Clinical Integration Lead' : 'Reconciliation Lead'}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-600 space-y-1">
                <p className="flex items-center gap-1 text-emerald-700 font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> On-Call Duty: ACTIVE
                </p>
                <p className="text-slate-400 text-[10px]">Pager: +91 9074121510</p>
                <p className="text-slate-400 text-[10px]">Email: nidhinrajm55@gmail.com</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
