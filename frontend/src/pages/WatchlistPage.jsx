/**
 * WatchlistPage - Backend Integrated (P1.2)
 * 
 * Features:
 * - Fetches watchlist from backend API
 * - Shows alertCount for each item
 * - Add/Remove items synced with backend
 * - Link to filtered AlertsPage
 * - Real-time resolver integration
 */
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Eye, Trash2, Bell, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Activity, Clock, 
  ChevronRight, Wallet, Users, Coins, X, 
  Loader2, RefreshCw, Search, ExternalLink
} from 'lucide-react';
import Header from '../components/Header';
import EmptyState from '../components/EmptyState';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { watchlistApi, resolverApi } from '../api';
import UnifiedCard, { StatusBadge, CardIcon } from '../components/UnifiedCard';
import ContextPath from '../components/ContextPath';

// Type icons and labels
const TYPE_CONFIG = {
  token: { icon: Coins, label: 'Token', color: 'text-purple-600 bg-purple-100' },
  wallet: { icon: Wallet, label: 'Wallet', color: 'text-blue-600 bg-blue-100' },
  actor: { icon: Users, label: 'Actor', color: 'text-amber-600 bg-amber-100' },
  entity: { icon: Users, label: 'Entity', color: 'text-emerald-600 bg-emerald-100' },
};

