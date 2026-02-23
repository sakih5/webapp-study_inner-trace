-- ============================================================
-- Inner Trace — Supabase スキーマ
-- Supabase ダッシュボード > SQL Editor で実行する
-- ============================================================

-- ------------------------------------------------------------
-- 1. log_entries（行動・感情記録）
-- ------------------------------------------------------------
CREATE TABLE public.log_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  start_time  text        NULL,  -- HH:MM 形式 (05:00〜29:50)
  end_time    text        NULL,  -- HH:MM 形式 (05:00〜29:50)
  action      text        NOT NULL,
  emotion     text        NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_log_user_date ON public.log_entries (user_id, date DESC);

-- ------------------------------------------------------------
-- 2. retro_entries（振り返り）
-- ------------------------------------------------------------
CREATE TABLE public.retro_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date        NOT NULL,
  type        text        NOT NULL,
  category    text        NOT NULL,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_retro_user_date ON public.retro_entries (user_id, date DESC);

-- ------------------------------------------------------------
-- 3. user_options（タイプ・カテゴリ共通オプション）
-- ------------------------------------------------------------
CREATE TABLE public.user_options (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_type text        NOT NULL CHECK (option_type IN ('retro_type', 'retro_category')),
  label       text        NOT NULL,
  sort_order  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_options_user_type ON public.user_options (user_id, option_type, sort_order);

-- ------------------------------------------------------------
-- 4. updated_at 自動更新トリガー
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_updated_at
  BEFORE UPDATE ON public.log_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_retro_updated_at
  BEFORE UPDATE ON public.retro_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ------------------------------------------------------------
-- 5. Row Level Security
-- ------------------------------------------------------------
ALTER TABLE public.log_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retro_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_options  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own rows only" ON public.log_entries
  USING (user_id = auth.uid());
CREATE POLICY "own rows only" ON public.retro_entries
  USING (user_id = auth.uid());
CREATE POLICY "own rows only" ON public.user_options
  USING (user_id = auth.uid());

-- ------------------------------------------------------------
-- 6. ユーザー登録時の初期オプションシード
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_options (user_id, option_type, label, sort_order) VALUES
    (NEW.id, 'retro_type',     'Keep',       0),
    (NEW.id, 'retro_type',     'Problem',    1),
    (NEW.id, 'retro_type',     'Try',        2),
    (NEW.id, 'retro_type',     '学び',       3),
    (NEW.id, 'retro_category', '仕事',       0),
    (NEW.id, 'retro_category', '勉強',       1),
    (NEW.id, 'retro_category', '生活',       2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
