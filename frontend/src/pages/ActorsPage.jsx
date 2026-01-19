/**
 * Actors Page - LIVE DATA
 * 
 * Displays actor cards with real aggregated data from backend.
 * Philosophy: Observed structure, not predictions.
 * 
 * Removed: WinRate, PnL, Latency (not fact-based)
 * Added: Participation, Flow Volume, Net Position
 */
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, Filter, Users, ArrowUpDown, Eye, Search,
  Building2, Wallet, TrendingUp, Activity, Loader2,
  Info, ChevronDown, ExternalLink
} from 'lucide-react';
import Header from '../components/Header';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";

// Type badge colors
const typeBadgeColors = {
  'Exchange': 'bg-blue-100 text-blue-700',
  'Fund': 'bg-purple-100 text-purple-700',
  'Market Maker': 'bg-amber-100 text-amber-700',
  'Whale': 'bg-emerald-100 text-emerald-700',
  'Trader': 'bg-cyan-100 text-cyan-700',
  'Accumulator': 'bg-green-100 text-green-700',
  'Distributor': 'bg-red-100 text-red-700',
  'Unknown': 'bg-gray-100 text-gray-700',
};

// Score color
function getScoreColor(score) {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50';
  if (score >= 40) return 'text-amber-600 bg-amber-50';
  return 'text-gray-600 bg-gray-50';
}

// Actor Card Component
function ActorCard({ actor, isFollowed, onToggleFollow }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {actor.logo ? (
            <img src={actor.logo} alt={actor.name} className="w-10 h-10 rounded-lg" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>
          )}
          <div>
            <Link 
              to={`/entity/${actor.slug}`}
              className="font-semibold text-gray-900 hover:text-gray-600 transition-colors"
            >
              {actor.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadgeColors[actor.actorType] || typeBadgeColors.Unknown}`}>
                {actor.actorType}
              </span>
              {actor.badges?.includes('Confirmed') && (
                <Tooltip>
                  <TooltipTrigger>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                      Confirmed
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Evidence-backed attribution</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        
        {/* Score */}
        <Tooltip>
          <TooltipTrigger>
            <div className={`px-2.5 py-1.5 rounded-lg font-bold text-lg ${getScoreColor(actor.edgeScore)}`}>
              {actor.edgeScore}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs max-w-48">
              Edge Score reflects network influence & data coverage, not performance
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      {/* Wallet Count */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <Wallet className="w-4 h-4" />
        <span>{actor.walletCount} wallets</span>
      </div>
      
      {/* Tags */}
      {actor.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {actor.tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Highlights (Fact-based metrics) */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
        {actor.highlights?.map((h, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="text-xs text-gray-500 mb-0.5">{h.label}</div>
                <div className="text-sm font-semibold text-gray-900">{h.value}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">{h.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={() => onToggleFollow(actor.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isFollowed 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFollowed ? 'fill-current' : ''}`} />
          {isFollowed ? 'Following' : 'Follow'}
        </button>
        
        <Link
          to={`/entity/${actor.slug}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          View Profile
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// Main Page
export default function ActorsPage() {
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('edgeScore');
  const [filterType, setFilterType] = useState('all');
  const [followedActors, setFollowedActors] = useState(['binance', 'a16z']);
  const [followedOnly, setFollowedOnly] = useState(false);
  
  const loadActors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: sortBy });
      if (searchQuery) params.set('q', searchQuery);
      if (filterType !== 'all') params.set('type', filterType);
      
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/actors-list/?${params}`);
      const data = await res.json();
      
      if (data.ok) {
        setActors(data.data.actors || []);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load actors');
    }
    setLoading(false);
  }, [sortBy, searchQuery, filterType]);
  
  useEffect(() => {
    loadActors();
  }, [loadActors]);
  
  const toggleFollow = (actorId) => {
    setFollowedActors(prev => 
      prev.includes(actorId) 
        ? prev.filter(id => id !== actorId)
        : [...prev, actorId]
    );
  };
  
  // Filter by followed
  const displayedActors = followedOnly 
    ? actors.filter(a => followedActors.includes(a.id))
    : actors;
  
  const actorTypes = ['all', 'Exchange', 'Fund', 'Whale', 'Trader', 'Market Maker'];
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-gray-700" />
              <h1 className="text-2xl font-bold text-gray-900">Actors</h1>
              <span className="px-2 py-1 bg-indigo-100 rounded text-xs font-semibold text-indigo-700">
                LIVE DATA
              </span>
            </div>
            <p className="text-gray-500">
              Aggregated actor profiles with observed network activity.
              <span className="font-medium text-gray-700"> Scores reflect structure, not predictions.</span>
            </p>
          </div>
          
          {/* Filters Row */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actors, types, tags..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-gray-200">
              {actorTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterType === type 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
            
            {/* Quick Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFollowedOnly(!followedOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  followedOnly 
                    ? 'bg-amber-100 text-amber-700 border-amber-200' 
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                <Star className={`w-3.5 h-3.5 inline mr-1 ${followedOnly ? 'fill-current' : ''}`} />
                Followed
              </button>
            </div>
            
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium"
              >
                <option value="edgeScore">Edge Score</option>
                <option value="walletCount">Wallet Count</option>
                <option value="activity">Activity</option>
              </select>
            </div>
          </div>
          
          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-xs text-amber-800">
                <p className="font-semibold mb-1">Observed structure, not predictions</p>
                <p>Actor scores reflect network position and data coverage. Highlights show fact-based metrics (Participation, Flow, Position), not performance predictions like WinRate or PnL.</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-red-500 mb-2">{error}</p>
              <button onClick={loadActors} className="text-gray-600 hover:text-gray-800 underline">
                Retry
              </button>
            </div>
          ) : displayedActors.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">No actors found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedActors.map(actor => (
                <ActorCard 
                  key={actor.id}
                  actor={actor}
                  isFollowed={followedActors.includes(actor.id)}
                  onToggleFollow={toggleFollow}
                />
              ))}
            </div>
          )}
          
          {/* Stats */}
          {!loading && displayedActors.length > 0 && (
            <div className="mt-6 text-center text-xs text-gray-400">
              Showing {displayedActors.length} actors
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
