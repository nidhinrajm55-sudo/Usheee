import React from 'react'
import {
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
  Flame,
  CheckCircle2,
  ArrowRight,
  User,
  Sliders,
  Play
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

export default function EndpointGrid({
  assets = [],
  burningAssetId,
  workerState,
  onInspectEndpoint,
  trackId = 'fintech'
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((asset) => {
        const isOnFire = asset.id === burningAssetId
        const isTarget = workerState?.target_house === asset.id || workerState?.current_house === asset.id
        const Icon = iconMap[asset.id] || Building2
        const isHealthcare = trackId === 'healthcare'

        return (
          <div
            key={asset.id}
            className={`saas-card overflow-hidden flex flex-col justify-between transition-all ${
              isOnFire
                ? 'border-rose-400 bg-rose-50/20 shadow-lg shadow-rose-950/10 ring-2 ring-rose-400/30'
                : 'hover:border-slate-300'
            }`}
          >
            <div>
              {/* Card Header Visual Container (Progentio Image Style) */}
              <div
                className={`h-28 p-4 relative flex items-center justify-between overflow-hidden ${
                  isOnFire
                    ? 'bg-gradient-to-br from-rose-950 via-red-900 to-amber-950 text-white'
                    : isHealthcare
                    ? 'bg-gradient-to-br from-cyan-950 via-slate-900 to-slate-950 text-white'
                    : 'bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 text-white'
                }`}
              >
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]"></div>

                {/* Left Header Info */}
                <div className="relative z-10">
                  <span
                    className={`text-[9px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full ${
                      isOnFire
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                        : isHealthcare
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {asset.vocab_label || asset.type}
                  </span>
                  <h4 className="font-extrabold text-sm text-white mt-1.5 leading-tight">{asset.name}</h4>
                </div>

                {/* Right Icon / Flame Illustration */}
                <div className="relative z-10 flex-shrink-0">
                  {isOnFire ? (
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/30 border border-rose-400 flex items-center justify-center animate-bounce shadow-lg shadow-rose-900/50">
                      <Flame className="w-7 h-7 text-amber-300 fill-amber-300 flame-active" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-sm">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Card Body Content */}
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {asset.description || 'Core mission-critical regulated pipeline asset.'}
                </p>

                {/* Badge Pills: Owner & Checks */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    <User className="w-3 h-3 text-slate-500" />
                    {asset.owner?.name || 'Resident Lead'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 border border-slate-200">
                    {asset.checks?.length || 0} Automated Checks
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Card Footer: Status & Action Button */}
            <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnFire ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                  }`}
                ></span>
                <span className={`font-bold ${isOnFire ? 'text-rose-600' : 'text-slate-600'}`}>
                  {isOnFire ? 'BURNING · CHECK FAILED' : 'Healthy Endpoint'}
                </span>
              </div>

              <button
                onClick={() => onInspectEndpoint && onInspectEndpoint(asset)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isOnFire
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
                }`}
              >
                {isOnFire ? (
                  <>
                    <Flame className="w-3 h-3 fill-white" />
                    Extinguish
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-slate-500" />
                    Inspect
                  </>
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
