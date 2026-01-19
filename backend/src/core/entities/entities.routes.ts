/**
 * Entities Routes - Real Implementation
 * 
 * API для работы с entities (Exchange / Fund / MM / Protocol)
 */
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { EntityModel } from './entities.model.js';
import { EntityAddressModel } from './entity_address.model.js';
import { seedEntities } from './entities.seed.js';
import * as entityProfileService from './entity_profile.service.js';
import * as aggregation from './entities.aggregation.js';

const entitiesRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * GET /entities
   * List all entities with filters
   */
  fastify.get('/', async (request: FastifyRequest) => {
    const query = request.query as { 
      search?: string; 
      category?: string; 
      limit?: string;
      status?: string;
    };
    
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const search = query.search?.toLowerCase();
    const category = query.category;
    const status = query.status || 'live';
    
    // Build filter
    const filter: any = {};
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } },
      ];
    }
    
    // Get entities
    const entities = await EntityModel.find(filter)
      .sort({ coverage: -1, addressesCount: -1 })
      .limit(limit)
      .lean();
    
    // Format for frontend
    const formatted = entities.map((e: any) => ({
      id: e._id.toString(),
      name: e.name,
      slug: e.slug,
      logo: e.logo,
      description: e.description,
      category: e.category,
      tags: e.tags,
      addressesCount: e.addressesCount,
      coverage: e.coverage,
      status: e.status,
      netFlow24h: e.netFlow24h,
      volume24h: e.volume24h,
      topTokens: e.topTokens,
      totalHoldingsUSD: e.totalHoldingsUSD,
      updatedAt: e.updatedAt,
    }));
    
    return {
      ok: true,
      data: {
        entities: formatted,
        total: await EntityModel.countDocuments(filter),
        interpretation: {
          headline: `${formatted.length} entities found`,
          description: category && category !== 'all' 
            ? `Showing ${category} entities`
            : 'All entity types included',
        },
      },
    };
  });
  
  /**
   * GET /entities/:slug
   * Get entity details
   */
  fastify.get('/:slug', async (request: FastifyRequest) => {
    const { slug } = request.params as { slug: string };
    
    const entity = await EntityModel.findOne({ slug: slug.toLowerCase() }).lean();
    
    if (!entity) {
      return {
        ok: false,
        error: 'Entity not found',
      };
    }
    
    // Get addresses
    const addresses = await EntityAddressModel.find({ 
      entityId: (entity as any)._id.toString() 
    })
      .sort({ lastSeen: -1 })
      .limit(10)
      .lean();
    
    const e = entity as any;
    
    return {
      ok: true,
      data: {
        entity: {
          id: e._id.toString(),
          name: e.name,
          slug: e.slug,
          logo: e.logo,
          description: e.description,
          category: e.category,
          tags: e.tags,
          addressesCount: e.addressesCount,
          coverage: e.coverage,
          status: e.status,
          netFlow24h: e.netFlow24h,
          volume24h: e.volume24h,
          topTokens: e.topTokens,
          totalHoldingsUSD: e.totalHoldingsUSD,
          source: e.source,
          attribution: e.attribution,
          firstSeen: e.firstSeen,
          lastSeen: e.lastSeen,
          updatedAt: e.updatedAt,
        },
        addresses: addresses.map((a: any) => ({
          chain: a.chain,
          address: a.address,
          role: a.role,
          firstSeen: a.firstSeen,
          lastSeen: a.lastSeen,
        })),
      },
    };
  });
  
  /**
   * GET /entities/:slug/holdings
   * Get entity holdings breakdown (real data from indexed transfers)
   */
  fastify.get('/:slug/holdings', async (request: FastifyRequest) => {
    const { slug } = request.params as { slug: string };
    
    try {
      const result = await aggregation.calculateEntityHoldings(slug);
      
      return {
        ok: true,
        data: {
          holdings: result.holdings.map(h => ({
            token: h.token,
            tokenAddress: h.tokenAddress,
            balance: h.balance,
            balanceRaw: h.balanceRaw,
            valueUSD: h.valueUSD,
            percentage: h.percentage,
          })),
          total: result.total,
          totalTokens: result.totalTokens,
          lastUpdated: result.lastUpdated,
          source: result.holdings.length > 0 ? 'indexed_transfers' : 'no_data',
          interpretation: {
            headline: result.holdings.length > 0 
              ? `${result.holdings.length} tokens tracked`
              : 'No holdings data available',
            description: 'Holdings calculated from observed inflows minus outflows',
          },
        },
      };
    } catch (error) {
      console.error('[Entities] Holdings aggregation error:', error);
      return {
        ok: true,
        data: {
          holdings: [],
          total: 0,
          totalTokens: 0,
          lastUpdated: new Date(),
          source: 'error',
        },
      };
    }
  });
  
  /**
   * GET /entities/:slug/flows
   * Get entity net flow history with token breakdown (real data)
   */
  fastify.get('/:slug/flows', async (request: FastifyRequest) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { window?: string };
    
    const windowDays = query.window === '24h' ? 1 : query.window === '30d' ? 30 : 7;
    
    try {
      const result = await aggregation.calculateEntityFlows(slug, windowDays);
      
      return {
        ok: true,
        data: {
          // Daily flows
          flows: result.flows.map(f => ({
            date: f.date,
            netFlow: f.netFlow,
            inflow: f.inflow,
            outflow: f.outflow,
          })),
          // Per-token breakdown
          byToken: result.byToken.map(t => ({
            token: t.token,
            tokenAddress: t.tokenAddress,
            inflow: t.inflow,
            outflow: t.outflow,
            netFlow: t.netFlow,
            inflowUSD: t.inflowUSD,
            outflowUSD: t.outflowUSD,
            netFlowUSD: t.netFlowUSD,
            dominantFlow: t.dominantFlow,
            txCount: t.txCount,
          })),
          summary: {
            totalInflow: result.totalInflow,
            totalOutflow: result.totalOutflow,
            netFlow: result.netFlow,
          },
          window: result.window,
          source: result.flows.some(f => f.inflow > 0 || f.outflow > 0) ? 'indexed_transfers' : 'no_data',
          interpretation: {
            headline: result.netFlow >= 0 
              ? `Net inflow observed: +$${Math.abs(result.netFlow / 1e6).toFixed(1)}M`
              : `Net outflow observed: -$${Math.abs(result.netFlow / 1e6).toFixed(1)}M`,
            description: `${result.window} period analyzed`,
          },
        },
      };
    } catch (error) {
      console.error('[Entities] Flows aggregation error:', error);
      return {
        ok: true,
        data: {
          flows: [],
          byToken: [],
          summary: { totalInflow: 0, totalOutflow: 0, netFlow: 0 },
          window: query.window || '7d',
          source: 'error',
        },
      };
    }
  });
  
  /**
   * GET /entities/:slug/bridges
   * Get cross-chain/bridge activity for entity
   */
  fastify.get('/:slug/bridges', async (request: FastifyRequest) => {
    const { slug } = request.params as { slug: string };
    
    try {
      const result = await aggregation.calculateEntityBridgeFlows(slug);
      
      return {
        ok: true,
        data: {
          bridges: result.bridges.map(b => ({
            fromChain: b.fromChain,
            toChain: b.toChain,
            asset: b.asset,
            assetAddress: b.assetAddress,
            volume: b.volume,
            volumeUSD: b.volumeUSD,
            direction: b.direction,
            txCount: b.txCount,
          })),
          totalVolume: result.totalVolume,
          summary: result.summary,
          source: result.bridges.length > 0 ? 'indexed_transfers' : 'no_data',
          interpretation: {
            headline: result.bridges.length > 0 
              ? `Cross-chain activity detected: ${result.bridges.length} routes`
              : 'No bridge activity detected',
            description: 'Bridge flows from Ethereum to L2s and cross-chain',
          },
        },
      };
    } catch (error) {
      console.error('[Entities] Bridge aggregation error:', error);
      return {
        ok: true,
        data: {
          bridges: [],
          totalVolume: 0,
          summary: { l1ToL2: 0, crossChain: 0 },
          source: 'error',
        },
      };
    }
  });
  
  /**
   * GET /entities/:slug/transactions
   * Get recent transactions for entity
   */
  fastify.get('/:slug/transactions', async (request: FastifyRequest) => {
    const { slug } = request.params as { slug: string };
    const query = request.query as { limit?: string };
    
    const limit = Math.min(parseInt(query.limit || '20'), 100);
    
    try {
      const transactions = await aggregation.getEntityTransactions(slug, limit);
      
      return {
        ok: true,
        data: {
          transactions,
          total: transactions.length,
          source: transactions.length > 0 ? 'indexed_transfers' : 'no_data',
        },
      };
    } catch (error) {
      console.error('[Entities] Transactions query error:', error);
      return {
        ok: true,
        data: {
          transactions: [],
          total: 0,
          source: 'error',
        },
      };
    }
  });
  
  /**
   * GET /entities/:slug/pattern-bridge
   * Get entity addresses grouped by behavioral patterns (P0 Feature)
   */
  fastify.get('/:slug/pattern-bridge', async (request: FastifyRequest) => {
    const { slug } = request.params as { slug: string };
    
    try {
      const result = await aggregation.getEntityPatternBridge(slug);
      
      return {
        ok: true,
        data: {
          patterns: result.patterns.map(p => ({
            pattern: p.pattern,
            description: p.description,
            addresses: p.addresses.map(a => ({
              address: a.address,
              shortAddress: `${a.address.slice(0, 6)}...${a.address.slice(-4)}`,
              patternScore: Math.round(a.patternScore),
              txCount: a.txCount,
              avgValue: a.avgValue,
              dominantTokens: a.dominantTokens,
              lastActive: a.lastActive,
            })),
            totalTxCount: p.totalTxCount,
            avgPatternScore: Math.round(p.avgPatternScore),
          })),
          totalAddresses: result.totalAddresses,
          source: result.patterns.length > 0 ? 'indexed_transfers' : 'no_data',
          interpretation: {
            headline: result.patterns.length > 0 
              ? `${result.totalAddresses} addresses grouped into ${result.patterns.length} patterns`
              : 'No pattern data available',
            description: 'Addresses grouped by observed behavioral patterns',
          },
        },
      };
    } catch (error) {
      console.error('[Entities] Pattern bridge error:', error);
      return {
        ok: true,
        data: {
          patterns: [],
          totalAddresses: 0,
          source: 'error',
        },
      };
    }
  });
  
  /**
   * POST /entities/seed
   * Seed initial entities (dev only)
   */
  fastify.post('/seed', async (request, reply) => {
    // Dev only
    if (process.env.NODE_ENV === 'production') {
      return reply.code(403).send({ ok: false, error: 'Seed disabled in production' });
    }
    
    const result = await seedEntities();
    return {
      ok: true,
      data: result,
    };
  });

  /**
   * GET /entities/:id/profile
   * Get comprehensive entity profile
   */
  fastify.get('/:id/profile', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const profile = await entityProfileService.getEntityProfile(id);
    
    return {
      ok: true,
      data: {
        entityId: id,
        profile,
        interpretation: {
          headline: 'Entity profile loaded',
          description: 'Comprehensive entity analysis',
        },
      },
    };
  });
  
  /**
   * GET /entities/:id/actors
   * Get actors belonging to entity
   */
  fastify.get('/:id/actors', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const actors = await entityProfileService.getEntityActors(id);
    
    return {
      ok: true,
      data: {
        entityId: id,
        actors,
      },
    };
  });
  
  /**
   * GET /entities/:id/strategies
   * Get strategies used by entity
   */
  fastify.get('/:id/strategies', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const strategies = await entityProfileService.getEntityStrategies(id);
    
    return {
      ok: true,
      data: {
        entityId: id,
        strategies,
      },
    };
  });
  
  console.log('Entities routes registered');
};

export default entitiesRoutes;
