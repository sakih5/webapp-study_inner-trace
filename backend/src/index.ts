import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import logRouter from './routes/log';
import retroRouter from './routes/retro';
import settingsRouter from './routes/settings';

const app = express();
const port = Number(process.env.PORT ?? 8080);

// CORS設定
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000');
}

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// ルート
app.use('/v1/log', logRouter);
app.use('/v1/retro', retroRouter);
app.use('/v1/settings', settingsRouter);

// ヘルスチェック
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// グローバルエラーハンドラー
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
