-- Add provider_response column to hotel_payments table
ALTER TABLE `hotel_payments`
ADD COLUMN `provider_response` TEXT DEFAULT NULL AFTER `card_last4`;