// Format address for display
function formatAddress(address) {
  if (!address) return '';
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Time ago helper
function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Add Item Modal
const AddItemModal = ({ isOpen, onClose, onAdd }) => {
  const [type, setType] = useState('token');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [resolvedData, setResolvedData] = useState(null);
  const [error, setError] = useState(null);

  // Resolve address on input
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (address.length >= 3) {
        setResolving(true);
        setError(null);
        try {
          const response = await resolverApi.resolve(address);
          if (response?.data) {
            setResolvedData(response.data);
          }
        } catch (e) {
          console.error('Resolve failed:', e);
        } finally {
          setResolving(false);
        }
      } else {
        setResolvedData(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [address]);

  const handleSubmit = async () => {
    if (!address && type !== 'token') return;
    
    setResolving(true);
    setError(null);
    
    try {
      const targetAddress = resolvedData?.normalizedId || address;
      
      const item = {
        type,
        target: {
          address: targetAddress,
          chain: resolvedData?.metadata?.chain || 'ethereum',
          symbol: resolvedData?.symbol || resolvedData?.label,
          name: resolvedData?.name,
        },
        note: note || undefined,
      };
      
      const response = await watchlistApi.addToWatchlist(item);
      
      if (response?.ok) {
        onAdd(response.data);
        setAddress('');
        setNote('');
        setResolvedData(null);
        onClose();
        toast.success('Added to watchlist');
      } else {
        setError(response?.error || 'Failed to add');
      }
    } catch (e) {
      console.error('Failed to add:', e);
      setError('Failed to add to watchlist');
    } finally {
      setResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Add to Watchlist</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).slice(0, 3).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setType(key)}
                    className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg border-2 transition-all ${
                      type === key 
                        ? 'border-gray-900 bg-gray-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid={`type-${key}-btn`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {type === 'token' ? 'Token Address or Symbol' : 'Address or ENS'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={type === 'token' ? '0x... or USDT' : '0x... or vitalik.eth'}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 pr-10"
                data-testid="watchlist-address-input"
              />
              {resolving && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
            {/* Resolved Preview */}
            {resolvedData && (
              <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {resolvedData.label || resolvedData.symbol || formatAddress(resolvedData.normalizedId)}
                  </span>
                  {resolvedData.confidence && (
                    <span className="text-xs text-emerald-600">
                      {Math.round(resolvedData.confidence * 100)}%
                    </span>
                  )}
                </div>
                {resolvedData.name && (
                  <div className="text-xs text-emerald-600 mt-1">{resolvedData.name}</div>
                )}
              </div>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              data-testid="watchlist-note-input"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!address || resolving}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            data-testid="add-watchlist-btn"
          >
            {resolving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add to Watchlist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Watchlist Item Card - Refactored using UnifiedCard
const WatchlistCard = ({ item, onRemove, onViewAlerts }) => {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.token;
  const Icon = config.icon;
  
  const displayName = item.target?.symbol || item.target?.name || formatAddress(item.target?.address);
  const hasAlerts = item.alertCount > 0;

  // Render subtitle (address + chain)
  const subtitle = (
    <div>
      <div className="text-xs text-gray-500 font-mono">
        {formatAddress(item.target?.address)}
      </div>
      {item.target?.chain && (
        <div className="text-xs text-gray-400">
          {item.target.chain}
        </div>
      )}
    </div>
  );

  // Render insight (note if exists)
  const insightNode = item.note ? (
    <div className="text-xs text-gray-500 italic">
      <span className="text-gray-400">Note: </span>
      &ldquo;{item.note}&rdquo;
    </div>
  ) : null;

  // Render meta (Added time + View alerts link)
  const metaInfo = (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <Clock className="w-3 h-3" />
        Added {timeAgo(item.createdAt)}
      </div>
      
      {hasAlerts && (
        <Link 
          to={`/alerts?target=${item.target?.address}`}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          View alerts
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );

  // Render actions
  const actions = [
    // Alert Badge Button
    <Tooltip key="alerts">
      <TooltipTrigger asChild>
        <button
          onClick={() => onViewAlerts(item)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
            hasAlerts 
              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          data-testid={`alerts-badge-${item._id}`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{item.alertCount || 0}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-xs">
          {hasAlerts ? `${item.alertCount} alert${item.alertCount > 1 ? 's' : ''} active` : 'No alerts'}
        </p>
      </TooltipContent>
    </Tooltip>,
    
    // View Button
    <Tooltip key="view">
      <TooltipTrigger asChild>
        <Link
          to={item.type === 'token' 
            ? `/tokens/${item.target?.address}` 
            : `/address/${item.target?.address}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          data-testid={`view-${item._id}`}
        >
          <ExternalLink className="w-4 h-4 text-gray-500" />
        </Link>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-xs">View details</p>
      </TooltipContent>
    </Tooltip>,
    
    // Delete Button
    <Tooltip key="delete">
      <TooltipTrigger asChild>
        <button
          onClick={() => onRemove(item)}
          className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
          data-testid={`delete-${item._id}`}
        >
          <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-900 text-white">
        <p className="text-xs">Remove from watchlist</p>
      </TooltipContent>
    </Tooltip>,
  ];

  return (
    <UnifiedCard
      testId={`watchlist-item-${item._id}`}
      icon={<CardIcon icon={Icon} className={config.color} />}
      header={{
        title: displayName,
        badge: <StatusBadge className={config.color}>
          {config.label}
        </StatusBadge>,
        subtitle: subtitle,
      }}
      insight={insightNode}
      meta={metaInfo}
      actions={actions}
    />
  );
};

// Main Page Component
export default function WatchlistPage() {
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, token, wallet, actor
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Load watchlist
  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const typeFilter = filter === 'all' ? undefined : filter;
      const response = await watchlistApi.getWatchlist(typeFilter);
      
      if (response?.ok) {
        setItems(response.data || []);
      } else {
        setError(response?.error || 'Failed to load watchlist');
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setError('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  // Add item
  const handleAddItem = (newItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  // Remove item
  const handleRemoveItem = async (item) => {
    if (!confirm(`Remove ${item.target?.symbol || formatAddress(item.target?.address)} from watchlist?`)) {
      return;
    }
    
    setDeleting(item._id);
    
    try {
      const response = await watchlistApi.removeFromWatchlist(item._id);
      
      if (response?.ok) {
        setItems(prev => prev.filter(i => i._id !== item._id));
        toast.success('Removed from watchlist');
      } else {
        toast.error(response?.error || 'Failed to remove');
      }
    } catch (err) {
      console.error('Failed to remove:', err);
      toast.error('Failed to remove');
    } finally {
      setDeleting(null);
    }
  };

  // View alerts for item
  const handleViewAlerts = (item) => {
    navigate(`/alerts?target=${item.target?.address}`);
  };

  // Filter items by search
  const filteredItems = items.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.target?.address?.toLowerCase().includes(query) ||
      item.target?.symbol?.toLowerCase().includes(query) ||
      item.target?.name?.toLowerCase().includes(query) ||
      item.note?.toLowerCase().includes(query)
    );
  });

  // Stats
  const stats = {
    total: items.length,
    tokens: items.filter(i => i.type === 'token').length,
    wallets: items.filter(i => i.type === 'wallet').length,
    withAlerts: items.filter(i => i.alertCount > 0).length,
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-5xl mx-auto px-4 py-6">
          {/* Context Path */}
          <ContextPath className="mb-4">
            <ContextPath.Item href="/market">Market</ContextPath.Item>
            <ContextPath.Item current>Watchlist</ContextPath.Item>
          </ContextPath>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Watchlist</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitoring overview
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-colors"
              data-testid="add-to-watchlist-btn"
            >
              <Plus className="w-4 h-4" />
              Track Activity
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Items</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.tokens}</div>
              <div className="text-xs text-gray-500">Tokens</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.wallets}</div>
              <div className="text-xs text-gray-500">Wallets</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.withAlerts}</div>
              <div className="text-xs text-gray-500">With Alerts</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-4 mb-6">
            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'token', label: 'Tokens' },
                { value: 'wallet', label: 'Wallets' },
                { value: 'actor', label: 'Actors' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === opt.value
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  data-testid={`filter-${opt.value}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search watchlist..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                data-testid="watchlist-search"
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadWatchlist}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="refresh-watchlist"
            >
              <RefreshCw className={`w-5 h-5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-600">{error}</p>
              <button
                onClick={loadWatchlist}
                className="mt-4 text-purple-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title={searchQuery ? "No matches found" : "Your watchlist is empty"}
              description={searchQuery 
                ? "Try a different search term" 
                : "Track tokens or wallets for on-chain activity and set alerts for important behavior."
              }
              action={!searchQuery ? {
                label: 'Track Activity',
                icon: Plus,
                onClick: () => setShowAddModal(true)
              } : null}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <WatchlistCard
                  key={item._id}
                  item={item}
                  onRemove={handleRemoveItem}
                  onViewAlerts={handleViewAlerts}
                />
              ))}
            </div>
          )}
        </main>

        {/* Add Modal */}
        <AddItemModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddItem}
        />
      </div>
    </TooltipProvider>
  );
}
