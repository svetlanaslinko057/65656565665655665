/**
 * Actor Detail Page
 * 
 * Structural profile: WHO they are, HOW they act, WHERE their influence.
 * NO predictions, NO verdicts, NO trading signals.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, Wallet, TrendingUp, TrendingDown, Activity,
  Users, Network, ArrowRight, Loader2, Info, Tag,
  PieChart, BarChart3, Clock, ExternalLink
} from 'lucide-react';
import Header from '../components/Header';
import ActorSignalsBlock from '../components/actor/ActorSignalsBlock';
import ActorContextBlock from '../components/actor/ActorContextBlock';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

const typeBadgeColors = {
  'Exchange': 'bg-blue-100 text-blue-700',
  'Fund': 'bg-purple-100 text-purple-700',
  'Market Maker': 'bg-amber-100 text-amber-700',
  'Whale': 'bg-emerald-100 text-emerald-700',
  'Unknown': 'bg-gray-100 text-gray-700',
};

const tagColors = {
  emerald: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  amber: 'bg-amber-100 text-amber-700',
};

// Block 1: Summary
function SummaryBlock({ data }) {
  if (!data) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Behavior Summary
        <span className="text-xs font-normal text-gray-500 ml-2">{data.period}</span>
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Inflow</div>
          <div className="text-lg font-bold text-emerald-700">{data.metrics.inflow}</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Outflow</div>
          <div className="text-lg font-bold text-red-700">{data.metrics.outflow}</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Transactions</div>
          <div className="text-lg font-bold text-gray-900">{data.metrics.txCount}</div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Observed Patterns</div>
        <div className="flex flex-wrap gap-2">
          {data.observedPatterns?.map((p, i) => (
            <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
              {p}
            </span>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-500 italic">{data.interpretation}</p>
    </div>
  );
}

// Block 2: Tags
function TagsBlock({ data }) {
  if (!data?.tags?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Tag className="w-4 h-4" />
        Behavior Tags
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {data.tags.map((tag, i) => (
          <Tooltip key={i}>
            <TooltipTrigger>
              <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold cursor-help ${tagColors[tag.color] || 'bg-gray-100 text-gray-700'}`}>
                {tag.name}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-48">{tag.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 italic">{data.disclaimer}</p>
    </div>
  );
}

// Block 3: Flows
function FlowsBlock({ data }) {
  if (!data) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Flow Analysis
        <span className="text-xs font-normal text-gray-500 ml-2">{data.period}</span>
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Total Inflow</div>
          <div className="text-lg font-bold text-emerald-700">{data.summary.totalInflow}</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-xs text-gray-500 mb-1">Total Outflow</div>
          <div className="text-lg font-bold text-red-700">{data.summary.totalOutflow}</div>
        </div>
        <div className={`text-center p-3 rounded-lg ${data.summary.netFlowRaw >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="text-xs text-gray-500 mb-1">Net Flow</div>
          <div className={`text-lg font-bold ${data.summary.netFlowRaw >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {data.summary.netFlow}
          </div>
        </div>
      </div>
      
      {data.flowsByToken?.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2">Flows by Token</div>
          <div className="space-y-2">
            {data.flowsByToken.slice(0, 5).map((t, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-sm">{t.symbol}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-emerald-600">+{t.inflow.toFixed(2)}</span>
                  <span className="text-red-600">-{t.outflow.toFixed(2)}</span>
                  <span className={`font-semibold ${t.netFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {t.netFlow >= 0 ? '+' : ''}{t.netFlow.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 italic mt-4">{data.interpretation}</p>
    </div>
  );
}

// Block 4: Cohorts
function CohortsBlock({ data }) {
  if (!data?.cohorts?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <PieChart className="w-4 h-4" />
        Wallet Cohorts
      </h3>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        {data.cohorts.map((c, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className={`text-center p-4 rounded-lg cursor-help ${
                c.color === 'emerald' ? 'bg-emerald-50' :
                c.color === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
              }`}>
                <div className="text-2xl font-bold text-gray-900">{c.percentage}%</div>
                <div className="text-xs text-gray-500 mt-1">{c.name}</div>
                <div className="text-xs text-gray-400">{c.wallets} wallets</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{c.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 italic">{data.interpretation}</p>
    </div>
  );
}

// Block 5: Similar Actors
function SimilarBlock({ data }) {
  if (!data?.similar?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        Related Actors
      </h3>
      
      <div className="space-y-2 mb-4">
        {data.similar.map((a, i) => (
          <Link 
            key={i}
            to={`/actors/${a.id}`}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              {a.logo ? (
                <img src={a.logo} alt={a.name} className="w-8 h-8 rounded-lg" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
              )}
              <div>
                <div className="font-medium text-sm">{a.name}</div>
                <div className="text-xs text-gray-500">{a.reason}</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 italic">{data.interpretation}</p>
    </div>
  );
}

// Main Page
export default function ActorDetailPage() {
  const { actorId } = useParams();
  const [summary, setSummary] = useState(null);
  const [tags, setTags] = useState(null);
  const [flows, setFlows] = useState(null);
  const [cohorts, setCohorts] = useState(null);
  const [similar, setSimilar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    const base = process.env.REACT_APP_BACKEND_URL;
    
    // Load all endpoints in parallel
    const [summaryRes, tagsRes, flowsRes, cohortsRes, similarRes] = await Promise.all([
      fetch(`${base}/api/actor/${actorId}/summary`).then(r => r.json()).catch(() => null),
      fetch(`${base}/api/actor/${actorId}/tags`).then(r => r.json()).catch(() => null),
      fetch(`${base}/api/actor/${actorId}/flows`).then(r => r.json()).catch(() => null),
      fetch(`${base}/api/actor/${actorId}/cohorts`).then(r => r.json()).catch(() => null),
      fetch(`${base}/api/actor/${actorId}/similar`).then(r => r.json()).catch(() => null),
    ]);
    
    if (summaryRes?.ok) setSummary(summaryRes.data);
    if (tagsRes?.ok) setTags(tagsRes.data);
    if (flowsRes?.ok) setFlows(flowsRes.data);
    if (cohortsRes?.ok) setCohorts(cohortsRes.data);
    if (similarRes?.ok) setSimilar(similarRes.data);
    
    setLoading(false);
  }, [actorId]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Actor Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {summary?.logo ? (
                  <img src={summary.logo} alt={summary.name} className="w-16 h-16 rounded-xl" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{summary?.name || actorId}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${typeBadgeColors[summary?.actorType] || typeBadgeColors.Unknown}`}>
                      {summary?.actorType || 'Unknown'}
                    </span>
                    {summary?.confirmed && (
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700">
                            Confirmed
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Evidence-backed attribution</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Wallet className="w-4 h-4" />
                      {summary?.walletCount || 0} wallets
                    </span>
                  </div>
                </div>
              </div>
              
              {/* CTA Navigation */}
              <div className="flex items-center gap-2">
                <Link
                  to="/actors/graph"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  <Network className="w-4 h-4" />
                  View Influence Graph
                </Link>
                <Link
                  to={`/entity/${actorId}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Full Entity Page
                </Link>
              </div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Structural profile, not trading advice</p>
                <p>This page shows observed on-chain behavior patterns. It does not provide predictions, verdicts, or trading signals.</p>
              </div>
            </div>
          </div>
          
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SummaryBlock data={summary} />
            <ActorSignalsBlock actorSlug={actorId} />
            <ActorContextBlock actorSlug={actorId} />
            <TagsBlock data={tags} />
            <FlowsBlock data={flows} />
            <CohortsBlock data={cohorts} />
            <div className="lg:col-span-2">
              <SimilarBlock data={similar} />
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
