-- Add moderation fields to chatbot_messages
ALTER TABLE chatbot_messages
  ADD COLUMN flagged TINYINT(1) DEFAULT 0,
  ADD COLUMN flag_reason VARCHAR(255) NULL,
  ADD COLUMN moderated_by INT NULL,
  ADD COLUMN moderated_at DATETIME NULL;

-- Optional: index for quick queries on flagged messages
CREATE INDEX IF NOT EXISTS idx_chatbot_messages_flagged ON chatbot_messages(flagged);
