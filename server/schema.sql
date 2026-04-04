-- ========================================
-- DROP DATABASE (for clean testing)
-- ========================================
DROP DATABASE IF EXISTS alumni_influencer;
CREATE DATABASE alumni_influencer;
USE alumni_influencer;

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('alumni','developer','admin') DEFAULT 'alumni',
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- PROFILE TABLE
-- ========================================
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    bio TEXT,
    linkedin_url VARCHAR(255),
    profile_image VARCHAR(255),
    appearance_count INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- DEGREES
-- ========================================
CREATE TABLE degrees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(255),
    institution VARCHAR(255),
    url VARCHAR(255),
    completion_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- CERTIFICATIONS
-- ========================================
CREATE TABLE certifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    provider VARCHAR(255),
    url VARCHAR(255),
    completion_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- LICENSES
-- ========================================
CREATE TABLE licenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    authority VARCHAR(255),
    url VARCHAR(255),
    completion_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- PROFESSIONAL COURSES
-- ========================================
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    provider VARCHAR(255),
    url VARCHAR(255),
    completion_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- EMPLOYMENT HISTORY
-- ========================================
CREATE TABLE employment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    company VARCHAR(255),
    role VARCHAR(255),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- BIDS TABLE
-- ========================================
CREATE TABLE bids (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    bid_amount DECIMAL(10,2),
    bid_date DATE,
    status ENUM('pending','winning','lost') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- FEATURED ALUMNUS TABLE
-- ========================================
CREATE TABLE featured_alumni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    feature_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- API KEYS TABLE
-- ========================================
CREATE TABLE api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    usage_count INT DEFAULT 0,
    last_used_at DATETIME,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- EMAIL VERIFICATION TOKENS
-- ========================================
CREATE TABLE email_verification_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255),
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- PASSWORD RESET TOKENS
-- ========================================
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    token VARCHAR(255),
    expires_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX idx_bid_user ON bids(user_id);
CREATE INDEX idx_api_key ON api_keys(api_key);
CREATE INDEX idx_featured_date ON featured_alumni(feature_date);
