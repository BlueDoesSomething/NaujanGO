-- Allow the agent role in the users and role_changes tables
ALTER TABLE `users`
  MODIFY COLUMN `role` enum('user','owner','admin','agent') NOT NULL DEFAULT 'user';

ALTER TABLE `role_changes`
  MODIFY COLUMN `old_role` enum('user','owner','admin','agent') DEFAULT NULL,
  MODIFY COLUMN `new_role` enum('user','owner','admin','agent') NOT NULL;
