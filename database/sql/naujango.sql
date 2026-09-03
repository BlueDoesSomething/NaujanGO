-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 31, 2026 at 01:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `naujango`
--

-- --------------------------------------------------------

--
-- Table structure for table `attractions`
--

CREATE TABLE `attractions` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attractions`
--

INSERT INTO `attractions` (`id`, `name`, `description`, `municipality`, `location`, `image_url`, `created_at`, `latitude`, `longitude`) VALUES
(1, '333 Steps', 'With the complete description about the stairs, altar, and panoramic views', 'Naujan', 'Naujan Lake, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606659/333_k2r7eb.jpg', '2025-11-24 11:01:24', 12.271, 121.194),
(2, 'Arangin Falls', 'With details about the multi-level waterfall and picnic area', 'Naujan', 'Barangay Panaytayan, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606650/arangin_zy1dab.jpg', '2025-11-24 11:01:24', 12.31, 121.223),
(3, 'Naujan Town Plaza', 'With information about Liwasang Bonifacio and town events', 'Naujan', 'Ormin, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606628/plaza_bduwz9.jpg', '2025-11-24 11:01:24', 12.404, 121.225),
(4, 'Naujan Lake', 'Naujan Lake is the fifth largest lake in the Philippines and the largest freshwater lake in Oriental Mindoro and is declared as a “wetland of international importance” by the Ramsar Convention. It is bordered by the Municipalities of Naujan, Victoria, Socorro and Pola. The lake is home to a wide variety of fish and water birds both local and migratory.', 'Naujan', 'Mt. Halcon, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764605449/nuajanlake_yaydxh.jpg', '2025-11-24 11:01:24', 12.433, 121.15);

-- --------------------------------------------------------

--
-- Table structure for table `chatbot_conversations`
--

CREATE TABLE `chatbot_conversations` (
  `conversation_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `claimed_by` int(11) DEFAULT NULL,
  `claimed_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chatbot_conversations`
--

INSERT INTO `chatbot_conversations` (`conversation_id`, `user_id`, `started_at`) VALUES
(1, NULL, '2025-11-24 08:57:44'),
(2, NULL, '2025-11-24 10:28:32'),
(3, NULL, '2025-11-26 02:26:59'),
(4, NULL, '2025-12-01 12:24:21'),
(5, NULL, '2025-12-02 05:33:04'),
(6, NULL, '2025-12-02 05:33:04'),
(7, NULL, '2025-12-02 05:33:04'),
(8, NULL, '2025-12-02 06:36:15'),
(9, NULL, '2025-12-03 17:39:02'),
(10, NULL, '2026-01-15 10:47:05'),
(11, NULL, '2026-01-17 06:20:26'),
(12, NULL, '2026-01-17 06:46:46'),
(13, NULL, '2026-01-21 10:21:17'),
(14, NULL, '2026-01-21 10:32:23'),
(15, NULL, '2026-01-21 14:05:07'),
(16, NULL, '2026-01-30 09:30:26');

-- --------------------------------------------------------

--
-- Table structure for table `chatbot_messages`
--

