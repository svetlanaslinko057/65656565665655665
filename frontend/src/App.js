import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { Suspense, lazy } from "react";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

// Lazy loaded pages - Code Splitting
// Critical pages (loaded immediately for fast initial render)
import ArkhamHome from "./pages/ArkhamHome";

// Main navigation pages (lazy loaded)
const TokensPage = lazy(() => import("./pages/TokensPage"));
const WalletsPage = lazy(() => import("./pages/WalletsPage"));
const EntitiesPage = lazy(() => import("./pages/EntitiesPage"));
const SignalsPage = lazy(() => import("./pages/SignalsPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const StrategiesPage = lazy(() => import("./pages/StrategiesPage"));
const ActorsPage = lazy(() => import("./pages/ActorsPage"));
const ActorsGraphPage = lazy(() => import("./pages/ActorsGraphPage"));
const ActorDetailPage = lazy(() => import("./pages/ActorDetailPage"));
const CorrelationPage = lazy(() => import("./pages/CorrelationPage"));
const EnginePage = lazy(() => import("./pages/EnginePage"));
const EngineDashboard = lazy(() => import("./pages/EngineDashboard"));

// Detail pages (lazy loaded - less frequently accessed)
const TokenDetail = lazy(() => import("./pages/TokenDetail"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const EntityDetail = lazy(() => import("./pages/EntityDetail"));
const SignalSnapshot = lazy(() => import("./pages/SignalSnapshot"));
const ActorProfile = lazy(() => import("./pages/ActorProfile"));

function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Main Navigation */}
            <Route path="/" element={<ArkhamHome />} />
            <Route path="/tokens" element={<TokensPage />} />
            <Route path="/wallets" element={<WalletsPage />} />
            <Route path="/entities" element={<EntitiesPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/strategies" element={<StrategiesPage />} />
            <Route path="/actors" element={<ActorsPage />} />
            <Route path="/actors/graph" element={<ActorsGraphPage />} />
            <Route path="/actors/correlation" element={<CorrelationPage />} />
            <Route path="/actors/:actorId" element={<ActorDetailPage />} />
            <Route path="/engine" element={<EnginePage />} />
            <Route path="/engine/dashboard" element={<EngineDashboard />} />
            
            {/* Detail Pages */}
            <Route path="/token/:tokenId" element={<TokenDetail />} />
            <Route path="/tokens/:address" element={<TokensPage />} />
            <Route path="/portfolio/:address" element={<Portfolio />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/entity/:entityId" element={<EntityDetail />} />
            <Route path="/signal/:id" element={<SignalSnapshot />} />
            
            {/* Fallback */}
            <Route path="/*" element={<ArkhamHome />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" />
      </BrowserRouter>
    </WebSocketProvider>
  );
}

export default App;
