import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { validateLogPost, validateLogPatch } from '../middleware/validate';

const router = Router();

// GET /log?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (typeof from !== 'string' || typeof to !== 'string') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'from and to query params are required (YYYY-MM-DD)' } });
    return;
  }

  const { data, error } = await supabase
    .from('log_entries')
    .select('id, date, start_time, end_time, action, emotion, created_at, updated_at')
    .eq('user_id', req.userId!)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  if (error) {
    console.error('GET /log error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch log entries' } });
    return;
  }

  res.json(data);
});

// POST /log
router.post('/', authenticate, validateLogPost, async (req: Request, res: Response) => {
  const { date, action, start_time = null, end_time = null, emotion = null } = req.body;

  const { data, error } = await supabase
    .from('log_entries')
    .insert({ user_id: req.userId!, date, action, start_time, end_time, emotion })
    .select('id, date, start_time, end_time, action, emotion, created_at, updated_at')
    .single();

  if (error) {
    console.error('POST /log error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create log entry' } });
    return;
  }

  res.status(201).json(data);
});

// PATCH /log/:id
router.patch('/:id', authenticate, validateLogPatch, async (req: Request, res: Response) => {
  const { id } = req.params;

  // 所有権確認
  const { data: existing, error: fetchError } = await supabase
    .from('log_entries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Log entry not found' } });
    return;
  }

  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    return;
  }

  // 許可フィールドのみ抽出
  const allowedFields = ['date', 'action', 'start_time', 'end_time', 'emotion'];
  const patch: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in req.body) patch[field] = req.body[field];
  }

  const { data, error } = await supabase
    .from('log_entries')
    .update(patch)
    .eq('id', id)
    .select('id, date, start_time, end_time, action, emotion, created_at, updated_at')
    .single();

  if (error) {
    console.error('PATCH /log/:id error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update log entry' } });
    return;
  }

  res.json(data);
});

// DELETE /log/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('log_entries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Log entry not found' } });
    return;
  }

  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    return;
  }

  const { error } = await supabase
    .from('log_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('DELETE /log/:id error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete log entry' } });
    return;
  }

  res.status(204).send();
});

export default router;
