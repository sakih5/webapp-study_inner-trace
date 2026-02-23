import type { LogEntry, RetroEntry, UserOption } from '@/lib/types';

// 今日: 2026-02-23 (月)
// 今週: 2026-02-23 〜 2026-03-01
// 先週: 2026-02-16 〜 2026-02-22
// 先々週: 2026-02-09 〜 2026-02-15

export const MOCK_LOG_ENTRIES: LogEntry[] = [
  // 今週 ─────────────────────────────────
  {
    id: 'log-001',
    date: '2026-02-23',
    start_time: '09:00',
    end_time: '10:30',
    action: 'チームMTG（週次スプリント計画）',
    emotion: '集中',
  },
  {
    id: 'log-002',
    date: '2026-02-23',
    start_time: '11:00',
    end_time: '12:00',
    action: 'Inner Trace 設計書レビュー',
    emotion: '普通',
  },
  // 先週 ─────────────────────────────────
  {
    id: 'log-003',
    date: '2026-02-22',
    start_time: '09:30',
    end_time: '11:00',
    action: 'PoC設計書作成',
    emotion: '集中',
  },
  {
    id: 'log-004',
    date: '2026-02-22',
    start_time: '14:00',
    end_time: '15:30',
    action: '仕様確認MTG',
    emotion: '不安',
  },
  {
    id: 'log-005',
    date: '2026-02-22',
    start_time: '16:00',
    end_time: '18:00',
    action: 'フロントエンド実装（NavBarコンポーネント）',
    emotion: '達成感',
  },
  {
    id: 'log-006',
    date: '2026-02-21',
    start_time: '10:00',
    end_time: '12:00',
    action: 'コードレビュー対応',
    emotion: '疲れ',
  },
  {
    id: 'log-007',
    date: '2026-02-21',
    start_time: '13:00',
    end_time: '14:00',
    action: '1on1ミーティング（上長）',
    emotion: '普通',
  },
  {
    id: 'log-008',
    date: '2026-02-19',
    start_time: '09:00',
    end_time: '10:00',
    action: 'メール・Slack対応',
    emotion: null,
  },
  {
    id: 'log-009',
    date: '2026-02-19',
    start_time: '10:30',
    end_time: '12:30',
    action: 'DB設計レビュー・修正',
    emotion: '集中',
  },
  {
    id: 'log-010',
    date: '2026-02-17',
    start_time: '14:00',
    end_time: '16:00',
    action: 'テスト実施・バグ修正',
    emotion: '焦り',
  },
  // 先々週 ───────────────────────────────
  {
    id: 'log-011',
    date: '2026-02-13',
    start_time: '09:00',
    end_time: '11:00',
    action: '要件定義ドキュメント作成',
    emotion: '集中',
  },
  {
    id: 'log-012',
    date: '2026-02-13',
    start_time: '13:00',
    end_time: '14:30',
    action: 'ステークホルダーレビュー',
    emotion: '不安',
  },
  {
    id: 'log-013',
    date: '2026-02-10',
    start_time: '10:00',
    end_time: '12:00',
    action: '技術調査（Supabase RLS）',
    emotion: 'やる気',
  },
];

export const MOCK_RETRO_ENTRIES: RetroEntry[] = [
  // 先週 ─────────────────────────────────
  {
    id: 'retro-001',
    date: '2026-02-22',
    type: 'Keep',
    category: '仕事',
    content: '朝のタスク整理を15分かけてやったことで優先度が明確になり、集中して作業できた',
  },
  {
    id: 'retro-002',
    date: '2026-02-22',
    type: 'Problem',
    category: '生活',
    content: '昼食後に眠くなり30分ほど集中が途切れた。午後の生産性が落ちている',
  },
  {
    id: 'retro-003',
    date: '2026-02-22',
    type: 'Try',
    category: '生活',
    content: '昼食後に短い散歩（10分）を取り入れて眠気を防ぐ',
  },
  {
    id: 'retro-004',
    date: '2026-02-20',
    type: '学び',
    category: '勉強',
    content: 'Supabase RLSはポリシー設定を間違えると全データが見えなくなる。ローカルで十分テストすること',
  },
  // 先々週 ───────────────────────────────
  {
    id: 'retro-005',
    date: '2026-02-15',
    type: 'Keep',
    category: '仕事',
    content: 'PoC前に設計書を共有したことでMTGがスムーズに進んだ',
  },
  {
    id: 'retro-006',
    date: '2026-02-15',
    type: 'Try',
    category: '仕事',
    content: '週次で設計書を更新して常に最新の状態を保つ',
  },
];

export const MOCK_USER_OPTIONS: UserOption[] = [
  // retro_type
  { id: 'opt-t-01', option_type: 'retro_type', label: 'Keep',    sort_order: 0 },
  { id: 'opt-t-02', option_type: 'retro_type', label: 'Problem', sort_order: 1 },
  { id: 'opt-t-03', option_type: 'retro_type', label: 'Try',     sort_order: 2 },
  { id: 'opt-t-04', option_type: 'retro_type', label: '学び',    sort_order: 3 },
  // retro_category
  { id: 'opt-c-01', option_type: 'retro_category', label: '仕事', sort_order: 0 },
  { id: 'opt-c-02', option_type: 'retro_category', label: '勉強', sort_order: 1 },
  { id: 'opt-c-03', option_type: 'retro_category', label: '生活', sort_order: 2 },
];
