-- Migration: add `sender` column to chatbot_messages
-- Adds a sender field to distinguish 'user', 'bot', and 'human' messages.

ALTER TABLE chatbot_messages
  ADD COLUMN sender VARCHAR(16) NOT NULL DEFAULT 'user';

-- Backfill: set sender = 'user' for existing rows (default already handles this)
-- New human messages should be inserted with sender='human'.
