-- Add per-hotel payment method controls
ALTER TABLE hotels
ADD COLUMN IF NOT EXISTS allowed_payment_methods VARCHAR(255) NOT NULL DEFAULT 'card,gcash,paypal,bank_transfer,pay_at_property';

UPDATE hotels
SET allowed_payment_methods = 'card,gcash,paypal,bank_transfer,pay_at_property'
WHERE allowed_payment_methods IS NULL OR TRIM(allowed_payment_methods) = '';
