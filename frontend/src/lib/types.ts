export type Emotion = string;
export type RetroType = string;
export type RetroCategory = string;

export interface UserOption {
  id: string;
  option_type: 'retro_type' | 'retro_category';
  label: string;
  sort_order: number;
}

export interface LogEntry {
  id: string;
  date: string;               // YYYY-MM-DD
  start_time: string | null;  // HH:MM (05:00〜29:50) or null
  end_time: string | null;    // HH:MM (05:00〜29:50) or null
  action: string;
  emotion: Emotion | null;    // null = 未選択
  created_at?: string;
  updated_at?: string;
}

export interface RetroEntry {
  id: string;
  date: string;          // YYYY-MM-DD
  type: RetroType;
  category: RetroCategory;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface WeekRange {
  from: string;   // YYYY-MM-DD (月曜日)
  to: string;     // YYYY-MM-DD (日曜日)
  label: string;  // 表示用: "2026/02/16 〜 2026/02/22"
}
