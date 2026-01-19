/**
 * Engine Dashboard v1
 * 
 * Quality Control Dashboard - НЕ trading UI
 * 
 * Показывает:
 * 1. Decision Distribution (BUY/SELL/NEUTRAL)
 * 2. Coverage Gating (блокировки по coverage)
 * 3. Evidence vs Risk Scatter
 * 4. Flip-rate Timeline
 * 5. Shadow Agreement (v1.1 vs v2)
 * 
 * НЕ показывает: price, pnl, candles, performance
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Shield, Target, Activity, GitCompare,
  RefreshCw, Loader2, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Minus, Info, Zap
} from 'lucide-react';
import Header from '../components/Header';
import { api } from '../api/client';

// ============ DECISION DISTRIBUTION COMPONENT ============
function DecisionDistribution({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Decision Distribution</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { buy, sell, neutral, buyPlusSell, total, period } = data;
  
  const getStatusColor = (status) => {
    if (status === 'ok') return 'bg-emerald-100 text-emerald-700';
    if (status === 'warning') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold">Decision Distribution</h3>
        </div>
        <span className="text-sm text-gray-500">{total} decisions ({period})</span>
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        {/* NEUTRAL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Minus className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">NEUTRAL</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(neutral.status)}`}>
                {neutral.status}
              </span>
            </div>
            <span className="text-sm font-semibold">{neutral.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gray-400 rounded-full transition-all"
              style={{ width: `${neutral.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: 60-85%</p>
        </div>

        {/* BUY */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium">BUY</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(buy.status)}`}>
                {buy.status}
              </span>
            </div>
            <span className="text-sm font-semibold">{buy.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${buy.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: 7-20%</p>
        </div>

        {/* SELL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">SELL</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(sell.status)}`}>
                {sell.status}
              </span>
            </div>
            <span className="text-sm font-semibold">{sell.pct.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${sell.pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: 7-20%</p>
        </div>
      </div>

      {/* BUY+SELL summary */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">BUY + SELL Total</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{buyPlusSell.pct.toFixed(1)}%</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(buyPlusSell.status)}`}>
              {buyPlusSell.status === 'ok' ? '≤40%' : '>40%'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ COVERAGE GATING COMPONENT ============
function CoverageGating({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Coverage Gating</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { avgCoverageBuySell, avgCoverageNeutral, buySellAtLowCoverage, coverageVariance, period } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold">Coverage Gating</h3>
        </div>
        <span className="text-sm text-gray-500">{period}</span>
      </div>

      {/* Critical check */}
      <div className={`p-4 rounded-lg mb-4 ${buySellAtLowCoverage.status === 'ok' ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-2">
          {buySellAtLowCoverage.status === 'ok' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${buySellAtLowCoverage.status === 'ok' ? 'text-emerald-700' : 'text-red-700'}`}>
              BUY/SELL at Low Coverage: {buySellAtLowCoverage.count}
            </p>
            <p className="text-sm text-gray-600">
              {buySellAtLowCoverage.status === 'ok' 
                ? 'No decisions at coverage <60%' 
                : `${buySellAtLowCoverage.pct.toFixed(1)}% decisions at low coverage`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Coverage (BUY/SELL)</p>
          <p className="text-xl font-semibold">{avgCoverageBuySell.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Coverage (NEUTRAL)</p>
          <p className="text-xl font-semibold">{avgCoverageNeutral.toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <Info className="w-4 h-4 inline mr-1" />
          Coverage variance: {coverageVariance.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ============ EVIDENCE VS RISK SCATTER (simplified) ============
function EvidenceRiskScatter({ decisions, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">Evidence vs Risk</h3>
        </div>
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  // Build scatter data
  const scatterData = (decisions || []).map(d => ({
    evidence: d.scores?.evidence || 0,
    risk: d.scores?.risk || 0,
    decision: d.decision,
  }));

  // Group by zones
  const zones = {
    safe: scatterData.filter(d => d.evidence >= 65 && d.risk < 60),
    risky: scatterData.filter(d => d.risk >= 60),
    weak: scatterData.filter(d => d.evidence < 65 && d.risk < 60),
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold">Evidence vs Risk Distribution</h3>
        </div>
        <span className="text-sm text-gray-500">{scatterData.length} decisions</span>
      </div>

      {/* Simple visualization */}
      <div className="relative h-48 bg-gray-50 rounded-lg overflow-hidden">
        {/* Grid */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="border border-gray-100" />
          ))}
        </div>
        
        {/* Zone labels */}
        <div className="absolute top-2 right-2 text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
          High Risk Zone
        </div>
        <div className="absolute bottom-2 left-2 text-xs text-amber-500 bg-amber-50 px-2 py-1 rounded">
          Low Evidence Zone
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-emerald-500 bg-emerald-50 px-2 py-1 rounded">
          Safe Zone
        </div>

        {/* Dots */}
        {scatterData.map((d, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 rounded-full transform -translate-x-1 -translate-y-1 ${
              d.decision === 'BUY' ? 'bg-emerald-500' :
              d.decision === 'SELL' ? 'bg-red-500' : 'bg-gray-400'
            }`}
            style={{
              left: `${d.evidence}%`,
              bottom: `${100 - d.risk}%`,
            }}
            title={`Evidence: ${d.evidence}, Risk: ${d.risk}, Decision: ${d.decision}`}
          />
        ))}

        {/* Axis labels */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
          Evidence →
        </div>
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-400">
          ← Risk
        </div>
      </div>

      {/* Zone stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 bg-emerald-50 rounded">
          <p className="text-lg font-semibold text-emerald-600">{zones.safe.length}</p>
          <p className="text-xs text-gray-500">Safe Zone</p>
        </div>
        <div className="text-center p-2 bg-red-50 rounded">
          <p className="text-lg font-semibold text-red-600">{zones.risky.length}</p>
          <p className="text-xs text-gray-500">High Risk</p>
        </div>
        <div className="text-center p-2 bg-amber-50 rounded">
          <p className="text-lg font-semibold text-amber-600">{zones.weak.length}</p>
          <p className="text-xs text-gray-500">Low Evidence</p>
        </div>
      </div>
    </div>
  );
}

// ============ STABILITY KPI COMPONENT ============
function StabilityKPI({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold">Stability</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { flipRate24h, medianDecisionLifespanHours, decisionsChangedWithoutInputChange, status, period } = data;

  const getStatusColor = (status) => {
    if (status === 'ok') return 'bg-emerald-100 text-emerald-700';
    if (status === 'warning') return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-600" />
          <h3 className="font-semibold">Stability</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <span className="text-sm text-gray-500">{period}</span>
      </div>

      <div className="space-y-4">
        {/* Flip Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Flip Rate (24h)</span>
            <span className={`font-semibold ${flipRate24h > 15 ? 'text-red-600' : 'text-emerald-600'}`}>
              {flipRate24h.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${flipRate24h > 15 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, flipRate24h * 100 / 30)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Target: &lt;15%</p>
        </div>

        {/* Median Lifespan */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Median Decision Lifespan</p>
          <p className="text-xl font-semibold">{medianDecisionLifespanHours.toFixed(1)}h</p>
          <p className="text-xs text-gray-500">Target: ≥4h</p>
        </div>

        {/* Changed without input */}
        <div className={`p-3 rounded-lg ${decisionsChangedWithoutInputChange > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <p className="text-sm text-gray-600">Changed Without Input Change</p>
          <p className={`text-xl font-semibold ${decisionsChangedWithoutInputChange > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {decisionsChangedWithoutInputChange}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ SHADOW AGREEMENT COMPONENT ============
function ShadowAgreement({ data, loading }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Shadow Mode (v1.1 vs v2)</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { 
    totalComparisons, agreementRate, v2MoreAggressiveRate, v2LessAggressiveRate,
    avgEvidenceDiff, avgRiskDiff, v2BuySellAtLowCoverage, killConditionsPassed,
    killConditionsDetails, period
  } = data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Shadow Mode (v1.1 vs v2)</h3>
        </div>
        <span className="text-sm text-gray-500">{totalComparisons} comparisons ({period})</span>
      </div>

      {/* Kill conditions status */}
      <div className={`p-4 rounded-lg mb-4 ${killConditionsPassed ? 'bg-emerald-50' : 'bg-red-50'}`}>
        <div className="flex items-center gap-2">
          {killConditionsPassed ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={`font-medium ${killConditionsPassed ? 'text-emerald-700' : 'text-red-700'}`}>
              Kill Conditions: {killConditionsPassed ? 'PASSED' : 'FAILED'}
            </p>
            <p className="text-sm text-gray-600">
              {killConditionsPassed 
                ? 'v2 is safe for production consideration' 
                : 'v2 cannot be promoted to production'}
            </p>
          </div>
        </div>
      </div>

      {/* Agreement Rate */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Agreement Rate</span>
          <span className={`font-semibold ${agreementRate >= 70 ? 'text-emerald-600' : 'text-red-600'}`}>
            {agreementRate.toFixed(1)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all ${agreementRate >= 70 ? 'bg-emerald-500' : 'bg-red-500'}`}
            style={{ width: `${agreementRate}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Target: ≥70%</p>
      </div>

      {/* Comparison stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-orange-50 rounded-lg">
          <p className="text-sm text-gray-500">v2 More Aggressive</p>
          <p className="text-lg font-semibold text-orange-600">{v2MoreAggressiveRate.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-500">v2 Less Aggressive</p>
          <p className="text-lg font-semibold text-blue-600">{v2LessAggressiveRate.toFixed(1)}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Evidence Diff</p>
          <p className="text-lg font-semibold">{avgEvidenceDiff >= 0 ? '+' : ''}{avgEvidenceDiff.toFixed(1)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Avg Risk Diff</p>
          <p className="text-lg font-semibold">{avgRiskDiff >= 0 ? '+' : ''}{avgRiskDiff.toFixed(1)}</p>
        </div>
      </div>

      {/* v2 at low coverage */}
      {v2BuySellAtLowCoverage > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-1" />
            v2 made {v2BuySellAtLowCoverage} BUY/SELL at low coverage - CRITICAL
          </p>
        </div>
      )}
    </div>
  );
}

// ============ OVERALL HEALTH BADGE ============
function OverallHealth({ health }) {
  const config = {
    healthy: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle, label: 'Healthy' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle, label: 'Warning' },
    critical: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Critical' },
  };

  const c = config[health] || config.warning;
  const Icon = c.icon;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${c.bg}`}>
      <Icon className={`w-5 h-5 ${c.text}`} />
      <span className={`font-semibold ${c.text}`}>Engine Health: {c.label}</span>
    </div>
  );
}

// ============ MAIN DASHBOARD COMPONENT ============
export default function EngineDashboard() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState(null);
  const [shadowKpi, setShadowKpi] = useState(null);
  const [decisions, setDecisions] = useState([]);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('7');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [kpiRes, shadowRes, decisionsRes] = await Promise.all([
        api.get(`/engine/kpi?days=${period}`),
        api.get(`/engine/shadow/kpi?days=${period}`),
        api.get('/engine/decisions?limit=100'),
      ]);

      if (kpiRes.data.ok) setKpi(kpiRes.data.data);
      if (shadowRes.data.ok) setShadowKpi(shadowRes.data.data);
      if (decisionsRes.data.ok) setDecisions(decisionsRes.data.data.decisions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Engine Dashboard</h1>
            <p className="text-gray-500">Quality Control - Decision Analysis</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Period selector */}
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="1">Last 24h</option>
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
            </select>

            {/* Refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>

            {/* Back to Engine */}
            <Link
              to="/engine"
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Zap className="w-4 h-4" />
              Engine
            </Link>
          </div>
        </div>

        {/* Overall health */}
        {kpi && (
          <div className="mb-6">
            <OverallHealth health={kpi.overallHealth} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            Error: {error}
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Row 1 */}
          <DecisionDistribution data={kpi?.distribution} loading={loading} />
          <CoverageGating data={kpi?.coverage} loading={loading} />
          
          {/* Row 2 */}
          <EvidenceRiskScatter decisions={decisions} loading={loading} />
          <StabilityKPI data={kpi?.stability} loading={loading} />
          
          {/* Row 3 - Full width */}
          <div className="lg:col-span-2">
            <ShadowAgreement data={shadowKpi} loading={loading} />
          </div>
        </div>

        {/* Engine Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <Info className="w-4 h-4 inline mr-1" />
            <strong>Engine v1.1</strong> | Shadow Mode: Active | ML: Disabled | 
            This dashboard shows quality metrics, not trading performance.
          </p>
        </div>
      </main>
    </div>
  );
}
