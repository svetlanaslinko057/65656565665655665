// ==================== STRICT CONFIG ====================

export const NODE_FILL = '#F2F4F7';
export const TEXT_COLOR = '#111827';

// Rating → Border
export const getRatingBorder = (score) => {
  if (score >= 70) return '#16A34A';  // Единый тёмно-зелёный
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
};

// LINK COLORS - входящие тёмно-зелёный, исходящие красный
export const LINK_COLORS = {
  incoming: '#16A34A',  // тёмно-зелёный - входящие (followedBy)
  outgoing: '#DC2626',  // красный - исходящие (frontRuns)
  correlation: '#64748B',
};

// NODE SIZE - ФИКСИРОВАННЫЙ РАЗМЕР 30px визуально
export const NODE_RADIUS = 15;  // Фиксированный радиус (30px диаметр)
export const getNodeRadius = () => NODE_RADIUS;

// РАЗМЕР УЗЛА В ПИКСЕЛЯХ - базовый 30px
export const NODE_BASE_SIZE = 30;

// Шрифт масштабируется пропорционально узлу
export const FONT_SIZE_BASE = 10;

// КОРИДОР - пороги плотности
export const CORRIDOR_THRESHOLD = {
  minEdges: 5,      // Минимум связей для "коридора"
  clickable: 2,     // Минимум для кликабельности
};

// Zoom limits
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 4;

// ==================== NAME ABBREVIATION ====================
export const abbreviate = (name) => {
  if (!name) return '??';
  const map = {
    'a16z Crypto': 'a16z', 'a16z': 'a16z',
    'Alameda Research': 'ALM', 'Pantera Capital': 'PAN',
    'Jump Trading': 'JMP', 'DWF Labs': 'DWF',
    'Wintermute': 'WMT', 'Vitalik.eth': 'VIT', 'vitalik.eth': 'VIT',
    'Smart Whale #4721': 'SW',
  };
  if (map[name]) return map[name];
  if (name.startsWith('0x')) return name.slice(2, 4).toUpperCase();
  if (name.includes('.eth')) return name.split('.')[0].slice(0, 3).toUpperCase();
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
};

// ==================== UTILS ====================
export const normalize = (v, min, max) => max === min ? 0.5 : Math.max(0, Math.min(1, (v - min) / (max - min)));

export const calcScore = (actor, all) => {
  const maxF = Math.max(...all.map(a => a.followers_count));
  const maxL = Math.max(...all.map(a => a.avg_follower_lag || 24));
  return Math.round((normalize(actor.followers_count, 0, maxF) * 0.35 + (actor.avg_follower_lag > 0 ? 1 - normalize(actor.avg_follower_lag, 0, maxL) : 0) * 0.25 + actor.consistency * 0.25 + actor.market_impact * 0.15) * 100);
};

export const getRole = (a) => a.followers_count >= 3 ? 'Leader' : a.followedBy?.length >= 2 ? 'Follower' : 'Neutral';

export const hasDegree = (actor, all) => {
  if (actor.frontRuns?.length > 0 || actor.followedBy?.length > 0) return true;
  return all.some(o => {
    const frontRunIds = o.frontRuns?.map(f => typeof f === 'object' ? f.id : f) || [];
    const followedByIds = o.followedBy?.map(f => typeof f === 'object' ? f.id : f) || [];
    return frontRunIds.includes(actor.id) || followedByIds.includes(actor.id);
  });
};

export const getLinkId = (link) => typeof link === 'object' ? link.id : link;
export const getLinkCount = (link) => typeof link === 'object' ? (link.count || 1) : 1;

export const isConnectedTo = (nodeId, targetId, actors) => {
  if (nodeId === targetId) return true;
  const t = actors.find(a => a.id === targetId);
  if (!t) return false;
  const frontRunIds = t.frontRuns?.map(f => getLinkId(f)) || [];
  const followedByIds = t.followedBy?.map(f => getLinkId(f)) || [];
  return frontRunIds.includes(nodeId) || followedByIds.includes(nodeId) || t.correlations?.some(c => c.id === nodeId);
};
