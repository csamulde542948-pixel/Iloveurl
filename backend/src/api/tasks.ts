import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';

const router = Router();

// GET /api/tasks/stats/summary - Public aggregate counters for homepage/product stats
router.get('/stats/summary', async (_req: Request, res: Response) => {
  try {
    const { count, error } = await supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');

    if (error) {
      console.error('Fetch Task Stats Error:', error);
      return res.status(500).json({ error: 'Failed to fetch task stats' });
    }

    return res.status(200).json({
      urlsTransformed: count || 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Fetch Task Stats Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/:id - Retrieve a specific task by ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (data.user_id && data.user_id !== req.authUserId) {
      return res.status(403).json({ error: 'You do not have access to this task.' });
    }

    // Transform result to match the tool response format
    const response = {
      id: data.id,
      status: data.status, // Include status for polling
      url: data.payload?.url,
      title: data.result?.title || data.type.replace('-', ' ').toUpperCase(),
      summary: data.result?.summary,
      error: data.result?.error,
      errorDetail: data.result?.errorDetail,
      screenshots: data.result?.screenshots,
      screenshot: data.result?.screenshot,
      logs: data.logs || [], // Include live logs
      data: data.result,
      timestamp: data.created_at
    };

    return res.status(200).json(response);
  } catch (err: any) {
    console.error('Fetch Task Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/history/:userId - Retrieve history for a user
router.get('/history/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!req.authUserId) {
    return res.status(401).json({ error: 'Sign in to view history.' });
  }

  if (req.authUserId !== userId) {
    return res.status(403).json({ error: 'You do not have access to this history.' });
  }
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('id, type, status, payload, result, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch history' });
    }

    const taskIds = (data || []).map((task) => task.id).filter(Boolean);
    const creditUsageByTask = new Map<string, number>();

    if (taskIds.length > 0) {
      const { data: ledgerRows, error: ledgerError } = await supabase
        .from('credit_ledger')
        .select('task_id, credits')
        .eq('user_id', userId)
        .eq('direction', 'debit')
        .eq('reason', 'tool_run')
        .in('task_id', taskIds);

      if (ledgerError) {
        console.warn('Fetch History Credit Ledger Warning:', ledgerError);
      } else {
        (ledgerRows || []).forEach((row: any) => {
          if (!row.task_id) return;
          creditUsageByTask.set(row.task_id, (creditUsageByTask.get(row.task_id) || 0) + Number(row.credits || 0));
        });
      }
    }

    const history = (data || []).map((task: any) => {
      const ledgerCredits = creditUsageByTask.get(task.id);
      const legacyCompletedCredits = task.status === 'completed' ? Number(task.payload?.credits || 0) : 0;
      return {
        ...task,
        credits_used: ledgerCredits ?? legacyCompletedCredits,
      };
    });

    return res.status(200).json(history);
  } catch (err: any) {
    console.error('Fetch History Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
