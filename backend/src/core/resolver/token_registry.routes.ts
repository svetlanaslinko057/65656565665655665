/**
 * Token Registry Routes (P2.5)
 * 
 * API for token symbol resolution
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { TokenRegistryModel } from './token_registry.model.js';
import { 
  resolveToken, 
  resolveTokens, 
  formatToken,
  getTokenRegistryStats,
  seedTokenRegistry 
} from './token.resolver.js';

export async function tokenRegistryRoutes(app: FastifyInstance): Promise<void> {
  
  /**
   * GET /api/tokens/resolve/:address
   * Resolve single token address to symbol/metadata
   */
  app.get('/tokens/resolve/:address', async (request: FastifyRequest) => {
    const { address } = request.params as { address: string };
    const { chain = 'ethereum' } = request.query as { chain?: string };
    
    const info = await resolveToken(address, chain);
    
    return {
      ok: true,
      data: {
        ...info,
        formatted: formatToken(info),
      },
    };
  });
  
  /**
   * POST /api/tokens/resolve/batch
   * Resolve multiple tokens at once
   */
  app.post('/tokens/resolve/batch', async (request: FastifyRequest) => {
    const { addresses, chain = 'ethereum' } = request.body as { 
      addresses: string[]; 
      chain?: string; 
    };
    
    if (!addresses || !Array.isArray(addresses)) {
      return {
        ok: false,
        error: 'INVALID_BODY',
        message: 'Body must contain "addresses" array',
      };
    }
    
    if (addresses.length > 100) {
      return {
        ok: false,
        error: 'TOO_MANY_ADDRESSES',
        message: 'Maximum 100 addresses per batch',
      };
    }
    
    const resolved = await resolveTokens(addresses, chain);
    
    // Convert Map to object
    const result: Record<string, any> = {};
    for (const [addr, info] of resolved) {
      result[addr] = {
        ...info,
        formatted: formatToken(info),
      };
    }
    
    return {
      ok: true,
      data: result,
      count: Object.keys(result).length,
    };
  });
  
  /**
   * GET /api/tokens/registry/stats
   * Get token registry statistics
   */
  app.get('/tokens/registry/stats', async () => {
    const stats = await getTokenRegistryStats();
    
    return {
      ok: true,
      data: stats,
    };
  });
  
  /**
   * GET /api/tokens/registry/search
   * Search tokens by symbol or name
   */
  app.get('/tokens/registry/search', async (request: FastifyRequest) => {
    const { q, chain, limit = '20' } = request.query as { 
      q?: string; 
      chain?: string;
      limit?: string;
    };
    
    if (!q || q.length < 1) {
      return {
        ok: false,
        error: 'MISSING_QUERY',
        message: 'Query parameter "q" is required',
      };
    }
    
    const filter: any = {
      $or: [
        { symbol: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
    };
    
    if (chain) {
      filter.chain = chain;
    }
    
    const tokens = await TokenRegistryModel.find(filter)
      .limit(parseInt(limit))
      .lean();
    
    return {
      ok: true,
      data: tokens.map((t: any) => ({
        address: t.address,
        chain: t.chain,
        symbol: t.symbol,
        name: t.name,
        decimals: t.decimals,
        verified: t.verified,
      })),
      count: tokens.length,
    };
  });
  
  /**
   * POST /api/tokens/registry/seed
   * Seed known tokens (admin endpoint)
   */
  app.post('/tokens/registry/seed', async () => {
    const seeded = await seedTokenRegistry();
    
    return {
      ok: true,
      data: { seeded },
    };
  });
  
  /**
   * POST /api/tokens/registry/add
   * Add new token to registry (admin endpoint)
   */
  app.post('/tokens/registry/add', async (request: FastifyRequest) => {
    const body = request.body as {
      address: string;
      chain?: string;
      symbol: string;
      name: string;
      decimals?: number;
      verified?: boolean;
    };
    
    if (!body.address || !body.symbol || !body.name) {
      return {
        ok: false,
        error: 'MISSING_FIELDS',
        message: 'Required: address, symbol, name',
      };
    }
    
    const token = await TokenRegistryModel.findOneAndUpdate(
      { address: body.address.toLowerCase(), chain: body.chain || 'ethereum' },
      {
        address: body.address.toLowerCase(),
        chain: body.chain || 'ethereum',
        symbol: body.symbol,
        name: body.name,
        decimals: body.decimals || 18,
        verified: body.verified || false,
        source: 'manual',
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );
    
    return {
      ok: true,
      data: {
        address: (token as any).address,
        symbol: (token as any).symbol,
        name: (token as any).name,
      },
    };
  });
  
  app.log.info('Token Registry routes registered (P2.5)');
}
