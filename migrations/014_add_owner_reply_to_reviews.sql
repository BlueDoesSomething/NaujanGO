-- Migration: Add owner_reply column to reviews table
-- This allows hotel owners to respond to guest reviews

ALTER TABLE `reviews`
ADD COLUMN `owner_reply` TEXT DEFAULT NULL AFTER `comment`,
ADD COLUMN `owner_reply_date` DATETIME DEFAULT NULL AFTER `owner_reply`;
