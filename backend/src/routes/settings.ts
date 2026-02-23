import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticate } from '../middleware/auth';
import { validateOptionPost } from '../middleware/validate';

const router = Router();

const VALID_OPTION_TYPES = ['retro_type', 'retro_category'];

// GET /settings/options?type=retro_type|retro_category
router.get('/options', authenticate, async (req: Request, res: Response) => {
  const { type } = req.query;

  if (typeof type !== 'string' || !VALID_OPTION_TYPES.includes(type)) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'type must be one of: retro_type, retro_category' } });
    return;
  }

  const { data, error } = await supabase
    .from('user_options')
    .select('id, option_type, label, sort_order')
    .eq('user_id', req.userId!)
    .eq('option_type', type)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('GET /settings/options error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch options' } });
    return;
  }

  res.json(data);
});

// POST /settings/options
router.post('/options', authenticate, validateOptionPost, async (req: Request, res: Response) => {
  const { option_type, label } = req.body;

  // sort_order: 既存の最大値 + 1
  const { data: maxData } = await supabase
    .from('user_options')
    .select('sort_order')
    .eq('user_id', req.userId!)
    .eq('option_type', option_type)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxData?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from('user_options')
    .insert({ user_id: req.userId!, option_type, label: label.trim(), sort_order })
    .select('id, option_type, label, sort_order')
    .single();

  if (error) {
    console.error('POST /settings/options error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create option' } });
    return;
  }

  res.status(201).json(data);
});

// DELETE /settings/options/:id
router.delete('/options/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data: existing, error: fetchError } = await supabase
    .from('user_options')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Option not found' } });
    return;
  }

  if (existing.user_id !== req.userId) {
    res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
    return;
  }

  const { error } = await supabase
    .from('user_options')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('DELETE /settings/options/:id error:', error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete option' } });
    return;
  }

  res.status(204).send();
});

export default router;
