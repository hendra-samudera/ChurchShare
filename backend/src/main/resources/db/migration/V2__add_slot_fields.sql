ALTER TABLE document_slot
    ADD COLUMN category          VARCHAR(50)  NOT NULL DEFAULT 'Announcements',
    ADD COLUMN description       TEXT,
    ADD COLUMN view_count        BIGINT       NOT NULL DEFAULT 0,
    ADD COLUMN original_filename VARCHAR(255);
