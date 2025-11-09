/**
 * AI Agent API Routes
 * Endpoints for Speak, Think, Remember, Post, Build
 */

import { Request, Response } from 'express';
import { getAIAgent } from './aiAgentCore';
import { getMonetizationAgent } from './monetizationAgent';

export function setupAIAgentRoutes(app: any) {
  const aiAgent = getAIAgent();
  const monetizationAgent = getMonetizationAgent();

  // Register AI Agent service for monetization
  monetizationAgent.registerService({
    id: 'ai-agent-core',
    name: 'AI Agent Core Services',
    type: 'ai_agent' as any,
    price: '0.50',
    network: 'base-sepolia',
    payTo: process.env.PAYMENT_WALLET || '0x0000000000000000000000000000000000000000',
    description: 'Access to AI agent capabilities: Speak, Think, Remember, Post, Build',
    enabled: true,
    metadata: {
      features: ['speak', 'think', 'remember', 'post', 'build'],
      capabilities: ['text-to-speech', 'reasoning', 'memory', 'social-media', 'code-generation']
    }
  });

  // ============================================
  // SPEAK Endpoints
  // ============================================

  app.post('/api/ai/speak',
    monetizationAgent.createPaymentMiddleware('ai-agent-core'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { text, options } = req.body;
        
        if (!text) {
          res.status(400).json({
            success: false,
            error: 'Text is required'
          });
          return;
        }

        const result = await aiAgent.speak(text, options);
        
        res.json({
          success: result.success,
          audioUrl: result.audioUrl,
          error: result.error,
          paymentId: (req as any).paymentId
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ============================================
  // THINK Endpoints
  // ============================================

  app.post('/api/ai/think',
    monetizationAgent.createPaymentMiddleware('ai-agent-core'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { prompt, context } = req.body;
        
        if (!prompt) {
          res.status(400).json({
            success: false,
            error: 'Prompt is required'
          });
          return;
        }

        const thought = await aiAgent.think(prompt, context);
        
        res.json({
          success: true,
          thought,
          paymentId: (req as any).paymentId
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  app.get('/api/ai/thoughts', (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const thoughts = aiAgent.getThoughts(limit);
      
      res.json({
        success: true,
        thoughts,
        count: thoughts.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/ai/thoughts/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const thought = aiAgent.getThought(id);
      
      if (!thought) {
        res.status(404).json({
          success: false,
          error: 'Thought not found'
        });
        return;
      }

      res.json({
        success: true,
        thought
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // REMEMBER Endpoints
  // ============================================

  app.post('/api/ai/remember',
    monetizationAgent.createPaymentMiddleware('ai-agent-core'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { content, tags, importance } = req.body;
        
        if (!content) {
          res.status(400).json({
            success: false,
            error: 'Content is required'
          });
          return;
        }

        const memory = aiAgent.remember(
          content,
          tags || [],
          importance || 5
        );
        
        res.json({
          success: true,
          memory,
          paymentId: (req as any).paymentId
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  app.post('/api/ai/recall', (req: Request, res: Response) => {
    try {
      const { tags } = req.body;
      
      if (!tags || !Array.isArray(tags)) {
        res.status(400).json({
          success: false,
          error: 'Tags array is required'
        });
        return;
      }

      const memories = aiAgent.recall(tags);
      
      res.json({
        success: true,
        memories,
        count: memories.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/ai/memories/search', (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const memories = aiAgent.searchMemories(query as string);
      
      res.json({
        success: true,
        memories,
        count: memories.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/ai/memories', (req: Request, res: Response) => {
    try {
      const memories = aiAgent.getAllMemories();
      
      res.json({
        success: true,
        memories,
        count: memories.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.delete('/api/ai/memories/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = aiAgent.forget(id);
      
      res.json({
        success: deleted,
        message: deleted ? 'Memory forgotten' : 'Memory not found'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // POST Endpoints
  // ============================================

  app.post('/api/ai/post',
    monetizationAgent.createPaymentMiddleware('ai-agent-core'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { content, platform, metadata } = req.body;
        
        if (!content || !platform) {
          res.status(400).json({
            success: false,
            error: 'Content and platform are required'
          });
          return;
        }

        if (!['twitter', 'discord', 'telegram', 'reddit'].includes(platform)) {
          res.status(400).json({
            success: false,
            error: 'Invalid platform. Must be: twitter, discord, telegram, or reddit'
          });
          return;
        }

        const post = await aiAgent.post(content, platform, metadata);
        
        res.json({
          success: true,
          post,
          paymentId: (req as any).paymentId
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  app.get('/api/ai/posts', (req: Request, res: Response) => {
    try {
      const { platform, limit } = req.query;
      const posts = aiAgent.getPosts(
        platform as string,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json({
        success: true,
        posts,
        count: posts.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/ai/posts/:id/schedule', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { scheduleTime } = req.body;
      
      if (!scheduleTime) {
        res.status(400).json({
          success: false,
          error: 'Schedule time (timestamp) is required'
        });
        return;
      }

      const scheduled = aiAgent.schedulePost(id, scheduleTime);
      
      res.json({
        success: scheduled,
        message: scheduled ? 'Post scheduled' : 'Post not found'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // BUILD Endpoints
  // ============================================

  app.post('/api/ai/build',
    monetizationAgent.createPaymentMiddleware('ai-agent-core'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { type, description } = req.body;
        
        if (!type || !description) {
          res.status(400).json({
            success: false,
            error: 'Type and description are required'
          });
          return;
        }

        if (!['code', 'content', 'design', 'api', 'deployment'].includes(type)) {
          res.status(400).json({
            success: false,
            error: 'Invalid type. Must be: code, content, design, api, or deployment'
          });
          return;
        }

        const task = await aiAgent.build(type, description);
        
        res.json({
          success: true,
          task,
          paymentId: (req as any).paymentId
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  app.get('/api/ai/build', (req: Request, res: Response) => {
    try {
      const { status, limit } = req.query;
      const tasks = aiAgent.getBuildTasks(
        status as string,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json({
        success: true,
        tasks,
        count: tasks.length
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/ai/build/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const task = aiAgent.getBuildTask(id);
      
      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Build task not found'
        });
        return;
      }

      res.json({
        success: true,
        task
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================
  // STATS Endpoint
  // ============================================

  app.get('/api/ai/stats', (req: Request, res: Response) => {
    try {
      const stats = aiAgent.getStats();
      
      res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
}

