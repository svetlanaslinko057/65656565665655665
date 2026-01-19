import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, Coins, Wallet, Building, Bell, Zap, 
  Search, Menu, X, Eye, Users
} from 'lucide-react';
import { useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import UniversalSearch from './UniversalSearch';
import GlobalIndexingStatus from './GlobalIndexingStatus';
import NotificationBell from './NotificationBell';

import { Brain } from 'lucide-react';

// Main navigation items (centered)
const navItems = [
  { path: '/', label: 'Market', icon: BarChart3 },
  { path: '/tokens', label: 'Tokens', icon: Coins },
  { path: '/wallets', label: 'Wallets', icon: Wallet },
  { path: '/entities', label: 'Entities', icon: Building },
  { path: '/actors', label: 'Actors', icon: Users },
  { path: '/signals', label: 'Signals', icon: Zap },
  { path: '/engine', label: 'Engine', icon: Brain },
];

export default function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 px-4 py-4 backdrop-blur-xl bg-gradient-to-br from-white/80 via-blue-50/60 to-purple-50/60">
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg shadow-gray-200/50 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0">
              <img 
                src="/assets/logo.png" 
                alt="FOMO" 
                className="h-10 w-auto"
              />
            </Link>

            {/* Centered Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2 bg-gray-50/80 rounded-full p-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200
                      ${active 
                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
                        : 'text-gray-600 hover:bg-white/80 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section - Icons + Connect */}
            <div className="flex items-center gap-3">
              {/* Global Indexing Status (P2.3.B) */}
              <GlobalIndexingStatus />

              {/* Universal Search */}
              {searchOpen ? (
                <UniversalSearch 
                  onClose={() => setSearchOpen(false)}
                  autoFocus={true}
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setSearchOpen(true)}
                      className="p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                      data-testid="header-search-btn"
                    >
                      <Search className="w-5 h-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white">
                    <p className="text-xs">Search (address, ENS, symbol)</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Watchlist Icon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link 
                    to="/watchlist"
                    className={`p-2.5 rounded-full transition-colors ${
                      isActive('/watchlist') 
                        ? 'text-gray-900 bg-gray-100' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white">
                  <p className="text-xs">Watchlist</p>
                </TooltipContent>
              </Tooltip>

              {/* Alerts - NotificationBell with dropdown */}
              <NotificationBell />

              {/* Connect Wallet Button - BLACK (original) */}
              <button className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 hover:scale-105 active:scale-95">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect</span>
              </button>

              {/* Mobile Menu Button */}
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="lg:hidden mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                {[...navItems, 
                  { path: '/watchlist', label: 'Watchlist', icon: Eye },
                  { path: '/alerts', label: 'Alerts', icon: Bell }
                ].map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex flex-col items-center gap-2 p-4 rounded-xl transition-all
                        ${active 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}
