CREATE TABLE IF NOT EXISTS stripe_payment_sessions (
  payment_intent_id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  selected_offer TEXT NOT NULL,
  express INTEGER NOT NULL DEFAULT 0,
  email TEXT,
  status TEXT NOT NULL,
  fbp TEXT,
  fbc TEXT,
  client_ip TEXT,
  client_user_agent TEXT,
  event_source_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(submission_id) REFERENCES submissions(id)
);

CREATE INDEX IF NOT EXISTS stripe_payment_sessions_submission_idx
  ON stripe_payment_sessions(submission_id);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'processing',
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