CREATE TABLE `chatbot_messages` (
  `message_id` int(11) NOT NULL,
  `conversation_id` int(11) DEFAULT NULL,
  `message_text` text NOT NULL,
  `response_text` text DEFAULT NULL,
  `language` varchar(10) DEFAULT 'en',
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chatbot_messages`
--

INSERT INTO `chatbot_messages` (`message_id`, `conversation_id`, `message_text`, `response_text`, `language`, `sent_at`) VALUES
(1, 1, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-11-24 08:57:44'),
(2, 2, 'Hello', 'Hello! I am the Naujan Chatbot Assistant. How can I help you with information about the Municipality of Naujan, Oriental Mindoro?', 'en', '2025-11-24 10:28:32'),
(3, 2, 'Naujan', 'Naujan es un Municipio de Primera Clase en la provincia de Oriental Mindoro, Filipinas.', 'en', '2025-11-24 10:29:15'),
(4, 2, 'Thank you', 'Salamat din! Have a great day.', 'en', '2025-11-24 10:29:47'),
(5, 3, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-11-26 02:26:59'),
(6, 3, 'Hello', '{\"response\": \"Hello! I am the Naujan Chatbot Assistant. How can I help you with information about the Municipality of Naujan, Oriental Mindoro?\", \"confidence\": 0.87, \"intent\": \"greeting\"}', 'en', '2025-11-26 02:29:25'),
(7, 3, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-11-26 02:33:00'),
(8, 3, 'Hola', 'I\'m not sure I understand. Could you please rephrase your question or be more specific about Naujan?', 'en', '2025-11-26 02:33:32'),
(9, 3, 'Attractions in Naujan', 'I\'m not sure I understand. Could you please rephrase your question or be more specific about Naujan?', 'en', '2025-11-26 02:34:13'),
(10, 3, 'Attractions in Naujan', 'Naujan is a 1st Class Municipality in the province of Oriental Mindoro, Philippines. It is situated on the northeastern coast of Mindoro Island.', 'en', '2025-11-26 02:35:31'),
(11, 3, 'Goodbye', 'Goodbye! I hope I was able to assist you with your questions about Naujan.', 'en', '2025-11-26 02:40:17'),
(12, 4, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-12-01 12:24:21'),
(13, 4, 'What are the attractions here in Nuajan', 'Ang kasalukuyang Mayor ng Naujan ay si **Henry Joel C. Teves**. Ang opisina ng Mayor ay matatawagan sa **(043) 208-3382**.', 'en', '2025-12-01 12:25:02'),
(14, 4, 'What are the attractions here in Naujan', 'Naujan is a 1st Class Municipality in the province of Oriental Mindoro, Philippines. It is situated on the northeastern coast of Mindoro Island.', 'en', '2025-12-01 12:26:06'),
(15, 5, 'Hello', 'Hello! I am the Naujan Chatbot Assistant. How can I help you with information about the Municipality of Naujan, Oriental Mindoro?', 'en', '2025-12-02 05:33:04'),
(16, 6, 'Hello', 'Hello! I am the Naujan Chatbot Assistant. How can I help you with information about the Municipality of Naujan, Oriental Mindoro?', 'en', '2025-12-02 05:33:04'),
(17, 7, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-12-02 05:33:04'),
(18, 5, 'Naujan', 'Naujan es un Municipio de Primera Clase en la provincia de Oriental Mindoro, Filipinas.', 'en', '2025-12-02 05:34:24'),
(19, 5, 'What are the attractions in the Naujan', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Oriental Mindoro, Pilipinas.', 'en', '2025-12-02 05:36:04'),
(20, 5, 'Where is Naujan', 'Naujan is a 1st Class Municipality in the province of Oriental Mindoro, Philippines. It is situated on the northeastern coast of Mindoro Island.', 'en', '2025-12-02 05:39:17'),
(21, 5, 'Who are the heroes of Naujan', 'Naujan has a rich history of resistance, including figures like **Francisco Manalaysay** (against Spain) and guerrilla leaders like **Esteban Beloncio** and **Gomersindo dela Torre** (during WWII).', 'en', '2025-12-02 06:23:02'),
(22, 8, 'Who are the heroes of Naujan', 'Las figuras notables incluyen a **Francisco Manalaysay** y el l�der guerrillero **Esteban Beloncio**.', 'en', '2025-12-02 06:36:15'),
(23, 8, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-12-02 06:37:57'),
(24, 8, 'Hola', 'Hello! I am the Naujan Chatbot Assistant. How can I help you with information about the Municipality of Naujan, Oriental Mindoro?', 'en', '2025-12-02 06:39:03'),
(25, 8, 'Where is Naujan Located', 'Naujan es un Municipio de Primera Clase en la provincia de Oriental Mindoro, Filipinas.', 'en', '2025-12-02 06:40:33'),
(26, 8, 'What province is Naujan in?', 'Naujan es un Municipio de Primera Clase en la provincia de Oriental Mindoro, Filipinas.', 'en', '2025-12-02 06:41:46'),
(27, 8, 'Is Naujan near Calapan?', 'Naujan is a 1st Class Municipality in the province of Oriental Mindoro, Philippines. It is situated on the northeastern coast of Mindoro Island.', 'en', '2025-12-02 06:47:24'),
(28, 8, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman tungkol sa Naujan?', 'en', '2025-12-02 06:51:48'),
(29, 9, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malman tungkol sa Naujan?', 'en', '2025-12-03 17:39:02'),
(30, 10, 'Hello', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malman tungkol sa Naujan?', 'en', '2026-01-15 10:47:05'),
(31, 11, 'Hello', '{\"status\": \"error\", \"response\": \"Server error: X has 512 features, but LogisticRegression is expecting 384 features as input.\", \"language\": \"en\"}', 'en', '2026-01-17 06:20:26'),
(32, 12, 'Hello', '{\"status\": \"success\", \"response\": \"Guten Tag! Ich bin der Naujan Chatbot-Assistent. Womit kann ich helfen?\", \"language\": \"en\", \"cached\": false}', 'en', '2026-01-17 06:46:46'),
(33, 12, 'Hello', '{\"status\": \"success\", \"response\": \"Hello! I am the Naujan Chatbot Assistant. How can I help you today?\", \"language\": \"en\", \"cached\": false}', 'en', '2026-01-17 07:28:45'),
(34, 12, 'What is Nuajan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-01-17 07:33:05'),
(35, 12, 'Where is Naujan located', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-01-17 07:33:45'),
(36, 12, 'Kamusta', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-01-17 07:42:18'),
(37, 12, 'Kumusta', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-01-17 08:43:37'),
(38, 12, 'Who is the mayor of Naujan', 'The incumbent Mayor of Naujan is Henry Joel C. Teves. The Mayor\'s Office can be reached at (043) 208-3382 or (043) 208-3479.', 'en', '2026-01-17 08:44:43'),
(39, 12, 'bonjour', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-01-17 09:07:08'),
(40, 13, 'Hola', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-01-21 10:21:17'),
(41, 13, 'Hola', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-01-21 10:31:33'),
(42, 14, 'Hola', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-01-21 10:32:23'),
(43, 14, 'tiempo en naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-01-21 10:35:06'),
(44, 14, 'Sino ang mayor ng Naujan', 'The incumbent Mayor of Naujan is Henry Joel C. Teves. The Mayor\'s Office can be reached at (043) 208-3382 or (043) 208-3479.', 'en', '2026-01-21 10:40:53'),
(45, 14, 'Quien es el alcalde de naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-01-21 10:42:21'),
(46, 14, 'Quien es el alcalde de naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-01-21 10:44:24'),
(47, 15, 'Where is Naujan located?', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-01-21 14:05:07'),
(48, 16, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-01-30 09:30:26'),
(49, 16, '¿Dónde está ubicado Naujan?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'es', '2026-01-30 09:32:16');

-- --------------------------------------------------------

--
-- Table structure for table `hotel_bookings`
--

CREATE TABLE `hotel_bookings` (
  `booking_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hotel_name` varchar(255) NOT NULL,
  `hotel_location` varchar(255) DEFAULT NULL,
  `price_per_night` decimal(10,2) NOT NULL,
  `currency` char(3) DEFAULT 'USD',
  `check_in` date NOT NULL,
  `check_out` date NOT NULL,
  `nights` int(11) NOT NULL,
  `rooms` int(11) NOT NULL,
  `guests` int(11) NOT NULL,
  `special_requests` text DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') DEFAULT 'pending',
  `payment_status` enum('unpaid','paid','refunded') DEFAULT 'unpaid',
  `payment_method` varchar(50) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `receipt_number` varchar(64) NOT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_email` varchar(200) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_bookings`
--

INSERT INTO `hotel_bookings` (`booking_id`, `user_id`, `hotel_name`, `hotel_location`, `price_per_night`, `currency`, `check_in`, `check_out`, `nights`, `rooms`, `guests`, `special_requests`, `status`, `payment_status`, `payment_method`, `total_amount`, `receipt_number`, `customer_name`, `customer_email`, `customer_phone`, `created_at`, `updated_at`) VALUES
(1, 1, 'Naujan Bayview Resort', 'Naujan, Oriental Mindoro', 85.00, 'USD', '2026-01-31', '2026-02-01', 1, 1, 2, NULL, 'confirmed', 'paid', 'gcash', 85.00, 'HB-20260131-05298F', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-01-31 00:06:41', '2026-01-31 00:06:41');

-- --------------------------------------------------------

--
-- Table structure for table `hotel_payments`
--

CREATE TABLE `hotel_payments` (
  `payment_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) DEFAULT 'USD',
  `method` varchar(50) DEFAULT NULL,
  `provider` varchar(50) DEFAULT 'simulated',
  `status` enum('pending','succeeded','failed','refunded') DEFAULT 'pending',
  `transaction_reference` varchar(100) DEFAULT NULL,
  `card_last4` varchar(4) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_payments`
--

INSERT INTO `hotel_payments` (`payment_id`, `booking_id`, `amount`, `currency`, `method`, `provider`, `status`, `transaction_reference`, `card_last4`, `paid_at`, `created_at`) VALUES
(1, 1, 85.00, 'USD', 'gcash', 'simulated', 'succeeded', 'PAY-F9B20ED7', NULL, '2026-01-31 00:06:41', '2026-01-31 00:06:41');

-- --------------------------------------------------------

--
-- Table structure for table `itineraries`
--

CREATE TABLE `itineraries` (
  `itinerary_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `total_distance` decimal(8,2) DEFAULT NULL,
  `total_time` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itineraries`
--

INSERT INTO `itineraries` (`itinerary_id`, `user_id`, `name`, `total_distance`, `total_time`, `created_at`, `updated_at`) VALUES
(1, 1, '', 0.00, 0, '2025-11-26 06:36:42', '2025-11-26 06:36:42'),
(2, 1, '', 0.00, 0, '2025-11-26 07:32:57', '2025-11-26 07:32:57'),
(3, 1, 'afafs', 10.45, 21, '2025-12-02 00:02:12', '2025-12-02 00:02:12'),
(4, 1, 'Atttractions', 5.36, 11, '2025-12-02 06:53:03', '2025-12-02 06:53:03');

-- --------------------------------------------------------

--
-- Table structure for table `itinerary_attractions`
--

CREATE TABLE `itinerary_attractions` (
  `id` int(11) NOT NULL,
  `itinerary_id` int(11) NOT NULL,
  `attraction_id` int(11) NOT NULL,
  `order_sequence` int(11) NOT NULL,
  `estimated_duration` int(11) DEFAULT 60
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itinerary_attractions`
--

