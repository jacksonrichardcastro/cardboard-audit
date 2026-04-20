-- P1-2: Support listing statuses and archiving via Soft Deletion
ALTER TABLE listings ADD COLUMN status varchar(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE listings ADD COLUMN deleted_at timestamp;
