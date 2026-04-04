-- ========================================
-- CLEAN SETUP
-- ========================================
DROP DATABASE IF EXISTS alumni_vantage;
CREATE DATABASE alumni_vantage;
USE alumni_vantage;

-- ========================================
-- USERS
-- ========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    verification_token VARCHAR(255) DEFAULT NULL,
    verification_expires_at DATETIME DEFAULT NULL,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires DATETIME DEFAULT NULL,
    role ENUM('alumni', 'developer', 'admin') DEFAULT 'alumni',
    attended_event TINYINT(1) DEFAULT 0,
    appearance_count INT DEFAULT 0,
    last_appearance_date DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PROFILES
-- ========================================
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bio TEXT,
    linkedin_url VARCHAR(255),
    profile_image_url VARCHAR(255),
    monthly_wins INT DEFAULT 0,
    has_event_bonus TINYINT(1) DEFAULT 0,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_profiles_user UNIQUE (user_id)
);

-- ========================================
-- DEGREES
-- ========================================
CREATE TABLE degrees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    degree_name VARCHAR(255) NOT NULL,
    university_url VARCHAR(255),
    completion_date DATE NOT NULL,
    CONSTRAINT fk_degrees_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- CERTIFICATIONS
-- ========================================
CREATE TABLE certifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255),
    issue_date DATE,
    expiration_date DATE,
    credential_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_certifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- LICENSES
-- ========================================
CREATE TABLE licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_name VARCHAR(255) NOT NULL,
    awarding_body_url VARCHAR(255),
    completion_date DATE,
    CONSTRAINT fk_licenses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- SHORT COURSES
-- ========================================
CREATE TABLE short_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    course_url VARCHAR(255),
    completion_date DATE,
    CONSTRAINT fk_short_courses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- EMPLOYMENT HISTORY
-- ========================================
CREATE TABLE employment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    CONSTRAINT fk_employment_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- BIDS
-- ========================================
CREATE TABLE bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bid_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'won', 'lost', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    slot_date DATE DEFAULT NULL,
    CONSTRAINT fk_bids_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- FEATURED PROFILES
-- ========================================
CREATE TABLE featured_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    won_date DATE NOT NULL,
    is_active TINYINT(1) DEFAULT 0,
    CONSTRAINT fk_featured_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- API KEYS
-- ========================================
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    client_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    scope VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked TINYINT(1) DEFAULT 0,
    last_used_at TIMESTAMP NULL DEFAULT NULL,
    key_prefix VARCHAR(12) GENERATED ALWAYS AS (LEFT(api_key, 12)) STORED,
    usage_count INT DEFAULT 0,
    CONSTRAINT fk_api_keys_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);

-- ========================================
-- API LOGS
-- ========================================
CREATE TABLE api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    api_key_id INT NULL,
    method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_api_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_api_logs_api_key
        FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
        ON DELETE SET NULL
);

-- ========================================
-- TOKEN BLACKLIST
-- ========================================
CREATE TABLE token_blacklist (
    token VARCHAR(512) PRIMARY KEY,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- INDEXES
-- ========================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE INDEX idx_degrees_user_id ON degrees(user_id);

CREATE INDEX idx_certifications_user_id ON certifications(user_id);

CREATE INDEX idx_licenses_user_id ON licenses(user_id);

CREATE INDEX idx_short_courses_user_id ON short_courses(user_id);

CREATE INDEX idx_employment_history_user_id ON employment_history(user_id);

CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_slot_date ON bids(slot_date);

CREATE INDEX idx_featured_profiles_user_id ON featured_profiles(user_id);
CREATE INDEX idx_featured_profiles_won_date ON featured_profiles(won_date);
CREATE INDEX idx_featured_profiles_is_active ON featured_profiles(is_active);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_api_key ON api_keys(api_key);
CREATE INDEX idx_api_keys_is_revoked ON api_keys(is_revoked);

CREATE INDEX idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX idx_api_logs_api_key_id ON api_logs(api_key_id);
CREATE INDEX idx_api_logs_created_at ON api_logs(created_at);
CREATE INDEX idx_api_logs_endpoint ON api_logs(endpoint);

-- ========================================
-- OPTIONAL TEST DATA
-- Only developer user inserted
-- ========================================
INSERT INTO users (
    email,
    password_hash,
    is_verified,
    verification_token,
    verification_expires_at,
    reset_token,
    reset_token_expires,
    role,
    attended_event,
    appearance_count,
    last_appearance_date,
    created_at
) VALUES (
    'developer1@my.westminster.ac.uk',
    '$2b$10$YDFLNf7GpDAtQzGQsPrHpubqGyf3.XVxbchz.vwKU4otxYcCO2sKi',
    1,
    NULL,
    NULL,
    NULL,
    '2026-04-05 20:16:59',
    'developer',
    0,
    0,
    NULL,
    '2026-04-04 20:16:59'
);