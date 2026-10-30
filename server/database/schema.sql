
-- ==========================================
-- SWEETY - BLOOD GLUCOSE TRACKER
-- PostgreSQL Database Schema
-- ==========================================

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Glucose readings table
CREATE TABLE IF NOT EXISTS glucose_readings (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    reading_date DATE NOT NULL,

    time_slot VARCHAR(30) NOT NULL
        CHECK (
            time_slot IN (
                'morning',
                'after_breakfast',
                'after_lunch',
                'after_dinner'
            )
        ),

    glucose_value INTEGER NOT NULL
        CHECK (glucose_value BETWEEN 40 AND 600),

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate slots for the same user and date.
    UNIQUE (user_id, reading_date, time_slot)
);

-- 3. Indexes for faster report queries
CREATE INDEX IF NOT EXISTS idx_readings_user_date
ON glucose_readings(user_id, reading_date);

CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email);
