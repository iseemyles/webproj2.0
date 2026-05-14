-- warning, deletes existing data
DROP DATABASE IF EXISTS webproj_db;
CREATE DATABASE webproj_db;
USE webproj_db;

-- auth table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- hashed
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- finish rates Table (para sa calc)
CREATE TABLE IF NOT EXISTS finish_rates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    finish_type VARCHAR(50) NOT NULL, -- unique ID e.g. 'basic'
    display_name VARCHAR(50) NOT NULL, -- Display label e.g. 'Basic/Bare'
    min_rate DECIMAL(10, 2) NOT NULL,
    max_rate DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255), -- Path to the finish image
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- map table
CREATE TABLE IF NOT EXISTS project_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- e.g. 'Interior Design', 'Renovation'
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    image_url VARCHAR(255), -- path sa project image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
