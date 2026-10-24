import React from 'react'
import { Network, ArrowRight } from 'lucide-react'

export default function DependencyGraph({ pack, burningAssetId }) {
  const assets = pack?.assets || []

  return (
    <div className="neomorph-card p-4 h-full flex flex-col bg-white border border-slate-200/80">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-slate-100 text-slate-700">
            <Network className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 leading-tight">Pipeline Topology Lineage</h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
          {assets.length} Nodes
        </span>
      </div>

      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {assets.map((asset) => {
          const isOnFire = asset.id === burningAssetId
          const hasUpstreams = (asset.dependencies || []).length > 0

          return (
            <div
              key={asset.id}
              className={`p-2 rounded-xl border transition-all ${
                isOnFire
                  ? 'bg-rose-50/50 border-rose-200'
                  : 'bg-slate-50/50 border-slate-200/60 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnFire ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  ></span>
                  <span className="text-xs font-bold text-slate-800">{asset.name}</span>
                </div>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 font-semibold">
                  {asset.type}
                </span>
              </div>

              {hasUpstreams && (
                <div className="mt-1 pt-1 border-t border-slate-200/40 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="text-[9px]">Sources:</span>
                  <div className="flex flex-wrap gap-1">
                    {asset.dependencies.map((dep) => (
                      <span
                        key={dep}
                        className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                          dep === burningAssetId
                            ? 'bg-rose-100 text-rose-700 font-bold'
                            : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        {dep}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Spread risk calculated via DAG</span>
        <span className="font-semibold text-slate-600">Strict Whitelist</span>
      </div>
    </div>
  )
}
