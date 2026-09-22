import React, { useState } from 'react';
import { AI_MODEL_REGISTRY, REGISTERED_DEVICES, SAMPLE_PRODUCTS } from '../data/catalog';
import { 
  BarChart3, 
  Cpu, 
  Layers, 
  Activity, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  HardDrive
} from 'lucide-react';

interface AnalyticsPanelProps {
  eventsLog: Array<{ event: string; timestamp: string; details?: any }>;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ eventsLog }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'preference_math' | 'models' | 'devices' | 'events'>('overview');

  // Anonymous Aggregate Metrics (README Sec 20 & 38)
  const stats = [
    { label: 'Anonymous Visitors', value: '1,428', change: '+18%', icon: Users, color: 'text-cyan-400' },
    { label: 'Interacted Visitors', value: '412', change: '28.8%', icon: Activity, color: 'text-indigo-400' },
    { label: 'Try-On Sessions', value: '236', change: '+24%', icon: Sparkles, color: 'text-emerald-400' },
    { label: 'Avg Generation Latency', value: '142 ms', change: 'GPU Accel', icon: Clock, color: 'text-amber-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase font-bold text-cyan-400">
              Management & Analytics Panel (Sec. 12, 19, 20 & 27)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white mt-1">
            FitAI Operations & Model Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Privacy-by-design anonymous engagement metrics, Section 12 preference formula verification, and commercial AI model registry.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
          {[
            { id: 'overview' as const, label: 'Dashboard Overview' },
            { id: 'preference_math' as const, label: 'Section 12 Formula' },
            { id: 'models' as const, label: 'AI Model Registry' },
            { id: 'devices' as const, label: 'Connected Devices' },
            { id: 'events' as const, label: 'Session Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`panel-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Dashboard Overview (Section 20 & 38) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((st) => {
              const Icon = st.icon;
              return (
                <div key={st.label} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400">{st.label}</span>
                    <Icon className={`w-4 h-4 ${st.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white mt-2 font-mono">{st.value}</div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
                    <span className="text-emerald-400">{st.change}</span>
                    <span>vs yesterday</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Popular Products Try-On Performance Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Product Engagement & Preference Matrix (Sec. 38)</span>
              </h3>
              <span className="text-xs text-slate-500 font-mono">Zero biometric data stored</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-3 font-semibold">PRODUCT</th>
                    <th className="pb-3 font-semibold">CATEGORY</th>
                    <th className="pb-3 font-semibold">PREVIEWS</th>
                    <th className="pb-3 font-semibold">EXPLICIT LIKES</th>
                    <th className="pb-3 font-semibold">WISHLIST SAVES</th>
                    <th className="pb-3 font-semibold">PREFERENCE CONFIDENCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {SAMPLE_PRODUCTS.slice(0, 5).map((prod, idx) => {
                    const previews = 85 - idx * 12;
                    const likes = 42 - idx * 7;
                    const saves = 18 - idx * 3;
                    const confidence = (0.88 - idx * 0.05).toFixed(2);

                    return (
                      <tr key={prod.id} className="hover:bg-slate-850 transition-colors">
                        <td className="py-3 flex items-center gap-3">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-800"
                          />
                          <div>
                            <div className="font-semibold text-white">{prod.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">${prod.price}</div>
                          </div>
                        </td>
                        <td className="py-3 text-slate-400 uppercase font-mono text-[10px]">
                          {prod.category.replace('_', ' ')}
                        </td>
                        <td className="py-3 font-mono text-slate-200">{previews}</td>
                        <td className="py-3 font-mono text-emerald-400">
                          {likes} ({((likes / previews) * 100).toFixed(0)}%)
                        </td>
                        <td className="py-3 font-mono text-amber-400">{saves}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full"
                                style={{ width: `${parseFloat(confidence) * 100}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-200">{confidence}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Section 12 Formula Verification */}
      {activeTab === 'preference_math' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <span className="text-xs font-mono uppercase font-bold text-indigo-400">
              Mathematical Verification
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              README Section 12 Preference Confidence Model
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              "Facial expression MUST NOT be interpreted as definitive knowledge of a person's emotions or intentions. Instead calculate a Preference Confidence Score using multiple signals."
            </p>
          </div>

          {/* Formula Weights Table */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { signal: 'Explicit Like/Dislike', weight: '40%', desc: 'Direct touch feedback (Heart or Pass)', color: 'border-indigo-500/60 bg-indigo-950/30 text-indigo-300' },
              { signal: 'Product Viewing Time', weight: '20%', desc: 'Dwell time in front of garment preview', color: 'border-cyan-500/60 bg-cyan-950/30 text-cyan-300' },
              { signal: 'Return/Revisit Behavior', weight: '15%', desc: 'Customer navigating back to item', color: 'border-emerald-500/60 bg-emerald-950/30 text-emerald-300' },
              { signal: 'Interaction Behavior', weight: '15%', desc: 'Slider dragging, zoom, comparison', color: 'border-amber-500/60 bg-amber-950/30 text-amber-300' },
              { signal: 'Facial-Expression Signal', weight: '10%', desc: 'Probabilistic smile/engagement vector', color: 'border-pink-500/60 bg-pink-950/30 text-pink-300' },
            ].map((item) => (
              <div key={item.signal} className={`p-4 rounded-xl border ${item.color}`}>
                <div className="text-xl font-bold font-mono">{item.weight}</div>
                <div className="text-xs font-semibold text-white mt-1">{item.signal}</div>
                <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-1 text-slate-300">
            <div className="text-indigo-400 font-bold">// Implementation Specification Formula</div>
            <div>Score = (ExplicitFeedback * 0.40) + (ViewingTimeWeight * 0.20) + (RevisitedWeight * 0.15) + (InteractionWeight * 0.15) + (ExpressionSignal * 0.10)</div>
            <div className="text-slate-500 pt-1">// Outputs normalized Preference Confidence: [0.00 .. 1.00]</div>
          </div>
        </div>
      )}

      {/* Tab 3: AI Model Registry (Section 2 & 27) */}
      {activeTab === 'models' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI Model Registry & Commercial License Matrix (Sec. 2 & 27)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                "No AI model may enter the production pipeline without being verified in docs/licenses/MODEL_LICENSE_MATRIX.md."
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono">
              6 Models Audited
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono">
                  <th className="pb-3 font-semibold">MODEL NAME</th>
                  <th className="pb-3 font-semibold">TASK</th>
                  <th className="pb-3 font-semibold">FRAMEWORK</th>
                  <th className="pb-3 font-semibold">LICENSE</th>
                  <th className="pb-3 font-semibold">COMMERCIAL USE</th>
                  <th className="pb-3 font-semibold">LATENCY</th>
                  <th className="pb-3 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {AI_MODEL_REGISTRY.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-850 transition-colors">
                    <td className="py-3 font-semibold text-white font-mono">{m.name}</td>
                    <td className="py-3 text-slate-300">{m.task}</td>
                    <td className="py-3 text-slate-400 font-mono text-[11px]">{m.framework}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {m.license}
                      </span>
                    </td>
                    <td className="py-3">
                      {m.commercialUse ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Benchmark Only
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-cyan-400">{m.latencyMs} ms</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Connected Devices (Section 22) */}
      {activeTab === 'devices' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Registered Edge & Cloud Hardware Devices (Sec. 22)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">4 Connected Terminals</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REGISTERED_DEVICES.map((dev) => (
              <div key={dev.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{dev.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-950 border border-emerald-800 text-emerald-400">
                    {dev.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400">{dev.store}</div>
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div>GPU: {dev.gpu}</div>
                  <div>Build: {dev.softwareVersion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Real-time Session Events Log (Section 18) */}
      {activeTab === 'events' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Live Interaction Event Stream (Sec. 18)</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Anonymous Telemetry</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[360px] overflow-y-auto font-mono text-xs space-y-2">
            {eventsLog.length === 0 ? (
              <div className="text-slate-500 py-4 text-center">
                No events recorded yet. Interact with the Fitting Room or Storefront to stream events!
              </div>
            ) : (
              eventsLog.map((ev, i) => (
                <div key={i} className="flex items-start gap-3 py-1 border-b border-slate-900">
                  <span className="text-slate-500 shrink-0">{ev.timestamp}</span>
                  <span className="text-cyan-400 font-semibold shrink-0">{ev.event}</span>
                  <span className="text-slate-400 truncate">
                    {ev.details ? JSON.stringify(ev.details) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