INSERT INTO `itinerary_attractions` (`id`, `itinerary_id`, `attraction_id`, `order_sequence`, `estimated_duration`) VALUES
(1, 1, 1, 1, 60),
(2, 2, 2, 1, 60),
(3, 3, 2, 1, 60),
(4, 3, 3, 2, 60),
(5, 4, 1, 1, 60),
(6, 4, 2, 2, 60);

-- --------------------------------------------------------

--
-- Table structure for table `languages`
--

CREATE TABLE `languages` (
  `language_code` varchar(10) NOT NULL,
  `language_name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `languages`
--

INSERT INTO `languages` (`language_code`, `language_name`) VALUES
('de', 'German'),
('en', 'English'),
('es', 'Spanish'),
('fr', 'French'),
('ja', 'Japanese'),
('ko', 'Korean'),
('tl', 'Tagalog'),
('zh', 'Chinese');

-- --------------------------------------------------------

--
-- Table structure for table `map_routes`
--

CREATE TABLE `map_routes` (
  `route_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `start_location` varchar(255) DEFAULT NULL,
  `end_location` varchar(255) DEFAULT NULL,
  `route_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`route_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `map_routes`
--

INSERT INTO `map_routes` (`route_id`, `user_id`, `start_location`, `end_location`, `route_data`, `created_at`) VALUES
(1, 1, '13.3333,121.3000', '13.3167,121.2833', '{\"waypoints\": [[13.3333, 121.3000], [13.3250, 121.2917], [13.3167, 121.2833]], \"distance\": 5.2, \"duration\": 15}', '2025-11-25 02:22:06'),
(2, 1, '13.3333,121.3000', '13.2833,121.3167', '{\"waypoints\": [[13.3333, 121.3000], [13.3083, 121.3083], [13.2833, 121.3167]], \"distance\": 8.1, \"duration\": 25}', '2025-11-25 02:22:06');

-- --------------------------------------------------------

--
-- Table structure for table `points_of_interest`
--

CREATE TABLE `points_of_interest` (
  `poi_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `latitude` decimal(10,7) NOT NULL,
  `longitude` decimal(10,7) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `points_of_interest`
--

INSERT INTO `points_of_interest` (`poi_id`, `name`, `description`, `category`, `latitude`, `longitude`, `created_at`, `updated_at`) VALUES
(1, 'Naujan Lake National Park', 'Beautiful freshwater lake perfect for boating and fishing', 'attraction', 13.3167000, 121.2833000, '2025-11-25 02:22:06', '2025-11-25 02:22:06'),
(2, 'Naujan Public Market', 'Local market with fresh produce and local goods', 'market', 13.3333000, 121.3000000, '2025-11-25 02:22:06', '2025-11-25 02:22:06'),
(3, 'Malaking Ilog Beach', 'Pristine beach with clear waters and white sand', 'beach', 13.2833000, 121.3167000, '2025-11-25 02:22:06', '2025-11-25 02:22:06'),
(4, 'Mount Halcon Base Camp', 'Starting point for Mount Halcon hiking adventures', 'mountain', 13.3500000, 121.2500000, '2025-11-25 02:22:06', '2025-11-25 02:22:06'),
(5, 'Naujan Town Plaza', 'Central town plaza for community events', 'landmark', 13.3340000, 121.3010000, '2025-11-25 02:22:06', '2025-11-25 02:22:06');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `poi_id` int(11) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `review_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `moderated` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `review_moderation_logs`
--

CREATE TABLE `review_moderation_logs` (
  `moderation_id` int(11) NOT NULL,
  `review_id` int(11) DEFAULT NULL,
  `moderator_id` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `moderated_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `preferred_language` varchar(10) DEFAULT 'en',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_picture` longtext DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `preferred_language`, `created_at`, `updated_at`, `profile_picture`, `first_name`, `last_name`, `phone`, `date_of_birth`) VALUES
(1, 'Blue', 'benedictmadrigal26@gmail.com', '$2b$10$eAf6Ki40dSkn6GGTuz41yuaTo04SbME7hwuchPwkwgjDJW4ew3S16', 'en', '2025-11-23 23:13:08', '2026-01-30 05:50:12', NULL, '', '', NULL, '0000-00-00'),
(2, 'kyla', 'kymanalobearxkyqt21@gmail.com', '$2b$10$TeiV0xG5R5GMQLq0Mv90m./6rOEvRdCrQqSyide8fHKwHsM2fVQsK', 'en', '2026-01-27 02:12:17', '2026-01-27 02:12:17', NULL, 'Kyla', 'Manalo', NULL, '2004-09-21');

-- --------------------------------------------------------

--
-- Table structure for table `weather_data`
--

CREATE TABLE `weather_data` (
  `weather_id` int(11) NOT NULL,
  `attraction_id` int(11) DEFAULT NULL,
  `temperature` decimal(5,2) DEFAULT NULL,
  `humidity` int(11) DEFAULT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `weather_condition` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attractions`
--
ALTER TABLE `attractions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chatbot_conversations`
--
ALTER TABLE `chatbot_conversations`
  ADD PRIMARY KEY (`conversation_id`),
  ADD KEY `idx_chatbot_user` (`user_id`);

--
-- Indexes for table `chatbot_messages`
--
ALTER TABLE `chatbot_messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `conversation_id` (`conversation_id`);

--
-- Indexes for table `hotel_bookings`
--
ALTER TABLE `hotel_bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD UNIQUE KEY `uniq_receipt_number` (`receipt_number`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `hotel_payments`
--
ALTER TABLE `hotel_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_booking_id` (`booking_id`);

--
-- Indexes for table `itineraries`
--
ALTER TABLE `itineraries`
  ADD PRIMARY KEY (`itinerary_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `itinerary_attractions`
--
ALTER TABLE `itinerary_attractions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `itinerary_id` (`itinerary_id`),
  ADD KEY `attraction_id` (`attraction_id`);

--
-- Indexes for table `languages`
--
ALTER TABLE `languages`
  ADD PRIMARY KEY (`language_code`);

--
-- Indexes for table `map_routes`
--
ALTER TABLE `map_routes`
  ADD PRIMARY KEY (`route_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `points_of_interest`
--
ALTER TABLE `points_of_interest`
  ADD PRIMARY KEY (`poi_id`),
  ADD KEY `idx_poi_category` (`category`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `idx_review_poi` (`poi_id`),
  ADD KEY `idx_review_user` (`user_id`);

--
-- Indexes for table `review_moderation_logs`
--
ALTER TABLE `review_moderation_logs`
  ADD PRIMARY KEY (`moderation_id`),
  ADD KEY `review_id` (`review_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `weather_data`
--
ALTER TABLE `weather_data`
  ADD PRIMARY KEY (`weather_id`),
  ADD KEY `attraction_id` (`attraction_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attractions`
--
ALTER TABLE `attractions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `chatbot_conversations`
--
ALTER TABLE `chatbot_conversations`
  MODIFY `conversation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `chatbot_messages`
--
ALTER TABLE `chatbot_messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `hotel_bookings`
--
ALTER TABLE `hotel_bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `hotel_payments`
--
ALTER TABLE `hotel_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `itineraries`
--
ALTER TABLE `itineraries`
  MODIFY `itinerary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `itinerary_attractions`
--
ALTER TABLE `itinerary_attractions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `map_routes`
--
ALTER TABLE `map_routes`
  MODIFY `route_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `points_of_interest`
--
ALTER TABLE `points_of_interest`
  MODIFY `poi_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `review_moderation_logs`
--
ALTER TABLE `review_moderation_logs`
  MODIFY `moderation_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `weather_data`
--
ALTER TABLE `weather_data`
  MODIFY `weather_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `chatbot_conversations`
--
ALTER TABLE `chatbot_conversations`
  ADD CONSTRAINT `chatbot_conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `chatbot_messages`
--
ALTER TABLE `chatbot_messages`
  ADD CONSTRAINT `chatbot_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chatbot_conversations` (`conversation_id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_bookings`
--
ALTER TABLE `hotel_bookings`
  ADD CONSTRAINT `fk_hotel_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_payments`
--
ALTER TABLE `hotel_payments`
  ADD CONSTRAINT `fk_hotel_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `hotel_bookings` (`booking_id`) ON DELETE CASCADE;

--
-- Constraints for table `itineraries`
--
ALTER TABLE `itineraries`
  ADD CONSTRAINT `itineraries_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `itinerary_attractions`
--
ALTER TABLE `itinerary_attractions`
  ADD CONSTRAINT `itinerary_attractions_ibfk_1` FOREIGN KEY (`itinerary_id`) REFERENCES `itineraries` (`itinerary_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `itinerary_attractions_ibfk_2` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `map_routes`
--
ALTER TABLE `map_routes`
  ADD CONSTRAINT `map_routes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`poi_id`) REFERENCES `points_of_interest` (`poi_id`) ON DELETE CASCADE;

--
-- Constraints for table `review_moderation_logs`
--
ALTER TABLE `review_moderation_logs`
  ADD CONSTRAINT `review_moderation_logs_ibfk_1` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`review_id`) ON DELETE CASCADE;

--
-- Constraints for table `weather_data`
--
ALTER TABLE `weather_data`
  ADD CONSTRAINT `weather_data_ibfk_1` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
