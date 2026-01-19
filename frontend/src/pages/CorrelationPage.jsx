import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import Header from '../components/Header';
import { Network, Target, X } from 'lucide-react';
import { TooltipProvider } from '../components/ui/tooltip';

// Import refactored components
import {
  ModeSelector,
  GraphControls,
  Leaderboard,
  ActorPanel,
  StrategyFlow,
  LinkTooltip,
  FlowTable,
  actorsData,
  NODE_FILL,
  TEXT_COLOR,
  NODE_RADIUS,
  FONT_SIZE_BASE,
  LINK_COLORS,
  CORRIDOR_THRESHOLD,
  ZOOM_MIN,
  ZOOM_MAX,
  getRatingBorder,
  abbreviate,
  calcScore,
  getRole,
  hasDegree,
  getLinkId,
  getLinkCount,
  isConnectedTo,
} from '../components/correlation';

// ==================== LEGEND COMPONENT ====================
const GraphLegend = ({ actorsCount }) => (
  <div className="flex items-center gap-3 mb-2 px-2 py-1.5 bg-white rounded-lg border border-gray-200 text-[10px] text-gray-500">
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full border-2" style={{ borderColor: '#16A34A' }}></span>70+
    </span>
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full border-2" style={{ borderColor: '#F59E0B' }}></span>40-69
    </span>
    <span className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full border-2" style={{ borderColor: '#EF4444' }}></span>&lt;40
    </span>
    <span className="text-gray-300">|</span>
    <span className="flex items-center gap-1">
      <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: LINK_COLORS.incoming }}></span>Входящие
    </span>
    <span className="flex items-center gap-1">
      <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: LINK_COLORS.outgoing }}></span>Исходящие
    </span>
    <span className="text-gray-300">|</span>
    <span className="flex items-center gap-1 text-amber-600">Click corridor = open table</span>
    <span className="ml-auto text-gray-400">{actorsCount} actors</span>
  </div>
);

// ==================== FOCUS BADGE COMPONENT ====================
const FocusBadge = ({ actor, onClear }) => {
  if (!actor) return null;
  return (
    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-lg">
      <Target className="w-3 h-3" />
      {abbreviate(actor.real_name)}
      <button onClick={onClear} className="hover:bg-gray-700 rounded p-0.5" data-testid="focus-badge-clear">
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

// ==================== GRAPH HINT COMPONENT ====================
const GraphHint = () => (
  <div className="absolute bottom-2 left-2 text-[9px] text-gray-400 bg-white/90 px-1.5 py-0.5 rounded border border-gray-100">
    Drag nodes • Scroll zoom • Click lines for flow table
  </div>
);

// ==================== CUSTOM HOOKS ====================
const usePreventBrowserZoom = (containerRef) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const preventBrowserZoom = (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    const preventGestureZoom = (e) => e.preventDefault();
    
    container.addEventListener('wheel', preventBrowserZoom, { passive: false });
    container.addEventListener('gesturestart', preventGestureZoom);
    container.addEventListener('gesturechange', preventGestureZoom);
    container.addEventListener('gestureend', preventGestureZoom);
    
    return () => {
      container.removeEventListener('wheel', preventBrowserZoom);
      container.removeEventListener('gesturestart', preventGestureZoom);
      container.removeEventListener('gesturechange', preventGestureZoom);
      container.removeEventListener('gestureend', preventGestureZoom);
    };
  }, [containerRef]);
};

