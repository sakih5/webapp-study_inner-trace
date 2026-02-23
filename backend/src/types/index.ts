export interface LogEntry {
  id: string;
  user_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  action: string;
  emotion: string | null;
  created_at: string;
  updated_at: string;
}

export interface RetroEntry {
  id: string;
  user_id: string;
  date: string;
  type: string;
  category: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface UserOption {
  id: string;
  user_id: string;
  option_type: 'emotion' | 'retro_type' | 'retro_category';
  label: string;
  sort_order: number;
  created_at: string;
}

// Express Request の拡張（認証済みリクエストに userId を付与）
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
