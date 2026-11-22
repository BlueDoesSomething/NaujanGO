-- DESTRUCTIVE, MANUAL cleanup explicitly requested for test Reviews and Itinerary data.
-- Back up the backend database and select it before running this WHOLE file.
-- Requires CREATE ROUTINE privileges and migration 049's archive table.
-- 
-- Only test data authorised: Reviews linked to Naujan Travellers Inn hotel/bookings,
-- and Itineraries in 'draft' or 'planning' state at Naujan Travellers Inn.
-- Personal review content and archive entries are removed for every viewer.
-- User accounts, bookings, and audit logs are retained.
-- Existing foreign keys may detach reviews from deleted bookings (ON DELETE SET NULL).
-- Do not disable foreign-key checks. Any SQL error rolls back all row changes.
-- Rerunning after success is a no-op; already-missing IDs are allowed.
--
-- Optional preview: run SET @migration_054_dry_run = 1; BEFORE this file.
-- Dry run performs the cleanup and then ROLLS BACK, returning would-delete counts.
-- To apply afterwards, SET @migration_054_dry_run = 0; and rerun this file.
-- Default (unset or 0): COMMIT the permanent cleanup. Backup is the only undo.

SELECT DATABASE() AS target_database;

DROP PROCEDURE IF EXISTS migration_054_cleanup_reviews_itineraries;

DELIMITER $$
CREATE PROCEDURE migration_054_cleanup_reviews_itineraries()
BEGIN
    DECLARE v_dry_run BOOLEAN DEFAULT FALSE;
    DECLARE v_required_tables INT DEFAULT 0;
    DECLARE v_wrong_hotel INT DEFAULT 0;
    DECLARE v_matched_reviews INT DEFAULT 0;
    DECLARE v_deleted_reviews INT DEFAULT 0;
    DECLARE v_matched_itineraries INT DEFAULT 0;
    DECLARE v_deleted_itineraries INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        DROP TEMPORARY TABLE IF EXISTS tmp_m054_test_ids;
        RESIGNAL;
    END;

    SET v_dry_run = COALESCE(@migration_054_dry_run, 0) = 1;

    -- Refuse nontransactional or missing tables before deleting any rows.
    SELECT COUNT(*) INTO v_required_tables
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('hotel_bookings', 'hotel_payments', 'dashboard_record_archives',
                         'itineraries', 'itinerary_items', 'itinerary_attractions',
                         'reviews')
      AND ENGINE = 'InnoDB';

    IF v_required_tables < 6 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Migration 054 requires InnoDB tables for reviews, itineraries, and bookings. Apply migration 049 first.';
    END IF;

    DROP TEMPORARY TABLE IF EXISTS tmp_m054_test_ids;
    CREATE TEMPORARY TABLE tmp_m054_test_ids (
        id INT NOT NULL PRIMARY KEY,
        type VARCHAR(20) NOT NULL
    ) ENGINE = InnoDB;

    INSERT INTO tmp_m054_test_ids (id, type) VALUES
        (170, 'review'), (171, 'review'), (172, 'review'),
        (1, 'itinerary'), (2, 'itinerary'); -- placeholder itinerary IDs

    START TRANSACTION;

    -- Review deletion: only reviews linked to Naujan Travellers Inn hotel or its bookings
    SELECT COUNT(*) INTO v_wrong_hotel
    FROM reviews r
    INNER JOIN hotel_bookings b ON b.booking_id = r.booking_id
    WHERE COALESCE(b.hotel_name, '') <> 'Naujan Travellers Inn';

    IF v_wrong_hotel > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Migration 054 stopped: a reviewed booking belongs to a different hotel. Nothing was deleted.';
    END IF;

    -- Delete reviews linked to Naujan Travellers Inn hotel (via hotel_id) or its bookings (via booking_id)
    DELETE r
    FROM reviews r
    INNER JOIN hotel_bookings b ON b.booking_id = r.booking_id
    WHERE b.hotel_name = 'Naujan Travellers Inn';
    SET v_deleted_reviews = ROW_COUNT();

    -- Also delete reviews that have hotel_id directly set to Naujan Travellers Inn hotel_id
    -- (hotel_id in reviews corresponds to the hotel the review is for)
    -- We need to find the hotel_id for Naujan Travellers Inn
    SET @naijan_hotel_id = (SELECT hotel_id FROM hotels WHERE name = 'Naujan Travellers Inn');
    IF @naijan_hotel_id IS NOT NULL THEN
        DELETE r
        FROM reviews r
        WHERE r.hotel_id = @naijan_hotel_id;
        SET v_deleted_reviews = v_deleted_reviews + ROW_COUNT();
    END IF;

    -- Itinerary deletion: only itineraries in 'draft' or 'planning' state at Naujan Travellers Inn
    SELECT COUNT(*) INTO v_matched_itineraries
    FROM itineraries i
    WHERE i.hotel_name = 'Naujan Travellers Inn'
      AND i.status IN ('draft', 'planning');

    -- Delete itineraries in draft/planning state at Naujan Travellers Inn
    DELETE i
    FROM itineraries i
    WHERE i.hotel_name = 'Naujan Travellers Inn'
      AND i.status IN ('draft', 'planning');
    SET v_deleted_itineraries = ROW_COUNT();

    IF v_deleted_reviews = 0 AND v_deleted_itineraries = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Migration 054: no eligible test records found to delete. All row changes were rolled back.';
    END IF;

    IF v_dry_run THEN
        ROLLBACK;
    ELSE
        COMMIT;
    END IF;

    DROP TEMPORARY TABLE tmp_m054_test_ids;

    SELECT IF(v_dry_run, 'DRY RUN: rolled back; counts are would-delete totals', 'COMMITTED: test records permanently deleted') AS result,
        v_deleted_reviews AS review_count,
        v_deleted_itineraries AS itinerary_count;
END$$
DELIMITER ;

CALL migration_054_cleanup_reviews_itineraries();
DROP PROCEDURE migration_054_cleanup_reviews_itineraries;