import 'dotenv/config';
import { buildApp } from './app.js';
import { connectMongo, disconnectMongo } from './db/mongoose.js';
import { env } from './config/env.js';
import { scheduler, registerDefaultJobs } from './jobs/scheduler.js';
import { runStartupChecks } from './core/system/startup.checks.js';
import { startHealthMonitor, stopHealthMonitor } from './core/system/health.monitor.js';
import * as bootstrapWorker from './core/bootstrap/bootstrap.worker.js';
import { startTelegramPolling, stopTelegramPolling } from './telegram-polling.worker.js';
import { seedTokenRegistry } from './core/resolver/token.resolver.js';

async function main(): Promise<void> {
  console.log('[Server] Starting BlockView Backend...');
  
  // Connect to MongoDB
  console.log('[Server] Connecting to MongoDB...');
  await connectMongo();

  // Build Fastify app
  const app = buildApp();

  // B6: Run startup checks (fail-fast)
  await runStartupChecks(app);

  // P2.5: Seed token registry with known tokens
  console.log('[Server] Seeding token registry...');
  await seedTokenRegistry();

  // Register scheduled jobs (including ERC-20 indexer)
  registerDefaultJobs();

  // Start scheduler jobs
  scheduler.startAll();

  // Start bootstrap worker
  const workerStarted = await bootstrapWorker.start();
  console.log(`[Server] Bootstrap worker: ${workerStarted ? 'started' : 'skipped (lock held)'}`);

  // B5: Start health monitor
  startHealthMonitor();

  // TEMPORARY FIX: Start Telegram polling (until ingress routing is fixed)
  console.log('[Server] Starting Telegram polling worker (TEMPORARY FIX)...');
  startTelegramPolling().catch(err => {
    console.error('[Server] Telegram polling error:', err);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}, shutting down...`);

    // Stop Telegram polling
    stopTelegramPolling();
    
    // Stop monitoring first
    stopHealthMonitor();
    
    // Stop worker
    await bootstrapWorker.stop();
    
    // Stop scheduler
    scheduler.stopAll();
    
    // Close app and DB
    await app.close();
    await disconnectMongo();

    console.log('[Server] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Start server
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.log(`[Server] ✓ Backend started on port ${env.PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    console.log(`[Server] WebSocket: ${env.WS_ENABLED ? 'enabled' : 'disabled'}`);
    console.log(`[Server] Indexer: ${env.INDEXER_ENABLED && env.INFURA_RPC_URL ? 'enabled' : 'disabled'}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[Server] Fatal error:', err);
  process.exit(1);
});