const useGraphData = (connected, mode, focusId) => {
  return useMemo(() => {
    const nodes = connected.map(a => ({
      id: a.id,
      label: abbreviate(a.real_name),
      score: a.influenceScore,
      radius: NODE_RADIUS,
      ratingColor: getRatingBorder(a.influenceScore),
      role: a.role,
      isFocused: focusId === a.id,
      ...a,
    }));
    
    const links = [];
    const ids = new Set(nodes.map(n => n.id));
    
    if (mode !== 'clusters') {
      connected.forEach(a => {
        a.frontRuns?.forEach(link => {
          const targetId = getLinkId(link);
          const count = getLinkCount(link);
          if (ids.has(targetId)) {
            links.push({ 
              source: a.id, 
              target: targetId, 
              type: 'outgoing', 
              color: LINK_COLORS.outgoing,
              count
            });
          }
        });
        a.followedBy?.forEach(link => {
          const sourceId = getLinkId(link);
          const count = getLinkCount(link);
          if (ids.has(sourceId)) {
            links.push({ 
              source: sourceId, 
              target: a.id, 
              type: 'incoming', 
              color: LINK_COLORS.incoming,
              count
            });
          }
        });
      });
    } else {
      const added = new Set();
      connected.forEach(a => a.correlations?.forEach(c => {
        if (ids.has(c.id) && c.strength > 0.3) {
          const k = [a.id, c.id].sort().join('-');
          if (!added.has(k)) { 
            added.add(k); 
            links.push({ 
              source: a.id, 
              target: c.id, 
              type: 'correlation', 
              color: LINK_COLORS.correlation,
              count: Math.ceil(c.strength * 10)
            }); 
          }
        }
      }));
    }
    
    return { nodes, links };
  }, [connected, mode, focusId]);
};

