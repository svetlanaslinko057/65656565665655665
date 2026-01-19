/**
 * Actors Graph Page - WITH CORRIDOR MODAL
 * 
 * Sprint 2 Finalization:
 * - Click edge → Corridor Table Modal
 * - Resolver integration
 * - Memory-safe, no heavy dependencies
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, Users, Loader2, Info, ChevronDown, ChevronUp,
  X, ExternalLink, ArrowRight, ArrowLeftRight, CheckCircle, HelpCircle
} from 'lucide-react';
import Header from '../components/Header';

const nodeColors = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444',
};

const patternConfig = {
  accumulator: { label: 'Accumulator', bgColor: 'bg-emerald-100' },
  distributor: { label: 'Distributor', bgColor: 'bg-red-100' },
  unknown: { label: 'Unknown', bgColor: 'bg-gray-50' },
};

function formatUSD(value) {
  if (!value) return '$0';
  const abs = Math.abs(value);
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function calculatePositions(nodes, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { ...node, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  });
}

// Corridor Table Modal
function CorridorModal({ edge, nodes, onClose, onNavigate }) {
  const [corridorData, setCorridorData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const fromNode = nodes.find(n => n.id === edge?.from);
  const toNode = nodes.find(n => n.id === edge?.to);
  
  useEffect(() => {
    if (!edge) return;
    setLoading(true);
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/actors/graph/edge/${edge.from}/${edge.to}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok) setCorridorData(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [edge]);
  
  if (!edge) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900">{fromNode?.label || edge.from}</span>
            <ArrowLeftRight className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-gray-900">{toNode?.label || edge.to}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : corridorData ? (
            <>
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-xs text-gray-500">{fromNode?.label} → {toNode?.label}</div>
                  <div className="text-lg font-bold text-emerald-700">
                    {formatUSD(corridorData.summary?.volumeFromTo || 0)}
                  </div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xs text-gray-500">{toNode?.label} → {fromNode?.label}</div>
                  <div className="text-lg font-bold text-red-700">
                    {formatUSD(corridorData.summary?.volumeToFrom || 0)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Transactions</div>
                  <div className="text-lg font-bold text-gray-900">
                    {corridorData.summary?.totalTx || 0}
                  </div>
                </div>
              </div>
              
              {/* Recent Transactions with Token Symbols */}
              {corridorData.transactions && corridorData.transactions.length > 0 && (
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-2">Recent Transfers</div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {corridorData.transactions.slice(0, 5).map((tx, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            tx.direction === 'from→to' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {tx.direction}
                          </span>
                          <span className="flex items-center gap-1 font-medium">
                            {tx.tokenSymbol || 'UNKNOWN'}
                            {tx.tokenVerified && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                            {!tx.tokenVerified && tx.tokenSymbol === 'UNKNOWN' && <HelpCircle className="w-3 h-3 text-gray-400" />}
                          </span>
                        </div>
                        <span className="text-gray-600">{formatUSD(tx.amount || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty state */}
              {(corridorData.summary?.totalTx || 0) === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <ArrowLeftRight className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No significant flows in selected window</p>
                </div>
              )}
              
              {/* Interpretation */}
              <p className="text-xs text-gray-500 italic mb-4">
                {corridorData.interpretation?.description || 'Aggregated flow data between actors'}
              </p>
              
              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigate(`/actors/${edge.from}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  View {fromNode?.label}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigate(`/actors/${edge.to}`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                >
                  View {toNode?.label}
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">Failed to load corridor data</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ranking Panel
function RankingPanel({ nodes, onNodeClick, selectedNode }) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-gray-700" />
          <span className="font-semibold text-gray-900">Network Ranking</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-gray-500 mb-3">Ranking by network position (structural)</p>
          {nodes.slice(0, 10).map((node, i) => (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all ${
                selectedNode?.id === node.id ? 'bg-gray-900 text-white' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  selectedNode?.id === node.id ? 'bg-white/20' : 'bg-gray-200'
                }`}>{i + 1}</span>
                <span className="font-medium text-sm">{node.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColors[node.ui?.color] || '#9ca3af' }} />
                <span className={`text-sm font-semibold ${selectedNode?.id === node.id ? 'text-white' : 'text-gray-700'}`}>
                  {node.metrics?.centralityScore || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Node Details Panel
function NodeDetails({ node, onClose, onNavigate }) {
  if (!node) return null;
  const pattern = patternConfig[node.dominantPattern] || patternConfig.unknown;
  return (
    <div className="bg-white/95 backdrop-blur rounded-xl border border-gray-200 shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">{node.label}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Centrality Score</span>
          <span className="font-bold text-xl">{node.metrics?.centralityScore || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Pattern</span>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${pattern.bgColor}`}>{pattern.label}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Total Flow</span>
          <span className="font-semibold">{formatUSD(node.metrics?.totalFlowUsd)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Connections</span>
          <span className="font-semibold">{(node.metrics?.inDegree || 0) + (node.metrics?.outDegree || 0)}</span>
        </div>
        <button
          onClick={() => onNavigate(`/actors/${node.id}`)}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          <ExternalLink className="w-4 h-4" />View Actor Profile
        </button>
      </div>
    </div>
  );
}

// Graph SVG
function SimpleGraph({ nodes, edges, onNodeClick, onEdgeClick, selectedNode, selectedEdge }) {
  const width = 700, height = 500;
  const positionedNodes = calculatePositions(nodes, width, height);
  const nodeMap = new Map(positionedNodes.map(n => [n.id, n]));
  
  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      <svg width={width} height={height} className="w-full h-auto">
        <g>
          {edges.map(edge => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;
            const color = edge.ui?.color === 'green' ? '#10b981' : edge.ui?.color === 'red' ? '#ef4444' : '#9ca3af';
            const isSelected = selectedEdge?.id === edge.id;
            return (
              <line
                key={edge.id}
                x1={fromNode.x} y1={fromNode.y} x2={toNode.x} y2={toNode.y}
                stroke={isSelected ? '#1f2937' : color}
                strokeWidth={isSelected ? (edge.ui?.width || 2) + 2 : edge.ui?.width || 1}
                strokeOpacity={isSelected ? 1 : 0.5}
                style={{ cursor: 'pointer' }}
                onClick={() => onEdgeClick(edge)}
              />
            );
          })}
        </g>
        <g>
          {positionedNodes.map(node => {
            const isSelected = selectedNode?.id === node.id;
            const color = nodeColors[node.ui?.color] || '#9ca3af';
            const size = node.ui?.size || 30;
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`} onClick={() => onNodeClick(node)} style={{ cursor: 'pointer' }}>
                <circle r={size / 2} fill={color} stroke={isSelected ? '#1f2937' : '#fff'} strokeWidth={isSelected ? 3 : 2} opacity={0.9} />
                <text textAnchor="middle" dy="0.35em" fontSize={Math.max(10, size / 4)} fontWeight="bold" fill="#fff">
                  {node.metrics?.centralityScore || 0}
                </text>
                <text textAnchor="middle" dy={size / 2 + 14} fontSize="11" fontWeight="600" fill="#374151">
                  {node.label?.length > 10 ? node.label.slice(0, 8) + '...' : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 border border-gray-200">
        <div className="text-xs font-semibold text-gray-700 mb-2">Click edge to see corridor</div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span>Net Inflow</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /><span>Balanced</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Net Outflow</span></div>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function ActorsGraphPage() {
  const navigate = useNavigate();
  const [graphData, setGraphData] = useState({ nodes: [], edges: [], metadata: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [window, setWindow] = useState('7d');
  
  const loadGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/actors/graph?window=${window}`);
      const data = await res.json();
      if (data.ok) setGraphData({ nodes: data.data.nodes || [], edges: data.data.edges || [], metadata: data.data.metadata, interpretation: data.data.interpretation });
      else setError(data.error || 'Failed to load graph');
    } catch (err) { setError('Failed to load graph data'); }
    setLoading(false);
  }, [window]);
  
  useEffect(() => { loadGraph(); }, [loadGraph]);
  
  const handleNodeClick = (node) => setSelectedNode(selectedNode?.id === node.id ? null : node);
  const handleEdgeClick = (edge) => { setSelectedEdge(edge); setSelectedNode(null); };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Network className="w-8 h-8 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">Actors Graph</h1>
            <span className="px-2 py-1 bg-indigo-100 rounded text-xs font-semibold text-indigo-700">STRUCTURAL</span>
          </div>
          <p className="text-gray-500">Click nodes to see details, click edges to see corridor flows. <span className="font-medium text-gray-700">Not predictive.</span></p>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <span className="text-sm text-gray-500">Time Window:</span>
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
            {['24h', '7d', '30d'].map(w => (
              <button key={w} onClick={() => setWindow(w)} className={`px-3 py-1.5 rounded-md text-xs font-semibold ${window === w ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{w}</button>
            ))}
          </div>
          {graphData.metadata && <span className="text-xs text-gray-400 ml-auto">{graphData.metadata.totalNodes} actors • {graphData.metadata.totalEdges} relationships</span>}
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : error ? (
          <div className="text-center py-32"><div className="text-red-500 mb-2">{error}</div><button onClick={loadGraph} className="text-gray-600 underline">Retry</button></div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3 space-y-4">
              <RankingPanel nodes={graphData.nodes} onNodeClick={handleNodeClick} selectedNode={selectedNode} />
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <p className="font-semibold mb-1">Structure, not signals</p>
                    <p>Colors = flow direction. Click edge for corridor details.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-6">
              <SimpleGraph nodes={graphData.nodes} edges={graphData.edges} onNodeClick={handleNodeClick} onEdgeClick={handleEdgeClick} selectedNode={selectedNode} selectedEdge={selectedEdge} />
              {graphData.interpretation && (
                <div className="mt-4 bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900">{graphData.interpretation.headline}</p>
                  <p className="text-xs text-gray-500 mt-1">{graphData.interpretation.description}</p>
                </div>
              )}
            </div>
            <div className="col-span-3">
              {selectedNode ? (
                <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} onNavigate={navigate} />
              ) : (
                <div className="bg-white/80 border border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Click on a node to see details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Corridor Modal */}
      {selectedEdge && (
        <CorridorModal edge={selectedEdge} nodes={graphData.nodes} onClose={() => setSelectedEdge(null)} onNavigate={(path) => { setSelectedEdge(null); navigate(path); }} />
      )}
    </div>
  );
}
