import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft, Wallet, Building, TrendingUp, TrendingDown, ExternalLink, Activity,
  ArrowUpRight, ArrowDownRight, PieChart, BarChart3, Users, Coins, AlertTriangle,
  Check, X, Info, ChevronDown, ChevronUp, Bell, Eye, Target, Zap, Filter, ArrowRight,
  Percent, Clock, BarChart2, ArrowLeftRight, Link2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart as RechartPie, Pie, Cell } from 'recharts';
import Header from '../components/Header';
import StatusBanner from '../components/StatusBanner';
import KnownAddresses from '../components/KnownAddresses';
import PatternBridge from '../components/entity/PatternBridge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Helper functions
function formatLargeUSD(value) {
  if (!value) return '$0';
  const absValue = Math.abs(value);
  if (absValue >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (absValue >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (absValue >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

// Default data when API doesn't return
function getDefaultHoldings() {
  return [
    { symbol: 'ETH', name: 'Ethereum', value: 420000000, percentage: 35, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' },
    { symbol: 'BTC', name: 'Bitcoin', value: 380000000, percentage: 32, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
    { symbol: 'USDT', name: 'Tether', value: 250000000, percentage: 21, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png' },
    { symbol: 'Others', name: 'Others', value: 150000000, percentage: 12, logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png' },
  ];
}

function getDefaultNetflow() {
  return [
    { date: 'Mon', netflow: 45000000 },
    { date: 'Tue', netflow: 32000000 },
    { date: 'Wed', netflow: -12000000 },
    { date: 'Thu', netflow: 28000000 },
    { date: 'Fri', netflow: 51000000 },
    { date: 'Sat', netflow: 38000000 },
    { date: 'Sun', netflow: 42000000 },
  ];
}

function getDefaultTransactions() {
  return [
    { type: 'inflow', token: 'ETH', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png', amount: '$12.5M', counterparty: '0x742d...f0bEb', time: '2m ago', isMarketMoving: true, flag: 'Market-Moving' },
    { type: 'outflow', token: 'BTC', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1.png', amount: '$8.9M', counterparty: '0x1bc9...whale', time: '15m ago', isCrossEntity: true, flag: 'Cross-Entity' },
    { type: 'inflow', token: 'SOL', logo: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png', amount: '$4.2M', counterparty: '0xa3f8...e2d4', time: '32m ago', isFirstEntry: true, flag: 'First Entry' },
  ];
}

function getMockEntity(entityId) {
  return {
    id: entityId || 'binance',
    name: entityId === 'coinbase' ? 'Coinbase' : 'Binance',
    type: 'Exchange',
    typeColor: 'bg-gray-100 text-gray-700',
    logo: 'https://s2.coinmarketcap.com/static/img/exchanges/64x64/270.png',
    description: 'Loading entity data...',
    firstSeen: 'Unknown',
    addressCount: 0,
    totalHoldings: 'Unknown',
    holdingsChange: 0,
    netFlow24h: 0,
    netFlow24hFormatted: '$0',
    marketShare: 0,
    holdings: getDefaultHoldings(),
    netflowData: getDefaultNetflow(),
    transactions: getDefaultTransactions(),
  };
}

const GlassCard = ({ children, className = "", hover = false }) => (
  <div className={`bg-white border border-gray-200 rounded-xl ${hover ? 'hover:border-gray-900 cursor-pointer' : ''} ${className}`}>
    {children}
  </div>
);

// Entity Behavior Summary Data (Factual, no intent)
const getEntityBehaviorSummary = (entityId) => {
  const data = {
    binance: {
      observedPatterns: [
        { detected: true, text: 'Sustained net inflows detected (+$420M cumulative over 7d)' },
        { detected: true, text: 'Increased stablecoin reserves observed (+12%)' },
        { detected: true, text: 'No abnormal outflow spikes identified' },
        { detected: true, text: 'Minor BTC distribution detected (-$56M)' }
      ],
      interpretation: 'Describes observed flow structure, not intent.',
      dataCoverage: 82, // Data completeness, not quality
      state: 'Net Inflow Trend',
      statePeriod: 'last 7d',
      similarEntities: [
        { name: 'Kraken', pattern: 'Similar ETH inflow pattern', overlap: 'High' },
        { name: 'a16z Crypto', pattern: 'Overlapping accumulation window', overlap: 'High' },
        { name: 'Grayscale', pattern: 'Correlated net flows', overlap: 'Medium' }
      ],
      tokenFlows: [
        { token: 'ETH', dominantFlow: 'inflow', volumeShare: 'High', dataCoverage: 82, entityFlowPct: 8.4 },
        { token: 'BTC', dominantFlow: 'outflow', volumeShare: 'Medium', dataCoverage: 68, entityFlowPct: 5.2 },
        { token: 'SOL', dominantFlow: 'inflow', volumeShare: 'High', dataCoverage: 79, entityFlowPct: 7.1 },
        { token: 'ARB', dominantFlow: 'inflow', volumeShare: 'Medium', dataCoverage: 71, entityFlowPct: 4.8 },
        { token: 'USDT', dominantFlow: 'neutral', volumeShare: 'Low', dataCoverage: 45, entityFlowPct: 2.1 }
      ],
      historicalStats: {
        condition: 'Net inflow > $100M in 24h',
        occurrences: 47,
        marketUpPct: 72,
        avgLagDays: 1.3,
        medianMove: '+3.2%'
      },
      bridgeFlows: [
        { from: 'Ethereum', to: 'Arbitrum', asset: 'ETH', amount: '$45M', direction: 'L1→L2' },
        { from: 'Ethereum', to: 'Polygon', asset: 'USDT', amount: '$23M', direction: 'L1→L2' },
        { from: 'Bitcoin', to: 'Ethereum', asset: 'Wrapped BTC', amount: '$12M', direction: 'Cross-chain' }
      ]
    },
    coinbase: {
      observedPatterns: [
        { detected: true, text: 'Stable overall holdings maintained' },
        { detected: true, text: 'Net outflow detected (-$45M in 24h)' },
        { detected: true, text: 'Institutional custody remains strong' },
        { detected: true, text: 'Rotation between BTC and altcoins observed' }
      ],
      interpretation: 'Mixed flow patterns detected across token pairs.',
      dataCoverage: 68,
      state: 'Mixed Flow Pattern',
      statePeriod: 'last 7d',
      similarEntities: [
        { name: 'Jump Trading', pattern: 'Similar BTC distribution pattern', overlap: 'Medium' }
      ],
      tokenFlows: [
        { token: 'ETH', dominantFlow: 'neutral', volumeShare: 'Medium', dataCoverage: 58, entityFlowPct: 4.2 },
        { token: 'BTC', dominantFlow: 'outflow', volumeShare: 'Medium', dataCoverage: 65, entityFlowPct: 5.8 },
        { token: 'LINK', dominantFlow: 'inflow', volumeShare: 'Low', dataCoverage: 52, entityFlowPct: 3.1 }
      ],
      historicalStats: {
        condition: 'Net outflow > $50M in 24h',
        occurrences: 34,
        marketUpPct: 38,
        avgLagDays: 0.8,
        medianMove: '-1.8%'
      },
      bridgeFlows: []
    }
  };
  return data[entityId] || data.binance;
};

// Alert types for Entity
const entityAlertTypes = [
  {
    id: 'structural_shift',
    name: 'Structural Shift',
    category: 'Structural',
    description: 'Alert on fundamental behavior changes',
    triggers: ['Accumulation → Distribution switch', 'Confidence drops below threshold', 'Token alignment changes'],
    icon: Activity,
    categoryColor: 'bg-gray-900'
  },
  {
    id: 'impact_threshold',
    name: 'Impact Threshold',
    category: 'Impact-based',
    description: 'Alert when entity exceeds impact levels',
    triggers: ['Net flow > historical 90th percentile', 'Token impact score > 7/10', 'Flow > X% of daily volume'],
    icon: Target,
    isNew: true,
    categoryColor: 'bg-teal-500'
  },
  {
    id: 'cross_entity',
    name: 'Cross-Entity Signal',
    category: 'Cross-Entity',
    description: 'Alert when multiple entities align',
    triggers: ['2+ entities aligned on same token', 'Exchange + Smart Money same direction', 'Entity cluster forming'],
    icon: Users,
    isNew: true,
    categoryColor: 'bg-purple-500'
  },
  {
    id: 'behavior_shift',
    name: 'Behavior Shift',
    category: 'Structural',
    description: 'Alert on activity pattern changes',
    triggers: ['Tx frequency change > 50%', 'New token exposure', 'Risk profile shift'],
    icon: AlertTriangle,
    categoryColor: 'bg-gray-900'
  }
];

const txFilterTypes = [
  { id: 'all', label: 'All' },
  { id: 'market_moving', label: 'Market-Moving' },
  { id: 'first_entry', label: 'First Entry' },
  { id: 'cross_entity', label: 'Cross-Entity' }
];

// Entity Behavior Summary (Factual, no verdict)
const EntityBehaviorSummary = ({ entity, behaviorData, onTrack, onAlert, isTracked }) => {
  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Entity Behavior Summary</div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-bold">{behaviorData.state}</span>
            <span className="text-xs text-gray-400">({behaviorData.statePeriod})</span>
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-2">
            {entity.type} • {entity.addressCount} addresses
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-1">Data Coverage</div>
          <div className="text-3xl font-bold">{behaviorData.dataCoverage}<span className="text-xl text-gray-500">%</span></div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" />
                What is this?
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
              <p className="text-xs">Coverage reflects data completeness, not quality. Higher coverage = more addresses and transactions analyzed.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Observed Patterns</div>
        <div className="space-y-2 text-sm">
          {behaviorData.observedPatterns.map((pattern, i) => (
            <div key={i} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-white">{pattern.text}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-400">{behaviorData.interpretation}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-white/10">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onTrack}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isTracked
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}
            >
              {isTracked ? <Check className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isTracked ? 'Tracking' : 'Track Entity'}
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">{isTracked ? 'Click to stop tracking' : 'Add to watchlist • Get alerts • See in Market activity'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onAlert}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Alert on Changes
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs">Get notified on net flow flips, token exits, and structural changes</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                // TODO: Implement navigation to Actors Graph with entity context
                console.log('Navigate to Actors Graph for entity:', entity.name);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-xl text-sm font-medium hover:bg-indigo-500/30 transition-colors ml-auto"
            >
              <Link2 className="w-4 h-4" />
              View in Actors Graph
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 text-white max-w-xs border border-white/20">
            <p className="text-xs font-semibold mb-1">Explore connected wallets and counterparties</p>
            <p className="text-xs text-gray-400">See relationship network and transaction flows</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

// Cross-Entity Similarity (Pattern observation, not coordination)
// Cross-Entity Similarity (Pattern observation, not coordination)
const CrossEntitySimilarity = ({ similarEntities, currentEntity }) => {
  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Cross-Entity Similarity</h3>
      </div>

      {similarEntities.length > 0 ? (
        <>
          <div className="text-xs text-gray-500 mb-3">Entities with similar patterns to {currentEntity}:</div>
          <div className="space-y-2">
            {similarEntities.map((entity, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{entity.name}</div>
                    <div className="text-xs text-gray-500">{entity.pattern}</div>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-600 px-2 py-1 bg-gray-100 rounded">
                  {entity.overlap}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600">
              This indicates <span className="font-semibold">pattern similarity</span>, not coordination.
            </p>
          </div>
        </>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg text-center">
          <div className="text-gray-500 text-sm">No similar patterns detected</div>
          <div className="text-xs text-gray-400 mt-1">This entity shows unique behavior</div>
        </div>
      )}
    </GlassCard>
  );
};

// Token Flow Matrix (Descriptive, not predictive)
const TokenFlowMatrix = ({ tokenFlows, entityName }) => {
  const getFlowIcon = (flow) => {
    switch(flow) {
      case 'inflow': return <TrendingUp className="w-4 h-4" />;
      case 'outflow': return <TrendingDown className="w-4 h-4" />;
      default: return <ArrowLeftRight className="w-4 h-4" />;
    }
  };

  const getFlowStyle = (flow) => {
    switch(flow) {
      case 'inflow': return 'text-gray-900';
      case 'outflow': return 'text-gray-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Token Flow Matrix</h3>
        </div>
        <span className="text-xs text-gray-500">Observed flow patterns by token</span>
      </div>

      <div className="grid grid-cols-5 gap-4 pb-3 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
        <div>Token</div>
        <div>Dominant Flow</div>
        <div>Volume Share</div>
        <div>Data Coverage</div>
        <div className="text-right">Entity Flow %</div>
      </div>

      <div className="divide-y divide-gray-100">
        {tokenFlows.map((item, i) => (
          <div key={i} className="grid grid-cols-5 gap-4 py-3 items-center">
            <div className="font-semibold text-gray-900">{item.token}</div>
            <div className={`flex items-center gap-1.5 ${getFlowStyle(item.dominantFlow)}`}>
              {getFlowIcon(item.dominantFlow)}
              <span className="capitalize text-sm">{item.dominantFlow}</span>
            </div>
            <div>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                item.volumeShare === 'High' ? 'bg-gray-900 text-white' :
                item.volumeShare === 'Medium' ? 'bg-gray-200 text-gray-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {item.volumeShare}
              </span>
            </div>
            <div className="text-sm text-gray-700">{item.dataCoverage}%</div>
            <div className="text-right">
              <span className={`font-bold ${item.entityFlowPct >= 7 ? 'text-gray-900' : item.entityFlowPct >= 4 ? 'text-gray-700' : 'text-gray-400'}`}>
                {item.entityFlowPct.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-xs text-gray-600">
          Matrix shows <span className="font-semibold">observed flow structure</span> across tokens. Not predictive.
        </div>
      </div>
    </GlassCard>
  );
};

// Historical Statistics (Facts only, no advice)
const HistoricalStatistics = ({ historicalStats, entityName }) => {
  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Historical Statistics</h3>
        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">FACT</span>
      </div>

      <div className="p-4 bg-gray-900 text-white rounded-xl mb-4">
        <div className="text-xs text-gray-400 mb-1">CONDITION</div>
        <div className="text-lg font-bold">{entityName} {historicalStats.condition}</div>
        <div className="text-xs text-gray-400 mt-1">{historicalStats.occurrences} occurrences in last 180 days</div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalStats.marketUpPct}%</div>
          <div className="text-xs text-gray-500 mt-1">Market moved up after</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalStats.avgLagDays}d</div>
          <div className="text-xs text-gray-500 mt-1">Avg lag to market reaction</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl text-center">
          <div className="text-2xl font-bold text-gray-900">{historicalStats.medianMove}</div>
          <div className="text-xs text-gray-500 mt-1">Median price move</div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          Statistics describe <span className="font-semibold">historical correlation</span>, not causation.
        </p>
      </div>
    </GlassCard>
  );
};

// Bridge Flows (Cross-chain behavior grouping)
const BridgeFlows = ({ bridgeFlows, entityName }) => {
  if (!bridgeFlows || bridgeFlows.length === 0) {
    return null;
  }

  return (
    <GlassCard className="p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-gray-700" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Cross-Chain Flows</h3>
        <span className="px-2 py-0.5 bg-indigo-100 rounded text-xs font-medium text-indigo-700">BRIDGE</span>
      </div>

      <div className="text-xs text-gray-500 mb-3">
        Observed bridge activity: groups entity behavior across networks
      </div>

      <div className="space-y-2">
        {bridgeFlows.map((flow, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">{flow.from}</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{flow.to}</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <span className="text-xs text-gray-500">{flow.asset}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-900">{flow.amount}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">
                {flow.direction}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600">
          Bridge tracking groups <span className="font-semibold">entity behavior across networks</span>. Not intent.
        </p>
      </div>
    </GlassCard>
  );
};

const HoldingsBreakdown = ({ holdings }) => {
  const COLORS = ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB'];

  return (
    <GlassCard className="p-4 h-full">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Holdings Breakdown</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RechartPie>
              <Pie
                data={holdings}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {holdings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => `$${(value / 1e6).toFixed(1)}M`} />
            </RechartPie>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-48">
          {holdings.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <img src={item.logo} alt={item.symbol} className="w-5 h-5 rounded-full" />
                <span className="font-semibold text-sm text-gray-900">{item.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">${(item.value / 1e6).toFixed(1)}M</div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

const NetflowChart = ({ netflowData }) => {
  const [period, setPeriod] = useState('7D');

  return (
    <GlassCard className="p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Flow History</h3>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {['24H', '7D', '30D'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                period === p ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={netflowData}>
            <defs>
              <linearGradient id="netflowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#374151" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#374151" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="0" stroke="rgba(0,0,0,0.03)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="transparent" tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} stroke="transparent" tickLine={false} tickFormatter={(v) => `${v > 0 ? '+' : ''}${(v/1e6).toFixed(0)}M`} width={55} />
            <Area type="monotone" dataKey="netflow" stroke="#374151" strokeWidth={2.5} fill="url(#netflowGradient)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};

// Flows by Token Component - показывает разбивку потоков по токенам
const FlowsByToken = ({ flowsByToken }) => {
  if (!flowsByToken || flowsByToken.length === 0) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Flows by Token</h3>
        <div className="text-sm text-gray-400 text-center py-8">No token flow data available</div>
      </GlassCard>
    );
  }
  
  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Flows by Token</h3>
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {flowsByToken.slice(0, 8).map((token, i) => {
          const hasUSD = token.inflowUSD > 0 || token.outflowUSD > 0;
          const displayInflow = hasUSD ? token.inflowUSD : token.inflow;
          const displayOutflow = hasUSD ? token.outflowUSD : token.outflow;
          const displayNet = hasUSD ? token.netFlowUSD : token.netFlow;
          const totalFlow = Math.abs(displayInflow) + Math.abs(displayOutflow);
          const inflowPercent = totalFlow > 0 ? (Math.abs(displayInflow) / totalFlow) * 100 : 50;
          
          return (
            <div key={i} className="border border-gray-100 rounded-lg p-3 hover:border-gray-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{token.token}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    token.dominantFlow === 'inflow' ? 'bg-emerald-50 text-emerald-600' :
                    token.dominantFlow === 'outflow' ? 'bg-red-50 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {token.dominantFlow === 'inflow' ? 'Net inflow observed' :
                     token.dominantFlow === 'outflow' ? 'Net outflow observed' :
                     'Balanced flow'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{token.txCount} tx</span>
              </div>
              
              {/* Flow bar visualization */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                <div 
                  className="bg-emerald-400 transition-all" 
                  style={{ width: `${inflowPercent}%` }}
                />
                <div 
                  className="bg-red-400 transition-all" 
                  style={{ width: `${100 - inflowPercent}%` }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Inflow</span>
                  <div className="font-semibold text-emerald-600">
                    {hasUSD ? `$${(displayInflow / 1e6).toFixed(2)}M` : `${(displayInflow / 1e3).toFixed(1)}K`}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Outflow</span>
                  <div className="font-semibold text-red-600">
                    {hasUSD ? `$${(displayOutflow / 1e6).toFixed(2)}M` : `${(displayOutflow / 1e3).toFixed(1)}K`}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Net</span>
                  <div className={`font-bold ${displayNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {displayNet >= 0 ? '+' : ''}{hasUSD ? `$${(displayNet / 1e6).toFixed(2)}M` : `${(displayNet / 1e3).toFixed(1)}K`}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

// Bridge Activity Component - показывает кроссчейн активность
const BridgeActivity = ({ bridgeData }) => {
  if (!bridgeData || bridgeData.length === 0) {
    return (
      <GlassCard className="p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
          <span className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4" />
            Cross-Chain Activity
          </span>
        </h3>
        <div className="text-sm text-gray-400 text-center py-8">
          <Link2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <div>No bridge activity detected</div>
          <div className="text-xs mt-1">Entity has not interacted with known bridge contracts</div>
        </div>
      </GlassCard>
    );
  }
  
  // Group by destination chain
  const byChain = bridgeData.reduce((acc, b) => {
    if (!acc[b.toChain]) acc[b.toChain] = [];
    acc[b.toChain].push(b);
    return acc;
  }, {});
  
  return (
    <GlassCard className="p-4">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
        <span className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4" />
          Cross-Chain Activity
        </span>
      </h3>
      <div className="space-y-4">
        {Object.entries(byChain).map(([chain, bridges]) => (
          <div key={chain} className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 bg-gray-900 text-white rounded">
                  Ethereum
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {chain}
                </span>
              </div>
              <span className="text-xs text-gray-400">
                {bridges[0].direction}
              </span>
            </div>
            <div className="space-y-1">
              {bridges.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{b.asset}</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">
                      {b.volumeUSD > 0 ? `$${(b.volumeUSD / 1e6).toFixed(2)}M` : `${b.volume.toFixed(2)}`}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">({b.txCount} tx)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

const RecentTransactions = ({ transactions }) => {
  const [txFilter, setTxFilter] = useState('all');

  const filteredTx = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    if (txFilter === 'market_moving') return tx.isMarketMoving;
    if (txFilter === 'first_entry') return tx.isFirstEntry;
    if (txFilter === 'cross_entity') return tx.isCrossEntity;
    return true;
  });

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Transactions</h3>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-0.5">
          {txFilterTypes.map(filter => (
            <button
              key={filter.id}
              onClick={() => setTxFilter(filter.id)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                txFilter === filter.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-white'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Token</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Counterparty</th>
              <th className="py-2 px-3 text-left text-xs font-semibold text-gray-500 uppercase">Flag</th>
              <th className="py-2 px-3 text-right text-xs font-semibold text-gray-500 uppercase">Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredTx.map((tx, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                    tx.type === 'inflow' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tx.type === 'inflow' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    <img src={tx.logo} alt={tx.token} className="w-5 h-5 rounded-full" />
                    <span className="font-semibold">{tx.token}</span>
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-bold text-gray-900">{tx.amount}</td>
                <td className="py-2 px-3">
                  <code className="text-xs text-gray-600">{tx.counterparty}</code>
                </td>
                <td className="py-2 px-3">
                  {tx.flag && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      tx.flag === 'Market-Moving' ? 'bg-gray-900 text-white' :
                      tx.flag === 'First Entry' ? 'bg-teal-100 text-teal-700' :
                      tx.flag === 'Cross-Entity' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {tx.flag}
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-right text-xs text-gray-500">{tx.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
};

const EntityAlertModal = ({ onClose, entityName }) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [threshold, setThreshold] = useState('0.15');

  const alertsByCategory = entityAlertTypes.reduce((acc, alert) => {
    const cat = alert.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(alert);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-bold text-gray-900">Create Entity Alert</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Monitor {entityName} activity — choose alert type based on what matters to you
        </p>

        {Object.entries(alertsByCategory).map(([category, alerts]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
                category === 'Structural' ? 'bg-gray-900' :
                category === 'Impact-based' ? 'bg-teal-500' :
                category === 'Cross-Entity' ? 'bg-purple-500' : 'bg-gray-500'
              }`}>
                {category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert.id)}
                    className={`p-3 border rounded-xl transition-colors cursor-pointer ${
                      selectedAlert === alert.id ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                        selectedAlert === alert.id ? 'bg-gray-900' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-3.5 h-3.5 ${selectedAlert === alert.id ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-semibold text-gray-900 text-xs">{alert.name}</h4>
                          {alert.isNew && <span className="px-1 py-0.5 bg-teal-500 text-white rounded text-[10px]">NEW</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{alert.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">Alerts work automatically</div>
          <button
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              selectedAlert
                ? 'bg-gray-900 text-white hover:bg-gray-800'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!selectedAlert}
          >
            Create Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EntityDetail() {
  const { entityId } = useParams();
  const [entity, setEntity] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isTracked, setIsTracked] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEntity() {
      setLoading(true);
      setError(null);
      
      try {
        // Load entity details from API
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entityId}`);
        if (!response.ok) throw new Error('Failed to load entity');
        
        const data = await response.json();
        if (!data.ok || !data.data?.entity) throw new Error('Entity not found');
        
        const apiEntity = data.data.entity;
        const apiAddresses = data.data.addresses || [];
        
        // Load flows data
        let flowsData = [];
        let flowsSummary = null;
        let flowsByToken = [];
        try {
          const flowsRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entityId}/flows?window=7d`);
          const flowsJson = await flowsRes.json();
          if (flowsJson.ok && flowsJson.data?.flows) {
            flowsData = flowsJson.data.flows.map(f => ({
              date: new Date(f.date).toLocaleDateString('en', { weekday: 'short' }),
              netflow: f.netFlow,
              inflow: f.inflow,
              outflow: f.outflow,
            }));
            flowsSummary = flowsJson.data.summary;
            // Store flows by token
            flowsByToken = flowsJson.data.byToken || [];
          }
        } catch (e) { console.log('Flows not available'); }
        
        // Load bridge data
        let bridgeData = [];
        try {
          const bridgeRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entityId}/bridges`);
          const bridgeJson = await bridgeRes.json();
          if (bridgeJson.ok && bridgeJson.data?.bridges) {
            bridgeData = bridgeJson.data.bridges;
          }
        } catch (e) { console.log('Bridge data not available'); }
        
        // Load recent transactions (P0: Real data instead of mock)
        let transactionsData = [];
        try {
          const txRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entityId}/transactions?limit=20`);
          const txJson = await txRes.json();
          if (txJson.ok && txJson.data?.transactions) {
            transactionsData = txJson.data.transactions.map(tx => ({
              type: tx.type,
              token: tx.token,
              logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/${tx.token === 'ETH' || tx.token === 'WETH' ? '1027' : tx.token === 'USDT' ? '825' : tx.token === 'USDC' ? '3408' : tx.token === 'WBTC' ? '1' : '1027'}.png`,
              amount: tx.amount,
              counterparty: `${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}`,
              time: tx.time,
              isMarketMoving: tx.isMarketMoving,
              isCrossEntity: tx.isBridge,
              isFirstEntry: false,
              flag: tx.isMarketMoving ? 'Market-Moving' : tx.isBridge ? 'Cross-Entity' : null,
            }));
          }
        } catch (e) { console.log('Transactions not available'); }
        
        // Load pattern bridge data (P1: Behavioral patterns)
        let patternBridgeData = { patterns: [], totalAddresses: 0 };
        try {
          const patternRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entityId}/pattern-bridge`);
          const patternJson = await patternRes.json();
          if (patternJson.ok && patternJson.data?.patterns) {
            patternBridgeData = {
              patterns: patternJson.data.patterns,
              totalAddresses: patternJson.data.totalAddresses,
            };
          }
        } catch (e) { console.log('Pattern bridge data not available'); }
        
        // Load holdings data
        let holdingsData = [];
        let holdingsTotal = 0;
        try {
          const holdingsRes = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/entities/${entityId}/holdings`);
          const holdingsJson = await holdingsRes.json();
          if (holdingsJson.ok && holdingsJson.data?.holdings) {
            // Filter out "No Data" entries and entries with no value
            holdingsData = holdingsJson.data.holdings
              .filter(h => h.token !== 'No Data' && parseFloat(h.balance) > 0)
              .slice(0, 6)
              .map(h => ({
                symbol: h.token.length > 8 ? h.token.slice(0, 6) + '...' : h.token,
                name: h.token,
                value: h.valueUSD || parseFloat(h.balance), // Use balance if no USD value
                percentage: h.percentage || 0,
                balance: h.balance,
                logo: `https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png`,
              }));
            holdingsTotal = holdingsJson.data.total || holdingsData.reduce((sum, h) => sum + h.value, 0);
          }
        } catch (e) { console.log('Holdings not available'); }
        
        // Calculate 24h net flow from summary
        const netFlow24h = flowsSummary?.netFlow || apiEntity.netFlow24h || 0;
        
        // Format entity for frontend
        const formattedEntity = {
          id: apiEntity.slug || entityId,
          name: apiEntity.name,
          type: apiEntity.category?.charAt(0).toUpperCase() + apiEntity.category?.slice(1) || 'Unknown',
          typeColor: 'bg-gray-100 text-gray-700',
          logo: apiEntity.logo,
          description: apiEntity.description,
          firstSeen: apiEntity.firstSeen ? new Date(apiEntity.firstSeen).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : 'Unknown',
          addressCount: apiEntity.addressesCount || apiAddresses.length,
          totalHoldings: holdingsTotal > 0 ? formatLargeUSD(holdingsTotal) : (apiEntity.totalHoldingsUSD ? formatLargeUSD(apiEntity.totalHoldingsUSD) : 'Calculating...'),
          holdingsChange: 0,
          netFlow24h: netFlow24h,
          netFlow24hFormatted: netFlow24h !== 0 ? formatLargeUSD(netFlow24h) : '$0',
          marketShare: 0,
          coverage: apiEntity.coverage || 0,
          status: apiEntity.status,
          tags: apiEntity.tags || [],
          addresses: apiAddresses,
          attribution: apiEntity.attribution,
          holdings: holdingsData.length > 0 ? holdingsData : getDefaultHoldings(),
          netflowData: flowsData.length > 0 ? flowsData : getDefaultNetflow(),
          flowsByToken: flowsByToken,
          bridgeData: bridgeData,
          transactions: transactionsData.length > 0 ? transactionsData : getDefaultTransactions(),
          patternBridge: patternBridgeData,
          dataSource: holdingsData.length > 0 || transactionsData.length > 0 ? 'live' : 'mock',
        };
        
        setEntity(formattedEntity);
      } catch (err) {
        console.error('Failed to load entity:', err);
        setError(err.message);
        // Fallback to mock
        setEntity(getMockEntity(entityId));
      } finally {
        setLoading(false);
      }
    }
    
    loadEntity();
  }, [entityId]);

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl font-semibold text-gray-600">Loading...</div>
    </div>
  );
  
  if (error && !entity) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-xl font-semibold text-red-600">{error}</div>
    </div>
  );

  const behaviorData = getEntityBehaviorSummary(entityId || 'binance');

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-white">
        <Header />

        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/entities" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-4 h-4" />
            Back to Entities
          </Link>
          <StatusBanner compact />
        </div>

        <div className="px-4 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <img src={entity.logo} alt={entity.name} className="w-16 h-16 rounded-2xl" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{entity.name}</h1>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${entity.typeColor}`}>
                  {entity.type.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600">{entity.description}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>First seen: {entity.firstSeen}</span>
                <span>•</span>
                <span>{entity.addressCount} addresses</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Holdings</div>
              <div className="text-2xl font-bold text-gray-900">{entity.totalHoldings}</div>
              <div className={`text-xs font-semibold ${entity.holdingsChange >= 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                {entity.holdingsChange >= 0 ? '+' : ''}{entity.holdingsChange}% (7d)
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Net Flow (24h)</div>
              <div className={`text-2xl font-bold ${entity.netFlow24h >= 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                {entity.netFlow24h >= 0 ? '+' : ''}{entity.netFlow24hFormatted}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Market Share</div>
              <div className="text-2xl font-bold text-gray-900">{entity.marketShare}%</div>
            </div>
          </div>
        </div>

        <div className="px-4">
          <EntityBehaviorSummary
            entity={entity}
            behaviorData={behaviorData}
            onTrack={() => setIsTracked(!isTracked)}
            onAlert={() => setShowAlertModal(true)}
            isTracked={isTracked}
          />
        </div>

        <div className="px-4">
          <CrossEntitySimilarity
            similarEntities={behaviorData.similarEntities}
            currentEntity={entity.name}
          />
        </div>

        <div className="px-4">
          <TokenFlowMatrix tokenFlows={behaviorData.tokenFlows} entityName={entity.name} />
        </div>

        <div className="px-4">
          <HistoricalStatistics historicalStats={behaviorData.historicalStats} entityName={entity.name} />
        </div>

        <div className="px-4">
          <BridgeFlows bridgeFlows={behaviorData.bridgeFlows} entityName={entity.name} />
        </div>

        {/* P1: Pattern Bridge - Behavioral Pattern Grouping */}
        <div className="px-4 pb-4">
          <PatternBridge 
            patterns={entity.patternBridge?.patterns || []}
            totalAddresses={entity.patternBridge?.totalAddresses || 0}
            loading={loading}
            entityName={entity.name}
          />
        </div>

        {/* Known Addresses - Attribution Layer */}
        <div className="px-4 pb-4">
          <KnownAddresses 
            subjectType="entity" 
            subjectId={entityId || 'binance'} 
          />
        </div>

        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">Core Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-[320px]"><HoldingsBreakdown holdings={entity.holdings} /></div>
            <div className="h-[320px]"><NetflowChart netflowData={entity.netflowData} /></div>
          </div>
        </div>
        
        {/* P0: Flows by Token + Bridge Activity */}
        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">
            Flow Analysis
            <span className="ml-2 text-xs font-normal text-gray-500">Real-time token breakdown</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <FlowsByToken flowsByToken={entity.flowsByToken} />
            <BridgeActivity bridgeData={entity.bridgeData} />
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-4"
          >
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
              <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600">FACT</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {showAdvancedAnalytics ? 'Hide' : 'Show'}
              {showAdvancedAnalytics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </button>

          {showAdvancedAnalytics && (
            <RecentTransactions transactions={entity.transactions} />
          )}
        </div>

        {showAlertModal && <EntityAlertModal onClose={() => setShowAlertModal(false)} entityName={entity.name} />}
      </div>
    </TooltipProvider>
  );
}
