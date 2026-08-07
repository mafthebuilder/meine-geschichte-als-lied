CREATE TABLE IF NOT EXISTS mhc_orders (
  id TEXT PRIMARY KEY,
  submission_id TEXT,
  payment_provider TEXT NOT NULL,
  provider_order_id TEXT NOT NULL,
  provider_payment_id TEXT,
  order_name TEXT NOT NULL,
  email TEXT,
  customer_name TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  fulfillment_status TEXT,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  selected_offer TEXT,
  express INTEGER NOT NULL DEFAULT 0,
  production_status TEXT NOT NULL DEFAULT 'to_create',
  delivery_file_key TEXT,
  delivery_file_name TEXT,
  delivery_token TEXT UNIQUE,
  provider_created_at TEXT NOT NULL,
  synced_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at TEXT,
  delivery_email_sent_at TEXT,
  delivery_email_message_id TEXT,
  delivery_email_count INTEGER NOT NULL DEFAULT 0,
  delivery_viewed_at TEXT,
  delivery_downloaded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(payment_provider, provider_order_id)
);

CREATE INDEX IF NOT EXISTS mhc_orders_submission_idx ON mhc_orders(submission_id);
CREATE INDEX IF NOT EXISTS mhc_orders_status_idx ON mhc_orders(production_status);
CREATE INDEX IF NOT EXISTS mhc_orders_provider_created_idx ON mhc_orders(provider_created_at);

CREATE TABLE IF NOT EXISTS mhc_revisions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  revision_type TEXT NOT NULL,
  message TEXT NOT NULL,
  song_moment TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES mhc_orders(id)
);

CREATE INDEX IF NOT EXISTS mhc_revisions_order_idx ON mhc_revisions(order_id);
CREATE INDEX IF NOT EXISTS mhc_revisions_status_idx ON mhc_revisions(status);

CREATE TABLE IF NOT EXISTS prospect_previews (
  submission_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'to_create',
  excerpt_file_key TEXT,
  excerpt_file_name TEXT,
  preview_token TEXT UNIQUE,
  preview_email_sent_at TEXT,
  preview_email_count INTEGER NOT NULL DEFAULT 0,
  preview_viewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id)
);

CREATE INDEX IF NOT EXISTS prospect_previews_status_idx ON prospect_previews(status);

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_name TEXT NOT NULL,
  session_id TEXT,
  submission_id TEXT,
  event_source TEXT NOT NULL DEFAULT 'browser',
  path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  value_cents INTEGER,
  currency TEXT,
  payment_provider TEXT,
  provider_id TEXT,
  metadata TEXT,
  occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS analytics_events_name_idx ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS analytics_events_submission_idx ON analytics_events(submission_id);
CREATE INDEX IF NOT EXISTS analytics_events_occurred_idx ON analytics_events(occurred_at);
CREATE INDEX IF NOT EXISTS analytics_events_campaign_idx ON analytics_events(utm_campaign);
