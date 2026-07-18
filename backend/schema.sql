CREATE TABLE IF NOT EXISTS booking_requests (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  arrival TEXT NOT NULL,
  departure TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  adults INTEGER NOT NULL,
  teens INTEGER NOT NULL,
  children INTEGER NOT NULL,
  guests INTEGER NOT NULL,
  pets INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL DEFAULT '',
  quote_cents INTEGER NOT NULL,
  verification_id TEXT,
  verification_url TEXT,
  verification_report_url TEXT,
  verification_status TEXT,
  owner_token_hash TEXT,
  owner_token_expires_at TEXT,
  stripe_customer_id TEXT,
  stripe_invoice_id TEXT UNIQUE,
  payment_expires_at TEXT,
  calendar_event_id TEXT,
  last_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_booking_dates ON booking_requests(arrival, departure);
CREATE INDEX IF NOT EXISTS idx_booking_verification ON booking_requests(verification_id);

CREATE TABLE IF NOT EXISTS payment_holds (
  night TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_holds_booking ON payment_holds(booking_id);

CREATE TABLE IF NOT EXISTS processed_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  processed_at TEXT NOT NULL,
  PRIMARY KEY (provider, event_id)
);