// ==================== MAIN COMPONENT ====================
export default function CorrelationPage() {
  // State
  const [mode, setMode] = useState('influence');
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [flowOpen, setFlowOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [hoveredRowRel, setHoveredRowRel] = useState(null);
  const [tooltipPos, setTooltipPos] = useState(null);
  
  // Refs
  const graphRef = useRef();
  const containerRef = useRef();
  const initialLayoutDone = useRef(false);
  
  // Prevent browser zoom
  usePreventBrowserZoom(containerRef);
  
  // Process actors data
  const actors = useMemo(() => 
    actorsData.map(a => ({ ...a, influenceScore: calcScore(a, actorsData), role: getRole(a) })), 
  []);
  const connected = useMemo(() => actors.filter(a => hasDegree(a, actors)), [actors]);
  
  // Graph data
  const graphData = useGraphData(connected, mode, focusId);
  
  // Initial layout effect
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0 && !initialLayoutDone.current) {
      const fg = graphRef.current;
      
      fg.d3Force('charge').strength(-200);
      fg.d3Force('link').distance(120).strength(0.4);
      fg.d3Force('center').strength(0.3);
      
      setTimeout(() => {
        fg.pauseAnimation();
        graphData.nodes.forEach(n => {
          n.fx = n.x;
          n.fy = n.y;
        });
        fg.zoomToFit(200, 60);
        setTimeout(() => {
          const currentZoom = fg.zoom();
          if (currentZoom > 1.5) fg.zoom(1.2, 100);
          else if (currentZoom < 0.5) fg.zoom(0.8, 100);
        }, 250);
        fg.resumeAnimation();
        initialLayoutDone.current = true;
      }, 600);
    }
  }, [graphData.nodes.length, graphData.nodes]);
  
  // Handlers
  const handleClick = useCallback((node) => setSelected(actors.find(a => a.id === node.id)), [actors]);
  
  const handleDragStart = useCallback(() => {
    if (graphRef.current) graphRef.current.pauseAnimation();
  }, []);
  
  const handleDrag = useCallback((node) => {
    node.fx = node.x;
    node.fy = node.y;
  }, []);
  
  const handleDragEnd = useCallback((node) => {
    node.fx = node.x;
    node.fy = node.y;
    if (graphRef.current) graphRef.current.resumeAnimation();
  }, []);
  
  const handleLinkClick = useCallback((link) => {
    if (link && (link.count || 1) >= CORRIDOR_THRESHOLD.clickable) {
      setSelectedEdge(link);
    }
  }, []);
  
  const handleLinkHover = useCallback((link, event) => {
    setHoveredEdge(link);
    if (link && event) {
      setTooltipPos({ x: event.clientX, y: event.clientY });
    } else {
      setTooltipPos(null);
    }
  }, []);
  
  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const z = graphRef.current.zoom();
      if (z < ZOOM_MAX) graphRef.current.zoom(Math.min(z * 1.25, ZOOM_MAX), 200);
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const z = graphRef.current.zoom();
      if (z > ZOOM_MIN) graphRef.current.zoom(Math.max(z * 0.8, ZOOM_MIN), 200);
    }
  }, []);
  
  const handleReset = useCallback(() => {
    initialLayoutDone.current = false;
    graphData.nodes.forEach(n => {
      n.fx = undefined;
      n.fy = undefined;
    });
    if (graphRef.current) {
      graphRef.current.d3ReheatSimulation();
      setTimeout(() => {
        graphRef.current.pauseAnimation();
        graphData.nodes.forEach(n => {
          n.fx = n.x;
          n.fy = n.y;
        });
        graphRef.current.zoomToFit(200, 40);
        graphRef.current.resumeAnimation();
        initialLayoutDone.current = true;
      }, 600);
    }
    setSelected(null);
    setFocusId(null);
    setSelectedEdge(null);
  }, [graphData.nodes]);
  
  const handleFullscreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  }, []);
  
  // Node renderer
  const renderNode = useCallback((node, ctx) => {
    const x = node.x, y = node.y;
    const isSelected = selected?.id === node.id;
    const isHovered = hovered?.id === node.id;
    
    const isHighlightedFromTable = hoveredRowRel && 
      (hoveredRowRel.fromId === node.id || hoveredRowRel.toId === node.id);
    
    const dimmed = focusId && !node.isFocused && !isConnectedTo(node.id, focusId, connected);
    ctx.globalAlpha = dimmed ? 0.25 : 1;
    
    const r = NODE_RADIUS;
    
    ctx.shadowColor = 'rgba(0,0,0,0.06)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;
    
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = isHighlightedFromTable ? '#E0F2FE' : NODE_FILL;
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.strokeStyle = node.ratingColor;
    ctx.lineWidth = isHighlightedFromTable ? 2.5 : 1.5;
    ctx.stroke();
    
    if (isSelected || isHovered || isHighlightedFromTable) {
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, 2 * Math.PI);
      ctx.strokeStyle = isSelected ? '#111827' : isHighlightedFromTable ? '#0EA5E9' : '#9CA3AF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    
    const fontSize = FONT_SIZE_BASE;
    const abbr = node.label || '';
    
    ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(abbr, x, y - 1.5);
    
    ctx.font = `500 ${fontSize * 0.7}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = node.ratingColor;
    ctx.fillText(node.score, x, y + fontSize * 0.7);
    
    ctx.globalAlpha = 1;
  }, [selected, hovered, focusId, connected, hoveredRowRel]);
  
  // Link renderer
  const renderLink = useCallback((link, ctx) => {
    if (!link.source.x || !link.target.x) return;
    
    const sx = link.source.x, sy = link.source.y;
    const tx = link.target.x, ty = link.target.y;
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const isActive = selected?.id === sourceId || selected?.id === targetId;
    const dimmed = focusId && sourceId !== focusId && targetId !== focusId;
    const isSelectedEdge = selectedEdge && 
      ((typeof selectedEdge.source === 'object' ? selectedEdge.source.id : selectedEdge.source) === sourceId) &&
      ((typeof selectedEdge.target === 'object' ? selectedEdge.target.id : selectedEdge.target) === targetId);
    const isHoveredEdge = hoveredEdge === link;
    
    const isHighlightedFromTable = hoveredRowRel && 
      ((hoveredRowRel.fromId === sourceId && hoveredRowRel.toId === targetId) ||
       (hoveredRowRel.fromId === targetId && hoveredRowRel.toId === sourceId));
    
    ctx.globalAlpha = dimmed ? 0.12 : (isSelectedEdge || isHighlightedFromTable ? 1 : isActive ? 0.85 : isHoveredEdge ? 0.9 : 0.6);
    
    const dx = tx - sx;
    const dy = ty - sy;
    const angle = Math.atan2(dy, dx);
    const perpAngle = angle + Math.PI / 2;
    
    const n = Math.min(link.count || 1, 20);
    const MAX_WIDTH = 7;
    const step = n === 1 ? 0 : MAX_WIDTH / (n - 1);
    
    const lineWidth = isSelectedEdge || isHighlightedFromTable ? 1.2 : isHoveredEdge ? 1.0 : 0.7;
    const color = isHighlightedFromTable ? '#0EA5E9' : link.color;
    
    for (let i = 0; i < n; i++) {
      const offset = n === 1 ? 0 : -MAX_WIDTH / 2 + i * step;
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const cpx = mx + Math.cos(perpAngle) * offset * 3;
      const cpy = my + Math.sin(perpAngle) * offset * 3;
      
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpx, cpy, tx, ty);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }, [selected, focusId, selectedEdge, hoveredEdge, hoveredRowRel]);
  
  const focusedActor = focusId ? actors.find(a => a.id === focusId) : null;
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50" data-testid="correlation-page">
        <Header />
        
        <main className="max-w-[1600px] mx-auto px-4 py-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Network className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900">Influence Graph</h1>
                <p className="text-[10px] text-gray-500">Drag nodes • Click corridors for details</p>
              </div>
            </div>
            
            <select
              value={focusId || ''}
              onChange={(e) => setFocusId(e.target.value || null)}
              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-xs font-medium"
              data-testid="focus-selector"
            >
              <option value="">All</option>
              {actors.filter(a => a.role === 'Leader').map(a => (
                <option key={a.id} value={a.id}>{abbreviate(a.real_name)} ({a.influenceScore})</option>
              ))}
            </select>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between mb-2">
            <ModeSelector mode={mode} setMode={setMode} />
          </div>
          
          {/* Legend */}
          <GraphLegend actorsCount={connected.length} />
          
          {/* Horizontal Panels */}
          <div className={`grid gap-3 mb-3 ${selectedEdge ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <ActorPanel 
              actor={selected} 
              onClose={() => setSelected(null)} 
              onSelectEdge={setSelectedEdge}
              graphLinks={graphData.links}
            />
            <Leaderboard
              actors={actors}
              onSelect={setSelected}
              selectedId={selected?.id}
              focusId={focusId}
              setFocusId={setFocusId}
            />
            <StrategyFlow expanded={flowOpen} toggle={() => setFlowOpen(!flowOpen)} />
            {selectedEdge && (
              <FlowTable 
                edge={selectedEdge} 
                onClose={() => setSelectedEdge(null)} 
                actors={actors}
                onHoverRow={setHoveredRowRel}
                hoveredRowId={hoveredRowRel?.id}
              />
            )}
          </div>
          
          {/* Graph */}
          <div
            ref={containerRef}
            className={`w-full bg-white rounded-xl border border-gray-200 overflow-hidden relative ${
              isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
            }`}
            style={{ height: isFullscreen ? '100vh' : '550px' }}
            data-testid="graph-container"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 0.5px, transparent 0.5px)',
                backgroundSize: '14px 14px',
                opacity: 0.35
              }}
            />
            
            <GraphControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onReset={handleReset}
              onFullscreen={handleFullscreen}
            />
            
            {/* Link Tooltip */}
            {hoveredEdge && tooltipPos && (
              <LinkTooltip link={hoveredEdge} actors={actors} position={tooltipPos} />
            )}
            
            {graphData.nodes.length > 0 && (
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                nodeCanvasObject={renderNode}
                linkCanvasObject={renderLink}
                linkWidth={link => Math.max((link.count || 1) * 2, 8)}
                linkCurvature={0}
                nodeRelSize={NODE_RADIUS}
                nodeVal={() => 1}
                onNodeClick={handleClick}
                onNodeHover={setHovered}
                onNodeDragStart={handleDragStart}
                onNodeDrag={handleDrag}
                onNodeDragEnd={handleDragEnd}
                onLinkClick={handleLinkClick}
                onLinkHover={handleLinkHover}
                linkHoverPrecision={8}
                onBackgroundClick={() => setSelected(null)}
                enableNodeDrag={true}
                enablePanInteraction={true}
                enableZoomInteraction={true}
                minZoom={ZOOM_MIN}
                maxZoom={ZOOM_MAX}
                linkDirectionalParticles={0}
                backgroundColor="transparent"
                width={isFullscreen ? window.innerWidth : 1200}
                height={isFullscreen ? window.innerHeight : 550}
                cooldownTime={50}
                warmupTicks={20}
                d3AlphaDecay={0.4}
                d3VelocityDecay={0.4}
              />
            )}
            
            <FocusBadge actor={focusedActor} onClear={() => setFocusId(null)} />
            <GraphHint />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
