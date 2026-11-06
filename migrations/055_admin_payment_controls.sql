-- Additive only. Does not alter bookings, payment history or gateway settings.
-- Back up and select the backend database before applying.
CREATE TABLE IF NOT EXISTS booking_payment_policy (
  policy_id INT PRIMARY KEY,
  online_payments_enabled TINYINT NOT NULL DEFAULT 0,
  lock_version INT NOT NULL DEFAULT 1,
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO booking_payment_policy (policy_id, online_payments_enabled) VALUES (1, 0);

CREATE TABLE IF NOT EXISTS booking_payment_policy_audit (
  audit_id INT AUTO_INCREMENT PRIMARY KEY,
  online_payments_enabled TINYINT NOT NULL,
  changed_by INT NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No cascading deletion: booking communication is part of its history.
-- Every read/write is scoped to the booking guest or currently linked owners.
CREATE TABLE IF NOT EXISTS booking_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  sender_id INT NOT NULL,
  sender_role VARCHAR(16) NOT NULL,
  client_key VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_booking_message_retry (booking_id, sender_id, client_key),
  KEY idx_booking_messages (booking_id, message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
