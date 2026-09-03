-- Add last_conversation tracking for logged-in users
-- This table stores the most recent conversation for each logged-in user

CREATE TABLE IF NOT EXISTS `user_last_conversation` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_unique` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`conversation_id`) REFERENCES `chatbot_conversations`(`conversation_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS `idx_user_last_conversation` ON `user_last_conversation`(`user_id`, `last_updated_at`);
