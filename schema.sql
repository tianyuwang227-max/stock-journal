CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_notes (
  id TEXT PRIMARY KEY,
  note_date TEXT NOT NULL,
  market_note TEXT,
  life_journal TEXT,
  quick_note TEXT,
  daily_review TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  industry TEXT,
  stage TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_research (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL,
  background TEXT,
  financing TEXT,
  revenue TEXT,
  position TEXT,
  upside TEXT,
  risk TEXT,
  summary TEXT,
  sources TEXT,
  custom_questions TEXT,
  report TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

CREATE TABLE IF NOT EXISTS decision_reviews (
  id TEXT PRIMARY KEY,
  stock TEXT,
  status TEXT NOT NULL,
  confidence INTEGER,
  reason TEXT,
  evidence TEXT,
  doubt TEXT,
  risk TEXT,
  buy_condition TEXT,
  drop_condition TEXT,
  review_date TEXT,
  result_review TEXT,
  checklist TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id TEXT PRIMARY KEY,
  title TEXT,
  goal TEXT,
  reflection TEXT,
  summary TEXT,
  week_start TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_tasks (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  title TEXT NOT NULL,
  target TEXT,
  priority TEXT,
  checks TEXT NOT NULL DEFAULT '[false,false,false,false,false,false,false]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES weekly_plans(id)
);

CREATE TABLE IF NOT EXISTS weekly_archives (
  id TEXT PRIMARY KEY,
  title TEXT,
  goal TEXT,
  summary TEXT,
  reflection TEXT,
  task_rate INTEGER,
  snapshot TEXT NOT NULL,
  archived_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS market_watch (
  id TEXT PRIMARY KEY,
  stock TEXT NOT NULL,
  status TEXT,
  change_text TEXT,
  trigger_condition TEXT,
  risk TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
