/**
 * Watchlist Routes (P0)
 * 
 * Watchlist = база интереса, НЕ условия
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  WatchlistItemModel,
  findOrCreateWatchlistItem,
  getUserWatchlist,
  removeWatchlistItem,
  getWatchlistItem,
} from './watchlist.model.js';
import { countAlertsForWatchlistItem } from '../alerts/alert_rules.model.js';

// Helper to get userId
function getUserId(request: FastifyRequest): string {
  const userId = request.headers['x-user-id'] as string;
  return userId || 'anonymous';
}

// Schemas
const AddToWatchlistBody = z.object({
  type: z.enum(['token', 'wallet', 'actor', 'entity']),
  target: z.object({
    address: z.string().min(1),
    chain: z.string().default('ethereum'),
    symbol: z.string().optional(),
    name: z.string().optional(),
  }),
  note: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const GetWatchlistQuery = z.object({
  type: z.enum(['token', 'wallet', 'actor', 'entity']).optional(),
});

const WatchlistIdParams = z.object({
  id: z.string().min(1),
});

export async function watchlistRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/watchlist
   * Get user's watchlist items with alert counts
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const query = GetWatchlistQuery.parse(request.query);
    
    const items = await getUserWatchlist(userId, query.type);
    
    // Enrich with alert counts
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        const alertCount = await countAlertsForWatchlistItem(item._id.toString());
        return {
          _id: item._id,
          type: item.type,
          target: item.target,
          note: item.note,
          tags: item.tags,
          createdAt: item.createdAt,
          alertCount, // X alerts active
        };
      })
    );
    
    return {
      ok: true,
      data: enrichedItems,
      count: enrichedItems.length,
    };
  });

  /**
   * POST /api/watchlist
   * Add item to watchlist
   */
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const body = AddToWatchlistBody.parse(request.body);
    
    const item = await findOrCreateWatchlistItem(userId, body.type, body.target);
    
    // Update note and tags if provided
    if (body.note || body.tags) {
      item.note = body.note;
      item.tags = body.tags;
      await item.save();
    }
    
    return reply.status(201).send({
      ok: true,
      data: {
        _id: item._id,
        type: item.type,
        target: item.target,
        note: item.note,
        tags: item.tags,
        createdAt: item.createdAt,
      },
    });
  });

  /**
   * DELETE /api/watchlist/:id
   * Remove item from watchlist
   */
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = getUserId(request);
    const params = WatchlistIdParams.parse(request.params);
    
    const deleted = await removeWatchlistItem(userId, params.id);
    
    if (!deleted) {
      return reply.status(404).send({ ok: false, error: 'Item not found' });
    }
    
    return { ok: true };
  });

  /**
   * GET /api/watchlist/:id
   * Get single watchlist item with alert count
   */
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const params = WatchlistIdParams.parse(request.params);
    
    const item = await getWatchlistItem(params.id);
    
    if (!item) {
      return reply.status(404).send({ ok: false, error: 'Item not found' });
    }
    
    const alertCount = await countAlertsForWatchlistItem(item._id.toString());
    
    return {
      ok: true,
      data: {
        _id: item._id,
        type: item.type,
        target: item.target,
        note: item.note,
        tags: item.tags,
        createdAt: item.createdAt,
        alertCount,
      },
    };
  });

  app.log.info('Watchlist routes registered');
}
