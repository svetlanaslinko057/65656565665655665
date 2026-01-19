/**
 * Engine Routes (Sprint 4)
 * 
 * API endpoints for Engine v1
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { buildEngineInput, buildEngineInputForActor } from './engine_input.service.js';
import { generateDecision } from './engine_decision.service.js';
import { EngineDecisionModel } from './engine_decision.model.js';
import { parseWindow, TimeWindow } from '../common/window.service.js';
import { buildEnvelope, buildErrorEnvelope } from '../common/analysis_envelope.js';

export async function engineRoutes(app: FastifyInstance): Promise<void> {
  
  /**
   * GET /api/engine/input
   * Build engine input for asset/actor
   */
  app.get('/engine/input', async (request: FastifyRequest) => {
    const query = request.query as {
      asset?: string;
      actor?: string;
      window?: string;
    };
    
    const window = parseWindow(query.window, '24h');
    
    if (!query.asset && !query.actor) {
      return buildErrorEnvelope('Either asset or actor parameter required', window);
    }
    
    try {
      let input;
      
      if (query.actor) {
        input = await buildEngineInputForActor(query.actor, window);
      } else {
        input = await buildEngineInput(query.asset!, window);
      }
      
      return buildEnvelope(input, {
        interpretation: {
          headline: `Engine input prepared for ${input.asset.symbol}`,
          description: `Collected ${input.contexts.length} contexts, ${input.signals.length} signals, ${input.actors.length} actors`,
        },
        coverage: {
          pct: input.coverage.overall,
          note: `Contexts: ${input.coverage.contexts}%, Actors: ${input.coverage.actors}%, Signals: ${input.coverage.signals}%`,
        },
        window,
        checked: ['contexts', 'signals', 'actors', 'graph'],
      });
    } catch (err: any) {
      return buildErrorEnvelope(err.message, window);
    }
  });
  
  /**
   * POST /api/engine/decide
   * Generate decision for asset/actor
   */
  app.post('/engine/decide', async (request: FastifyRequest) => {
    const body = request.body as {
      asset?: string;
      actor?: string;
      window?: string;
    };
    
    const window = parseWindow(body.window, '24h');
    
    if (!body.asset && !body.actor) {
      return buildErrorEnvelope('Either asset or actor parameter required', window);
    }
    
    try {
      // Build input
      let input;
      if (body.actor) {
        input = await buildEngineInputForActor(body.actor, window);
      } else {
        input = await buildEngineInput(body.asset!, window);
      }
      
      // Generate decision
      const decision = await generateDecision(input);
      
      return buildEnvelope(decision, {
        interpretation: {
          headline: `${decision.decision} signal based on ${decision.reasoning.primaryContext?.headline || 'observed patterns'}`,
          description: decision.reasoning.supportingFacts[0] || 'Multiple signals analyzed',
        },
        coverage: {
          pct: input.coverage.overall,
          note: `Based on ${input.actors.length} actors, ${input.signals.length} signals, ${input.contexts.length} contexts`,
        },
        window,
        checked: ['contexts', 'signals', 'actors', 'graph', 'coverage'],
      });
    } catch (err: any) {
      return buildErrorEnvelope(err.message, window);
    }
  });
  
  /**
   * GET /api/engine/decisions
   * Get decision history
   */
  app.get('/engine/decisions', async (request: FastifyRequest) => {
    const query = request.query as {
      asset?: string;
      decision?: string;
      limit?: string;
    };
    
    const filter: any = {};
    
    if (query.asset) {
      filter['asset.symbol'] = { $regex: query.asset, $options: 'i' };
    }
    
    if (query.decision) {
      filter.decision = query.decision.toUpperCase();
    }
    
    const limit = Math.min(parseInt(query.limit || '20'), 100);
    
    const decisions = await EngineDecisionModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    return {
      ok: true,
      data: {
        decisions: decisions.map((d: any) => ({
          id: d.decisionId,
          asset: d.asset,
          window: d.window,
          decision: d.decision,
          confidenceBand: d.confidenceBand,
          scores: d.scores,
          reasoning: d.reasoning,
          createdAt: d.createdAt,
          feedback: d.feedback?.helpful,
        })),
        count: decisions.length,
      },
    };
  });
  
  /**
   * GET /api/engine/decisions/:id
   * Get decision details
   */
  app.get('/engine/decisions/:id', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    
    const decision = await EngineDecisionModel.findOne({ decisionId: id }).lean();
    
    if (!decision) {
      return {
        ok: false,
        error: 'DECISION_NOT_FOUND',
      };
    }
    
    const d = decision as any;
    
    return {
      ok: true,
      data: {
        id: d.decisionId,
        inputId: d.inputId,
        asset: d.asset,
        window: d.window,
        decision: d.decision,
        confidenceBand: d.confidenceBand,
        scores: d.scores,
        reasoning: d.reasoning,
        explainability: d.explainability,
        coverage: d.coverage,
        feedback: d.feedback,
        engineVersion: d.engineVersion,
        createdAt: d.createdAt,
      },
    };
  });
  
  /**
   * POST /api/engine/decisions/:id/feedback
   * Submit feedback on decision (P4)
   */
  app.post('/engine/decisions/:id/feedback', async (request: FastifyRequest) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      helpful: boolean;
      comment?: string;
    };
    
    const decision = await EngineDecisionModel.findOneAndUpdate(
      { decisionId: id },
      {
        $set: {
          'feedback.helpful': body.helpful,
          'feedback.feedbackAt': new Date(),
          'feedback.comment': body.comment || null,
        },
      },
      { new: true }
    ).lean();
    
    if (!decision) {
      return {
        ok: false,
        error: 'DECISION_NOT_FOUND',
      };
    }
    
    return {
      ok: true,
      data: { recorded: true },
    };
  });
  
  /**
   * GET /api/engine/stats
   * Get engine statistics
   */
  app.get('/engine/stats', async () => {
    const [
      totalDecisions,
      byDecision,
      byConfidence,
      recentBuys,
      feedbackStats,
    ] = await Promise.all([
      EngineDecisionModel.countDocuments(),
      EngineDecisionModel.aggregate([
        { $group: { _id: '$decision', count: { $sum: 1 } } },
      ]),
      EngineDecisionModel.aggregate([
        { $group: { _id: '$confidenceBand', count: { $sum: 1 } } },
      ]),
      EngineDecisionModel.find({ decision: 'BUY' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      EngineDecisionModel.aggregate([
        { $match: { 'feedback.helpful': { $ne: null } } },
        { $group: {
          _id: '$feedback.helpful',
          count: { $sum: 1 },
        }},
      ]),
    ]);
    
    return {
      ok: true,
      data: {
        totalDecisions,
        byDecision: byDecision.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        byConfidence: byConfidence.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {} as Record<string, number>),
        recentBuySignals: recentBuys.map((d: any) => ({
          asset: d.asset?.symbol,
          confidence: d.confidenceBand,
          createdAt: d.createdAt,
        })),
        feedback: {
          helpful: feedbackStats.find((f: any) => f._id === true)?.count || 0,
          notHelpful: feedbackStats.find((f: any) => f._id === false)?.count || 0,
        },
      },
    };
  });
  
  app.log.info('Engine routes registered (Sprint 4 - Engine v1)');
}
