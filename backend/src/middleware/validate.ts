import { Request, Response, NextFunction } from 'express';

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + 'T12:00:00');
  return !isNaN(d.getTime());
}

// HH:MM 形式、05:00〜29:50、10分刻み。null は許容。
function isValidTime(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(':').map(Number);
  if (h < 5 || h > 29) return false;
  if (m % 10 !== 0 || m > 50) return false;
  return true;
}

// ---- log_entries ----

export function validateLogPost(req: Request, res: Response, next: NextFunction): void {
  const { date, action, start_time, end_time } = req.body;

  if (!isValidDate(date)) {
    badRequest(res, 'date is required and must be YYYY-MM-DD'); return;
  }
  if (typeof action !== 'string' || action.trim() === '') {
    badRequest(res, 'action is required'); return;
  }
  if (action.length > 5000) {
    badRequest(res, 'action must be at most 5000 characters'); return;
  }
  if (!isValidTime(start_time ?? null)) {
    badRequest(res, 'start_time must be HH:MM (05:00-29:50, 10-min intervals) or null'); return;
  }
  if (!isValidTime(end_time ?? null)) {
    badRequest(res, 'end_time must be HH:MM (05:00-29:50, 10-min intervals) or null'); return;
  }

  next();
}

export function validateLogPatch(req: Request, res: Response, next: NextFunction): void {
  const { date, action, start_time, end_time } = req.body;

  if (date !== undefined && !isValidDate(date)) {
    badRequest(res, 'date must be YYYY-MM-DD'); return;
  }
  if (action !== undefined) {
    if (typeof action !== 'string' || action.trim() === '') {
      badRequest(res, 'action must be a non-empty string'); return;
    }
    if (action.length > 5000) {
      badRequest(res, 'action must be at most 5000 characters'); return;
    }
  }
  if (start_time !== undefined && !isValidTime(start_time)) {
    badRequest(res, 'start_time must be HH:MM (05:00-29:50, 10-min intervals) or null'); return;
  }
  if (end_time !== undefined && !isValidTime(end_time)) {
    badRequest(res, 'end_time must be HH:MM (05:00-29:50, 10-min intervals) or null'); return;
  }

  next();
}

// ---- retro_entries ----

export function validateRetroPost(req: Request, res: Response, next: NextFunction): void {
  const { date, type, category, content } = req.body;

  if (!isValidDate(date)) {
    badRequest(res, 'date is required and must be YYYY-MM-DD'); return;
  }
  if (typeof type !== 'string' || type.trim() === '') {
    badRequest(res, 'type is required'); return;
  }
  if (typeof category !== 'string' || category.trim() === '') {
    badRequest(res, 'category is required'); return;
  }
  if (typeof content !== 'string' || content.trim() === '') {
    badRequest(res, 'content is required'); return;
  }
  if (content.length > 5000) {
    badRequest(res, 'content must be at most 5000 characters'); return;
  }

  next();
}

export function validateRetroPatch(req: Request, res: Response, next: NextFunction): void {
  const { date, type, category, content } = req.body;

  if (date !== undefined && !isValidDate(date)) {
    badRequest(res, 'date must be YYYY-MM-DD'); return;
  }
  if (type !== undefined && (typeof type !== 'string' || type.trim() === '')) {
    badRequest(res, 'type must be a non-empty string'); return;
  }
  if (category !== undefined && (typeof category !== 'string' || category.trim() === '')) {
    badRequest(res, 'category must be a non-empty string'); return;
  }
  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim() === '') {
      badRequest(res, 'content must be a non-empty string'); return;
    }
    if (content.length > 5000) {
      badRequest(res, 'content must be at most 5000 characters'); return;
    }
  }

  next();
}

// ---- user_options ----

const VALID_OPTION_TYPES = ['retro_type', 'retro_category'] as const;

export function validateOptionPost(req: Request, res: Response, next: NextFunction): void {
  const { option_type, label } = req.body;

  if (!VALID_OPTION_TYPES.includes(option_type)) {
    badRequest(res, 'option_type must be one of: retro_type, retro_category'); return;
  }
  if (typeof label !== 'string' || label.trim() === '') {
    badRequest(res, 'label is required'); return;
  }

  next();
}
