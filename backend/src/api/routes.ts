import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.routes.js';

// Route imports
import { systemRoutes } from './system.routes.js';

// Core module routes
import { relationsRoutes } from '../core/relations/relations.routes.js';
import { transfersRoutes } from '../core/transfers/transfers.routes.js';
import { bundlesRoutes } from '../core/bundles/bundles.routes.js';
import { signalsRoutes } from '../core/signals/signals.routes.js';
import { scoresRoutes } from '../core/scores/scores.routes.js';
import { strategyProfilesRoutes } from '../core/strategies/strategy_profiles.routes.js';
import { strategySignalsRoutes } from '../core/strategy_signals/strategy_signals.routes.js';
import { followsRoutes } from '../core/follows/follows.routes.js';
import { alertsRoutes } from '../core/alerts/alerts.routes.js';
import { tiersRoutes } from '../core/tiers/tiers.routes.js';

// Phase 10 - Explainability & Deep Profiles
import { profilesRoutes } from '../core/profiles/profiles.routes.js';
import { timelinesRoutes } from '../core/timelines/timelines.routes.js';
import { explanationsRoutes } from '../core/explanations/explanations.routes.js';
import { snapshotsRoutes } from '../core/snapshots/snapshots.routes.js';

// Phase 11 - Decision & Action Layer
import { decisionsRoutes } from '../core/decisions/decisions.routes.js';
import { actionsRoutes } from '../core/actions/actions.routes.js';
import { simulationsRoutes } from '../core/simulations/simulations.routes.js';
import { feedbackRoutes } from '../core/feedback/feedback.routes.js';
import { trustRoutes } from '../core/trust/trust.routes.js';

// Phase 12A - Adaptive Intelligence
import { adaptiveRoutes } from '../core/adaptive/adaptive.routes.js';

// Phase 12B - Personalized Intelligence
import { personalizedRoutes } from '../core/personalized/personalized.routes.js';

// Phase 12C - Learning Control & Safety
import { learningControlRoutes } from '../core/learning_control/learning_control.routes.js';

// Phase 13 - Automation & Action Layer
import { playbooksRoutes } from '../core/playbooks/playbooks.routes.js';
import { actionQueueRoutes } from '../core/action_queue/action_queue.routes.js';
import { paperRoutes } from '../core/paper/paper.routes.js';
import { actionExplainRoutes } from '../core/action_explain/action_explain.routes.js';

// Phase 14A - Market Reality Layer
import { marketRoutes } from '../core/market/market.routes.js';

// Phase 14B - Signal Reactions & Validation
import { signalReactionsRoutes } from '../core/signal_reactions/signal_reactions.routes.js';

// Phase 14C - Market Regimes
import { marketRegimesRoutes } from '../core/market_regimes/market_regimes.routes.js';

// Phase 15 - Trust, Reputation & Public Confidence
import { reputationRoutes } from '../core/reputation/reputation.routes.js';

// Phase 15.5 - Entry & Resolution Layer
import { resolverRoutes } from '../core/resolver/resolver.routes.js';
import { tokenProfileRoutes } from '../core/tokens/token_profile.routes.js';
import entitiesRoutes from '../core/entities/entities.routes.js';

// Phase 15.5 - Attribution Claims Layer
import { attributionClaimsRoutes } from '../core/attribution/attribution_claims.routes.js';

// P2.1 - Bootstrap Task Layer
import { bootstrapRoutes } from '../core/bootstrap/bootstrap.routes.js';

// P2.2 - ENS Provider Layer
import { ensRoutes } from '../core/ens/ens.routes.js';

// P2.3 - WebSocket Gateway
import { registerWebSocket, getConnectionStats } from '../core/websocket/index.js';

// Telegram Notifications
import { telegramRoutes } from '../core/notifications/telegram.routes.js';

// Watchlist
import { watchlistRoutes } from '../core/watchlist/watchlist.routes.js';

// Wallet Intelligence (Phase B)
import { walletRoutes } from '../core/wallets/wallet.routes.js';

// Actors Graph (Structural Intelligence)
import { actorsGraphRoutes } from '../core/actors/actors_graph.routes.js';

// Actors API (Live Data Cards)
import { actorsApiRoutes } from '../core/actors/actors_api.routes.js';

// Actor Detail (Profile Page)
import { actorDetailRoutes } from '../core/actors/actor_detail.routes.js';

