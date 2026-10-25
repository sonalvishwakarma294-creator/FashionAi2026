-- Run: mysql -u root -p fashion_ai < backend/schema.sql
-- CAUTION: Do NOT drop database in production
CREATE DATABASE IF NOT EXISTS fashion_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fashion_ai;

-- Users table (enhanced with hashed_password, is_admin)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  gender ENUM('male', 'female', 'other') DEFAULT 'female',
  member_since DATE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_gender (gender)
);

-- Feedback table
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins inherit from users (is_admin=true), or separate
INSERT INTO users (name, email, hashed_password, gender, member_since, is_admin, role) VALUES 
('Admin', 'admin@fashion.ai', '$2b$12$KIXp8Vq9g7YJ8z5XzK4L.uXzK7p8v9w0x1y2z3A4B5C6D7E8F9G0', 'other', '2024-01-01', TRUE, 'admin')
ON DUPLICATE KEY UPDATE hashed_password=hashed_password;

-- Outfits table (from gallery.json + metadata)
CREATE TABLE outfits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  image_path VARCHAR(500) NOT NULL,
  occasion ENUM('Casual', 'Office', 'Party', 'Traditional') NOT NULL,
  category VARCHAR(100),
  primary_color VARCHAR(50),
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSON,  -- extra: description, tags etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_occasion (occasion),
  INDEX idx_color (primary_color),
  INDEX idx_likes (likes)
);

-- Liked outfits (user-outfit relations)
CREATE TABLE liked_outfits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  outfit_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (outfit_id) REFERENCES outfits(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, outfit_id),
  INDEX idx_user (user_id)
);

-- User recommendations log
CREATE TABLE user_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rec_type VARCHAR(50),  -- 'personalized', 'color_match', etc.
  rec_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_type (user_id, rec_type)
);

-- Color combinations dataset
CREATE TABLE color_combinations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  primary_color VARCHAR(50) NOT NULL,
  matching_colors JSON NOT NULL,  -- ['White', 'Black', ...]
  occasions JSON,  -- ['casual', 'party']
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_primary (primary_color)
);

-- Populate color_combinations from existing logic
INSERT INTO color_combinations (primary_color, matching_colors) VALUES
('Teal', JSON_ARRAY('Coral', 'Gold', 'Ivory')),
('Emerald', JSON_ARRAY('Gold', 'Navy', 'Peach')),
('Navy', JSON_ARRAY('White', 'Gold', 'Red')),
('Gold', JSON_ARRAY('Black', 'Burgundy', 'Teal')),
('Burgundy', JSON_ARRAY('Gold', 'Navy', 'Ivory'))
ON DUPLICATE KEY UPDATE matching_colors=VALUES(matching_colors);

-- Migration script placeholder: outfits from gallery.json
-- TODO: Python script to load gallery.json and INSERT INTO outfits(image_path=name mapping, occasion)

-- Views for recs
CREATE VIEW outfit_recs AS
SELECT o.*, COUNT(lo.user_id) as like_count
FROM outfits o
LEFT JOIN liked_outfits lo ON o.id = lo.outfit_id
GROUP BY o.id
ORDER BY like_count DESC, o.likes DESC;

SELECT 'Database ready! Tables created.' as status;

