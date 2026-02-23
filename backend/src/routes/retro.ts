import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { validateRetroPost, validateRetroPatch } from '../middleware/validate';

const router = Router();

// GET /retro?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', authenticate, async (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (typeof from !== 'string' || typeof to !== 'string') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'from and to query params are required (YYYY-MM-DD)' } });
    return;
  }

  const { data, error } = await supabase
    .from('retro_entries')
    .select('id, date, type, category, content, created_at, updated_at')
    .eq('user_id', req.userId!)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  if (error) {
    console.error('GET /retro error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch retro entries' } });
    return;
  }

  res.json(data);
});

// POST /retro
router.post('/', authenticate, validateRetroPost, async (req: Request, res: Response) => {
  const { date, type, category, content } = req.body;

  const { data, error } = await supabase
    .from('retro_entries')
    .insert({ user_id: req.userId!, date, type, category, content })
    .select('id, date, type, category, content, created_at, updated_at')
    .single();

  if (error) {
    console.error('POST /retro error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create retro entry' } });
    return;
  }

  res.status(201).json(data);
});

// PATCH /retro/:id
router.patch('/:id', authenticate, validateRetroPatch, async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('retro_entries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Retro entry not found' } });
    return;
  }

  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    return;
  }

  const allowedFields = ['date', 'type', 'category', 'content'];
  const patch: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in req.body) patch[field] = req.body[field];
  }

  const { data, error } = await supabase
    .from('retro_entries')
    .update(patch)
    .eq('id', id)
    .select('id, date, type, category, content, created_at, updated_at')
    .single();

  if (error) {
    console.error('PATCH /retro/:id error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update retro entry' } });
    return;
  }

  res.json(data);
});

// DELETE /retro/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('retro_entries')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Retro entry not found' } });
    return;
  }

  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    return;
  }

  const { error } = await supabase
    .from('retro_entries')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('DELETE /retro/:id error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete retro entry' } });
    return;
  }

  res.status(204).send();
});

export default router;