// Sprint 3 - Actor Signals v2
import { actorSignalsRoutes } from '../core/signals/actor_signals.routes.js';

// Sprint 3 - Signal Context Layer
import { signalContextRoutes } from '../core/signals/signal_context.routes.js';

// Sprint 4 - Engine v1 (Decision Layer)
import { engineRoutes } from '../core/engine/engine.routes.js';

// P2.5 - Token Symbol Resolution
import { tokenRegistryRoutes } from '../core/resolver/token_registry.routes.js';

/**
 * Register All Routes
 */

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // Health endpoints
  await app.register(healthRoutes, { prefix: '/api' });

  // System endpoints (P2.3.B)
  await app.register(systemRoutes, { prefix: '/api/system' });

  // ========== CORE MODULES ==========
  
  // Transfers - Normalized layer (L2)
  await app.register(transfersRoutes, { prefix: '/api/transfers' });
  
  // Relations - Aggregated layer (L3)
  await app.register(relationsRoutes, { prefix: '/api/relations' });
  
  // Bundles - Intelligence layer (L4)
  await app.register(bundlesRoutes, { prefix: '/api/bundles' });
  
  // Signals - Event layer (L5)
  await app.register(signalsRoutes, { prefix: '/api/signals' });
  
  // Scores - Rating layer (L6)
  await app.register(scoresRoutes, { prefix: '/api/scores' });
  
  // Strategy Profiles - Strategy layer (L7)
  await app.register(strategyProfilesRoutes, { prefix: '/api/strategies' });
  
  // Strategy Signals - Strategy event layer (L7.1)
  await app.register(strategySignalsRoutes, { prefix: '/api/strategy-signals' });
  
  // Follows - Follow engine (L7.2)
  await app.register(followsRoutes, { prefix: '/api/follow' });
  
  // Alerts - Alerts 2.0 (L8)
  await app.register(alertsRoutes, { prefix: '/api/alerts' });
  
  // Tiers - Monetization hooks (L9)
  await app.register(tiersRoutes, { prefix: '/api/tiers' });
  
  // ========== PHASE 10 - EXPLAINABILITY ==========
  
  // Profiles - Actor/Entity profiles (L10.1)
  await app.register(profilesRoutes, { prefix: '/api/profiles' });
  
  // Timelines - Strategy/Signal/Bundle evolution (L10.2)
  await app.register(timelinesRoutes, { prefix: '/api/timeline' });
  
  // Explanations - WHY engine (L10.3)
  await app.register(explanationsRoutes, { prefix: '/api/explain' });
  
  // Snapshots - Prebuilt UI cache (L10.4)
  await app.register(snapshotsRoutes, { prefix: '/api/snapshots' });

  // ========== PHASE 11 - DECISION & ACTION LAYER ==========
  
  // Decisions - Decision engine (L11.1)
  await app.register(decisionsRoutes, { prefix: '/api/decisions' });
  
  // Actions - Action suggestions (L11.2)
  await app.register(actionsRoutes, { prefix: '/api/actions' });
  
  // Simulations - Virtual performance (L11.3)
  await app.register(simulationsRoutes, { prefix: '/api/simulations' });
  
  // Feedback - Feedback loop (L11.4)
  await app.register(feedbackRoutes, { prefix: '/api/feedback' });
  
  // Trust - Trust & transparency (L11.5)
  await app.register(trustRoutes, { prefix: '/api/trust' });

  // ========== PHASE 12A - ADAPTIVE INTELLIGENCE ==========
  
  // Adaptive - Adaptive weights, confidence calibration, strategy reliability (L12A)
  await app.register(adaptiveRoutes, { prefix: '/api/adaptive' });

  // ========== PHASE 12B - PERSONALIZED INTELLIGENCE ==========
  
  // User preferences, bias, personalized scores (L12B)
  await app.register(personalizedRoutes, { prefix: '/api/user' });

  // ========== PHASE 12C - LEARNING CONTROL & SAFETY ==========
  
  // Learning control, drift guard, freeze/reset (L12C)
  await app.register(learningControlRoutes, { prefix: '/api/learning' });

  // ========== PHASE 13 - AUTOMATION & ACTION LAYER ==========
  
  // Playbooks - Action templates (L13.1)
  await app.register(playbooksRoutes, { prefix: '/api/playbooks' });
  
  // Action Queue - Execution layer (L13.2)
  await app.register(actionQueueRoutes, { prefix: '/api/action-queue' });
  
  // Paper Trading - Copy simulation (L13.3)
  await app.register(paperRoutes, { prefix: '/api/paper' });
  
  // Action Explanations - Explainability (L13.4)
  await app.register(actionExplainRoutes, { prefix: '/api/action-explain' });

  // ========== PHASE 14A - MARKET REALITY LAYER ==========
  
  // Market prices, metrics (L14A)
  await app.register(marketRoutes, { prefix: '/api/market' });

  // ========== PHASE 14B - SIGNAL REACTIONS & VALIDATION ==========
  
  // Signal market reactions and validation (L14B)
  await app.register(signalReactionsRoutes, { prefix: '/api/signal-reactions' });

  // ========== PHASE 14C - MARKET REGIMES ==========
  
  // Market regime detection and context (L14C)
  await app.register(marketRegimesRoutes, { prefix: '/api/market-regimes' });

  // ========== PHASE 15 - TRUST, REPUTATION & PUBLIC CONFIDENCE ==========
  
  // Signal/Strategy/Actor reputation and trust indicators (L15)
  await app.register(reputationRoutes);

  // ========== PHASE 15.5 - ENTRY & RESOLUTION LAYER ==========
  
  // Universal Resolver (L15.5.1)
  await app.register(resolverRoutes, { prefix: '/api' });
  
  // Token Profiles (L15.5.2)
  await app.register(tokenProfileRoutes, { prefix: '/api/tokens' });
  
  // Entity Profiles (L15.5.3)
  await app.register(entitiesRoutes, { prefix: '/api/entities' });

  // Attribution Claims (L15.5.4)
  await app.register(attributionClaimsRoutes, { prefix: '/api/attribution' });

  // ========== P2.1 - BOOTSTRAP TASK LAYER ==========
  
  // Bootstrap Tasks - Indexing queue (P2.1)
  await app.register(bootstrapRoutes, { prefix: '/api/bootstrap' });

  // ========== P2.2 - ENS PROVIDER LAYER ==========
  
  // ENS Resolution (P2.2)
  await app.register(ensRoutes, { prefix: '/api/ens' });

  // ========== TELEGRAM NOTIFICATIONS ==========
  
  // Telegram Bot Integration
  await app.register(telegramRoutes, { prefix: '/api/telegram' });

  // ========== WATCHLIST ==========
  
  // Watchlist - Base of interest
  await app.register(watchlistRoutes, { prefix: '/api/watchlist' });

  // ========== PHASE B - WALLET INTELLIGENCE ==========
  
  // Wallet Profiles (B1)
  await app.register(walletRoutes, { prefix: '/api' });

  // ========== ACTORS - STRUCTURAL INTELLIGENCE ==========
  
  // Actors Graph - Network visualization (P1)
  await app.register(actorsGraphRoutes, { prefix: '/api/actors' });
  
  // Actors API - Live data cards (P1)
  await app.register(actorsApiRoutes, { prefix: '/api/actors-list' });
  
  // Actor Detail - Profile page (P1)
  await app.register(actorDetailRoutes, { prefix: '/api/actor' });

  // ========== SPRINT 3 - ACTOR SIGNALS V2 ==========
  
  // Actor Behavior Deviations (Sprint 3)
  await app.register(actorSignalsRoutes, { prefix: '/api' });
  
  // Signal Context Layer (Sprint 3)
  await app.register(signalContextRoutes, { prefix: '/api' });

  // ========== SPRINT 4 - ENGINE V1 ==========
  
  // Decision Engine (Sprint 4)
  await app.register(engineRoutes, { prefix: '/api' });

  // ========== P2.5 - TOKEN SYMBOL RESOLUTION ==========
  
  // Token Registry & Resolution (P2.5)
  await app.register(tokenRegistryRoutes, { prefix: '/api' });

  // ========== P2.3 - WEBSOCKET GATEWAY ==========
  
  // NOTE: WebSocket routes are registered directly in app.ts
  // to avoid encapsulation issues with @fastify/websocket
  
  // WS Stats endpoint
  app.get('/api/ws/stats', async (_request, reply) => {
    const stats = getConnectionStats();
    return reply.send({ ok: true, data: stats });
  });

  app.log.info('Routes registered');
}
