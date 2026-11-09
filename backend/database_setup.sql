-- Municipal Complaint Portal Database Setup
-- Run this entire script to set up the database from scratch

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS municipal_complaint_portal;
USE municipal_complaint_portal;

-- 2. Create users table with specialization column
CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  specialization VARCHAR(50) DEFAULT 'Other',
  PRIMARY KEY (id)
);

-- 3. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (id)
);

-- 4. Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- 5. Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  assigned_officer_id INT,
  category VARCHAR(100),
  priority VARCHAR(50),
  summary VARCHAR(500),
  location VARCHAR(255),
  status VARCHAR(100) DEFAULT 'PENDING',
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_officer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. Insert default roles (using IGNORE to avoid duplicates)
INSERT IGNORE INTO roles (name) VALUES ('admin'), ('officer'), ('citizen');

-- 7. Create admin user if not exists (password: admin123 - change in production!)
-- This is optional, uncomment if you want a default admin
-- INSERT IGNORE INTO users (id, name, email, password, specialization)
-- VALUES (1, 'System Admin', 'admin@municipal.gov', '$2b$10$YourHashedPasswordHere', 'Other');
-- INSERT IGNORE INTO user_roles (user_id, role_id)
-- SELECT 1, id FROM roles WHERE name = 'admin';