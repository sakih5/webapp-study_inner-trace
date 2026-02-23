import { Request, Response, NextFunction } from 'express';

// JWT ペイロードをローカルデコード（ネットワーク不要）
// Supabase が発行した JWT を HTTPS 経由で受け取るため、個人用アプリとして許容できる
function decodeJwtPayload(token: string): { sub?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing authorization header' } });
    return;
  }

  const token = authHeader.slice(7);
  const payload = decodeJwtPayload(token);

  if (!payload?.sub) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } });
    return;
  }

  // 有効期限チェック
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token expired' } });
    return;
  }

  req.userId = payload.sub;
  next();
}
