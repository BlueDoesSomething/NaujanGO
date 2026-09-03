-- Add conversation assignment fields for multi-agent moderation
ALTER TABLE `chatbot_conversations`
  ADD COLUMN IF NOT EXISTS `claimed_by` int(11) DEFAULT NULL AFTER `user_id`,
  ADD COLUMN IF NOT EXISTS `claimed_at` timestamp NULL DEFAULT NULL AFTER `claimed_by`,
  ADD INDEX IF NOT EXISTS `idx_chatbot_conversations_claimed_by` (`claimed_by`),
  ADD INDEX IF NOT EXISTS `idx_chatbot_conversations_claimed_at` (`claimed_at`),
  ADD CONSTRAINT `fk_chatbot_conversations_claimed_by`
    FOREIGN KEY (`claimed_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL;
