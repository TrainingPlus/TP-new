CREATE DATABASE IF NOT EXISTS `tp_main_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `tp_main_db`;

-- Users Table (Employees, Managers, Operators)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('operator', 'manager', 'employee') NOT NULL DEFAULT 'employee',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Student Directory Table
CREATE TABLE IF NOT EXISTS `students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `cpr` VARCHAR(9) NOT NULL UNIQUE,
    `full_name_en` VARCHAR(150) NOT NULL,
    `full_name_ar` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `course_name` VARCHAR(100) NOT NULL,
    `status` ENUM('Active', 'Graduated', 'Suspended') DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default sample users (Password: 123456)
INSERT INTO `users` (`name`, `email`, `password`, `role`) VALUES
('Operator User', 'operator@tp.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11.q/KCS7pE8fV1q0Jt.uT/O3oB20G6', 'operator'),
('Manager User', 'manager@tp.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11.q/KCS7pE8fV1q0Jt.uT/O3oB20G6', 'manager'),
('Employee User', 'employee@tp.com', '$2y$10$e0MYzXyjpJS7Pd0RVvHwHe11.q/KCS7pE8fV1q0Jt.uT/O3oB20G6', 'employee');
