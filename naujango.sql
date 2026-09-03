-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 05, 2026 at 03:28 AM
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
-- Table structure for table `about_editable_sections`
--

CREATE TABLE `about_editable_sections` (
  `id` int(11) NOT NULL,
  `section_key` varchar(50) NOT NULL COMMENT 'mayors or viceMayors',
  `section_name` varchar(100) NOT NULL,
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Array of personnel with name, years, image' CHECK (json_valid(`content`)),
  `updated_by` int(11) DEFAULT NULL COMMENT 'User ID who last updated',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Admin-editable About page sections';

-- --------------------------------------------------------

--
-- Table structure for table `about_media`
--

CREATE TABLE `about_media` (
  `id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL COMMENT 'Which section this media belongs to',
  `media_type` enum('image','video','document') DEFAULT 'image' COMMENT 'Type of media',
  `file_url` varchar(500) NOT NULL COMMENT 'URL to media file',
  `file_name` varchar(255) NOT NULL COMMENT 'Original file name',
  `file_size` int(11) DEFAULT NULL COMMENT 'File size in bytes',
  `mime_type` varchar(100) DEFAULT NULL COMMENT 'MIME type (image/jpeg, video/mp4, etc.)',
  `caption` text DEFAULT NULL COMMENT 'Caption or description',
  `alt_text` varchar(255) DEFAULT NULL COMMENT 'Alt text for images',
  `display_order` int(11) DEFAULT 1000 COMMENT 'Order within section',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Whether to show in public',
  `uploaded_by` int(11) DEFAULT NULL COMMENT 'User who uploaded',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Media files for About page sections';

-- --------------------------------------------------------

--
-- Table structure for table `about_settings`
--

CREATE TABLE `about_settings` (
  `id` int(11) NOT NULL,
  `overview_text` longtext NOT NULL DEFAULT 'Naujan is a first-class municipality in Oriental Mindoro, Philippines, known for its rich biodiversity and cultural heritage.',
  `vision_text` longtext NOT NULL DEFAULT 'To be a premier sustainable tourism destination that showcases Naujan\'s natural beauty, rich culture, and vibrant local community.',
  `mission_text` longtext NOT NULL DEFAULT '{\r\n    "points": [\r\n      "Showcase authentic tourism experiences that celebrate local culture and heritage",\r\n      "Promote sustainable practices that protect our environment and communities",\r\n      "Connect travelers with memorable experiences and genuine local interactions",\r\n      "Support local businesses and economic growth through tourism"\r\n    ]\r\n  }',
  `population` int(11) DEFAULT 45000,
  `land_area_sq_km` decimal(10,2) DEFAULT 62.50,
  `density_per_sq_km` decimal(10,2) DEFAULT 720.00,
  `num_barangays` int(11) DEFAULT 28,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `municipal_rank` varchar(50) DEFAULT NULL,
  `current_mayor_name` varchar(255) DEFAULT NULL,
  `current_mayor_term` varchar(50) DEFAULT NULL,
  `current_vice_mayor_name` varchar(255) DEFAULT NULL,
  `current_vice_mayor_term` varchar(50) DEFAULT NULL,
  `visitor_arrivals_2022` int(11) DEFAULT NULL,
  `visitor_arrivals_2023` int(11) DEFAULT NULL,
  `visitor_arrivals_2024` int(11) DEFAULT NULL,
  `visitor_arrivals_2025` int(11) DEFAULT NULL,
  `tourism_total_employment` int(11) DEFAULT NULL,
  `tourism_attractions_count` int(11) DEFAULT NULL,
  `tourism_accommodation_count` int(11) DEFAULT NULL,
  `tourism_female_employed` int(11) DEFAULT NULL,
  `tourism_male_employed` int(11) DEFAULT NULL,
  `primary_language_id` int(11) DEFAULT 1 COMMENT 'Current primary language',
  `publication_status` enum('draft','published') DEFAULT 'published' COMMENT 'Overall publication status',
  `last_updated_by` int(11) DEFAULT NULL COMMENT 'User ID who last updated',
  `last_published_at` timestamp NULL DEFAULT NULL COMMENT 'When content was last published',
  `enable_public_comments` tinyint(1) DEFAULT 0 COMMENT 'Allow public comments on About page',
  `seo_meta_description` varchar(160) DEFAULT NULL COMMENT 'SEO meta description',
  `seo_keywords` varchar(500) DEFAULT NULL COMMENT 'SEO keywords (comma-separated)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `about_settings`
--

INSERT INTO `about_settings` (`id`, `overview_text`, `vision_text`, `mission_text`, `population`, `land_area_sq_km`, `density_per_sq_km`, `num_barangays`, `updated_at`, `municipal_rank`, `current_mayor_name`, `current_mayor_term`, `current_vice_mayor_name`, `current_vice_mayor_term`, `visitor_arrivals_2022`, `visitor_arrivals_2023`, `visitor_arrivals_2024`, `visitor_arrivals_2025`, `tourism_total_employment`, `tourism_attractions_count`, `tourism_accommodation_count`, `tourism_female_employed`, `tourism_male_employed`, `primary_language_id`, `publication_status`, `last_updated_by`, `last_published_at`, `enable_public_comments`, `seo_meta_description`, `seo_keywords`) VALUES
(1, 'Naujan is a 1st class municipality in Oriental Mindoro with 70 barangays. It is known for its agricultural economy, cultural heritage, and tourism development.', 'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA, with a livable and ecologically balanced environment demonstrating a vibrant economy inspired by God-loving, healthy, educated, and empowered citizenry under a dynamic and committed leadership.', '{\"points\": [\"Recognition and promotion of indigenous cultural communities while ensuring respect for cultural integrity\", \"Conservation and protection of natural resources for safe, adaptive, and resilient barangays\", \"Accountability and competency of people-centered governance through partnerships and development programs\", \"Promotion of eco-tourism and sustainable agricultural production with adequate social services and improved infrastructure\"]}', 109122, 503.10, 216.50, 70, '2026-03-26 11:37:59', '2nd most populous in Oriental Mindoro', 'Henry Joel C. Teves', '2022-Present', 'Candido J. Melgar Jr.', '2025-Present', 15605, 42561, 62788, 36074, 580, 475, 105, 338, 242, 1, 'published', NULL, NULL, 0, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `attractions`
--

CREATE TABLE `attractions` (
  `id` int(11) NOT NULL,
  `poi_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `category` varchar(100) DEFAULT 'attraction',
  `location` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attractions`
--

INSERT INTO `attractions` (`id`, `poi_id`, `name`, `description`, `municipality`, `category`, `location`, `image_url`, `created_at`, `latitude`, `longitude`, `archived`, `archived_at`) VALUES
(1, NULL, '333 Steps (Melgar A)', '333 Steps is a hillside trek with concrete steps surrounded by green vegetation, leading to panoramic views of the rolling hills and coastline. The ambiance is refreshing, active, and uplifting. Visitors can hike the steps, take photos of the scenic views, enjoy light exercise, and experience the beauty of nature.', 'Naujan', 'attraction', 'Brgy. Melgar A, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606659/333_k2r7eb.jpg', '2025-11-24 11:01:24', 12.271, 121.194, 0, NULL),
(2, NULL, 'Arangin Falls', 'With details about the multi-level waterfall and picnic area', 'Naujan', 'attraction', 'Barangay Panaytayan, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606650/arangin_zy1dab.jpg', '2025-11-24 11:01:24', 12.238, 121.069, 0, NULL),
(3, NULL, 'Liwasang Bonifacio', 'Naujan Lake National Park is the fifth largest lake in the Philippines, surrounded by lush mountains and rich biodiversity. The expansive waters host migratory birds and endemic wildlife, making it a haven for nature lovers. The ambiance is calm, serene, and peaceful, perfect for boat rides, birdwatching, nature photography, or simply enjoying breathtaking sunsets over the glass-like lake.', 'Naujan', 'attraction', 'Brgy. Poblacion I, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764606628/plaza_bduwz9.jpg', '2025-11-24 11:01:24', 12.4399, 121.251, 0, NULL),
(4, NULL, 'Naujan Lake', 'Naujan Lake is the fifth largest lake in the Philippines and the largest freshwater lake in Oriental Mindoro and is declared as a “wetland of international importance” by the Ramsar Convention. It is bordered by the Municipalities of Naujan, Victoria, Socorro and Pola. The lake is home to a wide variety of fish and water birds both local and migratory.', 'Naujan', 'attraction', 'Brgy. Poblacion & Surrounding Barangays, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764605449/nuajanlake_yaydxh.jpg', '2025-11-24 11:01:24', 12.4413, 121.153, 0, NULL),
(5, NULL, 'Simbahang Bato (Bancuro Ruins)', 'Simbahang Bato is a historic 17th-century coral and adobe church ruin with a unique “church within a church” design. The moss-covered walls and open-air structures create a hauntingly beautiful atmosphere where history and faith meet. Visitors can explore the ruins, take photos, learn about the Spanish-era heritage, and feel the quiet reverence of this iconic site.', NULL, 'attraction', 'Brgy. Bancuro, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735184/Simbahang_Bato__Naujan__Oriental_Mindoro_002_agvtfw.jpg', '2026-03-31 16:26:48', 13.2812, 121.322, 0, NULL),
(6, NULL, 'Dao Waterlily Mini Park', 'Dao Waterlily Mini Park is a scenic eco-park where colorful water lilies cover the ponds, creating a picturesque environment. The park also showcases local craftsmanship, with artisans making sustainable bags and accessories from dried water lily stalks. Visitors can enjoy boat rides, shop for unique souvenirs, take photos, and relax amidst the cheerful and nature-filled surroundings.', NULL, 'attraction', 'Brgy. Dao, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735228/20251211070343_cf06a8af_um3gdr.jpg', '2026-03-31 16:35:17', 13.257, 121.32, 0, NULL),
(7, NULL, 'Montelago Hot Spring & Forest Falls', 'Montelago Hot Spring and Forest Falls is a natural getaway with warm mineral pools and small forest waterfalls nestled among volcanic rocks and greenery. The ambiance is soothing, refreshing, and peaceful. Guests can soak in hot springs, swim in forest pools, trek trails, enjoy nature walks, and take photos of the stunning scenery along the Naujan Lake shoreline. ', NULL, 'attraction', ' Brgy. Montelago, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777736169/20251212133409_8815c76d_hqaoyk.jpg', '2026-03-31 16:37:11', 13.2226, 121.375, 0, NULL),
(8, NULL, 'AgriGold Farm Learning Center Inc.', 'AgriGold Farm Learning Center is a lively educational farm with green vegetable plots, poultry areas, and interactive learning facilities. The atmosphere is cheerful and welcoming, ideal for families and eco-enthusiasts. Visitors can join workshops on organic farming, explore crops and poultry, learn sustainable agriculture techniques, and enjoy hands-on experiences on the farm.', NULL, 'attraction', 'Brgy. Poblacion, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735681/481662542_1046501550846647_1624833536728573699_n_jkoipe.jpg', '2026-03-31 16:38:08', 13.2539, 121.259, 0, NULL),
(9, NULL, 'Largo Castillo Farmhouse', 'Largo Castillo Farmhouse is a rustic and eco-friendly farmhouse surrounded by open green fields and gardens. The atmosphere is calm and natural, ideal for relaxing and connecting with nature. Visitors can picnic, celebrate birthdays or small events, explore the grounds, and experience farm-to-table activities in a peaceful setting.', NULL, 'attraction', 'Brgy. Nag-Iba 1, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777736045/242323580_107179795045150_7224951110875635102_n_cxekay.jpg', '2026-03-31 16:38:35', 13.3333, 121.277, 0, NULL),
(10, NULL, 'La Hacienda', 'La Hacienda is a Balinese-inspired resort with elegant villas, tropical gardens, and a central pool. The ambiance is luxurious, serene, and peaceful, perfect for a quiet retreat. Guests can swim in the pool, stroll through gardens, stay in themed villas, and enjoy a relaxing, tropical escape in the countryside.', NULL, 'attraction', ' Brgy. Poblacion, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735964/20251212012306_15be85d7_dtjbhk.jpg', '2026-03-31 16:39:21', 13.2776, 122.309, 0, NULL),
(11, NULL, 'Naujan Agricultural Center', 'Naujan Agricultural Center is a modern farm and training facility with open fields, crop areas, and demonstration plots. The ambiance is productive, educational, and welcoming. Visitors can attend training programs, explore sustainable farming practices, observe crops, and learn modern agricultural techniques in a supportive environment.', NULL, 'attraction', ' Brgy. Poblacion, Naujan, Oriental Mindoro', NULL, '2026-03-31 16:41:00', NULL, NULL, 0, NULL),
(12, NULL, 'Mulawin Boulevard', 'Mulawin Boulevard is a scenic road lined with trees and connecting neighborhoods, showing the growth of the town. The ambiance is calm, modern, and welcoming. Visitors can walk, bike, take photos, and observe daily local life while enjoying the open space.', NULL, 'attraction', ' Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777736352/488897597_654920977400464_7372896903990599748_n_lopkad.jpg', '2026-03-31 16:42:26', 13.2364, 121.139, 0, NULL),
(13, NULL, 'Rio del Sierra', 'Rio del Sierra is a hidden riverside with cold, refreshing waters, native kubo huts, and mountain views. The ambiance is raw, natural, and soothing. Visitors can swim in the river, relax in huts, picnic, and enjoy the sounds of flowing water in a peaceful environment.', NULL, 'attraction', 'Sitio Sili, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777736527/unnamed_ykg9p6.webp', '2026-03-31 16:43:21', 13.2757, 121.083, 0, NULL),
(14, NULL, 'DJMV Organic Healing Park', ' DJMV Organic Healing Park is an eco-friendly farm filled with lush greenery, chemical-free crops, and tranquil spaces designed for wellness. The ambiance is calming, refreshing, and restorative. Visitors can stroll through the gardens, learn about sustainable organic farming, enjoy peaceful nature walks, and experience a healthy, relaxing environment that soothes the mind and body.', NULL, 'attraction', 'Brgy. Poblacion, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735540/304091589_509948987797874_3674544061630463545_n_estlrb.jpg', '2026-03-31 16:45:22', 13.2578, 121.262, 0, NULL),
(15, NULL, 'Karacha Falls', ' Karacha Falls is a majestic waterfall surrounded by forested hills, with strong cascading waters and a deep pool at the base. The ambiance is adventurous, natural, and invigorating. Visitors can trek off-road trails, swim in the refreshing pool, explore the surrounding forest, and take photos of the scenic waterfall.', NULL, 'attraction', 'Brgy. Malvar, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735886/20251212014221_fb100695_q2vmad.jpg', '2026-03-31 16:46:31', 13.1985, 116.109, 0, NULL),
(16, NULL, 'ORIC sa Bathala Waterfalls', '\nORIC sa Bathala Waterfalls is an emerging eco-tourism destination with a thrilling hanging bridge and horseback access to the falls. The ambiance is exciting, scenic, and adventurous. Guests can cross the hanging bridge, ride horses to the falls, swim in cool waters, and explore the untouched natural beauty of Naujan.\n', NULL, 'attraction', 'Sitio Bathala, Naujan, Oriental Mindoro', NULL, '2026-03-31 16:47:19', NULL, NULL, 0, NULL),
(17, NULL, 'Bahay Tuklasan Plenary Hall', 'Bahay Tuklasan Plenary Hall is a spacious venue for trainings, conferences, and community gatherings, surrounded by organized grounds. The ambiance is professional, accessible, and engaging. Visitors can attend seminars, workshops, and agricultural congresses, or participate in local government and community programs.', NULL, 'attraction', ' Brgy. Poblacion, Naujan, Oriental Mindoro', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777735398/20251210074435_45eaf415_bqxaq5.jpg', '2026-03-31 16:50:04', 13.3197, 121.301, 0, NULL),
(18, NULL, 'Bahay Tuklasan Dormitory', 'Bahay Tuklasan Dormitory offers clean, practical shared accommodations for students, volunteers, and groups. The ambiance is simple, functional, and communal. Guests can stay overnight, prepare meals, rest comfortably, and easily access nearby training and agricultural facilities.', NULL, 'attraction', 'Brgy. Poblacion, Naujan, Oriental Mindoro', NULL, '2026-03-31 16:51:20', NULL, NULL, 0, NULL),
(19, 1, 'Naujan Lake National Park', 'Beautiful freshwater lake perfect for boating and fishing', NULL, 'attraction', NULL, NULL, '2025-11-25 02:22:06', 13.3167, 121.283, 1, '2026-05-03 10:01:19'),
(20, 2, 'Naujan Public Market', 'Local market with fresh produce and local goods', NULL, 'market', NULL, NULL, '2025-11-25 02:22:06', 13.3333, 121.3, 1, '2026-05-02 23:42:57'),
(21, 3, 'Malaking Ilog Beach', 'Pristine beach with clear waters and white sand', NULL, 'beach', NULL, NULL, '2025-11-25 02:22:06', 13.2833, 121.317, 0, NULL),
(23, 5, 'Naujan Town Plaza', 'Central town plaza for community events', NULL, 'landmark', NULL, NULL, '2025-11-25 02:22:06', 13.334, 121.301, 1, '2026-05-02 23:43:00');

-- --------------------------------------------------------

--
-- Table structure for table `auth_tokens`
--

CREATE TABLE `auth_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `token_type` enum('email_verification','password_reset') NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `auth_tokens`
--

INSERT INTO `auth_tokens` (`id`, `user_id`, `token_hash`, `token_type`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 1, 'ed432981fd9089df47dbe4fa236e13a3285303669f22f5de73454120f6f21e99', 'password_reset', '2026-03-17 23:57:24', NULL, '2026-03-17 23:27:24');

-- --------------------------------------------------------

--
-- Table structure for table `booking_receipts`
--

CREATE TABLE `booking_receipts` (
  `receipt_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `receipt_number` varchar(50) NOT NULL,
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `pdf_path` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_profiles`
--

CREATE TABLE `business_profiles` (
  `id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `business_email` varchar(255) DEFAULT NULL,
  `business_phone` varchar(20) DEFAULT NULL,
  `business_address` text DEFAULT NULL,
  `tax_id` varchar(100) DEFAULT NULL COMMENT 'Business Tax ID (e.g., BIR TIN for Philippines)',
  `bank_account` varchar(255) DEFAULT NULL COMMENT 'Encrypted bank account number',
  `bank_name` varchar(255) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL COMMENT 'When business profile was verified by admin',
  `verification_status` enum('pending','verified','rejected') DEFAULT 'pending',
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores business information for hotel owners including tax ID, bank account, and address details. Bank account should be stored encrypted.';

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
(16, NULL, '2026-01-30 09:30:26'),
(17, NULL, '2026-01-31 01:18:26'),
(18, 1, '2026-01-31 15:34:39'),
(19, 1, '2026-01-31 15:56:21'),
(20, 1, '2026-01-31 16:06:52'),
(21, 1, '2026-01-31 16:50:22'),
(22, 1, '2026-02-02 15:37:16'),
(23, 1, '2026-02-03 00:29:28'),
(24, 1, '2026-02-03 01:34:44'),
(25, 1, '2026-02-03 01:35:12'),
(26, 1, '2026-02-03 01:38:55'),
(27, 1, '2026-02-03 01:53:43'),
(28, 1, '2026-02-08 06:01:06'),
(29, 1, '2026-02-10 00:58:09'),
(30, 1, '2026-02-10 00:58:53'),
(31, 1, '2026-02-10 01:03:01'),
(32, 1, '2026-02-10 01:03:13'),
(33, 1, '2026-02-21 14:37:16'),
(34, NULL, '2026-02-24 01:01:42'),
(35, 1, '2026-03-10 08:15:18'),
(36, 1, '2026-03-28 06:35:51'),
(37, NULL, '2026-04-01 04:08:39'),
(38, 1, '2026-04-20 15:34:24'),
(39, 1, '2026-04-20 17:04:59'),
(40, 1, '2026-04-20 19:41:17'),
(41, 1, '2026-04-20 21:39:03'),
(42, 1, '2026-04-20 22:17:53'),
(43, 1, '2026-04-20 22:36:34'),
(44, 1, '2026-04-20 23:06:08'),
(45, 1, '2026-04-20 23:10:04'),
(46, 1, '2026-04-20 23:11:10'),
(47, 1, '2026-04-20 23:15:40'),
(48, 1, '2026-04-20 23:20:32'),
(49, 1, '2026-04-21 02:57:15'),
(50, 1, '2026-04-21 03:27:31'),
(51, 1, '2026-05-03 07:31:32'),
(52, 1, '2026-05-03 07:32:29');

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
(49, 16, '¿Dónde está ubicado Naujan?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'es', '2026-01-30 09:32:16'),
(50, 17, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-01-31 01:18:26'),
(51, 18, '¿Dónde está Naujan?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'es', '2026-01-31 15:34:39'),
(52, 19, 'Ayúdame a planificar un itinerario', 'Disculpa el retraso. Estoy teniendo problemas para acceder a mi base de conocimientos. ¿Podrías intentar de nuevo?', 'es', '2026-01-31 15:56:21'),
(53, 19, '¿Dónde se encuentra Naujan?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'es', '2026-01-31 15:57:27'),
(54, 20, '¿Dónde está Naujan?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'es', '2026-01-31 16:06:52'),
(55, 21, '¿Cuáles son los cultivos principales?', 'Disculpa el retraso. Estoy teniendo problemas para acceder a mi base de conocimientos. ¿Podrías intentar de nuevo?', 'es', '2026-01-31 16:50:22'),
(56, 22, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-02-02 15:37:16'),
(57, 22, 'Who is the mayor of Naujan', 'I apologize for the delay. I\'m having trouble accessing my full knowledge base right now. Could you try asking your question again, or visit our website for more information about Naujan?', 'en', '2026-02-02 15:38:04'),
(58, 22, 'What\'s the current weather in Naujan?', 'For current weather information, please check the weather section of our website or try again in a moment.', 'en', '2026-02-02 15:38:26'),
(59, 22, 'What are the top tourist attractions in Naujan?', 'Naujan is famous for Naujan Lake, the fifth-largest lake in the Philippines. There are also beautiful natural spots and local farms to visit.', 'en', '2026-02-02 15:38:47'),
(60, 23, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-02-03 00:29:28'),
(61, 24, 'Show me the interactive map of Naujan', 'I apologize for the delay. I\'m having trouble accessing my full knowledge base right now. Could you try asking your question again, or visit our website for more information about Naujan?', 'en', '2026-02-03 01:34:44'),
(62, 25, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-02-03 01:35:12'),
(63, 26, 'How can I contact the Mayor?', 'I apologize for the delay. I\'m having trouble accessing my full knowledge base right now. Could you try asking your question again, or visit our website for more information about Naujan?', 'en', '2026-02-03 01:38:55'),
(64, 26, 'What\'s the current weather in Naujan?', 'For current weather information, please check the weather section of our website or try again in a moment.', 'en', '2026-02-03 01:39:20'),
(65, 26, 'hi', 'Hi there! I\'m currently running in fallback mode. What would you like to know about Naujan?', 'ja', '2026-02-03 01:46:25'),
(66, 27, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-02-03 01:53:43'),
(67, 28, 'Where is Naujan located?', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'en', '2026-02-08 06:01:06'),
(68, 28, '¿Cuáles son las principales atracciones turísticas de Naujan?', 'Disculpa el retraso. Estoy teniendo problemas para acceder a mi base de conocimientos. ¿Podrías intentar de nuevo?', 'es', '2026-02-08 06:01:44'),
(69, 28, 'hola', '¡Hola! Tengo algunos problemas técnicos, pero estoy aquí para ayudar. ¿Cómo puedo asistirte?', 'es', '2026-02-08 06:03:02'),
(70, 28, 'dónde se encuentra naujan', 'Naujan is a municipality in Oriental Mindoro, Philippines. It\'s known for its beautiful lake and agricultural products.', 'es', '2026-02-08 06:03:42'),
(71, 28, 'dónde se encuentra naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 06:45:05'),
(72, 28, 'Kumusta', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 06:48:31'),
(73, 28, 'dónde se encuentra naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 06:49:11'),
(74, 28, 'dónde se encuentra naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 07:02:50'),
(75, 28, 'dónde se encuentra naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 07:12:44'),
(76, 28, 'Kumusta', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 07:14:29'),
(77, 28, 'Show me the interactive map of Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 07:14:46'),
(78, 28, 'What\'s the current weather in Naujan?', 'I don\'t have live weather data, but Naujan has a tropical climate. For current conditions, please check PAGASA or a weather app.', 'en', '2026-02-08 07:14:48'),
(79, 28, 'What are the top tourist attractions in Naujan?', 'Suggested day trip: start at Naujan Church (heritage), visit Naujan Lake for birdwatching, then stop by local coconut/rice farms and finish at the town plaza for food stalls.', 'en', '2026-02-08 07:14:51'),
(80, 28, 'Kumusta', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 07:18:14'),
(81, 28, 'Hello', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-08 07:23:42'),
(82, 28, 'Where is naujan located', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-02-08 07:23:53'),
(83, 28, 'Hola', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-08 07:46:36'),
(84, 28, 'hola bot', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-08 07:47:00'),
(85, 28, 'buenos días', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-08 07:47:06'),
(86, 28, 'Buenos dias', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-08 07:47:12'),
(87, 28, 'Kamusta', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-09 13:43:45'),
(88, 28, 'Who is the mayor of Naujan', 'The incumbent Mayor of Naujan is Henry Joel C. Teves. The Mayor\'s Office can be reached at (043) 208-3382 or (043) 208-3479.', 'en', '2026-02-09 13:44:02'),
(89, 28, 'Best attractions', 'Suggested day trip: start at Naujan Church (heritage), visit Naujan Lake for birdwatching, then stop by local coconut/rice farms and finish at the town plaza for food stalls.', 'en', '2026-02-09 13:44:15'),
(90, 29, 'Tell me about Naujan Lake', 'Naujan Lake is the 5th largest lake in the Philippines and a Ramsar Wetland of International Importance since 1999. It hosts migratory birds like the Philippine duck.', 'en', '2026-02-10 00:58:09'),
(91, 30, 'kumusta', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman?', 'tl', '2026-02-10 00:58:53'),
(92, 30, 'saan matatagapuan ang Naujan', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Oriental Mindoro, sa hilagang-silangang bahagi ng Mindoro Island.', 'tl', '2026-02-10 00:59:13'),
(93, 30, 'kumusta ang panahon sa naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-10 00:59:52'),
(94, 30, 'ano ang magandang atraksyon sa naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-10 01:00:37'),
(95, 30, 'ano ang magandang attractions sa naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-10 01:00:51'),
(96, 30, 'ano ang naujan lake', 'Ang Naujan Lake ay ang panlimang pinakamalaking lawa sa Pilipinas at isang Ramsar Wetland of International Importance (1999).', 'tl', '2026-02-10 01:01:19'),
(97, 30, 'sino ang punong bayan ng naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-10 01:01:37'),
(98, 30, 'sino ang mayor ng naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-10 01:01:46'),
(99, 30, 'Sino ang mayor ng Naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-10 01:01:57'),
(100, 30, 'Who is the mayor of naujan', 'The incumbent Mayor of Naujan is Henry Joel C. Teves. The Mayor\'s Office can be reached at (043) 208-3382 or (043) 208-3479.', 'en', '2026-02-10 01:02:06'),
(101, 30, 'Best attractions', 'Suggested day trip: start at Naujan Church (heritage), visit Naujan Lake for birdwatching, then stop by local coconut/rice farms and finish at the town plaza for food stalls.', 'en', '2026-02-10 01:02:34'),
(102, 31, 'Help me plan an itinerary', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-10 01:03:01'),
(103, 32, 'What are the main crops?', 'Naujan\'s main crops are rice and coconut (copra). Farmers also grow corn, root crops, vegetables, and some fruit trees like mango and banana.', 'en', '2026-02-10 01:03:13'),
(104, 32, 'What\'s the current weather in Naujan?', 'I don\'t have live weather data, but Naujan has a tropical climate. For current conditions, please check PAGASA or a weather app.', 'en', '2026-02-21 14:36:13'),
(105, 33, 'How can I contact the Mayor?', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-21 14:37:16'),
(106, 33, 'What\'s the current weather in Naujan?', 'I don\'t have live weather data, but Naujan has a tropical climate. For current conditions, please check PAGASA or a weather app.', 'en', '2026-02-21 15:45:36'),
(107, 33, 'Where is naujan located', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-02-21 15:46:08'),
(108, 33, 'helllow', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-22 08:41:14'),
(109, 33, 'hellow', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-22 08:41:33'),
(110, 33, 'recommend me some attraction to visit', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-22 08:42:12'),
(111, 33, 'Saan ang Naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-23 07:55:43'),
(112, 33, 'Saang lugar ang naujan', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Oriental Mindoro, sa hilagang-silangang bahagi ng Mindoro Island.', 'tl', '2026-02-23 07:55:59'),
(113, 33, 'Sino ang mayor ng Naujan', 'Ang kasalukuyang Mayor ng Naujan ay si Henry Joel C. Teves. Ang opisina ay matatawagan sa (043) 208-3382 o (043) 208-3479.', 'tl', '2026-02-23 07:56:20'),
(114, 33, '瑙詹在哪里？', '我不太确定我理解了。你能重新表述一下吗？', 'zh', '2026-02-23 07:57:09'),
(115, 33, 'Nǎo zhān zài nǎlǐ', '我不太确定我理解了。你能重新表述一下吗？', 'zh', '2026-02-23 07:57:34'),
(116, 33, '瑙詹在哪里', '我不太确定我理解了。你能重新表述一下吗？', 'zh', '2026-02-23 07:57:49'),
(117, 33, '瑙詹在哪里', '我不太确定我理解了。你能重新表述一下吗？', 'zh', '2026-02-23 07:58:02'),
(118, 33, '中午好', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-23 07:59:14'),
(119, 33, '中午好', '你好！我是瑙汉聊天助手。我能帮你什么吗？', 'zh', '2026-02-23 07:59:22'),
(120, 34, 'Where is Naujan located?', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-02-24 01:01:42'),
(121, 34, 'Saang lugar ang Naujan', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Oriental Mindoro, sa hilagang-silangang bahagi ng Mindoro Island.', 'tl', '2026-02-24 01:02:01'),
(122, 33, 'Show me the interactive map of Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-27 13:53:33'),
(123, 33, 'What\'s the current weather in Naujan?', 'I don\'t have live weather data, but Naujan has a tropical climate. For current conditions, please check PAGASA or a weather app.', 'en', '2026-02-27 13:53:39'),
(124, 33, 'What are the top tourist attractions in Naujan?', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-02-27 13:53:55'),
(125, 33, 'Help me plan a day trip to Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-02-27 13:54:01'),
(126, 33, 'Ano ang kasalukuyang panahon sa Naujan?', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman?', 'tl', '2026-02-28 08:50:00'),
(127, 33, 'Mga atraksyon sa Naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-28 08:50:40'),
(128, 33, 'Ipakita sa akin ang interactive na mapa ng Naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-02-28 08:51:29'),
(129, 33, 'Ano ang kasalukuyang panahon sa Naujan?', 'Magandang araw! Ako ang Naujan Chatbot. Ano ang kailangan mong malaman?', 'tl', '2026-02-28 08:51:35'),
(130, 33, 'What\'s the current weather in Naujan?', 'I don\'t have live weather data, but Naujan has a tropical climate. For current conditions, please check PAGASA or a weather app.', 'en', '2026-02-28 09:08:21'),
(131, 33, 'Show me the interactive map of Naujan', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-02-28 09:08:23'),
(132, 33, 'What are the top tourist attractions in Naujan?', 'Suggested day trip: start at Naujan Church (heritage), visit Naujan Lake for birdwatching, then stop by local coconut/rice farms and finish at the town plaza for food stalls.', 'en', '2026-02-28 09:08:24'),
(133, 33, 'Ano ang mga nangungunang tourist attraction sa Naujan?', 'Isang araw na itinerary: Simulan sa Naujan Church, pumunta sa Naujan Lake para sa birdwatching, tapos bisitahin ang lokal na niyugan o palayan at kumain sa plaza.', 'tl', '2026-02-28 09:22:49'),
(134, 33, 'paliwanag ang naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-03-05 05:17:15'),
(135, 33, 'where is naujan', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-03-05 05:18:33'),
(136, 33, 'Best Attractions in Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-06 05:39:18'),
(137, 33, 'Attractions in Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-06 05:39:30'),
(138, 33, 'Where is naujan', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-03-06 05:39:40'),
(139, 33, 'What are the top tourist attractions in Naujan?', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-06 05:39:48'),
(140, 33, 'What\'s the current weather in Naujan?', 'I don\'t have live weather data, but Naujan has a tropical climate. For current conditions, please check PAGASA or a weather app.', 'en', '2026-03-06 05:39:59'),
(141, 33, 'Help me plan a day trip to Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-03-06 05:40:10'),
(142, 33, 'What are the top tourist attractions in Naujan?', 'Suggested day trip: start at Naujan Church (heritage), visit Naujan Lake for birdwatching, then stop by local coconut/rice farms and finish at the town plaza for food stalls.', 'en', '2026-03-06 05:40:30'),
(143, 33, 'Help me plan a day trip to Oriental Mindoro', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-03-06 14:00:27'),
(144, 33, 'Where can i start', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-10 08:12:32'),
(145, 33, 'Best Attractions in Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-10 08:12:58'),
(146, 33, 'What are the top tourist attractions in Oriental Mindoro?', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-10 08:13:13'),
(147, 33, 'What are the top tourist attractions in Oriental Mindoro?', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-10 08:14:57'),
(148, 35, 'Tell me about Naujan Lake', 'Naujan Lake is the 5th largest lake in the Philippines and a Ramsar Wetland of International Importance since 1999. It hosts migratory birds like the Philippine duck.', 'en', '2026-03-10 08:15:18'),
(149, 35, 'Where is naujan located', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-03-10 08:15:30'),
(150, 36, 'What are the top tourist attractions in Oriental Mindoro?', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-28 06:35:51'),
(151, 36, 'What is the History of Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-28 06:37:00'),
(152, 36, 'What are the top tourist attractions in Oriental Mindoro?', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-28 07:20:04'),
(153, 36, 'Top Tourists Attractions in Naujan', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-28 07:20:19'),
(154, 36, 'Where is Naujan located', 'I\'m not quite sure I understand. Could you rephrase that?', 'en', '2026-03-28 07:20:32'),
(155, 36, 'Where is Naujan', 'Naujan is a 1st Class Municipality in Oriental Mindoro, on the northeastern coast of Mindoro Island in the Philippines.', 'en', '2026-03-28 07:57:22'),
(156, 36, 'What are the attractions in Naujan', 'Top attractions in Naujan:\n• Naujan Lake National Park - stunning freshwater lake with birdwatching and boat rides\n• Simbahang Bato - historic 17th-century church ruins with beautiful heritage\n• Liwasang Bonifacio - vibrant public plaza at town center\n• Dao Waterlily Mini Park - scenic eco-park with water lilies and local craftsmanship\n• Montelago Hot Spring & Forest Falls - natural hot pools and waterfalls\n• AgriGold Farm Learning Center - educational farm with workshops\n• Karacha Falls - majestic waterfall with forest trekking\n• ORIC sa Bathala Waterfalls - exciting eco-tourism with hanging bridge and horseback access\n• Beaches like Celeste Beach House and Nabul Beach Resort for swimming and relaxation.', 'en', '2026-03-28 07:57:36'),
(157, 36, 'Saan ang Naujan', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Naujan, sa hilagang-silangang bahagi ng Mindoro Island.', 'tl', '2026-03-28 07:57:50'),
(158, 36, 'Sino ang mayor ng Naujan', 'Naujan ay matatagpuan sa probinsya ng Naujan, sa rehiyon ng MIMAROPA.', 'tl', '2026-03-28 07:58:24'),
(159, 36, 'Mayor ng Naujan', 'Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong sa: mga turistang lugar, hotel booking, transportasyon, pagkain, mga pista, diving, hiking, pamimili, seguridad at panahon.', 'tl', '2026-03-28 07:58:36'),
(160, 36, 'Kailan ang pinakamainam na panahon para bumisita sa Oriental Mindoro?', 'Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong sa: mga turistang lugar, hotel booking, transportasyon, pagkain, mga pista, diving, hiking, pamimili, seguridad at panahon.', 'tl', '2026-03-28 07:59:03'),
(161, 36, 'Ipakita sa akin ang interactive na mapa ng Naujan', 'Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong sa: mga turistang lugar, hotel booking, transportasyon, pagkain, mga pista, diving, hiking, pamimili, seguridad at panahon.', 'tl', '2026-03-28 07:59:05'),
(162, 36, 'Ano ang mga nangungunang tourist attraction sa Oriental Mindoro?', 'Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong sa: mga turistang lugar, hotel booking, transportasyon, pagkain, mga pista, diving, hiking, pamimili, seguridad at panahon.', 'tl', '2026-03-28 07:59:08'),
(163, 36, 'Mga attraksyon ng Naujan', 'Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong sa: mga turistang lugar, hotel booking, transportasyon, pagkain, mga pista, diving, hiking, pamimili, seguridad at panahon.', 'tl', '2026-03-28 07:59:16'),
(164, 36, 'Mga attraksyon ng Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-03-28 11:16:18'),
(165, 36, 'Saan ang Naujan', 'Hindi ko po masyadong maintindihan. Pwede po bang ulitin?', 'tl', '2026-03-28 11:16:37'),
(166, 36, 'Ayúdame a planificar un itinerario', 'Rasgos naturales de Naujan:\n• Lago Naujan — 5to lago más grande de Filipinas, refugio de aves\n• Río Sadya — ideal para nadar y disfrutar de la naturaleza\n• Vastos arrozales — Naujan es famoso por su producción de arroz\n• Plantaciones de coco — fuente de copra y productos de coco\n• Manglares costeros — protegen la costa y albergan peces', 'es', '2026-03-30 11:06:33'),
(167, 36, 'Gallerin mo ang Mangyan culture', 'Komunidad Mangyan (Iraya, Alangan): Nakatira sa taas ng Naujan. Kilala sa woven baskets, alahas at ambahan poetry. Bisitahin ng may paggalang at lokal na gabay.', 'tl', '2026-03-30 11:17:01'),
(168, 36, '预算旅游要多少钱？', '我不太确定我理解了。你能重新表述一下吗？', 'zh', '2026-03-30 11:17:09'),
(169, 36, '地元の食べ物について教えて', '申し訳ございませんが、よく理解できませんでした。言い直していただけますか？', 'ja', '2026-03-30 11:17:43'),
(170, 36, 'ナウハンのインタラクティブマップを見せて', '申し訳ございませんが、よく理解できませんでした。言い直していただけますか？', 'ja', '2026-03-30 11:17:49'),
(171, 36, '예산 여행은 얼마인가요?', '나우한 여행 예산 가이드:\n• 페리 (바타낙스→칼라판): ₱150–₱350 (RORO 또는 패스트크래프트)\n• 버스 (마닐라→바타낙스): ₱150–₱250\n• 지프니/밴 (칼라판→나우한): ₱40–₱60\n• 기본 숙박: 1박 ₱500–₱1,200\n• 카린데리아 식사: ₱80–₱150\n• 호수 보트 투어: ₱300–₱800\n예상 일일 예산: ₱800–₱1,500 (저예산 여행자).', 'ko', '2026-03-30 11:18:03'),
(172, 36, '나우한의 인터랙티브 지도를 보여주세요', 'LAKBAY에서 호텔 예약 방법:\n1. \'호텔\' 섹션으로 이동.\n2. 나우한의 이용 가능한 호텔 탐색.\n3. 체크인 및 체크아웃 날짜 선택.\n4. 세부 사항 확인 후 예약 확정.\n예약 완료에는 계정이 필요합니다.', 'ko', '2026-03-30 11:18:17'),
(173, 36, '오리엔탈 민도로의 주요 관광 명소는 무엇입니까?', '추천 일정: 나우한 교회 → 나우한 호수에서 조류 관찰 → 코코넛/논밭 방문 → 광장에서 식사.', 'ko', '2026-03-30 11:18:36'),
(174, 36, 'Quelles sont les principales attractions d\'Oriental Mindoro?', 'Activités au Lac Naujan :\n• Observation des oiseaux — plus de 100 espèces dont le Canard des Philippines\n• Promenade en bateau — louer un bateau local pour naviguer sur le lac\n• Pêche — les pêcheurs locaux proposent des tours guidés\n• Kayaking — explorer les rives et les mangroves du lac\n• Randonnée sur les sentiers éco du Parc National\n• Pique-nique et détente sur les rives du lac', 'fr', '2026-03-30 11:18:45'),
(175, 36, 'オリエンタル・ミンドロの主要観光地は？', '申し訳ございませんが、よく理解できませんでした。言い直していただけますか？', 'ja', '2026-03-31 13:57:09'),
(176, 36, 'ナウハンのインタラクティブマップを見せて', '申し訳ございませんが、よく理解できませんでした。言い直していただけますか？', 'ja', '2026-03-31 13:57:30'),
(177, 37, 'what is naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-01 04:08:39'),
(178, 37, 'Where is naujan?', 'Naujan is a 1st Class Municipality in the Philippines, known for agriculture and tourism on Mindoro Island.', 'en', '2026-04-01 04:09:06'),
(179, 37, 'nasaan ang naujan?', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Naujan, sa hilagang-silangang bahagi ng Mindoro Island.', 'tl', '2026-04-01 04:11:17'),
(180, 36, 'hi', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-09 19:07:09'),
(181, 36, 'HI', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-09 19:07:23'),
(182, 36, 'Ipakita sa akin ang interactive na mapa ng Naujan', 'Ang Naujan ay isang 1st Class Municipality sa lalawigan ng Naujan, sa hilagang-silangang bahagi ng Mindoro Island.', 'tl', '2026-04-20 15:33:45'),
(183, 36, 'Kailan ang pinakamainam na panahon para bumisita sa Oriental Mindoro?', 'Ang kasalukuyang Vice Mayor ng Naujan ay si Candido J. Melgar Jr. Ang Vice Mayor ay tumutulong sa pmunoang-papel at administrasyon ng munisipyo.', 'tl', '2026-04-20 15:33:53'),
(184, 36, 'Kailan ang pinakamainam na panahon para bumisita sa Oriental Mindoro?', 'Ang kasalukuyang Vice Mayor ng Naujan ay si Candido J. Melgar Jr. Ang Vice Mayor ay tumutulong sa pmunoang-papel at administrasyon ng munisipyo.', 'tl', '2026-04-20 15:34:01'),
(185, 36, 'Ano ang mga nangungunang tourist attraction sa Oriental Mindoro?', 'Ang kasalukuyang Vice Mayor ng Naujan ay si Candido J. Melgar Jr. Ang Vice Mayor ay tumutulong sa pmunoang-papel at administrasyon ng munisipyo.', 'tl', '2026-04-20 15:34:08'),
(186, 38, '¿Cuáles son las principales atracciones de Oriental Mindoro?', 'Los Mangyan son 8 grupos indigenas de Mindoro con tradiciones como la escritura Hanunuo-Mangyan, un sistema precolonial en bambu.', 'es', '2026-04-20 15:34:24'),
(187, 38, 'Ayúdame a planificar un viaje de un día a Oriental Mindoro', 'No estoy seguro de entender. �Puedes reformular eso? Puedo ayudarte con: atracciones tur�sticas, hoteles, transporte, comida local, festivales, buceo, senderismo, tiendas, seguridad y clima.', 'es', '2026-04-20 15:35:12'),
(188, 38, '¿Cuáles son las principales atracciones turísticas de Oriental Mindoro?', 'No estoy seguro de entender. �Puedes reformular eso? Puedo ayudarte con: atracciones tur�sticas, hoteles, transporte, comida local, festivales, buceo, senderismo, tiendas, seguridad y clima.', 'es', '2026-04-20 15:35:19'),
(189, 38, '¿Cuál es la mejor época para visitar Oriental Mindoro?', 'Es un santuario para m�s de 60 especies de aves, incluyendo el pato filipinos en peligro de extinci�n.', 'es', '2026-04-20 15:35:21'),
(190, 38, 'Muéstrame el mapa interactivo de Naujan', 'Naujan es un Municipio de Primera Clase en la provincia de Naujan, Filipinas.', 'es', '2026-04-20 15:35:21'),
(191, 38, '¿Qué hoteles y alojamientos hay disponibles en Naujan?', 'No estoy seguro de entender. �Puedes reformular eso? Puedo ayudarte con: atracciones tur�sticas, hoteles, transporte, comida local, festivales, buceo, senderismo, tiendas, seguridad y clima.', 'es', '2026-04-20 15:35:32'),
(192, 38, 'Ano ang mga pangunahing atraksyon sa Oriental Mindoro?', 'Bienvenido sa Naujan! Ano ang gusto mong malaman?', 'tl', '2026-04-20 15:35:52'),
(193, 38, 'Mga atraksyon sa Oriental Mindoro', 'Hindi ko po masyadong naiintindihan. Pwede po bang ulitin? Maaari akong tumulong sa: mga turistang lugar, hotel booking, transportasyon, pagkain, mga pista, diving, hiking, pamimili, seguridad at panahon.', 'tl', '2026-04-20 15:36:07'),
(194, 38, 'What are the top attractions in Oriental Mindoro?', 'Naujan offers a range of accommodations, from budget guesthouses to comfortable hotels. Tell me your budget, travel dates, and preferred location, and I can suggest suitable options.', 'en', '2026-04-20 15:44:30'),
(195, 38, 'What are the attractions in Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 16:14:11'),
(196, 38, 'Who is the mayor of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 16:14:24'),
(197, 38, 'What are the top tourist attractions in Oriental Mindoro?', 'Naujan offers a range of accommodations, from budget guesthouses to comfortable hotels. Tell me your budget, travel dates, and preferred location, and I can suggest suitable options.', 'en', '2026-04-20 17:04:36'),
(198, 39, 'What are the top attractions in Oriental Mindoro?', 'Naujan offers a range of accommodations, from budget guesthouses to comfortable hotels. Tell me your budget, travel dates, and preferred location, and I can suggest suitable options.', 'en', '2026-04-20 17:04:59'),
(199, 40, 'What are the attractions in the Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 19:41:17'),
(200, 40, 'What hotels and accommodations are available in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 19:41:30'),
(201, 40, 'What are the top tourist attractions in Oriental Mindoro?', 'Naujan offers a range of accommodations, from budget guesthouses to comfortable hotels. Tell me your budget, travel dates, and preferred location, and I can suggest suitable options.', 'en', '2026-04-20 19:41:41'),
(202, 40, 'Help me plan a day trip to Oriental Mindoro', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 19:41:47'),
(203, 40, 'What\'s the best time to visit Oriental Mindoro?', 'Naujan offers a range of accommodations, from budget guesthouses to comfortable hotels. Tell me your budget, travel dates, and preferred location, and I can suggest suitable options.', 'en', '2026-04-20 19:41:52'),
(204, 40, 'What are the attractions of naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 21:38:00'),
(205, 41, 'Show me the interactive map of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 21:39:03'),
(206, 41, 'What\'s the best time to visit Oriental Mindoro?', 'Naujan offers a range of accommodations, from budget guesthouses to comfortable hotels. Tell me your budget, travel dates, and preferred location, and I can suggest suitable options.', 'en', '2026-04-20 21:39:09'),
(207, 42, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 22:17:53'),
(208, 42, 'Show me the interactive map of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 22:18:03'),
(209, 42, 'What\'s the best time to visit Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 22:18:07'),
(210, 42, 'What are the top tourist attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 22:18:12'),
(211, 42, 'Help me plan a day trip to Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 22:18:18'),
(212, 42, 'What hotels and accommodations are available in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 22:18:24'),
(213, 43, '¿Cuáles son las principales atracciones de Naujan?', 'No estoy seguro de entender. �Puedes reformular eso? Puedo ayudarte con informaci�n sobre Naujan: atracciones, Lago Naujan, hoteles, transporte, comida local, festivales, senderismo, tiendas, clima y seguridad.', 'es', '2026-04-20 22:59:14'),
(214, 43, '瑙詹有哪些主要景点？', '建议行程：从瑙汉教堂开始，参观瑙汉湖观鸟，然后去当地椰子或水稻农场，最后在市镇广场就餐。', 'zh', '2026-04-20 22:59:41'),
(215, 43, 'ナウジャンの主要観光地は？', '申し訳ございませんが、よく理解できませんでした。言い直していただけますか？', 'ja', '2026-04-20 23:00:07'),
(216, 43, 'Show me the interactive map of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:00:41'),
(217, 43, 'What\'s the best time to visit Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:00:47'),
(218, 43, 'What are the top tourist attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:00:50'),
(219, 43, 'Help me plan a day trip to Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 23:00:55'),
(220, 43, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:01:05'),
(221, 44, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:06:08'),
(222, 44, 'Show me the interactive map of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:06:42'),
(223, 44, 'What\'s the best time to visit Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:06:50'),
(224, 44, 'What are the top tourist attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:06:55'),
(225, 44, 'Help me plan a day trip to Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 23:06:59'),
(226, 44, 'What hotels and accommodations are available in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:07:03'),
(227, 44, 'Who is the mayor of Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 23:09:52'),
(228, 45, 'How do I get to Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:10:04'),
(229, 46, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:11:10'),
(230, 46, 'What\'s the best time to visit Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:11:20'),
(231, 46, 'What are the top tourist attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:11:24'),
(232, 47, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:15:40'),
(233, 48, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:20:32'),
(234, 48, 'Hello', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 23:20:43'),
(235, 48, 'Where can i locate Naujan', 'Naujan is a 1st Class Municipality in the Philippines, known for agriculture and tourism on Mindoro Island.', 'en', '2026-04-20 23:20:55'),
(236, 48, 'What are the attractions of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-04-20 23:21:11'),
(237, 48, 'Who is the mayor  of Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-04-20 23:21:25'),
(238, 48, 'Who are the mayors of Naujan', 'You can contact Naujan\'s Local Government Unit at the Mayor\'s Office phone: (043) 208-3382 or (043) 208-3479. Mayor Henry Joel C. Teves leads the municipal administration.', 'en', '2026-04-20 23:47:07'),
(239, 48, 'ナウジャンはどこにいるのか', 'ナウジャンはフィリピンのミンドロ島北東部にある第一級自治体です。', 'ja', '2026-04-20 23:49:50'),
(240, 48, 'ナウジャンの市長は誰ですか？', 'ナウジャンの現市長はHenry Joel C. Tevesで、2022年から現在まで務めています。市長事務所は(043) 208-3382または(043) 208-3479でお問い合わせできます。', 'ja', '2026-04-20 23:56:06'),
(241, 48, 'Where is Naujan', 'Naujan is a 1st Class Municipality in the Philippines, known for agriculture and tourism on Mindoro Island.', 'en', '2026-04-21 01:44:20'),
(242, 49, 'Tell me about Naujan Lake', 'Naujan Lake National Park covers about 20,000 hectares and is the 5th largest freshwater lake in the Philippines. It was designated as a Ramsar Wetland of International Importance in 1999, recognizing its critical importance for migratory birds.', 'en', '2026-04-21 02:57:15'),
(243, 50, 'Tell me about Naujan Lake', 'Naujan Lake National Park covers about 20,000 hectares and is the 5th largest freshwater lake in the Philippines. It was designated as a Ramsar Wetland of International Importance in 1999, recognizing its critical importance for migratory birds.', 'en', '2026-04-21 03:27:31'),
(244, 51, 'What are the top attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-05-03 07:31:32'),
(245, 52, 'Tell me about Naujan Lake', 'Naujan Lake National Park covers about 20,000 hectares and is the 5th largest freshwater lake in the Philippines. It was designated as a Ramsar Wetland of International Importance in 1999, recognizing its critical importance for migratory birds.', 'en', '2026-05-03 07:32:29'),
(246, 52, 'What\'s the best time to visit Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-05-03 07:32:38');
INSERT INTO `chatbot_messages` (`message_id`, `conversation_id`, `message_text`, `response_text`, `language`, `sent_at`) VALUES
(247, 52, 'Show me the interactive map of Naujan', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-05-03 07:32:44'),
(248, 52, 'What are the top tourist attractions in Naujan?', 'Naujan\'s mayors include: Bonifacio Evora (1903), Leon Garong (1903-1916), Agustin Garong (1916-1922), Jose L. Basa (1922-1927), Santiago Garong (1928-1934), Porfirio Comia (1935-1940, 1950-1962), and others through the years. Current Mayor: Henry Joel C. Teves (2022-Present).', 'en', '2026-05-03 07:32:49'),
(249, 52, 'Help me plan a day trip to Naujan', 'Hello! I am the Naujan Chatbot Assistant. How can I help you today?', 'en', '2026-05-03 07:32:56'),
(250, 52, 'Show me the interactive map of Naujan', 'I\'m your LAKBAY travel assistant! I can help you with: Tourist spots and attractions in Naujan, Hotel bookings and accommodation options, Travel directions and transportation info, Weather and best travel times, Itinerary planning and trip suggestions, Local food and dining recommendations, Festivals and events, Mangyan culture and history, and Emergency contacts. Just ask me anything about traveling in Naujan!', 'en', '2026-05-03 07:39:47'),
(251, 52, 'What\'s the best time to visit Naujan?', 'Best time to visit Naujan:\nâ€¢ Novemberâ€“May (dry season) â€” ideal weather for exploring the lake, farms, and heritage sites\nâ€¢ Novemberâ€“March â€” BEST for birdwatching at Naujan Lake: migratory birds from Siberia and East Asia arrive\nâ€¢ Decemberâ€“February â€” coolest and most comfortable months for outdoor activities\nâ€¢ Juneâ€“October â€” rainy/typhoon season; the rice fields are lush and green, but travel may be disrupted\nTip: Visit early morning (5â€“8 AM) year-round for the best birdwatching experience at the lake.', 'en', '2026-05-03 07:39:55'),
(252, 52, 'What are the top tourist attractions in Naujan?', 'Top attractions in Naujan:\n• Naujan Lake National Park - stunning freshwater lake with birdwatching and boat rides\n• Simbahang Bato - historic 17th-century church ruins with beautiful heritage\n• Liwasang Bonifacio - vibrant public plaza at town center\n• Dao Waterlily Mini Park - scenic eco-park with water lilies and local craftsmanship\n• Montelago Hot Spring & Forest Falls - natural hot pools and waterfalls\n• AgriGold Farm Learning Center - educational farm with workshops\n• Karacha Falls - majestic waterfall with forest trekking\n• ORIC sa Bathala Waterfalls - exciting eco-tourism with hanging bridge and horseback access\n• Beaches like Celeste Beach House and Nabul Beach Resort for swimming and relaxation.', 'en', '2026-05-03 07:40:11'),
(253, 52, 'What\'s the best time to visit Naujan?', 'Best time to visit Naujan:\nâ€¢ Novemberâ€“May (dry season) â€” ideal weather for exploring the lake, farms, and heritage sites\nâ€¢ Novemberâ€“March â€” BEST for birdwatching at Naujan Lake: migratory birds from Siberia and East Asia arrive\nâ€¢ Decemberâ€“February â€” coolest and most comfortable months for outdoor activities\nâ€¢ Juneâ€“October â€” rainy/typhoon season; the rice fields are lush and green, but travel may be disrupted\nTip: Visit early morning (5â€“8 AM) year-round for the best birdwatching experience at the lake.', 'en', '2026-05-03 08:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `hotels`
--

CREATE TABLE `hotels` (
  `hotel_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price_per_night` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'PHP',
  `rating` decimal(3,1) DEFAULT 0.0,
  `rooms_total` int(11) DEFAULT 10,
  `rooms_available` int(11) DEFAULT 10,
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `image_url` varchar(500) DEFAULT NULL,
  `map_url` varchar(500) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL,
  `allowed_payment_methods` varchar(255) NOT NULL DEFAULT 'card,gcash,paypal,bank_transfer,pay_at_property'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotels`
--

INSERT INTO `hotels` (`hotel_id`, `name`, `location`, `description`, `price_per_night`, `currency`, `rating`, `rooms_total`, `rooms_available`, `amenities`, `image_url`, `map_url`, `latitude`, `longitude`, `contact_phone`, `contact_email`, `is_active`, `created_at`, `updated_at`, `archived`, `archived_at`, `allowed_payment_methods`) VALUES
(1, 'Naujan Paradise Resort', 'Brgy. Panaytayan, Naujan', 'A luxury resort featuring stunning views of Naujan Lake with world-class amenities and services. Perfect for a relaxing getaway with family and friends.', 3500.00, 'PHP', 4.8, 10, 6, '[\"Swimming Pool\",\"Restaurant\",\"Bar\",\"WiFi\",\"Air Conditioning\",\"Spa\",\"Room Service\",\"TV\"]', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764509053/baguiohotel_cj7b4u.jpg', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.123456789!2d121.22!3d12.31!2m3!1f0!2f0!3f0!3m2!1i1024!2i768', 12.53512620, 121.32753680, '(043) 208-5555', 'info@naijanparadiseresort.com', 0, '2026-01-31 15:31:13', '2026-05-02 04:41:59', 0, NULL, 'gcash'),
(2, 'Lake View Hotel', 'Naujan Town Proper', 'Affordable and comfortable hotel with direct views of Naujan Lake. A perfect base for exploring local attractions with friendly staff and quality service.', 1500.00, 'PHP', 4.3, 10, 10, '[\"Restaurant\",\"Bar\",\"WiFi\",\"Air Conditioning\",\"Room Service\",\"TV\",\"Parking\"]', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764509053/baguiohotel_cj7b4u.jpg', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.456789012!2d121.225!3d12.404!2m3!1f0!2f0!3f0!3m2!1i1024!2i768', 12.36492438, 121.15572139, '(043) 208-3456', 'lakeview@naujango.com', 0, '2026-01-31 15:31:13', '2026-05-02 04:42:05', 0, NULL, 'card,gcash,paypal,bank_transfer,pay_at_property'),
(3, 'Mountain View Inn', 'Brgy. Sulong, Naujan', 'Cozy inn located near Mt. Halcon foothills, ideal for trekkers and nature enthusiasts. Offers budget-friendly accommodations with authentic local hospitality.', 800.00, 'PHP', 4.7, 10, 9, '[\"Restaurant\",\"WiFi\",\"Fan\",\"Parking\",\"Common Area\"]', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1764509053/baguiohotel_cj7b4u.jpg', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3934.789012345!2d121.21!3d12.35!2m3!1f0!2f0!3f0!3m2!1i1024!2i768', 12.39835333, 121.18058306, '(043) 208-7890', 'info@mountainviewinn.com', 0, '2026-01-31 15:31:13', '2026-05-02 04:42:04', 0, NULL, 'card,gcash,paypal,bank_transfer,pay_at_property'),
(8, 'Naujan Travellers Inn', 'Barcenaga, Naujan, Oriental Mindoro', 'Naujan Travellers Inn and Restobar', 0.00, 'PHP', 0.0, 20, 20, '[\"Laundry\",\"Air Conditioned\"]', 'https://res.cloudinary.com/dljppqq7z/image/upload/v1777698537/476143474_9589161967760739_6181849064061771036_n_i7aghx.jpg', 'https://www.google.com/maps/place/Naujan+Travellers+Inn+and+Restobar/@13.2745991,121.240197,682m/data=!3m1!1e3!4m14!1m7!3m6!1s0x33bceabee1950b7d:0xf43c18e9b51321e9!2sNaujan+Travellers+Inn+and+Restobar!8m2!3d13.2745939!4d121.2427719!16s%2Fg%2F11dzw5htcw!3m5!1s0x33bceabee1950b7d:0xf43c18e9b51321e9!8m2!3d13.2745939!4d121.2427719!16s%2Fg%2F11dzw5htcw?entry=ttu&g_ep=EgoyMDI2MDQyOS4wIKXMDSoASAFQAw%3D%3D', NULL, NULL, '09204090333', 'travellersinn102310@gmail.com', 1, '2026-05-02 05:22:10', '2026-05-03 13:25:41', 0, NULL, 'gcash,pay_at_property');

-- --------------------------------------------------------

--
-- Table structure for table `hotel_availability`
--

CREATE TABLE `hotel_availability` (
  `availability_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `availability_date` date NOT NULL,
  `rooms_available` int(11) DEFAULT NULL,
  `price_override` decimal(10,2) DEFAULT NULL,
  `is_closed` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_availability`
--

INSERT INTO `hotel_availability` (`availability_id`, `hotel_id`, `availability_date`, `rooms_available`, `price_override`, `is_closed`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-02-01', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(2, 1, '2026-02-02', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(3, 1, '2026-02-03', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(4, 1, '2026-02-04', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(5, 1, '2026-02-05', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(6, 1, '2026-02-06', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(7, 1, '2026-02-07', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(8, 1, '2026-02-08', 8, 1000.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:11:27'),
(9, 1, '2026-02-09', 10, 0.00, 0, '2026-02-09 14:11:27', '2026-02-09 14:23:11');

-- --------------------------------------------------------

--
-- Table structure for table `hotel_bookings`
--

CREATE TABLE `hotel_bookings` (
  `booking_id` int(11) NOT NULL,
  `booking_reference` varchar(20) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `hotel_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `hotel_name` varchar(255) NOT NULL,
  `room_type_name` varchar(100) DEFAULT NULL,
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
  `payment_status` enum('unpaid','pending','paid','failed','refunded') DEFAULT 'unpaid',
  `payment_method` varchar(50) DEFAULT 'pay_at_property',
  `payment_reference` varchar(100) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `receipt_number` varchar(64) NOT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_email` varchar(200) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_bookings`
--

INSERT INTO `hotel_bookings` (`booking_id`, `booking_reference`, `user_id`, `hotel_id`, `room_id`, `hotel_name`, `room_type_name`, `hotel_location`, `price_per_night`, `currency`, `check_in`, `check_out`, `nights`, `rooms`, `guests`, `special_requests`, `status`, `payment_status`, `payment_method`, `payment_reference`, `total_amount`, `receipt_number`, `customer_name`, `customer_email`, `customer_phone`, `created_at`, `updated_at`, `expires_at`, `archived`, `archived_at`) VALUES
(4, 'HB000004', 1, 4, NULL, 'Naujan Heritage Hotel', NULL, 'Naujan Town Plaza Area', 2000.00, 'PHP', '2026-02-04', '2026-02-05', 1, 1, 2, 'adfaf', 'cancelled', 'paid', 'paypal', NULL, 2000.00, 'HB-20260204-DBD82A', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-04 02:52:27', '2026-02-09 12:57:58', NULL, 0, NULL),
(5, 'HB000005', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-04', '2026-02-05', 1, 1, 2, 'safdfaf', 'cancelled', 'paid', 'paypal', NULL, 5000.00, 'HB-20260204-551F10', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-04 03:00:53', '2026-02-09 12:57:58', NULL, 0, NULL),
(6, 'HB000006', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-04', '2026-02-05', 1, 1, 2, NULL, 'cancelled', 'paid', 'gcash', NULL, 5000.00, 'HB-20260204-A6BFDA', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-04 12:59:08', '2026-02-09 12:57:58', NULL, 0, NULL),
(7, 'HB000007', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 5000.00, 'HB-20260207-D44C3D', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-07 04:05:41', '2026-02-09 12:57:58', NULL, 0, NULL),
(8, 'HB000008', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 5000.00, 'HB-20260207-B39F85', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 05:07:44', '2026-02-09 12:57:58', NULL, 0, NULL),
(9, 'HB000009', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-09', 2, 1, 2, 'n ', 'cancelled', 'paid', 'paypal', NULL, 10000.00, 'HB-20260207-CA1D2E', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 05:10:47', '2026-02-09 12:57:58', NULL, 0, NULL),
(10, 'HB000010', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 5000.00, 'HB-20260207-20A6A7', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 05:12:56', '2026-02-09 12:57:58', NULL, 0, NULL),
(11, 'HB000011', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-09', 2, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 10000.00, 'HB-20260207-3A1C5E', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 05:21:19', '2026-03-02 11:40:36', NULL, 1, '2026-03-02 19:40:36'),
(12, 'HB000012', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-09', 2, 1, 2, 'sdasd', 'cancelled', 'unpaid', 'paypal', NULL, 10000.00, 'HB-20260207-2EAB55', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 05:21:26', '2026-03-02 11:40:32', NULL, 1, '2026-03-02 19:40:32'),
(13, 'HB000013', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 5000.00, 'HB-20260207-E4A17B', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 06:18:49', '2026-03-02 11:40:30', NULL, 1, '2026-03-02 19:40:30'),
(14, 'HB000014', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-17', '2026-02-18', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 5000.00, 'HB-20260207-925581', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 06:46:36', '2026-03-02 11:40:28', NULL, 1, '2026-03-02 19:40:28'),
(15, 'HB000015', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-6311F3', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 06:50:52', '2026-03-02 11:40:26', NULL, 1, '2026-03-02 19:40:26'),
(16, 'HB000016', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-806CCC', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:15:07', '2026-03-02 11:40:25', NULL, 1, '2026-03-02 19:40:25'),
(17, 'HB000017', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-9F8067', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:23:47', '2026-03-02 11:40:24', NULL, 1, '2026-03-02 19:40:24'),
(18, 'HB000018', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-12ACBF', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:23:49', '2026-03-02 11:40:23', NULL, 1, '2026-03-02 19:40:23'),
(19, 'HB000019', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-9E88A0', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:23:50', '2026-03-02 11:40:20', NULL, 1, '2026-03-02 19:40:20'),
(20, 'HB000020', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-58A814', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:23:51', '2026-03-02 11:40:19', NULL, 1, '2026-03-02 19:40:19'),
(21, 'HB000021', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-582C35', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:24:37', '2026-03-02 11:40:17', NULL, 1, '2026-03-02 19:40:17'),
(22, 'HB000022', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-2D5B40', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:25:57', '2026-03-02 11:40:16', NULL, 1, '2026-03-02 19:40:16'),
(23, 'HB000023', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-B5459C', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:26:08', '2026-03-02 11:40:14', NULL, 1, '2026-03-02 19:40:14'),
(24, 'HB000024', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-2F0E18', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:26:09', '2026-03-02 11:40:12', NULL, 1, '2026-03-02 19:40:12'),
(25, 'HB000025', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'failed', 'gcash', NULL, 5000.00, 'HB-20260207-853E34', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:26:12', '2026-03-02 11:40:11', NULL, 1, '2026-03-02 19:40:11'),
(26, 'HB000026', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-A6DEFC', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:27:45', '2026-03-02 11:40:10', NULL, 1, '2026-03-02 19:40:10'),
(27, 'HB000027', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-FC1130', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:35:37', '2026-03-02 11:40:09', NULL, 1, '2026-03-02 19:40:09'),
(28, 'HB000028', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-C5DF5A', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:41:54', '2026-03-02 11:40:07', NULL, 1, '2026-03-02 19:40:07'),
(29, 'HB000029', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-0AF6D5', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:47:12', '2026-03-02 11:40:06', NULL, 1, '2026-03-02 19:40:06'),
(30, 'HB000030', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'paypal', NULL, 5000.00, 'HB-20260207-5213E0', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:51:14', '2026-03-02 11:40:05', NULL, 1, '2026-03-02 19:40:05'),
(31, 'HB000031', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'failed', 'gcash', NULL, 5000.00, 'HB-20260207-90BC1B', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:51:27', '2026-03-02 11:40:01', NULL, 1, '2026-03-02 19:40:01'),
(32, 'HB000032', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'failed', 'gcash', NULL, 5000.00, 'HB-20260207-33C352', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-07 07:56:00', '2026-02-23 14:05:35', NULL, 1, '2026-02-23 22:05:35'),
(33, 'HB000033', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'cancelled', 'failed', 'paypal', NULL, 3500.00, 'HB-20260207-CC9DAE', 'Blue', 'benedictmadrigal26@gmail.com', '9652715332', '2026-02-07 08:02:10', '2026-04-09 20:01:58', NULL, 1, '2026-02-23 22:05:30'),
(34, 'HB000034', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'pending', 'failed', 'gcash', NULL, 5000.00, 'HB-20260207-1AB64B', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-07 09:25:48', '2026-03-02 11:40:00', NULL, 1, '2026-03-02 19:40:00'),
(35, 'HB000035', 1, 7, NULL, 'Lakefront Premium Resort', NULL, 'Brgy. Panaytayan, Naujan', 5000.00, 'PHP', '2026-02-07', '2026-02-08', 1, 1, 2, NULL, 'confirmed', 'failed', 'card', NULL, 5000.00, 'HB-20260207-B3082A', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-07 10:08:34', '2026-03-02 11:39:58', NULL, 1, '2026-03-02 19:39:58'),
(36, 'HB000036', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-08', '2026-02-09', 1, 1, 2, NULL, 'confirmed', 'failed', 'gcash', NULL, 3500.00, 'HB-20260208-184D52', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-08 14:22:36', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:57'),
(37, 'HB000037', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 3, NULL, 'confirmed', 'failed', 'gcash', NULL, 3500.00, 'HB-20260209-F75627', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-09 10:51:55', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:56'),
(38, 'HB000038', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 2, NULL, 'confirmed', 'failed', 'gcash', NULL, 3500.00, 'HB-20260209-98F8F4', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-09 11:27:16', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:55'),
(39, 'HB000039', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 2, NULL, 'cancelled', 'failed', 'paypal', NULL, 3500.00, 'HB-20260209-FB6C54', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-09 11:28:02', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:53'),
(40, 'HB000040', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-10', '2026-02-11', 1, 1, 2, NULL, 'pending', 'failed', 'gcash', NULL, 3500.00, 'HB-20260209-EFF652', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-09 12:54:45', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:48'),
(41, 'HB000041', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 2, NULL, 'pending', 'failed', 'paypal', NULL, 3500.00, 'HB-20260209-2BA1CC', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-09 13:00:35', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:47'),
(42, 'HB000042', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-09', '2026-02-11', 2, 1, 2, NULL, 'pending', 'failed', 'paypal', NULL, 7000.00, 'HB-20260209-EC4775', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-09 13:05:06', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:45'),
(43, 'HB000043', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 1, NULL, 'cancelled', 'failed', 'paypal', NULL, 800.00, 'HB-20260209-6DF077', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-09 13:46:04', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:44'),
(44, 'HB000044', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 1, NULL, 'cancelled', 'paid', 'paypal', NULL, 800.00, 'HB-20260209-F679DD', 'Blue', 'benedictmadrigal26@gmail.com', '9652715532', '2026-02-09 13:51:38', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:43'),
(45, 'HB000045', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-09', '2026-02-10', 1, 1, 1, NULL, 'cancelled', 'paid', 'gcash', NULL, 800.00, 'HB-20260209-975E11', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-09 14:49:37', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:42'),
(47, 'HB000047', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-14', '2026-02-15', 1, 2, 5, NULL, 'cancelled', 'failed', 'paypal', NULL, 1600.00, 'HB-20260210-35E4F7', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-10 01:22:27', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:40'),
(48, 'HB000048', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-11', '2026-02-12', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 800.00, 'HB-20260210-CF9475', 'Kyla Manalo', 'kymanalobearxkyqt21@gmail.com', '09703208984', '2026-02-10 01:24:10', '2026-04-09 20:01:58', NULL, 1, '2026-03-02 19:39:39'),
(49, 'HB000049', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-21', '2026-02-22', 1, 1, 2, NULL, 'pending', 'failed', 'paypal', NULL, 800.00, 'HB-20260220-135496', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-20 17:50:28', '2026-04-09 20:01:58', '2026-02-21 09:50:28', 1, '2026-03-02 19:39:38'),
(50, 'HB000050', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-23', '2026-02-24', 1, 1, 2, NULL, 'pending', 'failed', 'paypal', NULL, 800.00, 'HB-20260220-279781', 'Blue', 'benedictmadrigal26@gmail.com', NULL, '2026-02-20 17:55:32', '2026-04-09 20:01:58', '2026-02-21 09:55:32', 1, '2026-03-02 19:39:37'),
(51, 'HB000051', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-24', '2026-02-25', 1, 1, 2, NULL, 'pending', 'failed', 'gcash', NULL, 800.00, 'HB-20260221-794C27', 'Blue', 'benedictmadrigal26gmail.com', '09652715532', '2026-02-21 04:35:54', '2026-04-09 20:01:58', '2026-02-21 20:35:54', 1, '2026-03-02 19:39:35'),
(52, 'HB000052', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-02-25', '2026-02-26', 1, 1, 2, NULL, 'pending', 'failed', 'gcash', NULL, 800.00, 'HB-20260221-8E2479', 'Blue', 'benedictmadrigal26@gmail.com', '09652715532', '2026-02-21 04:40:45', '2026-04-09 20:01:58', '2026-02-21 20:40:45', 1, '2026-03-02 19:39:33'),
(53, 'HB000053', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-02-25', '2026-02-26', 1, 1, 2, NULL, 'pending', 'failed', 'paypal', NULL, 3500.00, 'HB-20260224-187119', 'Blue', 'benedictmadrigal26@gmail.com', '09122513374', '2026-02-24 00:54:23', '2026-04-09 20:01:58', '2026-02-24 16:54:23', 1, '2026-03-02 19:39:32'),
(54, 'HB000054', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-01', '2026-03-03', 2, 1, 2, NULL, 'pending', 'unpaid', 'gcash', NULL, 1600.00, 'HB-20260301-C48D35', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-03-01 13:43:12', '2026-04-09 20:01:58', '2026-03-02 05:43:12', 1, '2026-03-02 19:39:30'),
(55, 'HB000055', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-16', '2026-03-17', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 800.00, 'HB-20260302-EF79A4', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-03-02 13:10:00', '2026-04-09 20:01:58', '2026-03-03 05:10:00', 0, NULL),
(56, 'HB000056', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-10', '2026-03-11', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 800.00, 'HB-20260302-DB6033', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-03-02 13:28:15', '2026-04-09 20:01:58', '2026-03-03 05:28:15', 0, NULL),
(57, 'HB000057', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-11', '2026-03-12', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 800.00, 'HB-20260302-C85B95', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-03-02 13:37:56', '2026-04-09 20:01:58', '2026-03-03 05:37:56', 0, NULL),
(58, 'HB000058', 1, 2, 2, 'Lake View Hotel', 'Standard Room', 'Naujan Town Proper', 1500.00, 'PHP', '2026-03-05', '2026-03-08', 3, 2, 5, 'kkisloaoa', 'pending', 'pending', 'gcash', NULL, 9000.00, 'HB-20260303-6CB79D', 'Kyla Manalo', 'manalokyla44@gmail.com', '09703208984', '2026-03-03 00:35:25', '2026-04-09 20:01:58', '2026-03-03 16:35:25', 0, NULL),
(59, 'HB000059', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-03-30', '2026-03-31', 1, 1, 2, NULL, 'confirmed', 'paid', 'gcash', NULL, 3500.00, 'HB-20260324-A8BA13', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-03-24 07:55:58', '2026-04-09 20:01:58', '2026-03-24 23:55:58', 0, NULL),
(60, 'HB000060', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-28', '2026-04-02', 5, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 4000.00, 'HB-20260328-E2FA9D', 'Benedict R. Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-03-28 04:02:42', '2026-04-09 20:01:58', '2026-03-28 20:02:42', 0, NULL),
(61, 'HB000061', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-04-02', '2026-05-03', 31, 1, 2, NULL, 'pending', 'unpaid', 'gcash', NULL, 108500.00, 'HB-20260328-C56EA8', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '09652715532', '2026-03-28 04:39:40', '2026-04-09 20:01:58', '2026-03-28 20:39:40', 0, NULL),
(62, 'HB000062', 1, 1, 1, 'Naujan Paradise Resort', 'Standard Room', 'Brgy. Panaytayan, Naujan', 3500.00, 'PHP', '2026-03-31', '2026-04-02', 2, 1, 2, NULL, 'pending', 'pending', 'gcash', NULL, 7000.00, 'HB-20260328-B2FF54', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-03-28 04:49:35', '2026-04-09 20:01:58', '2026-03-28 20:49:35', 0, NULL),
(63, 'HB000063', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-30', '2026-03-31', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260330-DC4407', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-03-30 09:47:27', '2026-04-09 20:01:58', '2026-03-31 01:47:27', 0, NULL),
(64, 'HB000064', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-03-31', '2026-04-01', 1, 2, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 1600.00, 'HB-20260330-D490C1', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-03-30 10:00:12', '2026-04-09 20:01:58', '2026-03-31 02:00:12', 0, NULL),
(65, 'HB000065', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-06', '2026-04-07', 1, 1, 2, NULL, 'cancelled', 'paid', 'gcash', NULL, 800.00, 'HB-20260405-BDD014', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-05 11:41:26', '2026-04-09 20:01:58', '2026-04-06 03:41:26', 0, NULL),
(66, 'HB000066', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-06', '2026-04-07', 1, 1, 2, NULL, 'pending', 'pending', 'gcash', NULL, 800.00, 'HB-20260406-80D138', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-06 11:47:50', '2026-04-09 20:01:58', '2026-04-07 03:47:50', 0, NULL),
(67, 'HB000067', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-10', '2026-04-11', 1, 1, 2, NULL, 'confirmed', 'paid', 'gcash', NULL, 800.00, 'HB-20260410-DE8192', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-10 09:54:16', '2026-04-10 13:41:47', '2026-04-11 01:54:16', 0, NULL),
(68, 'HB000068', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-12', '2026-04-13', 1, 1, 2, NULL, 'confirmed', 'paid', 'gcash', NULL, 800.00, 'HB-20260412-FB0F63', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-12 05:44:06', '2026-04-12 05:45:38', '2026-04-12 21:44:06', 0, NULL),
(69, 'HB000069', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-19', '2026-04-20', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-137259', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 11:41:07', '2026-04-19 11:52:18', '2026-04-20 03:41:07', 0, NULL),
(70, 'HB000070', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-20', '2026-04-21', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-6C0ABA', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 11:42:26', '2026-04-19 11:52:17', '2026-04-20 03:42:26', 0, NULL),
(71, 'HB000071', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-21', '2026-04-22', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-1C4A7A', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 11:43:54', '2026-04-19 11:52:11', '2026-04-20 03:43:54', 0, NULL),
(72, 'HB000072', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-19', '2026-04-20', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-BBC645', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 11:52:49', '2026-04-19 12:57:35', '2026-04-20 03:52:49', 0, NULL),
(73, 'HB000073', 1, 3, NULL, 'Mountain View Inn', NULL, 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-20', '2026-04-21', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-0706F7', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 12:06:12', '2026-04-19 12:57:33', '2026-04-20 04:06:12', 0, NULL),
(74, 'HB000074', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-21', '2026-04-22', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 800.00, 'HB-20260419-128F49', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 12:12:20', '2026-04-19 12:57:32', '2026-04-20 04:12:20', 0, NULL),
(75, 'HB000075', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-22', '2026-04-23', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 800.00, 'HB-20260419-DC738B', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 12:21:45', '2026-04-19 12:57:31', '2026-04-20 04:21:45', 0, NULL),
(76, 'HB000076', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-24', '2026-04-25', 1, 1, 2, NULL, 'cancelled', 'paid', 'paypal', NULL, 800.00, 'HB-20260419-D6AFA1', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 12:22:12', '2026-04-19 12:57:30', '2026-04-20 04:22:12', 0, NULL),
(77, 'HB000077', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-19', '2026-04-20', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 800.00, 'HB-20260419-AAAD64', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 12:59:30', '2026-04-19 13:39:53', '2026-04-20 04:59:30', 0, NULL),
(78, 'HB000078', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-21', '2026-04-22', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 800.00, 'HB-20260419-E76036', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 13:06:29', '2026-04-19 13:39:52', '2026-04-20 05:06:29', 0, NULL),
(79, 'HB000079', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-22', '2026-04-23', 1, 1, 2, NULL, 'cancelled', 'unpaid', 'gcash', NULL, 800.00, 'HB-20260419-960DD5', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 13:17:03', '2026-04-19 13:39:51', '2026-04-20 05:17:03', 0, NULL),
(80, 'HB000080', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-24', '2026-04-25', 1, 1, 2, NULL, 'cancelled', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-CE68C9', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 13:24:22', '2026-04-19 13:39:50', '2026-04-20 05:24:22', 0, NULL),
(81, 'HB000081', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-19', '2026-04-20', 1, 1, 2, NULL, 'confirmed', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-DF3995', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 13:40:35', '2026-04-20 14:35:33', '2026-04-20 05:40:35', 0, NULL),
(82, 'HB000082', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-21', '2026-04-22', 1, 1, 2, NULL, 'confirmed', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-786D46', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 14:19:34', '2026-04-20 14:35:32', '2026-04-20 06:19:34', 0, NULL),
(83, 'HB000083', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-25', '2026-04-26', 1, 1, 2, NULL, 'confirmed', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-2201AD', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 14:24:33', '2026-04-20 14:35:32', '2026-04-20 06:24:33', 0, NULL),
(84, 'HB000084', 1, 3, 3, 'Mountain View Inn', 'Standard Room', 'Brgy. Sulong, Naujan', 800.00, 'PHP', '2026-04-26', '2026-04-27', 1, 1, 2, NULL, 'confirmed', 'pending', 'gcash', NULL, 800.00, 'HB-20260419-C90CE1', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '9652715532', '2026-04-19 14:34:43', '2026-04-20 14:35:30', '2026-04-20 06:34:43', 0, NULL),
(85, 'HB000085', 1, 8, 7, 'Naujan Travellers Inn', 'ECONOMY COUPLES', 'Barcenaga, Naujan, Oriental Mindoro', 349.99, 'PHP', '2026-05-03', '2026-05-04', 1, 1, 2, NULL, 'confirmed', 'paid', 'gcash', NULL, 349.99, 'HB-20260503-2C52EB', 'Benedict Madrigal', 'benedictmadrigal26@gmail.com', '+63 965 271 5532', '2026-05-03 13:31:51', '2026-05-03 14:36:54', '2026-05-04 05:31:51', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `hotel_owners`
--

CREATE TABLE `hotel_owners` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_owners`
--

INSERT INTO `hotel_owners` (`id`, `user_id`, `hotel_id`, `created_at`) VALUES
(10, 9, 2, '2026-02-07 12:16:03'),
(20, 2, 1, '2026-02-08 09:38:29'),
(23, 4, 1, '2026-02-08 09:39:27'),
(24, 1, 1, '2026-02-08 09:39:40'),
(25, 10, 1, '2026-03-01 08:16:21'),
(27, 5, 3, '2026-03-30 09:26:09'),
(28, 11, 8, '2026-05-02 05:27:27');

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
  `provider_response` text DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `hotel_payments`
--

INSERT INTO `hotel_payments` (`payment_id`, `booking_id`, `amount`, `currency`, `method`, `provider`, `status`, `transaction_reference`, `card_last4`, `provider_response`, `paid_at`, `created_at`, `updated_at`, `archived`, `archived_at`) VALUES
(4, 4, 2000.00, 'PHP', 'paypal', 'simulated', 'succeeded', 'PAY-CF1AEA7F', NULL, NULL, '2026-02-04 02:52:27', '2026-02-04 02:52:27', NULL, 0, NULL),
(5, 5, 5000.00, 'PHP', 'paypal', 'simulated', 'succeeded', 'PAY-D167EFA9', NULL, NULL, '2026-02-04 03:00:53', '2026-02-04 03:00:53', NULL, 0, NULL),
(6, 6, 5000.00, 'PHP', 'gcash', 'simulated', 'succeeded', 'PAY-A8ACD0F9', NULL, NULL, '2026-02-04 12:59:08', '2026-02-04 12:59:08', NULL, 0, NULL),
(7, 7, 5000.00, 'PHP', 'paypal', 'simulated', 'succeeded', 'PAY-47F3AE36', NULL, NULL, '2026-02-07 04:05:41', '2026-02-07 04:05:41', NULL, 0, NULL),
(8, 8, 5000.00, 'PHP', 'paypal', 'simulated', 'succeeded', 'PAY-61457969', NULL, NULL, '2026-02-07 05:07:44', '2026-02-07 05:07:44', NULL, 0, NULL),
(9, 9, 10000.00, 'PHP', 'paypal', 'simulated', 'succeeded', 'PAY-8AFFD65B', NULL, NULL, '2026-02-07 05:10:47', '2026-02-07 05:10:47', NULL, 0, NULL),
(10, 10, 5000.00, 'PHP', 'paypal', 'simulated', 'succeeded', 'PAY-4E4C54F2', NULL, NULL, '2026-02-07 05:12:56', '2026-02-07 05:12:56', NULL, 0, NULL),
(11, 25, 5000.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_F4UAbsuQy5ZgW5ULfpE6bTU1', NULL, NULL, '2026-02-07 07:26:12', '2026-02-07 07:26:12', '2026-02-09 14:52:54', 0, NULL),
(12, 31, 5000.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_kuQsMyFgKNCuLmT449URKo7C', NULL, NULL, '2026-02-07 07:51:39', '2026-02-07 07:51:39', '2026-02-09 14:52:51', 0, NULL),
(13, 32, 5000.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_TeS2FaGjG4aHs6GvGKtHbUcG', NULL, NULL, '2026-02-07 07:56:00', '2026-02-07 07:56:00', '2026-02-09 14:52:49', 0, NULL),
(14, 33, 3500.00, 'PHP', 'paypal', 'paypal', 'failed', '90650638JB9462309', NULL, NULL, '2026-02-07 08:02:11', '2026-02-07 08:02:11', '2026-02-09 14:52:45', 0, NULL),
(15, 34, 5000.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_1NsdqxbpLabiXnye1LYkf1bN', NULL, NULL, '2026-02-07 09:25:59', '2026-02-07 09:25:59', '2026-02-09 14:52:43', 0, NULL),
(16, 35, 5000.00, 'PHP', 'card', 'stripe', 'failed', 'cs_test_a1H5pVjnKomPWPZD0Ne6XZfVg86p19MSKXJxWHXw61wkNabollkdJ3KQee', NULL, NULL, '2026-02-07 10:08:46', '2026-02-07 10:08:46', '2026-02-09 14:52:38', 0, NULL),
(17, 36, 3500.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_3vhZ6zTbYpehEmkJgEyxJuJb', NULL, NULL, '2026-02-08 14:22:47', '2026-02-08 14:22:47', '2026-02-09 14:52:37', 0, NULL),
(18, 37, 3500.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_zpRQYLuNSrR4M72RfYgFLrFH', NULL, NULL, '2026-02-09 10:52:07', '2026-02-09 10:52:07', '2026-02-09 14:52:35', 0, NULL),
(19, 38, 3500.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_ozjuQoir6TNDtGUFa5rWt9pP', NULL, NULL, '2026-02-09 11:27:16', '2026-02-09 11:27:16', '2026-02-09 14:52:32', 0, NULL),
(20, 39, 3500.00, 'PHP', 'paypal', 'paypal', 'failed', '93E93233GY771311D', NULL, NULL, '2026-02-09 11:28:04', '2026-02-09 11:28:04', '2026-02-09 13:30:26', 0, NULL),
(21, 40, 3500.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_RJSDm6qJWFgoasayo6udJisx', NULL, NULL, '2026-02-09 12:54:56', '2026-02-09 12:54:56', '2026-02-09 13:27:22', 0, NULL),
(22, 41, 3500.00, 'PHP', 'paypal', 'paypal', 'failed', '46C93485GF330702M', NULL, NULL, '2026-02-09 13:00:48', '2026-02-09 13:00:48', '2026-02-09 13:27:20', 0, NULL),
(23, 42, 7000.00, 'PHP', 'paypal', 'paypal', 'failed', '0N482112LR999593L', NULL, NULL, '2026-02-09 13:05:19', '2026-02-09 13:05:19', '2026-02-09 13:27:17', 0, NULL),
(24, 43, 800.00, 'PHP', 'paypal', 'paypal', 'failed', '8YF12436JD7179135', NULL, NULL, '2026-02-09 13:46:16', '2026-02-09 13:46:16', '2026-02-09 13:50:48', 0, NULL),
(25, 44, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '2P3345650F360515F', NULL, '{\"order_id\":\"2P3345650F360515F\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/2P3345650F360515F\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=2P3345650F360515F\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/2P3345650F360515F\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/2P3345650F360515F/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-02-09 13:51:41', '2026-02-09 13:51:41', '2026-02-09 13:52:05', 0, NULL),
(26, 45, 800.00, 'PHP', 'gcash', 'gcash', 'succeeded', 'src_vDx3GYAwDrx1gRK5kVt9jqQh', NULL, '{\"source_id\":\"src_vDx3GYAwDrx1gRK5kVt9jqQh\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-02-09 15:39:19', '2026-02-09 14:49:48', '2026-02-09 15:39:19', 0, NULL),
(28, 47, 1600.00, 'PHP', 'paypal', 'paypal', 'failed', '15034645MR311392E', NULL, '{\"order_id\":\"15034645MR311392E\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/15034645MR311392E\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=15034645MR311392E\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/15034645MR311392E\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/15034645MR311392E/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-02-10 01:22:29', '2026-02-10 01:22:29', '2026-02-23 13:53:40', 0, NULL),
(29, 48, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '4M599657GB186934F', NULL, '{\"order_id\":\"4M599657GB186934F\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/4M599657GB186934F\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=4M599657GB186934F\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/4M599657GB186934F\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/4M599657GB186934F/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-02-10 01:24:11', '2026-02-10 01:24:11', '2026-02-10 01:25:38', 0, NULL),
(30, 49, 800.00, 'PHP', 'paypal', 'simulated', 'failed', 'PAY-72010C0B', NULL, NULL, NULL, '2026-02-20 17:50:28', '2026-02-23 13:53:37', 0, NULL),
(31, 49, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '62G92525W9115003C', NULL, '{\"order_id\":\"62G92525W9115003C\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/62G92525W9115003C\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=62G92525W9115003C\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/62G92525W9115003C\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/62G92525W9115003C/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-02-20 17:50:29', '2026-02-20 17:50:29', '2026-02-20 17:54:36', 0, NULL),
(32, 50, 800.00, 'PHP', 'paypal', 'simulated', 'failed', 'PAY-F889F10D', NULL, NULL, NULL, '2026-02-20 17:55:32', '2026-02-23 13:53:27', 0, NULL),
(33, 50, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '6FX82159E1686703H', NULL, '{\"order_id\":\"6FX82159E1686703H\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/6FX82159E1686703H\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=6FX82159E1686703H\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/6FX82159E1686703H\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/6FX82159E1686703H/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-02-20 17:55:32', '2026-02-20 17:55:32', '2026-02-20 17:55:39', 0, NULL),
(34, 51, 800.00, 'PHP', 'gcash', 'simulated', 'failed', 'PAY-8E7EC8C7', NULL, NULL, NULL, '2026-02-21 04:35:54', '2026-02-23 13:53:29', 0, NULL),
(35, 52, 800.00, 'PHP', 'gcash', 'simulated', 'failed', 'PAY-A05321BB', NULL, NULL, NULL, '2026-02-21 04:40:45', '2026-02-23 13:53:32', 0, NULL),
(36, 52, 800.00, 'PHP', 'gcash', 'gcash', 'failed', 'src_pomfnbSSZ3cqNVUmxt2Shir1', NULL, '{\"source_id\":\"src_pomfnbSSZ3cqNVUmxt2Shir1\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-02-21 04:41:09', '2026-02-21 04:41:09', '2026-02-23 13:53:35', 0, NULL),
(37, 53, 3500.00, 'PHP', 'paypal', 'simulated', 'pending', 'PAY-DB7FD4DE', NULL, NULL, NULL, '2026-02-24 00:54:23', NULL, 0, NULL),
(38, 53, 3500.00, 'PHP', 'paypal', 'paypal', 'failed', '86B77409C8977271M', NULL, '{\"order_id\":\"86B77409C8977271M\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/86B77409C8977271M\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=86B77409C8977271M\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/86B77409C8977271M\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/86B77409C8977271M/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-02-24 00:54:24', '2026-02-24 00:54:24', '2026-03-16 02:00:51', 0, NULL),
(39, 54, 1600.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-DB8125EC', NULL, NULL, NULL, '2026-03-01 13:43:12', NULL, 0, NULL),
(40, 55, 800.00, 'PHP', 'paypal', 'simulated', 'pending', 'PAY-5245BB74', NULL, NULL, NULL, '2026-03-02 13:10:00', NULL, 0, NULL),
(41, 55, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '04A5001555754801Y', NULL, '{\"order_id\":\"04A5001555754801Y\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/04A5001555754801Y\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=04A5001555754801Y\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/04A5001555754801Y\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/04A5001555754801Y/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-03-02 13:10:02', '2026-03-02 13:10:02', '2026-03-02 13:11:55', 0, NULL),
(42, 56, 800.00, 'PHP', 'paypal', 'simulated', 'pending', 'PAY-6E533263', NULL, NULL, NULL, '2026-03-02 13:28:15', NULL, 0, NULL),
(43, 56, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '3ME41503L0218142X', NULL, '{\"order_id\":\"3ME41503L0218142X\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/3ME41503L0218142X\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=3ME41503L0218142X\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/3ME41503L0218142X\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/3ME41503L0218142X/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-03-02 13:28:16', '2026-03-02 13:28:16', '2026-03-02 13:28:41', 0, NULL),
(44, 57, 800.00, 'PHP', 'paypal', 'simulated', 'pending', 'PAY-10F07B7A', NULL, NULL, NULL, '2026-03-02 13:37:56', NULL, 0, NULL),
(45, 57, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '3MP594216S051642F', NULL, '{\"order_id\":\"3MP594216S051642F\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/3MP594216S051642F\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=3MP594216S051642F\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/3MP594216S051642F\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/3MP594216S051642F/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-03-02 13:37:58', '2026-03-02 13:37:58', '2026-03-02 13:38:09', 0, NULL),
(46, 58, 9000.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-8AFEDD48', NULL, NULL, NULL, '2026-03-03 00:35:25', NULL, 0, NULL),
(47, 58, 9000.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_yZH5yJdQubbVzwhkRPZLYEPL', NULL, '{\"source_id\":\"src_yZH5yJdQubbVzwhkRPZLYEPL\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":900000,\"currency\":\"PHP\"}', '2026-03-03 00:35:26', '2026-03-03 00:35:26', NULL, 0, NULL),
(48, 59, 3500.00, 'PHP', 'gcash', 'simulated', 'succeeded', 'PAY-BA79E2C2', NULL, NULL, '2026-03-28 04:23:52', '2026-03-24 07:55:58', '2026-03-28 04:23:52', 0, NULL),
(49, 59, 3500.00, 'PHP', 'gcash', 'gcash', 'succeeded', 'src_XWKbbcZrfC8hG14mDFVEs2UN', NULL, '{\"source_id\":\"src_XWKbbcZrfC8hG14mDFVEs2UN\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":350000,\"currency\":\"PHP\"}', '2026-03-28 04:23:54', '2026-03-24 07:55:58', '2026-03-28 04:23:54', 0, NULL),
(50, 60, 4000.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-05B58C40', NULL, NULL, NULL, '2026-03-28 04:02:42', NULL, 0, NULL),
(51, 60, 4000.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_mn4eEpYtzuoRswVc6PcbZt4P', NULL, '{\"source_id\":\"src_mn4eEpYtzuoRswVc6PcbZt4P\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":400000,\"currency\":\"PHP\"}', '2026-03-28 04:02:43', '2026-03-28 04:02:43', NULL, 0, NULL),
(52, 61, 108500.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-70FC244D', NULL, NULL, NULL, '2026-03-28 04:39:40', NULL, 0, NULL),
(53, 62, 7000.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-BEFE02BE', NULL, NULL, NULL, '2026-03-28 04:49:35', NULL, 0, NULL),
(54, 62, 7000.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_e5NwWJ4C6AUhVtp1dYiFWZDV', NULL, '{\"source_id\":\"src_e5NwWJ4C6AUhVtp1dYiFWZDV\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":700000,\"currency\":\"PHP\"}', '2026-03-28 04:49:36', '2026-03-28 04:49:36', NULL, 0, NULL),
(55, 63, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-30755ED8', NULL, NULL, NULL, '2026-03-30 09:47:27', NULL, 0, NULL),
(56, 63, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_fk2HGt5xd83SM2wZpppDHoiq', NULL, '{\"source_id\":\"src_fk2HGt5xd83SM2wZpppDHoiq\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-03-30 09:47:28', '2026-03-30 09:47:28', NULL, 0, NULL),
(57, 64, 1600.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-18232B9C', NULL, NULL, NULL, '2026-03-30 10:00:12', NULL, 0, NULL),
(58, 64, 1600.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_inc1Fe1o7RM2pHvE9V8L3b5t', NULL, '{\"source_id\":\"src_inc1Fe1o7RM2pHvE9V8L3b5t\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":160000,\"currency\":\"PHP\"}', '2026-03-30 10:00:12', '2026-03-30 10:00:12', NULL, 0, NULL),
(59, 65, 800.00, 'PHP', 'gcash', 'simulated', 'succeeded', 'PAY-40ED727C', NULL, NULL, '2026-04-06 11:46:12', '2026-04-05 11:41:26', '2026-04-06 11:46:12', 0, NULL),
(60, 65, 800.00, 'PHP', 'gcash', 'gcash', 'succeeded', 'src_5XBgTSgZo7RorFVuwnYg3wjr', NULL, '{\"source_id\":\"src_5XBgTSgZo7RorFVuwnYg3wjr\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-06 11:46:09', '2026-04-05 11:41:27', '2026-04-06 11:46:09', 0, NULL),
(61, 66, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-42F089F1', NULL, NULL, NULL, '2026-04-06 11:47:50', NULL, 0, NULL),
(62, 66, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_UHJcjpMofreN4tpoJTtSeuxN', NULL, '{\"source_id\":\"src_UHJcjpMofreN4tpoJTtSeuxN\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-06 11:47:50', '2026-04-06 11:47:50', NULL, 0, NULL),
(63, 67, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-C98FC0CA', NULL, NULL, NULL, '2026-04-10 09:54:16', NULL, 0, NULL),
(64, 67, 800.00, 'PHP', 'gcash', 'gcash', 'succeeded', 'src_wPcU1nLEkSwRZW9wwe2k6SNX', NULL, '{\"source_id\":\"src_wPcU1nLEkSwRZW9wwe2k6SNX\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-10 13:41:47', '2026-04-10 09:54:17', '2026-04-10 13:41:47', 0, NULL),
(65, 68, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-D49897A2', NULL, NULL, NULL, '2026-04-12 05:44:06', NULL, 0, NULL),
(66, 68, 800.00, 'PHP', 'gcash', 'gcash', 'succeeded', 'src_deTwKts76huZxhsBxBZ4eC7C', NULL, '{\"source_id\":\"src_deTwKts76huZxhsBxBZ4eC7C\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-12 05:45:38', '2026-04-12 05:44:07', '2026-04-12 05:45:38', 0, NULL),
(67, 69, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-6B3830E1', NULL, NULL, NULL, '2026-04-19 11:41:07', NULL, 0, NULL),
(68, 69, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_ErszAeSJzrrQbbTNZFWdRvho', NULL, '{\"source_id\":\"src_ErszAeSJzrrQbbTNZFWdRvho\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 11:41:07', '2026-04-19 11:41:07', NULL, 0, NULL),
(69, 70, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-C85FCBBE', NULL, NULL, NULL, '2026-04-19 11:42:26', NULL, 0, NULL),
(70, 70, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_5CdYxfXKLRUXmJDn9TBoHt3m', NULL, '{\"source_id\":\"src_5CdYxfXKLRUXmJDn9TBoHt3m\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 11:42:26', '2026-04-19 11:42:26', NULL, 0, NULL),
(71, 71, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-02501D82', NULL, NULL, NULL, '2026-04-19 11:43:54', NULL, 0, NULL),
(72, 71, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_nK6BJ6KGVemC2gJ8HCudC7s9', NULL, '{\"source_id\":\"src_nK6BJ6KGVemC2gJ8HCudC7s9\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 11:43:55', '2026-04-19 11:43:55', NULL, 0, NULL),
(73, 72, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-19BDD29F', NULL, NULL, NULL, '2026-04-19 11:52:49', NULL, 0, NULL),
(74, 72, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_8fr7euesRwaRCv8uq9XiE2Az', NULL, '{\"source_id\":\"src_8fr7euesRwaRCv8uq9XiE2Az\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 11:52:49', '2026-04-19 11:52:49', NULL, 0, NULL),
(75, 73, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-127BC923', NULL, NULL, NULL, '2026-04-19 12:06:12', NULL, 0, NULL),
(76, 73, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_VsihmKKrSG34iN5Md8xdp3MU', NULL, '{\"source_id\":\"src_VsihmKKrSG34iN5Md8xdp3MU\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 12:06:13', '2026-04-19 12:06:13', NULL, 0, NULL),
(77, 74, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-58AEAA6E', NULL, NULL, NULL, '2026-04-19 12:12:20', NULL, 0, NULL),
(78, 75, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-3832EC02', NULL, NULL, NULL, '2026-04-19 12:21:45', NULL, 0, NULL),
(79, 76, 800.00, 'PHP', 'paypal', 'simulated', 'pending', 'PAY-2F664FC1', NULL, NULL, NULL, '2026-04-19 12:22:12', NULL, 0, NULL),
(80, 76, 800.00, 'PHP', 'paypal', 'paypal', 'succeeded', '1NS16827K0835721M', NULL, '{\"order_id\":\"1NS16827K0835721M\",\"status\":\"CREATED\",\"links\":[{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/1NS16827K0835721M\",\"rel\":\"self\",\"method\":\"GET\"},{\"href\":\"https://www.sandbox.paypal.com/checkoutnow?token=1NS16827K0835721M\",\"rel\":\"approve\",\"method\":\"GET\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/1NS16827K0835721M\",\"rel\":\"update\",\"method\":\"PATCH\"},{\"href\":\"https://api.sandbox.paypal.com/v2/checkout/orders/1NS16827K0835721M/capture\",\"rel\":\"capture\",\"method\":\"POST\"}]}', '2026-04-19 12:22:14', '2026-04-19 12:22:14', '2026-04-19 12:24:17', 0, NULL),
(81, 77, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-295AF942', NULL, NULL, NULL, '2026-04-19 12:59:30', NULL, 0, NULL),
(82, 78, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-42665D10', NULL, NULL, NULL, '2026-04-19 13:06:29', NULL, 0, NULL),
(83, 79, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-B74F7D02', NULL, NULL, NULL, '2026-04-19 13:17:03', NULL, 0, NULL),
(84, 80, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-3C146757', NULL, NULL, NULL, '2026-04-19 13:24:22', NULL, 0, NULL),
(85, 80, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_DTRR3AXUsWerkBpdN9C7fDXy', NULL, '{\"source_id\":\"src_DTRR3AXUsWerkBpdN9C7fDXy\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 13:32:47', '2026-04-19 13:32:47', NULL, 0, NULL),
(86, 81, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-6B75561D', NULL, NULL, NULL, '2026-04-19 13:40:35', NULL, 0, NULL),
(87, 81, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_M6AvC5aYw25Z3K5yC9mk2iGJ', NULL, '{\"source_id\":\"src_M6AvC5aYw25Z3K5yC9mk2iGJ\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 13:40:35', '2026-04-19 13:40:35', NULL, 0, NULL),
(88, 82, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-3915AA19', NULL, NULL, NULL, '2026-04-19 14:19:34', NULL, 0, NULL),
(89, 82, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_VpjZS7wEgwPkfHvk94ejZe8E', NULL, '{\"source_id\":\"src_VpjZS7wEgwPkfHvk94ejZe8E\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 14:19:34', '2026-04-19 14:19:34', NULL, 0, NULL),
(90, 83, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-5D302A06', NULL, NULL, NULL, '2026-04-19 14:24:33', NULL, 0, NULL),
(91, 83, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_2aGiFE2t1hXP2ox9X3FUigrz', NULL, '{\"source_id\":\"src_2aGiFE2t1hXP2ox9X3FUigrz\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 14:24:33', '2026-04-19 14:24:33', NULL, 0, NULL),
(92, 84, 800.00, 'PHP', 'gcash', 'simulated', 'pending', 'PAY-3F50ACCD', NULL, NULL, NULL, '2026-04-19 14:34:43', NULL, 0, NULL),
(93, 84, 800.00, 'PHP', 'gcash', 'gcash', 'pending', 'src_zzVvYZ1uriH5zgiLFSAEMxT8', NULL, '{\"source_id\":\"src_zzVvYZ1uriH5zgiLFSAEMxT8\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":80000,\"currency\":\"PHP\"}', '2026-04-19 14:34:43', '2026-04-19 14:34:43', NULL, 0, NULL),
(94, 85, 349.99, 'PHP', 'gcash', 'simulated', 'succeeded', 'PAY-4A93BA5B', NULL, NULL, '2026-05-03 14:36:54', '2026-05-03 13:31:51', '2026-05-03 14:36:54', 0, NULL),
(95, 85, 349.99, 'PHP', 'gcash', 'gcash', 'succeeded', 'src_w1bgWaUX3f4J6dCe7AfUXpe9', NULL, '{\"source_id\":\"src_w1bgWaUX3f4J6dCe7AfUXpe9\",\"type\":\"gcash\",\"status\":\"pending\",\"amount\":34999,\"currency\":\"PHP\"}', '2026-05-03 14:36:51', '2026-05-03 13:31:52', '2026-05-03 14:36:51', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `itineraries`
--

CREATE TABLE `itineraries` (
  `itinerary_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `total_distance` decimal(8,2) DEFAULT NULL,
  `total_time` int(11) DEFAULT NULL,
  `total_budget` decimal(10,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) DEFAULT 'planning',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itineraries`
--

INSERT INTO `itineraries` (`itinerary_id`, `user_id`, `name`, `description`, `total_distance`, `total_time`, `total_budget`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`, `archived`, `archived_at`) VALUES
(4, 1, 'Atttractions', NULL, 5.36, 11, 0.00, NULL, NULL, 'planning', '2025-12-02 06:53:03', '2025-12-02 06:53:03', 0, NULL),
(6, 1, 'Nauajn', 'Naujan', 0.00, 240, 2000.00, NULL, NULL, 'planning', '2026-02-02 13:59:12', '2026-02-02 13:59:12', 0, NULL),
(7, 1, 'Naujan', 'ajfbnafnjoanfsoj', 0.00, 240, 1500.00, NULL, NULL, 'planning', '2026-02-03 01:18:07', '2026-02-03 01:18:07', 0, NULL),
(9, 1, 'sdads', 'sadasd', 0.00, 240, 0.00, NULL, NULL, 'planning', '2026-02-24 00:57:17', '2026-02-24 00:57:17', 0, NULL),
(10, 1, '333 steps', NULL, 0.00, 360, 8993.00, NULL, NULL, 'planning', '2026-03-16 01:51:17', '2026-03-16 01:51:17', 0, NULL),
(11, 1, 'asda', 'dsadad', 0.00, 12, 0.00, NULL, NULL, 'planning', '2026-04-18 12:26:31', '2026-04-18 12:26:31', 0, NULL),
(12, 1, 'Travel', NULL, 118.77, 520, 30000.00, NULL, NULL, 'draft', '2026-04-18 23:28:19', '2026-04-18 23:31:08', 0, NULL),
(13, 1, 'NaujanGO', 'NaujanGO', 0.00, 240, 2000.00, NULL, NULL, 'planning', '2026-04-21 02:08:10', '2026-04-21 02:08:10', 0, NULL),
(14, 1, 'Summer', NULL, 116.68, 240, 1499.99, NULL, NULL, 'planning', '2026-04-29 03:20:24', '2026-04-29 03:20:24', 0, NULL),
(15, 1, 'Vacation', 'Vacation', 19.78, 360, 3000.00, NULL, NULL, 'planning', '2026-05-03 14:32:27', '2026-05-03 14:32:27', 0, NULL);

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
(5, 4, 1, 1, 60),
(6, 4, 2, 2, 60),
(13, 6, 1, 1, 120),
(14, 6, 2, 2, 120),
(15, 7, 1, 1, 120),
(16, 7, 2, 2, 120),
(21, 9, 1, 1, 120),
(22, 9, 3, 2, 120),
(23, 10, 1, 1, 120),
(24, 10, 2, 2, 120),
(25, 10, 3, 3, 120),
(26, 11, 19, 1, 12),
(27, 12, 23, 1, 120),
(28, 12, 1, 1, 200),
(29, 12, 2, 3, 200),
(30, 13, 19, 1, 120),
(31, 13, 21, 2, 120),
(32, 14, 19, 1, 120),
(33, 14, 1, 1, 120),
(34, 15, 1, 1, 120),
(35, 15, 3, 1, 120),
(36, 15, 2, 3, 120);

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
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `message_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`message_id`, `sender_id`, `receiver_id`, `subject`, `message`, `is_read`, `created_at`) VALUES
(1, 5, 5, 'dfgoajmf', 'asfasf', 1, '2026-02-09 15:58:13'),
(2, 1, 5, 'sfhainf', 'fsafhoasfb', 1, '2026-02-10 01:04:40');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `user_id`, `type`, `title`, `message`, `related_id`, `is_read`, `created_at`) VALUES
(1, 5, 'message', 'New Hotel Inquiry', 'You have a new inquiry from undefined', 1, 1, '2026-02-09 15:58:13'),
(2, 5, 'message', 'New Hotel Inquiry', 'You have a new inquiry from undefined', 2, 0, '2026-02-10 01:04:40');

-- --------------------------------------------------------

--
-- Table structure for table `restaurants`
--

CREATE TABLE `restaurants` (
  `restaurant_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `cuisine_type` varchar(100) DEFAULT NULL,
  `municipality` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `price_range` varchar(50) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 0.00,
  `review_count` int(11) DEFAULT 0,
  `image_url` varchar(500) DEFAULT NULL,
  `featured` tinyint(1) DEFAULT 0,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `opening_hours` varchar(100) DEFAULT NULL,
  `closing_hours` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `restaurants`
--

INSERT INTO `restaurants` (`restaurant_id`, `name`, `description`, `cuisine_type`, `municipality`, `location`, `phone`, `email`, `price_range`, `rating`, `review_count`, `image_url`, `featured`, `latitude`, `longitude`, `opening_hours`, `closing_hours`, `created_at`, `updated_at`) VALUES
(1, 'Arsenia\'s Hapag Kainan sa Kabukiran', 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 'Filipino', 'Calapan City', 'Mountain View Road, Calapan', '09171234567', 'arsenia@email.com', '$$', 4.80, 156, 'https://images.unsplash.com/photo-1543521521-7c8b9c6c5c1f?w=400&h=300&fit=crop', 1, 13.3333000, 121.3000000, '11:00', '22:00', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(2, 'Dine at Log Grill and Resto', 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 'Filipino-Asian Fusion', 'Pinamalayan', 'Beach Road, Pinamalayan', '09187654321', 'dineatllog@email.com', '$$$', 4.60, 98, 'https://images.unsplash.com/photo-1537457985212-8c5a5f5f5f5f?w=400&h=300&fit=crop', 1, 13.2833000, 121.3167000, '12:00', '23:00', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(3, 'Luca Cucina Italiana', 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 'Italian', 'Puerto Galera', 'Main Street, Puerto Galera', '09198765432', 'luca@email.com', '$$$', 4.70, 132, 'https://images.unsplash.com/photo-1552566626-5e751f6a6a2f?w=400&h=300&fit=crop', 1, 13.2500000, 121.2833000, '11:30', '22:30', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(4, 'Red Tomato Resto Farm', 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 'Seafood & Filipino', 'Roxas', 'Farm Road, Roxas', '09165432109', 'redtomato@email.com', '$$', 4.50, 87, 'https://images.unsplash.com/photo-1504674900923-2cc92358e5a7?w=400&h=300&fit=crop', 1, 13.1833000, 121.3500000, '10:00', '21:00', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(5, 'Casa del Mar Seafood', 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 'Seafood', 'Pola', 'Beach View, Pola', '09179876543', 'casadelmar@email.com', '$$', 4.40, 76, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 0, 13.0833000, 121.4000000, '12:00', '21:30', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(6, 'Kalesa Cafe & Bistro', 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 'Cafe & Bistro', 'Naujan', 'Town Center, Naujan', '09156789012', 'kalesa@email.com', '$', 4.30, 64, 'https://images.unsplash.com/photo-1514432324607-b174f8a68bb3?w=400&h=300&fit=crop', 0, 13.3340000, 121.3010000, '07:00', '18:00', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(7, 'Bahay Kubo Restaurant', 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 'Filipino', 'Baco', 'Garden View, Baco', '09143210987', 'bahaykubo@email.com', '$$', 4.50, 95, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 0, 13.4000000, 121.2500000, '11:00', '20:30', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(8, 'Sushi & Sake House', 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 'Japanese', 'Calapan City', 'Business District, Calapan', '09171112233', 'sushi@email.com', '$$$', 4.60, 108, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', 0, 13.3350000, 121.2950000, '11:30', '22:00', '2026-03-23 14:27:44', '2026-03-23 14:27:44'),
(9, 'Arsenia\'s Hapag Kainan sa Kabukiran', 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 'Filipino', 'Calapan City', 'Mountain View Road, Calapan', '09171234567', 'arsenia@email.com', '$$', 4.80, 156, 'https://images.unsplash.com/photo-1543521521-7c8b9c6c5c1f?w=400&h=300&fit=crop', 1, 13.3333000, 121.3000000, '11:00', '22:00', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(10, 'Dine at Log Grill and Resto', 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 'Filipino-Asian Fusion', 'Pinamalayan', 'Beach Road, Pinamalayan', '09187654321', 'dineatllog@email.com', '$$$', 4.60, 98, 'https://images.unsplash.com/photo-1537457985212-8c5a5f5f5f5f?w=400&h=300&fit=crop', 1, 13.2833000, 121.3167000, '12:00', '23:00', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(11, 'Luca Cucina Italiana', 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 'Italian', 'Puerto Galera', 'Main Street, Puerto Galera', '09198765432', 'luca@email.com', '$$$', 4.70, 132, 'https://images.unsplash.com/photo-1552566626-5e751f6a6a2f?w=400&h=300&fit=crop', 1, 13.2500000, 121.2833000, '11:30', '22:30', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(12, 'Red Tomato Resto Farm', 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 'Seafood & Filipino', 'Roxas', 'Farm Road, Roxas', '09165432109', 'redtomato@email.com', '$$', 4.50, 87, 'https://images.unsplash.com/photo-1504674900923-2cc92358e5a7?w=400&h=300&fit=crop', 1, 13.1833000, 121.3500000, '10:00', '21:00', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(13, 'Casa del Mar Seafood', 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 'Seafood', 'Pola', 'Beach View, Pola', '09179876543', 'casadelmar@email.com', '$$', 4.40, 76, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 0, 13.0833000, 121.4000000, '12:00', '21:30', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(14, 'Kalesa Cafe & Bistro', 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 'Cafe & Bistro', 'Naujan', 'Town Center, Naujan', '09156789012', 'kalesa@email.com', '$', 4.30, 64, 'https://images.unsplash.com/photo-1514432324607-b174f8a68bb3?w=400&h=300&fit=crop', 0, 13.3340000, 121.3010000, '07:00', '18:00', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(15, 'Bahay Kubo Restaurant', 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 'Filipino', 'Baco', 'Garden View, Baco', '09143210987', 'bahaykubo@email.com', '$$', 4.50, 95, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 0, 13.4000000, 121.2500000, '11:00', '20:30', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(16, 'Sushi & Sake House', 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 'Japanese', 'Calapan City', 'Business District, Calapan', '09171112233', 'sushi@email.com', '$$$', 4.60, 108, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', 0, 13.3350000, 121.2950000, '11:30', '22:00', '2026-03-23 14:33:01', '2026-03-23 14:33:01'),
(17, 'Arsenia\'s Hapag Kainan sa Kabukiran', 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 'Filipino', 'Calapan City', 'Mountain View Road, Calapan', '09171234567', 'arsenia@email.com', '$$', 4.80, 156, 'https://images.unsplash.com/photo-1543521521-7c8b9c6c5c1f?w=400&h=300&fit=crop', 1, 13.3333000, 121.3000000, '11:00', '22:00', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(18, 'Dine at Log Grill and Resto', 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 'Filipino-Asian Fusion', 'Pinamalayan', 'Beach Road, Pinamalayan', '09187654321', 'dineatllog@email.com', '$$$', 4.60, 98, 'https://images.unsplash.com/photo-1537457985212-8c5a5f5f5f5f?w=400&h=300&fit=crop', 1, 13.2833000, 121.3167000, '12:00', '23:00', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(19, 'Luca Cucina Italiana', 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 'Italian', 'Puerto Galera', 'Main Street, Puerto Galera', '09198765432', 'luca@email.com', '$$$', 4.70, 132, 'https://images.unsplash.com/photo-1552566626-5e751f6a6a2f?w=400&h=300&fit=crop', 1, 13.2500000, 121.2833000, '11:30', '22:30', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(20, 'Red Tomato Resto Farm', 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 'Seafood & Filipino', 'Roxas', 'Farm Road, Roxas', '09165432109', 'redtomato@email.com', '$$', 4.50, 87, 'https://images.unsplash.com/photo-1504674900923-2cc92358e5a7?w=400&h=300&fit=crop', 1, 13.1833000, 121.3500000, '10:00', '21:00', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(21, 'Casa del Mar Seafood', 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 'Seafood', 'Pola', 'Beach View, Pola', '09179876543', 'casadelmar@email.com', '$$', 4.40, 76, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 0, 13.0833000, 121.4000000, '12:00', '21:30', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(22, 'Kalesa Cafe & Bistro', 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 'Cafe & Bistro', 'Naujan', 'Town Center, Naujan', '09156789012', 'kalesa@email.com', '$', 4.30, 64, 'https://images.unsplash.com/photo-1514432324607-b174f8a68bb3?w=400&h=300&fit=crop', 0, 13.3340000, 121.3010000, '07:00', '18:00', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(23, 'Bahay Kubo Restaurant', 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 'Filipino', 'Baco', 'Garden View, Baco', '09143210987', 'bahaykubo@email.com', '$$', 4.50, 95, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 0, 13.4000000, 121.2500000, '11:00', '20:30', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(24, 'Sushi & Sake House', 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 'Japanese', 'Calapan City', 'Business District, Calapan', '09171112233', 'sushi@email.com', '$$$', 4.60, 108, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', 0, 13.3350000, 121.2950000, '11:30', '22:00', '2026-03-26 14:08:36', '2026-03-26 14:08:36'),
(25, 'Arsenia\'s Hapag Kainan sa Kabukiran', 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 'Filipino', 'Calapan City', 'Mountain View Road, Calapan', '09171234567', 'arsenia@email.com', '$$', 4.80, 156, 'https://images.unsplash.com/photo-1543521521-7c8b9c6c5c1f?w=400&h=300&fit=crop', 1, 13.3333000, 121.3000000, '11:00', '22:00', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(26, 'Dine at Log Grill and Resto', 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 'Filipino-Asian Fusion', 'Pinamalayan', 'Beach Road, Pinamalayan', '09187654321', 'dineatllog@email.com', '$$$', 4.60, 98, 'https://images.unsplash.com/photo-1537457985212-8c5a5f5f5f5f?w=400&h=300&fit=crop', 1, 13.2833000, 121.3167000, '12:00', '23:00', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(27, 'Luca Cucina Italiana', 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 'Italian', 'Puerto Galera', 'Main Street, Puerto Galera', '09198765432', 'luca@email.com', '$$$', 4.70, 132, 'https://images.unsplash.com/photo-1552566626-5e751f6a6a2f?w=400&h=300&fit=crop', 1, 13.2500000, 121.2833000, '11:30', '22:30', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(28, 'Red Tomato Resto Farm', 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 'Seafood & Filipino', 'Roxas', 'Farm Road, Roxas', '09165432109', 'redtomato@email.com', '$$', 4.50, 87, 'https://images.unsplash.com/photo-1504674900923-2cc92358e5a7?w=400&h=300&fit=crop', 1, 13.1833000, 121.3500000, '10:00', '21:00', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(29, 'Casa del Mar Seafood', 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 'Seafood', 'Pola', 'Beach View, Pola', '09179876543', 'casadelmar@email.com', '$$', 4.40, 76, 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop', 0, 13.0833000, 121.4000000, '12:00', '21:30', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(30, 'Kalesa Cafe & Bistro', 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 'Cafe & Bistro', 'Naujan', 'Town Center, Naujan', '09156789012', 'kalesa@email.com', '$', 4.30, 64, 'https://images.unsplash.com/photo-1514432324607-b174f8a68bb3?w=400&h=300&fit=crop', 0, 13.3340000, 121.3010000, '07:00', '18:00', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(31, 'Bahay Kubo Restaurant', 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 'Filipino', 'Baco', 'Garden View, Baco', '09143210987', 'bahaykubo@email.com', '$$', 4.50, 95, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', 0, 13.4000000, 121.2500000, '11:00', '20:30', '2026-04-04 15:16:12', '2026-04-04 15:16:12'),
(32, 'Sushi & Sake House', 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 'Japanese', 'Calapan City', 'Business District, Calapan', '09171112233', 'sushi@email.com', '$$$', 4.60, 108, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', 0, 13.3350000, 121.2950000, '11:30', '22:00', '2026-04-04 15:16:12', '2026-04-04 15:16:12');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `review_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `poi_id` int(11) DEFAULT NULL,
  `attraction_id` int(11) DEFAULT NULL,
  `hotel_id` int(11) DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `owner_reply` text DEFAULT NULL,
  `owner_reply_date` datetime DEFAULT NULL,
  `review_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `moderated` tinyint(1) DEFAULT 0,
  `helpful_count` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Hotel reviews. Users can review the same hotel multiple times but only once per booking. booking_id tracks which booking the review is for.';

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`review_id`, `user_id`, `poi_id`, `attraction_id`, `hotel_id`, `booking_id`, `room_id`, `rating`, `comment`, `owner_reply`, `owner_reply_date`, `review_date`, `moderated`, `helpful_count`) VALUES
(1, 1, NULL, NULL, 1, NULL, NULL, 5, 'Absolutely stunning resort! The lake views are breathtaking and the staff went above and beyond to make our stay special. Highly recommend the spa services.', NULL, NULL, '2026-01-15 06:30:00', 1, 12),
(2, 2, NULL, NULL, 1, NULL, NULL, 4, 'Beautiful location and excellent amenities. The pool area was fantastic. Only minor issue was slow WiFi in some rooms.', NULL, NULL, '2026-01-20 02:15:00', 1, 8),
(3, 3, NULL, NULL, 1, NULL, NULL, 5, 'Perfect for a romantic getaway. The restaurant serves amazing local cuisine. Will definitely return!', NULL, NULL, '2026-01-25 08:45:00', 1, 15),
(4, 1, NULL, NULL, 2, NULL, NULL, 4, 'Great value for money. Clean rooms and friendly staff. The lake view from our room was lovely. Good central location for exploring Naujan.', NULL, NULL, '2026-01-18 01:20:00', 1, 6),
(5, 2, NULL, NULL, 2, NULL, NULL, 4, 'Comfortable stay with all basic amenities. Restaurant food was delicious. Perfect base for our Naujan adventure.', NULL, NULL, '2026-01-22 05:10:00', 1, 4),
(6, 3, NULL, NULL, 3, NULL, NULL, 5, 'Ideal for trekkers heading to Mt. Halcon! The owners are incredibly helpful with trail information. Authentic local experience.', NULL, NULL, '2026-01-12 03:00:00', 1, 10),
(7, 1, NULL, NULL, 3, NULL, NULL, 4, 'Simple but clean and comfortable. Great location near the mountain trails. The home-cooked meals were a highlight!', NULL, NULL, '2026-01-19 07:30:00', 1, 7),
(8, 2, NULL, NULL, 4, NULL, NULL, 5, 'The heritage museum inside the hotel is fascinating! Beautiful architecture and rich cultural displays. Staff are very knowledgeable about Naujan history.', NULL, NULL, '2026-01-16 04:00:00', 1, 9),
(9, 3, NULL, NULL, 4, NULL, NULL, 4, 'Charming hotel with character. Love the traditional design mixed with modern comfort. The location near the plaza is very convenient.', NULL, NULL, '2026-01-23 02:45:00', 1, 5),
(10, 1, NULL, NULL, 5, NULL, NULL, 5, 'Amazing eco-lodge! Everything is sustainably designed and the commitment to conservation is evident. Peaceful and serene setting.', NULL, NULL, '2026-01-14 00:30:00', 1, 11),
(11, 2, NULL, NULL, 5, NULL, NULL, 5, 'Nature lovers paradise! Saw so many birds and butterflies. The staff are passionate about environmental protection. Highly educational stay.', NULL, NULL, '2026-01-21 06:20:00', 1, 13),
(12, 1, 1, 19, NULL, NULL, NULL, 5, 'Naujan Lake is absolutely beautiful! Perfect for peaceful morning walks and bird watching. A must-visit natural attraction.', NULL, NULL, '2026-01-10 01:00:00', 1, 18),
(13, 2, 1, 19, NULL, NULL, NULL, 4, 'Lovely scenic views. Great spot for photography. Would recommend visiting during sunset.', NULL, NULL, '2026-01-17 08:30:00', 1, 12),
(14, 3, 1, 19, NULL, NULL, NULL, 5, 'Pristine and serene. The lake ecosystem is rich with wildlife. Educational and relaxing at the same time.', NULL, NULL, '2026-01-24 03:15:00', 1, 14),
(15, 1, 2, 20, NULL, NULL, NULL, 5, 'San Guillermo Parish Church is a magnificent example of Spanish colonial architecture. The historical significance is palpable.', NULL, NULL, '2026-01-11 06:00:00', 1, 10),
(16, 2, 2, 20, NULL, NULL, NULL, 5, 'Beautiful church with deep roots in Naujan history. Peaceful atmosphere perfect for reflection and prayer.', NULL, NULL, '2026-01-19 02:00:00', 1, 8),
(17, 3, 3, 21, NULL, NULL, NULL, 4, 'Fascinating glimpse into Naujan\'s past. Well-curated exhibits and friendly museum staff. Great for families.', NULL, NULL, '2026-01-13 05:30:00', 1, 7),
(18, 1, 3, 21, NULL, NULL, NULL, 4, 'Informative and educational. Learned so much about local culture and traditions. Worth a visit!', NULL, NULL, '2026-01-20 07:00:00', 1, 6),
(19, 1, NULL, NULL, 3, 68, NULL, 5, 'Goods na Goods', NULL, NULL, '2026-04-20 15:00:45', 1, 0);

--
-- Triggers `reviews`
--
DELIMITER $$
CREATE TRIGGER `update_hotel_rating_after_review` AFTER INSERT ON `reviews` FOR EACH ROW BEGIN
  IF NEW.hotel_id IS NOT NULL AND NEW.moderated = 1 THEN
    UPDATE hotels 
    SET rating = (
      SELECT ROUND(AVG(rating), 1) 
      FROM reviews 
      WHERE hotel_id = NEW.hotel_id AND moderated = 1
    )
    WHERE hotel_id = NEW.hotel_id;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `role_changes`
--

CREATE TABLE `role_changes` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `old_role` enum('user','owner','admin','agent') DEFAULT NULL,
  `new_role` enum('user','owner','admin','agent') NOT NULL,
  `changed_by` int(11) NOT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_changes`
--

INSERT INTO `role_changes` (`id`, `user_id`, `old_role`, `new_role`, `changed_by`, `changed_at`, `reason`) VALUES
(1, 10, 'user', 'owner', 1, '2026-02-10 01:07:31', NULL),
(2, 10, 'owner', 'user', 1, '2026-02-10 01:09:51', NULL),
(3, 10, 'user', 'admin', 1, '2026-02-10 01:09:55', NULL),
(4, 1, 'admin', 'user', 10, '2026-02-10 01:12:01', NULL),
(5, 1, 'user', 'admin', 10, '2026-02-10 01:12:30', NULL),
(6, 10, 'admin', 'user', 1, '2026-02-10 01:13:15', NULL),
(7, 10, 'user', 'admin', 1, '2026-02-10 01:13:34', NULL),
(8, 1, 'admin', 'user', 10, '2026-02-10 01:21:19', NULL),
(9, 3, 'user', 'owner', 4, '2026-02-20 16:03:00', NULL),
(10, 1, 'user', 'owner', 4, '2026-02-20 16:04:32', NULL),
(11, 1, 'owner', 'user', 4, '2026-02-22 08:36:57', NULL),
(12, 10, 'admin', 'user', 4, '2026-03-01 08:23:53', NULL),
(13, 10, 'user', 'owner', 4, '2026-03-16 02:04:16', NULL),
(14, 11, 'user', 'owner', 4, '2026-05-02 05:26:45', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `hotel_id` int(11) NOT NULL,
  `room_type_name` varchar(100) NOT NULL COMMENT 'e.g., Standard Room, Deluxe Room, Suite',
  `description` text DEFAULT NULL,
  `capacity` int(11) NOT NULL COMMENT 'Number of people the room can accommodate',
  `room_size_sqm` decimal(8,2) DEFAULT NULL COMMENT 'Room size in square meters',
  `price_per_night` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'PHP',
  `quantity_available` int(11) NOT NULL DEFAULT 1 COMMENT 'Number of rooms of this type available',
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of amenities specific to this room type',
  `image_urls` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON array of image URLs',
  `primary_image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hotel room types and their details';

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`room_id`, `hotel_id`, `room_type_name`, `description`, `capacity`, `room_size_sqm`, `price_per_night`, `currency`, `quantity_available`, `amenities`, `image_urls`, `primary_image_url`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 'Standard Room', 'Default room at Naujan Paradise Resort', 2, NULL, 3500.00, 'PHP', 6, NULL, NULL, NULL, 1, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(2, 2, 'Standard Room', 'Default room at Lake View Hotel', 2, NULL, 1500.00, 'PHP', 10, NULL, NULL, NULL, 1, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(3, 3, 'Standard Room', 'Default room at Mountain View Inn', 2, NULL, 800.00, 'PHP', 13, '[\"[\\\"[]\\\"]\"]', '[\"[\\\"[]\\\"]\",\"/uploads/hotels/1775801778202-av7ij9ma.jpg\"]', '/uploads/hotels/1775801778202-av7ij9ma.jpg', 1, '2026-04-09 20:01:58', '2026-04-10 06:16:18'),
(4, 3, 'Deluxe Room', 'Cold', 4, NULL, 1200.00, 'PHP', 11, '[\"[\\\"Wifi\\\"]\"]', '[\"[]\"]', NULL, 1, '2026-04-20 13:49:17', '2026-04-20 13:49:17'),
(5, 8, 'ECONOMY SINGLE', 'null', 1, NULL, 250.00, 'PHP', 9, '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', NULL, 1, '2026-05-02 15:05:44', '2026-05-03 13:27:04'),
(6, 8, 'MELIORATE SINGLE', 'null', 1, NULL, 350.00, 'PHP', 11, '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', NULL, 1, '2026-05-02 15:07:02', '2026-05-03 13:26:46'),
(7, 8, 'ECONOMY COUPLES', 'null', 2, NULL, 349.99, 'PHP', 10, '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', '[\"[\\\"[\\\\\\\"[\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"[]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"]\\\\\\\\\\\\\\\"]\\\\\\\"]\\\"]\"]', NULL, 1, '2026-05-02 15:08:06', '2026-05-03 13:30:15');

-- --------------------------------------------------------

--
-- Table structure for table `room_inventory`
--

CREATE TABLE `room_inventory` (
  `inventory_id` int(11) NOT NULL,
  `room_id` int(11) NOT NULL,
  `availability_date` date NOT NULL,
  `available_count` int(11) NOT NULL COMMENT 'Number of available rooms on this date',
  `price_override` decimal(10,2) DEFAULT NULL COMMENT 'Override price for this specific date',
  `is_closed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daily inventory and pricing for each room type';

--
-- Dumping data for table `room_inventory`
--

INSERT INTO `room_inventory` (`inventory_id`, `room_id`, `availability_date`, `available_count`, `price_override`, `is_closed`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-02-01', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(2, 1, '2026-02-02', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(3, 1, '2026-02-03', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(4, 1, '2026-02-04', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(5, 1, '2026-02-05', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(6, 1, '2026-02-06', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(7, 1, '2026-02-07', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(8, 1, '2026-02-08', 8, 1000.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58'),
(9, 1, '2026-02-09', 10, 0.00, 0, '2026-04-09 20:01:58', '2026-04-09 20:01:58');

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` mediumtext DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('announcement', '{\"enabled\":false,\"message\":\"67676766767\",\"bgColor\":\"#16a34a\",\"textColor\":\"#ffffff\",\"linkUrl\":\"\",\"linkLabel\":\"\",\"dismissible\":true}', '2026-03-10 07:47:27'),
('attraction-hero', '{\"backButtonLabel\":\"Back\",\"heroMinHeightDesktop\":480,\"heroMinHeightMobile\":420,\"overlayStart\":0.78,\"overlayMid\":0.52,\"overlayEnd\":0.64,\"addToItineraryText\":\"Add to Itinerary\",\"saveToFavoritesText\":\"Save to Favorites\",\"savedToFavoritesText\":\"Saved to Favorites\",\"shareText\":\"Share\",\"viewOnMapText\":\"View on Map\",\"heroTitleColor\":\"#f8fafc\",\"heroMetaTextColor\":\"#ecfeff\",\"heroKickerColor\":\"#dcfce7\",\"heroBadgeTextColor\":\"#ecfdf5\",\"backButtonTextColor\":\"#0f172a\",\"backButtonBgColor\":\"#ffffff\",\"backButtonTransparent\":false,\"primaryButtonColor\":\"#000000\",\"primaryButtonTextColor\":\"#57ff81\",\"primaryButtonTransparent\":false,\"secondaryButtonColor\":\"#ffffff\",\"secondaryButtonTextColor\":\"#111827\",\"secondaryButtonTransparent\":false,\"tertiaryButtonColor\":\"#0f172a\",\"tertiaryButtonTextColor\":\"#ecfeff\",\"tertiaryButtonTransparent\":false}', '2026-03-15 15:00:44'),
('auth-pages', '{\"loginBgType\":\"image\",\"loginSolidColor\":\"#f5f7fa\",\"loginGradient\":{\"color1\":\"#f5f7fa\",\"color2\":\"#c3cfe2\",\"angle\":135},\"loginImage\":\"https://res.cloudinary.com/dljppqq7z/image/upload/v1764605449/nuajanlake_yaydxh.jpg\",\"loginOverlayOpacity\":0.5,\"registerBgType\":\"image\",\"registerSolidColor\":\"#f5f7fa\",\"registerGradient\":{\"color1\":\"#f5f7fa\",\"color2\":\"#c3cfe2\",\"angle\":135},\"registerImage\":\"https://res.cloudinary.com/dljppqq7z/image/upload/v1764605449/nuajanlake_yaydxh.jpg\",\"registerOverlayOpacity\":0.5}', '2026-05-03 07:09:00'),
('hero_settings', '{\"images\":[\"https://res.cloudinary.com/dljppqq7z/image/upload/v1764606659/333_k2r7eb.jpg\",\"https://res.cloudinary.com/dljppqq7z/image/upload/v1764606650/arangin_zy1dab.jpg\",\"https://res.cloudinary.com/dljppqq7z/image/upload/v1764606628/plaza_bduwz9.jpg\",\"https://res.cloudinary.com/dljppqq7z/image/upload/v1764605449/nuajanlake_yaydxh.jpg\"],\"overlayColor\":\"#16a34a\",\"overlayOpacity\":0.4}', '2026-04-28 15:01:35'),
('home_slideshow', '{\"overlayColor\":\"#000000\",\"overlayOpacity\":0.4,\"tagText\":\"Featured Destination\",\"buttonTextGuest\":\"Start Your Journey\",\"buttonTextUser\":\"Explore Now\",\"titleColor\":\"#ffffff\",\"descriptionColor\":\"#e5e7eb\",\"tagTextColor\":\"#ffffff\",\"tagBgColor\":\"#ffffff\",\"buttonColor\":\"#ffffff\",\"buttonTextColor\":\"#111827\",\"buttonTransparent\":false}', '2026-03-22 09:42:53'),
('site_theme', '{\"primary\":\"#16a34a\",\"primaryDark\":\"#16a34a\",\"primaryLight\":\"#22c55e\",\"secondary\":\"#0891b2\",\"secondaryDark\":\"#0e7490\",\"navBg\":\"#16a34a\"}', '2026-03-21 10:18:39'),
('typography', '{\"headingFont\":\"Inter\",\"bodyFont\":\"Poppins\",\"fontScale\":\"small\",\"headingWeight\":\"800\",\"bodyWeight\":\"400\",\"headingLineHeight\":\"1.15\",\"bodyLineHeight\":\"1.7\",\"headingLetterSpacing\":\"-0.02\",\"bodyLetterSpacing\":\"0\",\"h1Size\":\"3.5rem\",\"h2Size\":\"2.5rem\",\"h3Size\":\"1.75rem\",\"bodySize\":\"1rem\",\"navFontSize\":\"0.95rem\",\"buttonFontSize\":\"0.95rem\",\"contentMaxWidth\":\"1200px\",\"preset\":\"custom\"}', '2026-03-13 12:05:42');

-- --------------------------------------------------------

--
-- Table structure for table `translations`
--

CREATE TABLE `translations` (
  `id` bigint(20) NOT NULL,
  `original_table` varchar(100) NOT NULL COMMENT 'attractions, hotels, itineraries, etc.',
  `original_id` int(11) NOT NULL COMMENT 'ID in original table',
  `field_name` varchar(100) NOT NULL COMMENT 'Field being translated: name, description, content',
  `language_id` int(11) NOT NULL COMMENT 'Foreign key to translation_languages',
  `translated_value` longtext DEFAULT NULL COMMENT 'Translated text or content',
  `is_approved` tinyint(1) DEFAULT 0 COMMENT 'Whether translation is approved for public display',
  `created_by` int(11) DEFAULT NULL COMMENT 'User who created translation',
  `approved_by` int(11) DEFAULT NULL COMMENT 'User who approved translation',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores all translations for database content';

--
-- Dumping data for table `translations`
--

INSERT INTO `translations` (`id`, `original_table`, `original_id`, `field_name`, `language_id`, `translated_value`, `is_approved`, `created_by`, `approved_by`, `created_at`, `updated_at`, `approved_at`) VALUES
(1, 'attractions', 1, 'name', 1, '333 Steps (Melgar A)', 1, NULL, NULL, '2026-04-05 11:14:28', '2026-04-05 11:14:28', NULL),
(2, 'attractions', 1, 'name', 2, '333 Pasos (Melgar A)', 1, NULL, NULL, '2026-04-05 11:14:32', '2026-04-05 11:14:32', NULL),
(3, 'attractions', 1, 'name', 3, '333 Steps (Melgar A)', 1, NULL, NULL, '2026-04-05 11:14:33', '2026-04-05 11:14:33', NULL),
(4, 'attractions', 1, 'name', 5, '333 ステップ (メルガル A)', 1, NULL, NULL, '2026-04-05 11:14:35', '2026-04-05 11:14:35', NULL),
(5, 'attractions', 1, 'name', 6, '333계단(멜가르 A)', 1, NULL, NULL, '2026-04-05 11:14:36', '2026-04-05 11:14:36', NULL),
(6, 'attractions', 1, 'name', 7, '333 marches (Melgar A)', 1, NULL, NULL, '2026-04-05 11:14:38', '2026-04-05 11:14:38', NULL),
(7, 'attractions', 1, 'name', 8, '333 Schritte (Melgar A)', 1, NULL, NULL, '2026-04-05 11:14:40', '2026-04-05 11:14:40', NULL),
(8, 'attractions', 1, 'description', 1, '333 Steps is a hillside trek with concrete steps surrounded by green vegetation, leading to panoramic views of the rolling hills and coastline. The ambiance is refreshing, active, and uplifting. Visitors can hike the steps, take photos of the scenic views, enjoy light exercise, and experience the beauty of nature.', 1, NULL, NULL, '2026-04-05 11:14:40', '2026-04-05 11:14:40', NULL),
(9, 'attractions', 1, 'description', 2, '333 Steps es una caminata por la ladera con escalones de concreto rodeados de vegetación verde, que conducen a vistas panorámicas de las colinas y la costa.El ambiente es refrescante, activo y edificante.Los visitantes pueden subir las escaleras, tomar fotografías de las vistas panorámicas, disfrutar de ejercicio ligero y experimentar la belleza de la naturaleza.', 1, NULL, NULL, '2026-04-05 11:14:41', '2026-04-05 11:14:41', NULL),
(10, 'attractions', 1, 'description', 3, 'Ang 333 Steps ay isang hillside trek na may mga konkretong hakbang na napapalibutan ng mga berdeng halaman, na humahantong sa mga malalawak na tanawin ng mga gumugulong na burol at baybayin.Ang ambiance ay nakakapresko, aktibo, at nakapagpapasigla.Maaaring maglakad ang mga bisita sa mga hakbang, kumuha ng mga larawan ng mga magagandang tanawin, mag-enjoy ng magaan na ehersisyo, at maranasan ang kagandahan ng kalikasan.', 1, NULL, NULL, '2026-04-05 11:14:43', '2026-04-05 11:14:43', NULL),
(11, 'attractions', 1, 'description', 5, '333 ステップスは、緑の植物に囲まれたコンクリートの階段が続く丘陵地帯のトレッキングで、なだらかな丘陵と海岸線のパノラマの景色を眺めることができます。雰囲気はさわやかでアクティブで、高揚感があります。階段を登ったり、美しい景色を写真に撮ったり、軽い運動を楽しんだり、自然の美しさを体験できます。', 1, NULL, NULL, '2026-04-05 11:14:45', '2026-04-05 11:14:45', NULL),
(12, 'attractions', 1, 'description', 6, '333 계단(333 Steps)은 푸른 초목으로 둘러싸인 콘크리트 계단이 있는 언덕 트레킹으로 구불구불한 언덕과 해안선의 탁 트인 전망을 감상할 수 있습니다.분위기는 상쾌하고 활동적이며 기분이 좋아집니다.방문객들은 계단을 오르고, 경치를 사진으로 찍고, 가벼운 운동을 즐기며 자연의 아름다움을 경험할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:14:46', '2026-04-05 11:14:46', NULL),
(13, 'attractions', 1, 'description', 7, '333 Steps est une randonnée à flanc de colline avec des marches en béton entourées de végétation verte, menant à des vues panoramiques sur les collines et le littoral.L\'ambiance est rafraîchissante, active et exaltante.Les visiteurs peuvent parcourir les marches, prendre des photos des vues panoramiques, faire de l\'exercice léger et découvrir la beauté de la nature.', 1, NULL, NULL, '2026-04-05 11:14:48', '2026-04-05 11:14:48', NULL),
(14, 'attractions', 1, 'description', 8, '333 Steps ist eine Bergwanderung mit Betonstufen, umgeben von grüner Vegetation, die zu Panoramablicken auf die sanften Hügel und die Küste führt.Die Atmosphäre ist erfrischend, aktiv und erhebend.Besucher können die Stufen erklimmen, Fotos von der malerischen Aussicht machen, leichte Übungen machen und die Schönheit der Natur erleben.', 1, NULL, NULL, '2026-04-05 11:14:51', '2026-04-05 11:14:51', NULL),
(15, 'attractions', 2, 'name', 1, 'Arangin Falls', 1, NULL, NULL, '2026-04-05 11:14:51', '2026-04-05 11:14:51', NULL),
(16, 'attractions', 2, 'name', 2, 'Cataratas de Arangín', 1, NULL, NULL, '2026-04-05 11:14:52', '2026-04-05 11:14:52', NULL),
(17, 'attractions', 2, 'name', 3, 'Arangin Falls', 1, NULL, NULL, '2026-04-05 11:14:54', '2026-04-05 11:14:54', NULL),
(18, 'attractions', 2, 'name', 5, 'アランギン滝', 1, NULL, NULL, '2026-04-05 11:14:56', '2026-04-05 11:14:56', NULL),
(19, 'attractions', 2, 'name', 6, '아랑긴 폭포', 1, NULL, NULL, '2026-04-05 11:14:57', '2026-04-05 11:14:57', NULL),
(20, 'attractions', 2, 'name', 7, 'Chutes d\'Arangin', 1, NULL, NULL, '2026-04-05 11:14:58', '2026-04-05 11:14:58', NULL),
(21, 'attractions', 2, 'name', 8, 'Arangin Falls', 1, NULL, NULL, '2026-04-05 11:14:59', '2026-04-05 11:14:59', NULL),
(22, 'attractions', 2, 'description', 1, 'With details about the multi-level waterfall and picnic area', 1, NULL, NULL, '2026-04-05 11:14:59', '2026-04-05 11:14:59', NULL),
(23, 'attractions', 2, 'description', 2, 'Con detalles sobre la cascada de varios niveles y el área de picnic.', 1, NULL, NULL, '2026-04-05 11:15:01', '2026-04-05 11:15:01', NULL),
(24, 'attractions', 2, 'description', 3, 'May mga detalye tungkol sa multi-level waterfall at picnic area', 1, NULL, NULL, '2026-04-05 11:15:01', '2026-04-05 11:15:01', NULL),
(25, 'attractions', 2, 'description', 5, '複数層の滝とピクニックエリアの詳細', 1, NULL, NULL, '2026-04-05 11:15:04', '2026-04-05 11:15:04', NULL),
(26, 'attractions', 2, 'description', 6, '다층폭포와 피크닉 장소에 대한 자세한 내용', 1, NULL, NULL, '2026-04-05 11:15:06', '2026-04-05 11:15:06', NULL),
(27, 'attractions', 2, 'description', 7, 'Avec des détails sur la cascade à plusieurs niveaux et l\'aire de pique-nique', 1, NULL, NULL, '2026-04-05 11:15:08', '2026-04-05 11:15:08', NULL),
(28, 'attractions', 2, 'description', 8, 'Mit Details zum mehrstufigen Wasserfall und Picknickplatz', 1, NULL, NULL, '2026-04-05 11:15:10', '2026-04-05 11:15:10', NULL),
(29, 'attractions', 3, 'name', 1, 'Liwasang Bonifacio', 1, NULL, NULL, '2026-04-05 11:15:10', '2026-04-05 11:15:10', NULL),
(30, 'attractions', 3, 'name', 2, 'Bonifacio Liwasang', 1, NULL, NULL, '2026-04-05 11:15:11', '2026-04-05 11:15:11', NULL),
(31, 'attractions', 3, 'name', 3, 'Liwasang Bonifacio', 1, NULL, NULL, '2026-04-05 11:15:13', '2026-04-05 11:15:13', NULL),
(32, 'attractions', 3, 'name', 5, 'リワサン・ボニファシオ', 1, NULL, NULL, '2026-04-05 11:15:16', '2026-04-05 11:15:16', NULL),
(33, 'attractions', 3, 'name', 6, '리와상 보니파시오', 1, NULL, NULL, '2026-04-05 11:15:18', '2026-04-05 11:15:18', NULL),
(34, 'attractions', 3, 'name', 7, 'Liwasang Bonifacio', 1, NULL, NULL, '2026-04-05 11:15:19', '2026-04-05 11:15:19', NULL),
(35, 'attractions', 3, 'name', 8, 'Liwasang Bonifacio', 1, NULL, NULL, '2026-04-05 11:15:21', '2026-04-05 11:15:21', NULL),
(36, 'attractions', 3, 'description', 1, 'Naujan Lake National Park is the fifth largest lake in the Philippines, surrounded by lush mountains and rich biodiversity. The expansive waters host migratory birds and endemic wildlife, making it a haven for nature lovers. The ambiance is calm, serene, and peaceful, perfect for boat rides, birdwatching, nature photography, or simply enjoying breathtaking sunsets over the glass-like lake.', 1, NULL, NULL, '2026-04-05 11:15:21', '2026-04-05 11:15:21', NULL),
(37, 'attractions', 3, 'description', 2, 'El Parque Nacional del Lago Naujan es el quinto lago más grande de Filipinas, rodeado de exuberantes montañas y una rica biodiversidad.Las amplias aguas albergan aves migratorias y vida silvestre endémica, lo que las convierte en un paraíso para los amantes de la naturaleza.El ambiente es tranquilo, sereno y pacífico, perfecto para paseos en bote, observación de aves, fotografía de la naturaleza o simplemente disfrutar de impresionantes puestas de sol sobre el lago de cristal.', 1, NULL, NULL, '2026-04-05 11:15:23', '2026-04-05 11:15:23', NULL),
(38, 'attractions', 3, 'description', 3, 'Ang Naujan Lake National Park ay ang ikalimang pinakamalaking lawa sa Pilipinas, na napapalibutan ng malalagong kabundukan at mayamang biodiversity.Ang malawak na tubig ay nagho-host ng mga migratory bird at endemic wildlife, na ginagawa itong isang kanlungan para sa mga mahilig sa kalikasan.Kalmado, payapa, at payapa ang ambiance, perpekto para sa pagsakay sa bangka, panonood ng ibon, photography ng kalikasan, o simpleng pag-enjoy sa mga nakamamanghang paglubog ng araw sa ibabaw ng mala-salaming lawa.', 1, NULL, NULL, '2026-04-05 11:15:25', '2026-04-05 11:15:25', NULL),
(39, 'attractions', 3, 'description', 5, 'ナウジャン湖国立公園は、フィリピンで 5 番目に大きい湖で、緑豊かな山々と豊かな生物多様性に囲まれています。広大な海域には渡り鳥や固有の野生生物が生息しており、自然愛好家にとっての天国となっています。雰囲気は穏やかで穏やかで平和で、ボートに乗ったり、バードウォッチング、自然の写真を撮ったり、単にガラスのような湖に沈む息を呑むような夕日を楽しむのに最適です。', 1, NULL, NULL, '2026-04-05 11:15:27', '2026-04-05 11:15:27', NULL),
(40, 'attractions', 3, 'description', 6, '나우잔 호수 국립공원(Naujan Lake National Park)은 필리핀에서 다섯 번째로 큰 호수로, 울창한 산과 풍부한 생물 다양성으로 둘러싸여 있습니다.광대한 바다에는 철새와 고유종 야생동물이 서식하여 자연을 사랑하는 사람들의 안식처가 됩니다.분위기는 고요하고 고요하며 평화로워 보트 타기, 조류 관찰, 자연 사진 촬영, 유리처럼 보이는 호수 위로 숨막히는 일몰을 즐기기에 적합합니다.', 1, NULL, NULL, '2026-04-05 11:15:29', '2026-04-05 11:15:29', NULL),
(41, 'attractions', 3, 'description', 7, 'Le parc national du lac Naujan est le cinquième plus grand lac des Philippines, entouré de montagnes luxuriantes et d\'une riche biodiversité.Les vastes eaux abritent des oiseaux migrateurs et une faune endémique, ce qui en fait un paradis pour les amoureux de la nature.L\'ambiance est calme, sereine et paisible, parfaite pour les promenades en bateau, l\'observation des oiseaux, la photographie de la nature ou simplement pour profiter de couchers de soleil à couper le souffle sur le lac aux allures de verre.', 1, NULL, NULL, '2026-04-05 11:15:31', '2026-04-05 11:15:31', NULL),
(42, 'attractions', 3, 'description', 8, 'Der Naujan-Lake-Nationalpark ist der fünftgrößte See der Philippinen, umgeben von üppigen Bergen und einer reichen Artenvielfalt.Die ausgedehnten Gewässer beherbergen Zugvögel und endemische Wildtiere und machen es zu einem Paradies für Naturliebhaber.Die Atmosphäre ist ruhig, gelassen und friedlich, perfekt für Bootsfahrten, Vogelbeobachtungen, Naturfotografie oder einfach zum Genießen atemberaubender Sonnenuntergänge über dem spiegelglatten See.', 1, NULL, NULL, '2026-04-05 11:15:34', '2026-04-05 11:15:34', NULL),
(43, 'attractions', 4, 'name', 1, 'Naujan Lake', 1, NULL, NULL, '2026-04-05 11:15:34', '2026-04-05 11:15:34', NULL),
(44, 'attractions', 4, 'name', 2, 'Lago Naujan', 1, NULL, NULL, '2026-04-05 11:15:37', '2026-04-05 11:15:37', NULL),
(45, 'attractions', 4, 'name', 3, 'Lawa ng Naujan', 1, NULL, NULL, '2026-04-05 11:15:38', '2026-04-05 11:15:38', NULL),
(46, 'attractions', 4, 'name', 5, 'ナウジャン湖', 1, NULL, NULL, '2026-04-05 11:15:41', '2026-04-05 11:15:41', NULL),
(47, 'attractions', 4, 'name', 6, '나우잔 호수', 1, NULL, NULL, '2026-04-05 11:15:43', '2026-04-05 11:15:43', NULL),
(48, 'attractions', 4, 'name', 7, 'Lac Naujan', 1, NULL, NULL, '2026-04-05 11:15:45', '2026-04-05 11:15:45', NULL),
(49, 'attractions', 4, 'name', 8, 'Naujan-See', 1, NULL, NULL, '2026-04-05 11:15:48', '2026-04-05 11:15:48', NULL),
(50, 'attractions', 4, 'description', 1, 'Naujan Lake is the fifth largest lake in the Philippines and the largest freshwater lake in Oriental Mindoro and is declared as a “wetland of international importance” by the Ramsar Convention. It is bordered by the Municipalities of Naujan, Victoria, Socorro and Pola. The lake is home to a wide variety of fish and water birds both local and migratory.', 1, NULL, NULL, '2026-04-05 11:15:48', '2026-04-05 11:15:48', NULL),
(51, 'attractions', 4, 'description', 2, 'El lago Naujan es el quinto lago más grande de Filipinas y el lago de agua dulce más grande de Mindoro Oriental y está declarado “humedal de importancia internacional” por la Convención de Ramsar.Limita con los Municipios de Naujan, Victoria, Socorro y Pola.El lago alberga una amplia variedad de peces y aves acuáticas, tanto locales como migratorias.', 1, NULL, NULL, '2026-04-05 11:15:50', '2026-04-05 11:15:50', NULL),
(52, 'attractions', 4, 'description', 3, 'Ang Naujan Lake ay ang ikalimang pinakamalaking lawa sa Pilipinas at ang pinakamalaking freshwater lake sa Oriental Mindoro at idineklara bilang \"wetland of international importance\" ng Ramsar Convention.Ito ay nasa hangganan ng Munisipalidad ng Naujan, Victoria, Socorro at Pola.Ang lawa ay tahanan ng iba\'t ibang uri ng isda at mga ibon sa tubig parehong lokal at migratory.', 1, NULL, NULL, '2026-04-05 11:15:52', '2026-04-05 11:15:52', NULL),
(53, 'attractions', 4, 'description', 5, 'ナウジャン湖はフィリピンで 5 番目に大きい湖であり、東ミンドロ島では最大の淡水湖であり、ラムサール条約によって「国際的に重要な湿地」として宣言されています。ナウジャン、ビクトリア、ソコロ、ポーラの各自治体に隣接しています。この湖には、地元の魚や渡り鳥の両方が多種多様な魚や水鳥が生息しています。', 1, NULL, NULL, '2026-04-05 11:15:54', '2026-04-05 11:15:54', NULL),
(54, 'attractions', 4, 'description', 6, '나우잔 호수는 필리핀에서 다섯 번째로 큰 호수이자 동양의 민도로에서 가장 큰 담수호이며, 람사르 협약에 의해 “국제적으로 중요한 습지”로 지정되었습니다.나우한(Naujan), 빅토리아(Victoria), 소코로(Socorro), 폴라(Pola) 지방자치단체와 접해 있습니다.호수에는 지역 및 철새 모두에서 다양한 물고기와 물새가 서식하고 있습니다.', 1, NULL, NULL, '2026-04-05 11:15:56', '2026-04-05 11:15:56', NULL),
(55, 'attractions', 4, 'description', 7, 'Le lac Naujan est le cinquième plus grand lac des Philippines et le plus grand lac d\'eau douce du Mindoro oriental. Il est déclaré « zone humide d\'importance internationale » par la Convention de Ramsar.Elle est bordée par les communes de Naujan, Victoria, Socorro et Pola.Le lac abrite une grande variété de poissons et d\'oiseaux aquatiques locaux et migrateurs.', 1, NULL, NULL, '2026-04-05 11:15:58', '2026-04-05 11:15:58', NULL),
(56, 'attractions', 4, 'description', 8, 'Der Naujan-See ist der fünftgrößte See der Philippinen und der größte Süßwassersee im orientalischen Mindoro und wird von der Ramsar-Konvention zum „Feuchtgebiet von internationaler Bedeutung“ erklärt.Es grenzt an die Gemeinden Naujan, Victoria, Socorro und Pola.Der See ist die Heimat einer großen Vielfalt an einheimischen Fischen und Wasservögeln sowie Zugvögeln.', 1, NULL, NULL, '2026-04-05 11:16:00', '2026-04-05 11:16:00', NULL),
(57, 'attractions', 5, 'name', 1, 'Simbahang Bato (Bancuro Ruins)', 1, NULL, NULL, '2026-04-05 11:16:00', '2026-04-05 11:16:00', NULL),
(58, 'attractions', 5, 'name', 2, 'Simbahang Bato (Ruinas de Bancuro)', 1, NULL, NULL, '2026-04-05 11:16:03', '2026-04-05 11:16:03', NULL),
(59, 'attractions', 5, 'name', 3, 'Simbahang Bato (Bancuro Ruins)', 1, NULL, NULL, '2026-04-05 11:16:04', '2026-04-05 11:16:04', NULL),
(60, 'attractions', 5, 'name', 5, 'シンバハン・バト（バンクロ遺跡）', 1, NULL, NULL, '2026-04-05 11:16:06', '2026-04-05 11:16:06', NULL),
(61, 'attractions', 5, 'name', 6, '심바항 바토(반쿠로 유적지)', 1, NULL, NULL, '2026-04-05 11:16:08', '2026-04-05 11:16:08', NULL),
(62, 'attractions', 5, 'name', 7, 'Simbahang Bato (ruines de Bancuro)', 1, NULL, NULL, '2026-04-05 11:16:09', '2026-04-05 11:16:09', NULL),
(63, 'attractions', 5, 'name', 8, 'Simbahang Bato (Bancuro-Ruinen)', 1, NULL, NULL, '2026-04-05 11:16:11', '2026-04-05 11:16:11', NULL),
(64, 'attractions', 5, 'description', 1, 'Simbahang Bato is a historic 17th-century coral and adobe church ruin with a unique “church within a church” design. The moss-covered walls and open-air structures create a hauntingly beautiful atmosphere where history and faith meet. Visitors can explore the ruins, take photos, learn about the Spanish-era heritage, and feel the quiet reverence of this iconic site.', 1, NULL, NULL, '2026-04-05 11:16:11', '2026-04-05 11:16:11', NULL),
(65, 'attractions', 5, 'description', 2, 'Simbahang Bato es una histórica iglesia en ruinas de coral y adobe del siglo XVII con un diseño único de \"iglesia dentro de una iglesia\".Las paredes cubiertas de musgo y las estructuras al aire libre crean una atmósfera inquietantemente hermosa donde la historia y la fe se encuentran.Los visitantes pueden explorar las ruinas, tomar fotografías, aprender sobre la herencia de la época española y sentir la silenciosa reverencia de este sitio icónico.', 1, NULL, NULL, '2026-04-05 11:16:12', '2026-04-05 11:16:12', NULL),
(66, 'attractions', 5, 'description', 3, 'Ang Simbahang Bato ay isang makasaysayang 17th-century coral at adobe church ruin na may kakaibang disenyong \"church within a church\".Ang mga pader na natatakpan ng lumot at mga open-air na istruktura ay lumikha ng isang napakagandang kapaligiran kung saan nagtatagpo ang kasaysayan at pananampalataya.Maaaring tuklasin ng mga bisita ang mga guho, kumuha ng litrato, matuto tungkol sa pamana ng panahon ng Espanyol, at madama ang tahimik na pagpipitagan ng iconic na site na ito.', 1, NULL, NULL, '2026-04-05 11:16:14', '2026-04-05 11:16:14', NULL),
(67, 'attractions', 5, 'description', 5, 'シンバハン バトは、17 世紀の歴史的なサンゴと日干しレンガ造りの教会遺跡で、ユニークな「教会の中の教会」のデザインが施されています。苔で覆われた壁と屋外の建物は、歴史と信仰が出会う忘れられないほど美しい雰囲気を作り出しています。訪問者は遺跡を探索し、写真を撮り、スペイン時代の遺産について学び、この象徴的な場所への静かな敬意を感じることができます。', 1, NULL, NULL, '2026-04-05 11:16:16', '2026-04-05 11:16:16', NULL),
(68, 'attractions', 5, 'description', 6, '심바항 바토(Simbahang Bato)는 독특한 \"교회 안의 교회\" 디자인을 갖춘 역사적인 17세기 산호와 흙벽돌 교회 유적지입니다.이끼로 뒤덮인 벽과 야외 구조물은 역사와 신앙이 만나는 잊혀지지 않을 만큼 아름다운 분위기를 연출합니다.방문객들은 유적지를 탐험하고, 사진을 찍고, 스페인 시대의 유산에 대해 배우고, 이 상징적인 장소의 조용한 경외심을 느낄 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:16:18', '2026-04-05 11:16:18', NULL),
(69, 'attractions', 5, 'description', 7, 'Simbahang Bato est une ruine d\'église historique en corail et en adobe du XVIIe siècle avec une conception unique « d\'église dans l\'église ».Les murs couverts de mousse et les structures en plein air créent une atmosphère d’une beauté envoûtante où l’histoire et la foi se rencontrent.Les visiteurs peuvent explorer les ruines, prendre des photos, en apprendre davantage sur le patrimoine de l\'époque espagnole et ressentir le respect paisible de ce site emblématique.', 1, NULL, NULL, '2026-04-05 11:16:20', '2026-04-05 11:16:20', NULL),
(70, 'attractions', 5, 'description', 8, 'Simbahang Bato ist eine historische Kirchenruine aus Korallen- und Lehmziegeln aus dem 17. Jahrhundert mit einem einzigartigen „Kirche-in-Kirche“-Design.Die moosbedeckten Wände und Freiluftstrukturen schaffen eine betörend schöne Atmosphäre, in der Geschichte und Glaube aufeinandertreffen.Besucher können die Ruinen erkunden, Fotos machen, mehr über das Erbe der spanischen Ära erfahren und die stille Ehrfurcht vor diesem ikonischen Ort spüren.', 1, NULL, NULL, '2026-04-05 11:16:22', '2026-04-05 11:16:22', NULL),
(71, 'attractions', 6, 'name', 1, 'Dao Waterlily Mini Park', 1, NULL, NULL, '2026-04-05 11:16:22', '2026-04-05 11:16:22', NULL),
(72, 'attractions', 6, 'name', 2, 'Miniparque Dao Waterlily', 1, NULL, NULL, '2026-04-05 11:16:23', '2026-04-05 11:16:23', NULL),
(73, 'attractions', 6, 'name', 3, 'Dao Waterlily Mini Park', 1, NULL, NULL, '2026-04-05 11:16:25', '2026-04-05 11:16:25', NULL),
(74, 'attractions', 6, 'name', 5, 'ダオスイレンミニパーク', 1, NULL, NULL, '2026-04-05 11:16:27', '2026-04-05 11:16:27', NULL),
(75, 'attractions', 6, 'name', 6, '다오 수련 미니파크', 1, NULL, NULL, '2026-04-05 11:16:29', '2026-04-05 11:16:29', NULL),
(76, 'attractions', 6, 'name', 7, 'Mini-parc aux nénuphars de Dao', 1, NULL, NULL, '2026-04-05 11:16:31', '2026-04-05 11:16:31', NULL),
(77, 'attractions', 6, 'name', 8, 'Dao Waterlily Mini Park', 1, NULL, NULL, '2026-04-05 11:16:34', '2026-04-05 11:16:34', NULL),
(78, 'attractions', 6, 'description', 1, 'Dao Waterlily Mini Park is a scenic eco-park where colorful water lilies cover the ponds, creating a picturesque environment. The park also showcases local craftsmanship, with artisans making sustainable bags and accessories from dried water lily stalks. Visitors can enjoy boat rides, shop for unique souvenirs, take photos, and relax amidst the cheerful and nature-filled surroundings.', 1, NULL, NULL, '2026-04-05 11:16:34', '2026-04-05 11:16:34', NULL),
(79, 'attractions', 6, 'description', 2, 'Dao Waterlily Mini Park es un pintoresco parque ecológico donde coloridos nenúfares cubren los estanques, creando un ambiente pintoresco.El parque también exhibe la artesanía local, con artesanos que fabrican bolsos y accesorios sostenibles a partir de tallos secos de nenúfar.Los visitantes pueden disfrutar de paseos en bote, comprar recuerdos únicos, tomar fotografías y relajarse en un entorno alegre y lleno de naturaleza.', 1, NULL, NULL, '2026-04-05 11:16:36', '2026-04-05 11:16:36', NULL),
(80, 'attractions', 6, 'description', 3, 'Ang Dao Waterlily Mini Park ay isang magandang eco-park kung saan ang mga makukulay na water lily ay tumatakip sa mga lawa, na lumilikha ng magandang kapaligiran.Ang parke ay nagpapakita rin ng lokal na craftsmanship, kasama ang mga artisan na gumagawa ng mga sustainable na bag at accessories mula sa mga tuyong tangkay ng water lily.Maaaring tangkilikin ng mga bisita ang pagsakay sa bangka, mamili ng mga kakaibang souvenir, kumuha ng litrato, at mag-relax sa gitna ng masaya at puno ng kalikasan na kapaligiran.', 1, NULL, NULL, '2026-04-05 11:16:38', '2026-04-05 11:16:38', NULL),
(81, 'attractions', 6, 'description', 5, 'ダオ スイレン ミニ パークは、色とりどりのスイレンが池を覆い、絵のように美しい環境を作り出している風光明媚なエコパークです。この公園では地元の職人技も展示されており、職人たちは乾燥したスイレンの茎を使って持続可能なバッグやアクセサリーを作っています。訪問者は、ボートに乗ったり、ユニークなお土産を買ったり、写真を撮ったり、陽気で自然に満ちた環境の中でリラックスしたりできます。', 1, NULL, NULL, '2026-04-05 11:16:40', '2026-04-05 11:16:40', NULL),
(82, 'attractions', 6, 'description', 6, '다오수련 미니파크는 연못을 알록달록한 수련이 뒤덮어 그림 같은 환경을 조성하는 경치 좋은 생태공원이다.이 공원은 또한 장인들이 말린 수련 줄기로 지속 가능한 가방과 액세서리를 만드는 등 현지 장인 정신을 보여줍니다.방문객들은 보트 타기를 즐기고, 독특한 기념품을 쇼핑하고, 사진을 찍고, 밝고 자연이 가득한 환경 속에서 휴식을 취할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:16:42', '2026-04-05 11:16:42', NULL),
(83, 'attractions', 6, 'description', 7, 'Dao Waterlily Mini Park est un éco-parc pittoresque où des nénuphars colorés recouvrent les étangs, créant un environnement pittoresque.Le parc présente également le savoir-faire local, avec des artisans fabriquant des sacs et des accessoires durables à partir de tiges de nénuphar séchées.Les visiteurs peuvent profiter de promenades en bateau, acheter des souvenirs uniques, prendre des photos et se détendre dans un environnement joyeux et naturel.', 1, NULL, NULL, '2026-04-05 11:16:44', '2026-04-05 11:16:44', NULL),
(84, 'attractions', 6, 'description', 8, 'Der Dao Waterlily Mini Park ist ein malerischer Ökopark, in dem bunte Seerosen die Teiche bedecken und eine malerische Umgebung schaffen.Der Park zeigt auch lokale Handwerkskunst: Kunsthandwerker stellen nachhaltige Taschen und Accessoires aus getrockneten Seerosenstielen her.Besucher können Bootsfahrten genießen, einzigartige Souvenirs kaufen, Fotos machen und inmitten der fröhlichen und naturreichen Umgebung entspannen.', 1, NULL, NULL, '2026-04-05 11:16:46', '2026-04-05 11:16:46', NULL),
(85, 'attractions', 7, 'name', 1, 'Montelago Hot Spring & Forest Falls', 1, NULL, NULL, '2026-04-05 11:16:46', '2026-04-05 11:16:46', NULL),
(86, 'attractions', 7, 'name', 2, 'Aguas termales de Montelago y cataratas del bosque', 1, NULL, NULL, '2026-04-05 11:16:47', '2026-04-05 11:16:47', NULL),
(87, 'attractions', 7, 'name', 3, 'Montelago Hot Spring at Forest Falls', 1, NULL, NULL, '2026-04-05 11:16:49', '2026-04-05 11:16:49', NULL),
(88, 'attractions', 7, 'name', 5, 'モンテラゴ温泉とフォレストフォールズ', 1, NULL, NULL, '2026-04-05 11:16:51', '2026-04-05 11:16:51', NULL),
(89, 'attractions', 7, 'name', 6, '몬테라고 온천 및 포레스트 폭포', 1, NULL, NULL, '2026-04-05 11:16:53', '2026-04-05 11:16:53', NULL),
(90, 'attractions', 7, 'name', 7, 'Source chaude de Montelago et chutes forestières', 1, NULL, NULL, '2026-04-05 11:16:55', '2026-04-05 11:16:55', NULL),
(91, 'attractions', 7, 'name', 8, 'Montelago Hot Spring & Forest Falls', 1, NULL, NULL, '2026-04-05 11:16:57', '2026-04-05 11:16:57', NULL),
(92, 'attractions', 7, 'description', 1, 'Montelago Hot Spring and Forest Falls is a natural getaway with warm mineral pools and small forest waterfalls nestled among volcanic rocks and greenery. The ambiance is soothing, refreshing, and peaceful. Guests can soak in hot springs, swim in forest pools, trek trails, enjoy nature walks, and take photos of the stunning scenery along the Naujan Lake shoreline. ', 1, NULL, NULL, '2026-04-05 11:16:57', '2026-04-05 11:16:57', NULL),
(93, 'attractions', 7, 'description', 2, 'Montelago Hot Spring and Forest Falls es una escapada natural con cálidas piscinas minerales y pequeñas cascadas forestales ubicadas entre rocas volcánicas y vegetación.El ambiente es relajante, refrescante y pacífico.Los huéspedes pueden sumergirse en aguas termales, nadar en piscinas forestales, recorrer senderos, disfrutar de paseos por la naturaleza y tomar fotografías del impresionante paisaje a lo largo de la costa del lago Naujan.', 1, NULL, NULL, '2026-04-05 11:16:59', '2026-04-05 11:16:59', NULL),
(94, 'attractions', 7, 'description', 3, 'Ang Montelago Hot Spring at Forest Falls ay isang natural na getaway na may mga maiinit na mineral pool at maliliit na talon sa kagubatan na matatagpuan sa gitna ng mga bulkan na bato at halamanan.Ang ambiance ay nakapapawi, nakakapresko, at mapayapa.Maaaring magbabad ang mga bisita sa mga hot spring, lumangoy sa mga forest pool, trek trail, magsaya sa mga nature walk, at kumuha ng mga larawan ng nakamamanghang tanawin sa kahabaan ng baybayin ng Naujan Lake.', 1, NULL, NULL, '2026-04-05 11:17:01', '2026-04-05 11:17:01', NULL),
(95, 'attractions', 7, 'description', 5, 'モンテラゴ ホット スプリング アンド フォレスト フォールズは、火山岩と緑に囲まれた温かいミネラルプールと小さな森の滝がある自然の保養地です。雰囲気は落ち着いていて、さわやかで、平和です。滞在中は、温泉に浸かったり、森のプールで泳いだり、トレイルをトレッキングしたり、自然散策を楽しんだり、ナウハン湖の海岸線に沿った素晴らしい景色の写真を撮ったりすることができます。', 1, NULL, NULL, '2026-04-05 11:17:04', '2026-04-05 11:17:04', NULL),
(96, 'attractions', 7, 'description', 6, '몬테라고 온천과 숲 폭포는 화산암과 녹지 사이에 자리잡은 따뜻한 미네랄 웅덩이와 작은 숲 폭포가 있는 자연 휴양지입니다.분위기는 차분하고 상쾌하며 평화롭습니다.손님들은 온천에 몸을 담그고, 숲속 수영장에서 수영하고, 트레킹 코스를 즐기고, 자연 산책을 즐기고, 나우잔 호수(Naujan Lake) 해안선을 따라 아름다운 풍경을 사진으로 찍을 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:17:06', '2026-04-05 11:17:06', NULL),
(97, 'attractions', 7, 'description', 7, 'Montelago Hot Spring and Forest Falls est une escapade naturelle avec des piscines minérales chaudes et de petites cascades forestières nichées parmi les roches volcaniques et la verdure.L\'ambiance est apaisante, rafraîchissante et paisible.Les clients peuvent se baigner dans des sources chaudes, nager dans des piscines forestières, faire des randonnées, profiter de promenades dans la nature et prendre des photos des magnifiques paysages le long des rives du lac Naujan.', 1, NULL, NULL, '2026-04-05 11:17:08', '2026-04-05 11:17:08', NULL),
(98, 'attractions', 7, 'description', 8, 'Montelago Hot Spring and Forest Falls ist ein natürlicher Zufluchtsort mit warmen Mineralbecken und kleinen Waldwasserfällen, eingebettet zwischen Vulkangestein und viel Grün.Die Atmosphäre ist beruhigend, erfrischend und friedlich.Gäste können in heißen Quellen baden, in Waldbecken schwimmen, Wanderwege erkunden, Spaziergänge in der Natur genießen und Fotos von der atemberaubenden Landschaft entlang der Küste des Naujan-Sees machen.', 1, NULL, NULL, '2026-04-05 11:17:10', '2026-04-05 11:17:10', NULL),
(99, 'attractions', 8, 'name', 1, 'AgriGold Farm Learning Center Inc.', 1, NULL, NULL, '2026-04-05 11:17:10', '2026-04-05 11:17:10', NULL),
(100, 'attractions', 8, 'name', 2, 'Centro de aprendizaje agrícola AgriGold Inc.', 1, NULL, NULL, '2026-04-05 11:17:12', '2026-04-05 11:17:12', NULL),
(101, 'attractions', 8, 'name', 3, 'AgriGold Farm Learning Center Inc.', 1, NULL, NULL, '2026-04-05 11:17:14', '2026-04-05 11:17:14', NULL),
(102, 'attractions', 8, 'name', 5, '株式会社アグリゴールドファームラーニングセンター', 1, NULL, NULL, '2026-04-05 11:17:16', '2026-04-05 11:17:16', NULL),
(103, 'attractions', 8, 'name', 6, 'AgriGold 농장 학습 센터 Inc.', 1, NULL, NULL, '2026-04-05 11:17:17', '2026-04-05 11:17:17', NULL),
(104, 'attractions', 8, 'name', 7, 'Centre d\'apprentissage agricole AgriGold Inc.', 1, NULL, NULL, '2026-04-05 11:17:18', '2026-04-05 11:17:18', NULL),
(105, 'attractions', 8, 'name', 8, 'AgriGold Farm Learning Center Inc.', 1, NULL, NULL, '2026-04-05 11:17:19', '2026-04-05 11:17:19', NULL),
(106, 'attractions', 8, 'description', 1, 'AgriGold Farm Learning Center is a lively educational farm with green vegetable plots, poultry areas, and interactive learning facilities. The atmosphere is cheerful and welcoming, ideal for families and eco-enthusiasts. Visitors can join workshops on organic farming, explore crops and poultry, learn sustainable agriculture techniques, and enjoy hands-on experiences on the farm.', 1, NULL, NULL, '2026-04-05 11:17:19', '2026-04-05 11:17:19', NULL),
(107, 'attractions', 8, 'description', 2, 'AgriGold Farm Learning Center es una animada granja educativa con huertos de vegetales verdes, áreas avícolas e instalaciones de aprendizaje interactivo.El ambiente es alegre y acogedor, ideal para familias y entusiastas del medio ambiente.Los visitantes pueden unirse a talleres sobre agricultura orgánica, explorar cultivos y aves de corral, aprender técnicas de agricultura sostenible y disfrutar de experiencias prácticas en la granja.', 1, NULL, NULL, '2026-04-05 11:17:21', '2026-04-05 11:17:21', NULL),
(108, 'attractions', 8, 'description', 3, 'Ang AgriGold Farm Learning Center ay isang buhay na buhay na pang-edukasyon na sakahan na may mga luntiang gulayan, poultry area, at interactive learning facility.Ang kapaligiran ay masaya at nakakaengganyo, perpekto para sa mga pamilya at eco-enthusiast.Maaaring sumali ang mga bisita sa mga workshop sa organikong pagsasaka, galugarin ang mga pananim at manok, matuto ng napapanatiling mga diskarte sa agrikultura, at mag-enjoy ng mga hands-on na karanasan sa bukid.', 1, NULL, NULL, '2026-04-05 11:17:22', '2026-04-05 11:17:22', NULL),
(109, 'attractions', 8, 'description', 5, 'アグリゴールド ファーム ラーニング センターは、緑の野菜畑、養鶏エリア、インタラクティブな学習施設を備えた活気のある教育農場です。陽気で居心地の良い雰囲気は、家族連れや環境愛好家に最適です。訪問者は、有機農業に関するワークショップに参加し、作物や家禽を観察し、持続可能な農業技術を学び、農場での実践的な体験を楽しむことができます。', 1, NULL, NULL, '2026-04-05 11:17:24', '2026-04-05 11:17:24', NULL),
(110, 'attractions', 8, 'description', 6, 'AgriGold 농장 학습 센터는 녹색 채소밭, 가금류 사육장, 대화형 학습 시설을 갖춘 활기찬 교육 농장입니다.분위기는 밝고 환영받으며 가족과 환경 애호가에게 이상적입니다.방문객들은 유기농업에 관한 워크숍에 참여하고, 농작물과 가금류를 탐험하고, 지속 가능한 농업 기술을 배우고, 농장에서 실습 경험을 즐길 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:17:26', '2026-04-05 11:17:26', NULL),
(111, 'attractions', 8, 'description', 7, 'AgriGold Farm Learning Center est une ferme éducative animée avec des parcelles de légumes verts, des zones avicoles et des installations d\'apprentissage interactives.L\'ambiance est joyeuse et accueillante, idéale pour les familles et les éco-passionnés.Les visiteurs peuvent participer à des ateliers sur l\'agriculture biologique, explorer les cultures et la volaille, apprendre des techniques d\'agriculture durable et vivre des expériences pratiques à la ferme.', 1, NULL, NULL, '2026-04-05 11:17:28', '2026-04-05 11:17:28', NULL),
(112, 'attractions', 8, 'description', 8, 'Das AgriGold Farm Learning Center ist ein lebendiger Lehrbauernhof mit grünen Gemüsebeeten, Geflügelbereichen und interaktiven Lerneinrichtungen.Die Atmosphäre ist fröhlich und einladend, ideal für Familien und Öko-Enthusiasten.Besucher können an Workshops zum ökologischen Landbau teilnehmen, Pflanzen und Geflügel erkunden, nachhaltige Landwirtschaftstechniken erlernen und praktische Erfahrungen auf dem Bauernhof machen.', 1, NULL, NULL, '2026-04-05 11:17:30', '2026-04-05 11:17:30', NULL),
(113, 'attractions', 9, 'name', 1, 'Largo Castillo Farmhouse', 1, NULL, NULL, '2026-04-05 11:17:30', '2026-04-05 11:17:30', NULL),
(114, 'attractions', 9, 'name', 2, 'Casa Rural Largo Castillo', 1, NULL, NULL, '2026-04-05 11:17:32', '2026-04-05 11:17:32', NULL),
(115, 'attractions', 9, 'name', 3, 'Largo Castillo Farmhouse', 1, NULL, NULL, '2026-04-05 11:17:34', '2026-04-05 11:17:34', NULL),
(116, 'attractions', 9, 'name', 5, 'ラルゴ カスティージョ ファームハウス', 1, NULL, NULL, '2026-04-05 11:17:36', '2026-04-05 11:17:36', NULL),
(117, 'attractions', 9, 'name', 6, '라르고 카스티요 농가', 1, NULL, NULL, '2026-04-05 11:17:37', '2026-04-05 11:17:37', NULL),
(118, 'attractions', 9, 'name', 7, 'Ferme Largo Castillo', 1, NULL, NULL, '2026-04-05 11:17:40', '2026-04-05 11:17:40', NULL),
(119, 'attractions', 9, 'name', 8, 'Largo Castillo Bauernhaus', 1, NULL, NULL, '2026-04-05 11:17:41', '2026-04-05 11:17:41', NULL),
(120, 'attractions', 9, 'description', 1, 'Largo Castillo Farmhouse is a rustic and eco-friendly farmhouse surrounded by open green fields and gardens. The atmosphere is calm and natural, ideal for relaxing and connecting with nature. Visitors can picnic, celebrate birthdays or small events, explore the grounds, and experience farm-to-table activities in a peaceful setting.', 1, NULL, NULL, '2026-04-05 11:17:41', '2026-04-05 11:17:41', NULL),
(121, 'attractions', 9, 'description', 2, 'Casa Rural Largo Castillo es una casa rural rústica y ecológica rodeada de campos y jardines verdes y abiertos.El ambiente es tranquilo y natural, ideal para relajarse y conectarse con la naturaleza.Los visitantes pueden hacer picnic, celebrar cumpleaños o pequeños eventos, explorar los terrenos y experimentar actividades de la granja a la mesa en un entorno tranquilo.', 1, NULL, NULL, '2026-04-05 11:17:43', '2026-04-05 11:17:43', NULL),
(122, 'attractions', 9, 'description', 3, 'Ang Largo Castillo Farmhouse ay isang rustic at eco-friendly na farmhouse na napapalibutan ng mga bukas na berdeng bukid at hardin.Ang kapaligiran ay kalmado at natural, perpekto para sa pagpapahinga at pagkonekta sa kalikasan.Maaaring magpiknik ang mga bisita, magdiwang ng mga kaarawan o maliliit na kaganapan, tuklasin ang bakuran, at maranasan ang mga farm-to-table na aktibidad sa isang mapayapang kapaligiran.', 1, NULL, NULL, '2026-04-05 11:17:44', '2026-04-05 11:17:44', NULL),
(123, 'attractions', 9, 'description', 5, 'Largo Castillo Farmhouseは、緑豊かな野原と庭園に囲まれた素朴で環境に優しいファームハウスです。落ち着いたナチュラルな雰囲気で、リラックスして自然と触れ合うのに最適です。訪問者は、静かな環境の中でピクニックをしたり、誕生日や小さなイベントを祝ったり、敷地内を探索したり、農場から食卓までのアクティビティを体験したりできます。', 1, NULL, NULL, '2026-04-05 11:17:46', '2026-04-05 11:17:46', NULL),
(124, 'attractions', 9, 'description', 6, 'Largo Castillo Farmhouse는 탁 트인 녹지와 정원으로 둘러싸인 소박하고 친환경적인 농가입니다.분위기는 조용하고 자연스러워 휴식을 취하고 자연과 소통하기에 이상적입니다.방문객들은 평화로운 환경에서 피크닉을 즐기고, 생일이나 작은 행사를 축하하고, 경내를 탐험하고, 농장에서 식탁까지의 활동을 경험할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:17:48', '2026-04-05 11:17:48', NULL),
(125, 'attractions', 9, 'description', 7, 'Largo Castillo Farmhouse est une ferme rustique et respectueuse de l\'environnement entourée de champs et de jardins verdoyants.L\'atmosphère est calme et naturelle, idéale pour se détendre et se connecter avec la nature.Les visiteurs peuvent pique-niquer, célébrer des anniversaires ou de petits événements, explorer le domaine et participer à des activités de la ferme à la table dans un cadre paisible.', 1, NULL, NULL, '2026-04-05 11:17:49', '2026-04-05 11:17:49', NULL),
(126, 'attractions', 9, 'description', 8, 'Das Largo Castillo Farmhouse ist ein rustikales und umweltfreundliches Bauernhaus, umgeben von offenen grünen Feldern und Gärten.Die Atmosphäre ist ruhig und natürlich, ideal zum Entspannen und zur Verbindung mit der Natur.Besucher können in einer ruhigen Umgebung picknicken, Geburtstage oder kleine Veranstaltungen feiern, das Gelände erkunden und Aktivitäten vom Bauernhof bis zum Tisch erleben.', 1, NULL, NULL, '2026-04-05 11:17:52', '2026-04-05 11:17:52', NULL),
(127, 'attractions', 10, 'name', 1, 'La Hacienda', 1, NULL, NULL, '2026-04-05 11:17:52', '2026-04-05 11:17:52', NULL),
(128, 'attractions', 10, 'name', 2, 'La Hacienda', 1, NULL, NULL, '2026-04-05 11:17:53', '2026-04-05 11:17:53', NULL),
(129, 'attractions', 10, 'name', 3, 'La Hacienda', 1, NULL, NULL, '2026-04-05 11:17:55', '2026-04-05 11:17:55', NULL),
(130, 'attractions', 10, 'name', 5, 'ラ・アシエンダ', 1, NULL, NULL, '2026-04-05 11:17:56', '2026-04-05 11:17:56', NULL),
(131, 'attractions', 10, 'name', 6, '라 하시엔다', 1, NULL, NULL, '2026-04-05 11:17:58', '2026-04-05 11:17:58', NULL),
(132, 'attractions', 10, 'name', 7, 'La Hacienda', 1, NULL, NULL, '2026-04-05 11:18:00', '2026-04-05 11:18:00', NULL),
(133, 'attractions', 10, 'name', 8, 'La Hacienda', 1, NULL, NULL, '2026-04-05 11:18:02', '2026-04-05 11:18:02', NULL),
(134, 'attractions', 10, 'description', 1, 'La Hacienda is a Balinese-inspired resort with elegant villas, tropical gardens, and a central pool. The ambiance is luxurious, serene, and peaceful, perfect for a quiet retreat. Guests can swim in the pool, stroll through gardens, stay in themed villas, and enjoy a relaxing, tropical escape in the countryside.', 1, NULL, NULL, '2026-04-05 11:18:02', '2026-04-05 11:18:02', NULL),
(135, 'attractions', 10, 'description', 2, 'La Hacienda es un resort de inspiración balinesa con elegantes villas, jardines tropicales y una piscina central.El ambiente es lujoso, sereno y pacífico, perfecto para un retiro tranquilo.Los huéspedes pueden nadar en la piscina, pasear por los jardines, alojarse en villas temáticas y disfrutar de una relajante escapada tropical en el campo.', 1, NULL, NULL, '2026-04-05 11:18:03', '2026-04-05 11:18:03', NULL),
(136, 'attractions', 10, 'description', 3, 'Ang La Hacienda ay isang Balinese-inspired na resort na may mga eleganteng villa, tropikal na hardin, at gitnang pool.Ang ambiance ay maluho, matahimik, at mapayapa, perpekto para sa isang tahimik na pag-urong.Maaaring lumangoy ang mga bisita sa pool, maglakad-lakad sa mga hardin, manatili sa mga villa na may temang, at tangkilikin ang nakakarelaks at tropikal na pagtakas sa kanayunan.', 1, NULL, NULL, '2026-04-05 11:18:05', '2026-04-05 11:18:05', NULL),
(137, 'attractions', 10, 'description', 5, 'ラ ハシエンダは、エレガントなヴィラ、トロピカル ガーデン、中央プールを備えたバリ風リゾートです。雰囲気は豪華で静かで平和で、静かな隠れ家に最適です。ゲストはプールで泳いだり、庭園を散歩したり、テーマのあるヴィラに滞在したり、田園地帯でリラックスしたトロピカルな休暇を楽しむことができます。', 1, NULL, NULL, '2026-04-05 11:18:06', '2026-04-05 11:18:06', NULL),
(138, 'attractions', 10, 'description', 6, 'La Hacienda는 우아한 빌라, 열대 정원, 중앙 수영장을 갖춘 발리풍 리조트입니다.분위기는 고급스럽고 고요하며 평화로워 조용한 휴양에 적합합니다.투숙객은 수영장에서 수영하고, 정원을 산책하고, 테마 빌라에 머물고, 시골에서 편안한 열대 휴가를 즐길 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:18:08', '2026-04-05 11:18:08', NULL),
(139, 'attractions', 10, 'description', 7, 'La Hacienda est un complexe d\'inspiration balinaise doté d\'élégantes villas, de jardins tropicaux et d\'une piscine centrale.L\'ambiance est luxueuse, sereine et paisible, parfaite pour une retraite tranquille.Vous pourrez nager dans la piscine, vous promener dans les jardins, séjourner dans des villas à thème et profiter d\'une escapade tropicale relaxante à la campagne.', 1, NULL, NULL, '2026-04-05 11:18:10', '2026-04-05 11:18:10', NULL),
(140, 'attractions', 10, 'description', 8, 'La Hacienda ist ein balinesisch inspiriertes Resort mit eleganten Villen, tropischen Gärten und einem zentralen Pool.Das Ambiente ist luxuriös, ruhig und friedlich, perfekt für einen ruhigen Rückzugsort.Gäste können im Pool schwimmen, durch die Gärten schlendern, in thematisch gestalteten Villen übernachten und einen erholsamen, tropischen Urlaub auf dem Land genießen.', 1, NULL, NULL, '2026-04-05 11:18:12', '2026-04-05 11:18:12', NULL),
(141, 'attractions', 11, 'name', 1, 'Naujan Agricultural Center', 1, NULL, NULL, '2026-04-05 11:18:12', '2026-04-05 11:18:12', NULL),
(142, 'attractions', 11, 'name', 2, 'Centro Agrícola Naujan', 1, NULL, NULL, '2026-04-05 11:18:13', '2026-04-05 11:18:13', NULL),
(143, 'attractions', 11, 'name', 3, 'Naujan Agricultural Center', 1, NULL, NULL, '2026-04-05 11:18:15', '2026-04-05 11:18:15', NULL),
(144, 'attractions', 11, 'name', 5, 'ナウジャン農業センター', 1, NULL, NULL, '2026-04-05 11:18:16', '2026-04-05 11:18:16', NULL),
(145, 'attractions', 11, 'name', 6, '나우잔 농업센터', 1, NULL, NULL, '2026-04-05 11:18:18', '2026-04-05 11:18:18', NULL),
(146, 'attractions', 11, 'name', 7, 'Centre Agricole de Naujan', 1, NULL, NULL, '2026-04-05 11:18:19', '2026-04-05 11:18:19', NULL),
(147, 'attractions', 11, 'name', 8, 'Landwirtschaftszentrum Naujan', 1, NULL, NULL, '2026-04-05 11:18:21', '2026-04-05 11:18:21', NULL),
(148, 'attractions', 11, 'description', 1, 'Naujan Agricultural Center is a modern farm and training facility with open fields, crop areas, and demonstration plots. The ambiance is productive, educational, and welcoming. Visitors can attend training programs, explore sustainable farming practices, observe crops, and learn modern agricultural techniques in a supportive environment.', 1, NULL, NULL, '2026-04-05 11:18:21', '2026-04-05 11:18:21', NULL),
(149, 'attractions', 11, 'description', 2, 'El Centro Agrícola Naujan es una granja moderna y una instalación de capacitación con campos abiertos, áreas de cultivo y parcelas de demostración.El ambiente es productivo, educativo y acogedor.Los visitantes pueden asistir a programas de capacitación, explorar prácticas agrícolas sostenibles, observar cultivos y aprender técnicas agrícolas modernas en un entorno de apoyo.', 1, NULL, NULL, '2026-04-05 11:18:23', '2026-04-05 11:18:23', NULL),
(150, 'attractions', 11, 'description', 3, 'Ang Naujan Agricultural Center ay isang modernong sakahan at pasilidad ng pagsasanay na may mga bukas na bukid, mga lugar ng pananim, at mga demonstration plot.Produktibo, pang-edukasyon, at nakakaengganyo ang ambiance.Ang mga bisita ay maaaring dumalo sa mga programa sa pagsasanay, galugarin ang napapanatiling mga kasanayan sa pagsasaka, mag-obserba ng mga pananim, at matuto ng mga makabagong pamamaraan ng agrikultura sa isang kapaligirang sumusuporta.', 1, NULL, NULL, '2026-04-05 11:18:25', '2026-04-05 11:18:25', NULL),
(151, 'attractions', 11, 'description', 5, 'ナウジャン農業センターは、オープンフィールド、作物エリア、実証区画を備えた近代的な農場および研修施設です。生産的で教育的で、歓迎的な雰囲気です。訪問者は、支援的な環境の中で研修プログラムに参加し、持続可能な農業実践を探求し、作物を観察し、最新の農業技術を学ぶことができます。', 1, NULL, NULL, '2026-04-05 11:18:26', '2026-04-05 11:18:26', NULL),
(152, 'attractions', 11, 'description', 6, '나우잔 농업 센터(Naujan Agricultural Center)는 개방된 들판, 농경지, 시범 부지를 갖춘 현대식 농장 및 훈련 시설입니다.분위기는 생산적이고 교육적이며 환영하는 분위기입니다.방문객들은 교육 프로그램에 참석하고, 지속 가능한 농업 관행을 탐구하고, 작물을 관찰하고, 지원적인 환경에서 현대 농업 기술을 배울 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:18:28', '2026-04-05 11:18:28', NULL),
(153, 'attractions', 11, 'description', 7, 'Le Centre Agricole de Naujan est une ferme moderne et un centre de formation avec des champs ouverts, des zones de culture et des parcelles de démonstration.L\'ambiance est productive, éducative et accueillante.Les visiteurs peuvent assister à des programmes de formation, explorer des pratiques agricoles durables, observer les cultures et apprendre des techniques agricoles modernes dans un environnement favorable.', 1, NULL, NULL, '2026-04-05 11:18:30', '2026-04-05 11:18:30', NULL),
(154, 'attractions', 11, 'description', 8, 'Das Naujan Agricultural Center ist ein moderner Bauernhof und eine Ausbildungseinrichtung mit offenen Feldern, Anbauflächen und Demonstrationsflächen.Die Atmosphäre ist produktiv, lehrreich und einladend.Besucher können an Schulungsprogrammen teilnehmen, nachhaltige landwirtschaftliche Praktiken erkunden, Nutzpflanzen beobachten und moderne landwirtschaftliche Techniken in einer unterstützenden Umgebung erlernen.', 1, NULL, NULL, '2026-04-05 11:18:33', '2026-04-05 11:18:33', NULL),
(155, 'attractions', 12, 'name', 1, 'Mulawin Boulevard', 1, NULL, NULL, '2026-04-05 11:18:33', '2026-04-05 11:18:33', NULL),
(156, 'attractions', 12, 'name', 2, 'Bulevar Mulawin', 1, NULL, NULL, '2026-04-05 11:18:35', '2026-04-05 11:18:35', NULL),
(157, 'attractions', 12, 'name', 3, 'Mulawin Boulevard', 1, NULL, NULL, '2026-04-05 11:18:36', '2026-04-05 11:18:36', NULL),
(158, 'attractions', 12, 'name', 5, 'ムラウィン大通り', 1, NULL, NULL, '2026-04-05 11:18:38', '2026-04-05 11:18:38', NULL),
(159, 'attractions', 12, 'name', 6, '물라윈 대로', 1, NULL, NULL, '2026-04-05 11:18:40', '2026-04-05 11:18:40', NULL),
(160, 'attractions', 12, 'name', 7, 'Boulevard Mulawin', 1, NULL, NULL, '2026-04-05 11:18:42', '2026-04-05 11:18:42', NULL),
(161, 'attractions', 12, 'name', 8, 'Mulawin Boulevard', 1, NULL, NULL, '2026-04-05 11:18:44', '2026-04-05 11:18:44', NULL),
(162, 'attractions', 12, 'description', 1, 'Mulawin Boulevard is a scenic road lined with trees and connecting neighborhoods, showing the growth of the town. The ambiance is calm, modern, and welcoming. Visitors can walk, bike, take photos, and observe daily local life while enjoying the open space.', 1, NULL, NULL, '2026-04-05 11:18:44', '2026-04-05 11:18:44', NULL),
(163, 'attractions', 12, 'description', 2, 'Mulawin Boulevard es una calle panorámica bordeada de árboles y que conecta vecindarios, lo que muestra el crecimiento de la ciudad.El ambiente es tranquilo, moderno y acogedor.Los visitantes pueden caminar, andar en bicicleta, tomar fotografías y observar la vida local diaria mientras disfrutan del espacio abierto.', 1, NULL, NULL, '2026-04-05 11:18:45', '2026-04-05 11:18:45', NULL),
(164, 'attractions', 12, 'description', 3, 'Ang Mulawin Boulevard ay isang magandang kalsada na may linya na may mga puno at nagdudugtong sa mga kapitbahayan, na nagpapakita ng paglago ng bayan.Kalmado, moderno, at nakakaengganyo ang ambiance.Ang mga bisita ay maaaring maglakad, magbisikleta, kumuha ng litrato, at mag-obserba ng pang-araw-araw na lokal na buhay habang tinatamasa ang open space.', 1, NULL, NULL, '2026-04-05 11:18:47', '2026-04-05 11:18:47', NULL),
(165, 'attractions', 12, 'description', 5, 'ムラウィン大通りは、街の成長を示す、木々が立ち並ぶ美しい道路で、近隣地域を結んでいます。雰囲気は落ち着いていて、モダンで、居心地が良いです。訪問者は、オープンスペースを楽しみながら、歩いたり、自転車に乗ったり、写真を撮ったり、地元の日常生活を観察したりできます。', 1, NULL, NULL, '2026-04-05 11:18:50', '2026-04-05 11:18:50', NULL),
(166, 'attractions', 12, 'description', 6, 'Mulawin Boulevard는 나무가 늘어서 있고 동네를 연결하는 경치 좋은 도로로, 마을의 성장을 보여줍니다.분위기는 차분하고 현대적이며 환영하는 분위기입니다.방문객들은 열린 공간을 즐기면서 걷기, 자전거 타기, 사진 촬영 등 현지 생활을 관찰할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:18:52', '2026-04-05 11:18:52', NULL),
(167, 'attractions', 12, 'description', 7, 'Le boulevard Mulawin est une route panoramique bordée d\'arbres et reliant les quartiers, témoignant de la croissance de la ville.L\'ambiance est calme, moderne et accueillante.Les visiteurs peuvent marcher, faire du vélo, prendre des photos et observer la vie locale quotidienne tout en profitant de l\'espace ouvert.', 1, NULL, NULL, '2026-04-05 11:18:53', '2026-04-05 11:18:53', NULL),
(168, 'attractions', 12, 'description', 8, 'Der Mulawin Boulevard ist eine malerische, von Bäumen gesäumte Straße, die Stadtteile miteinander verbindet und das Wachstum der Stadt zeigt.Das Ambiente ist ruhig, modern und einladend.Besucher können spazieren gehen, Fahrrad fahren, Fotos machen und das tägliche Leben vor Ort beobachten, während sie den offenen Raum genießen.', 1, NULL, NULL, '2026-04-05 11:18:55', '2026-04-05 11:18:55', NULL),
(169, 'attractions', 13, 'name', 1, 'Rio del Sierra', 1, NULL, NULL, '2026-04-05 11:18:55', '2026-04-05 11:18:55', NULL),
(170, 'attractions', 13, 'name', 2, 'Río de la Sierra', 1, NULL, NULL, '2026-04-05 11:18:59', '2026-04-05 11:18:59', NULL),
(171, 'attractions', 13, 'name', 3, 'Rio del Sierra', 1, NULL, NULL, '2026-04-05 11:19:00', '2026-04-05 11:19:00', NULL),
(172, 'attractions', 13, 'name', 5, 'リオ・デル・シエラ', 1, NULL, NULL, '2026-04-05 11:19:02', '2026-04-05 11:19:02', NULL),
(173, 'attractions', 13, 'name', 6, '리오 델 시에라', 1, NULL, NULL, '2026-04-05 11:19:04', '2026-04-05 11:19:04', NULL),
(174, 'attractions', 13, 'name', 7, 'Río de la Sierra', 1, NULL, NULL, '2026-04-05 11:19:06', '2026-04-05 11:19:06', NULL),
(175, 'attractions', 13, 'name', 8, 'Rio del Sierra', 1, NULL, NULL, '2026-04-05 11:19:07', '2026-04-05 11:19:07', NULL),
(176, 'attractions', 13, 'description', 1, 'Rio del Sierra is a hidden riverside with cold, refreshing waters, native kubo huts, and mountain views. The ambiance is raw, natural, and soothing. Visitors can swim in the river, relax in huts, picnic, and enjoy the sounds of flowing water in a peaceful environment.', 1, NULL, NULL, '2026-04-05 11:19:07', '2026-04-05 11:19:07', NULL),
(177, 'attractions', 13, 'description', 2, 'Río del Sierra es una ribera escondida con aguas frías y refrescantes, cabañas kubo nativas y vistas a las montañas.El ambiente es crudo, natural y relajante.Los visitantes pueden nadar en el río, relajarse en cabañas, hacer un picnic y disfrutar del sonido del agua que fluye en un ambiente tranquilo.', 1, NULL, NULL, '2026-04-05 11:19:09', '2026-04-05 11:19:09', NULL),
(178, 'attractions', 13, 'description', 3, 'Ang Rio del Sierra ay isang nakatagong tabing ilog na may malamig, nakakapreskong tubig, mga kubo ng katutubong kubo, at mga tanawin ng bundok.Ang ambiance ay hilaw, natural, at nakapapawing pagod.Ang mga bisita ay maaaring lumangoy sa ilog, mamahinga sa mga kubo, piknik, at tamasahin ang mga tunog ng umaagos na tubig sa isang mapayapang kapaligiran.', 1, NULL, NULL, '2026-04-05 11:19:11', '2026-04-05 11:19:11', NULL),
(179, 'attractions', 13, 'description', 5, 'リオ デル シエラは、冷たくさわやかな水、地元のクボ小屋、山の景色が広がる隠れた川沿いです。雰囲気は生々しく、自然で、心地よいです。訪問者は、静かな環境の中で川で泳いだり、小屋でリラックスしたり、ピクニックをしたり、水の流れる音を楽しんだりできます。', 1, NULL, NULL, '2026-04-05 11:19:13', '2026-04-05 11:19:13', NULL),
(180, 'attractions', 13, 'description', 6, '리오 델 시에라(Rio del Sierra)는 차갑고 상쾌한 물, 토종 쿠보 오두막, 산의 전망을 갖춘 숨겨진 강변입니다.분위기는 생생하고 자연스럽고 차분합니다.방문객들은 강에서 수영을 하고, 오두막에서 휴식을 취하고, 피크닉을 즐기고, 평화로운 환경에서 흐르는 물소리를 즐길 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:19:15', '2026-04-05 11:19:15', NULL),
(181, 'attractions', 13, 'description', 7, 'Rio del Sierra est une rivière cachée avec des eaux froides et rafraîchissantes, des huttes kubo indigènes et des vues sur les montagnes.L\'ambiance est brute, naturelle et apaisante.Les visiteurs peuvent se baigner dans la rivière, se détendre dans des cabanes, pique-niquer et profiter du bruit de l\'eau qui coule dans un environnement paisible.', 1, NULL, NULL, '2026-04-05 11:19:17', '2026-04-05 11:19:17', NULL),
(182, 'attractions', 13, 'description', 8, 'Rio del Sierra ist ein versteckter Flussufer mit kaltem, erfrischendem Wasser, einheimischen Kubo-Hütten und Bergblick.Die Atmosphäre ist roh, natürlich und beruhigend.Besucher können im Fluss schwimmen, in Hütten entspannen, ein Picknick machen und die Geräusche des fließenden Wassers in einer ruhigen Umgebung genießen.', 1, NULL, NULL, '2026-04-05 11:19:19', '2026-04-05 11:19:19', NULL),
(183, 'attractions', 14, 'name', 1, 'DJMV Organic Healing Park', 1, NULL, NULL, '2026-04-05 11:19:19', '2026-04-05 11:19:19', NULL);
INSERT INTO `translations` (`id`, `original_table`, `original_id`, `field_name`, `language_id`, `translated_value`, `is_approved`, `created_by`, `approved_by`, `created_at`, `updated_at`, `approved_at`) VALUES
(184, 'attractions', 14, 'name', 2, 'Parque de curación orgánica DJMV', 1, NULL, NULL, '2026-04-05 11:19:20', '2026-04-05 11:19:20', NULL),
(185, 'attractions', 14, 'name', 3, 'DJMV Organic Healing Park', 1, NULL, NULL, '2026-04-05 11:19:22', '2026-04-05 11:19:22', NULL),
(186, 'attractions', 14, 'name', 5, 'DJMV オーガニック ヒーリング パーク', 1, NULL, NULL, '2026-04-05 11:19:24', '2026-04-05 11:19:24', NULL),
(187, 'attractions', 14, 'name', 6, 'DJMV 오가닉 힐링파크', 1, NULL, NULL, '2026-04-05 11:19:25', '2026-04-05 11:19:25', NULL),
(188, 'attractions', 14, 'name', 7, 'Parc de guérison biologique DJMV', 1, NULL, NULL, '2026-04-05 11:19:27', '2026-04-05 11:19:27', NULL),
(189, 'attractions', 14, 'name', 8, 'DJMV Bio-Heilpark', 1, NULL, NULL, '2026-04-05 11:19:29', '2026-04-05 11:19:29', NULL),
(190, 'attractions', 14, 'description', 1, ' DJMV Organic Healing Park is an eco-friendly farm filled with lush greenery, chemical-free crops, and tranquil spaces designed for wellness. The ambiance is calming, refreshing, and restorative. Visitors can stroll through the gardens, learn about sustainable organic farming, enjoy peaceful nature walks, and experience a healthy, relaxing environment that soothes the mind and body.', 1, NULL, NULL, '2026-04-05 11:19:29', '2026-04-05 11:19:29', NULL),
(191, 'attractions', 14, 'description', 2, 'DJMV Organic Healing Park es una granja ecológica llena de exuberante vegetación, cultivos libres de químicos y espacios tranquilos diseñados para el bienestar.El ambiente es calmante, refrescante y reconstituyente.Los visitantes pueden pasear por los jardines, aprender sobre la agricultura orgánica sostenible, disfrutar de tranquilos paseos por la naturaleza y experimentar un ambiente saludable y relajante que calma la mente y el cuerpo.', 1, NULL, NULL, '2026-04-05 11:19:30', '2026-04-05 11:19:30', NULL),
(192, 'attractions', 14, 'description', 3, 'Ang DJMV Organic Healing Park ay isang eco-friendly na sakahan na puno ng luntiang halaman, mga pananim na walang kemikal, at mga tahimik na espasyo na idinisenyo para sa kagalingan.Ang ambiance ay calming, refreshing, at restorative.Maaaring maglakad-lakad ang mga bisita sa mga hardin, matuto tungkol sa napapanatiling organikong pagsasaka, mag-enjoy sa mapayapang paglalakad sa kalikasan, at makaranas ng malusog at nakakarelaks na kapaligiran na nagpapaginhawa sa isip at katawan.', 1, NULL, NULL, '2026-04-05 11:19:32', '2026-04-05 11:19:32', NULL),
(193, 'attractions', 14, 'description', 5, 'DJMV オーガニック ヒーリング パークは、豊かな緑、化学物質を使用していない作物、健康のために設計された静かな空間で満たされた環境に優しい農場です。雰囲気は落ち着いていて、さわやかで、元気を与えてくれます。訪問者は庭園を散策し、持続可能な有機農業について学び、穏やかな自然散策を楽しみ、心と体を癒す健康的でリラックスできる環境を体験することができます。', 1, NULL, NULL, '2026-04-05 11:19:35', '2026-04-05 11:19:35', NULL),
(194, 'attractions', 14, 'description', 6, 'DJMV 오가닉 힐링파크는 푸르른 녹지와 무농약 작물, 웰니스를 위한 고요한 공간을 갖춘 친환경 농장입니다.분위기는 차분하고 상쾌하며 회복력이 있습니다.방문객들은 정원을 산책하고, 지속 가능한 유기농업에 대해 배우고, 평화로운 자연 산책을 즐기고, 몸과 마음을 진정시키는 건강하고 편안한 환경을 경험할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:19:37', '2026-04-05 11:19:37', NULL),
(195, 'attractions', 14, 'description', 7, 'DJMV Organic Healing Park est une ferme écologique remplie de verdure luxuriante, de cultures sans produits chimiques et d\'espaces tranquilles conçus pour le bien-être.L\'ambiance est apaisante, rafraîchissante et réparatrice.Les visiteurs peuvent se promener dans les jardins, en apprendre davantage sur l\'agriculture biologique durable, profiter de promenades paisibles dans la nature et découvrir un environnement sain et relaxant qui apaise l\'esprit et le corps.', 1, NULL, NULL, '2026-04-05 11:19:39', '2026-04-05 11:19:39', NULL),
(196, 'attractions', 14, 'description', 8, 'Der DJMV Organic Healing Park ist ein umweltfreundlicher Bauernhof mit üppigem Grün, chemiefreiem Anbau und ruhigen, zum Wohlfühlen gestalteten Räumen.Die Atmosphäre ist beruhigend, erfrischend und erholsam.Besucher können durch die Gärten schlendern, etwas über nachhaltigen ökologischen Landbau erfahren, friedliche Spaziergänge in der Natur unternehmen und eine gesunde, entspannende Umgebung erleben, die Geist und Körper beruhigt.', 1, NULL, NULL, '2026-04-05 11:19:41', '2026-04-05 11:19:41', NULL),
(197, 'attractions', 15, 'name', 1, 'Karacha Falls', 1, NULL, NULL, '2026-04-05 11:19:41', '2026-04-05 11:19:41', NULL),
(198, 'attractions', 15, 'name', 2, 'Cataratas de Karacha', 1, NULL, NULL, '2026-04-05 11:19:42', '2026-04-05 11:19:42', NULL),
(199, 'attractions', 15, 'name', 3, 'Karacha Falls', 1, NULL, NULL, '2026-04-05 11:19:43', '2026-04-05 11:19:43', NULL),
(200, 'attractions', 15, 'name', 5, 'カラチャ滝', 1, NULL, NULL, '2026-04-05 11:19:46', '2026-04-05 11:19:46', NULL),
(201, 'attractions', 15, 'name', 6, '카라차 폭포', 1, NULL, NULL, '2026-04-05 11:19:47', '2026-04-05 11:19:47', NULL),
(202, 'attractions', 15, 'name', 7, 'Chutes de Karacha', 1, NULL, NULL, '2026-04-05 11:19:50', '2026-04-05 11:19:50', NULL),
(203, 'attractions', 15, 'name', 8, 'Karatscha-Wasserfälle', 1, NULL, NULL, '2026-04-05 11:19:52', '2026-04-05 11:19:52', NULL),
(204, 'attractions', 15, 'description', 1, ' Karacha Falls is a majestic waterfall surrounded by forested hills, with strong cascading waters and a deep pool at the base. The ambiance is adventurous, natural, and invigorating. Visitors can trek off-road trails, swim in the refreshing pool, explore the surrounding forest, and take photos of the scenic waterfall.', 1, NULL, NULL, '2026-04-05 11:19:52', '2026-04-05 11:19:52', NULL),
(205, 'attractions', 15, 'description', 2, 'Las cataratas Karacha son una majestuosa cascada rodeada de colinas boscosas, con fuertes aguas en cascada y una piscina profunda en la base.El ambiente es aventurero, natural y estimulante.Los visitantes pueden recorrer senderos todo terreno, nadar en la refrescante piscina, explorar el bosque circundante y tomar fotografías de la pintoresca cascada.', 1, NULL, NULL, '2026-04-05 11:19:54', '2026-04-05 11:19:54', NULL),
(206, 'attractions', 15, 'description', 3, 'Ang Karacha Falls ay isang kahanga-hangang talon na napapalibutan ng mga kagubatan na burol, na may malakas na cascading water at malalim na pool sa base.Ang ambiance ay adventurous, natural, at nakapagpapalakas.Maaaring maglakbay ang mga bisita sa mga off-road trail, lumangoy sa nakakapreskong pool, galugarin ang nakapalibot na kagubatan, at kumuha ng mga larawan ng magandang talon.', 1, NULL, NULL, '2026-04-05 11:19:55', '2026-04-05 11:19:55', NULL),
(207, 'attractions', 15, 'description', 5, 'カラチャ滝は、森林に覆われた丘に囲まれた雄大な滝で、滝のように勢いよく流れ落ち、ふもとには深い淵があります。雰囲気は冒険的で、自然で、爽快です。訪問者はオフロードトレイルをトレッキングしたり、爽やかなプールで泳いだり、周囲の森林を探索したり、美しい滝の写真を撮ったりすることができます。', 1, NULL, NULL, '2026-04-05 11:19:57', '2026-04-05 11:19:57', NULL),
(208, 'attractions', 15, 'description', 6, '카라차 폭포(Karacha Falls)는 숲이 우거진 언덕으로 둘러싸인 장엄한 폭포로, 강한 계단식 물과 바닥에 깊은 웅덩이가 있습니다.분위기는 모험적이고 자연스러우며 활력이 넘칩니다.방문객들은 오프로드 트레일을 트레킹하고, 상쾌한 수영장에서 수영하고, 주변 숲을 탐험하고, 아름다운 폭포에서 사진을 찍을 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:19:58', '2026-04-05 11:19:58', NULL),
(209, 'attractions', 15, 'description', 7, 'Les chutes de Karacha sont une cascade majestueuse entourée de collines boisées, avec de fortes eaux en cascade et un bassin profond à la base.L\'ambiance est aventureuse, naturelle et revigorante.Les visiteurs peuvent parcourir des sentiers hors route, nager dans la piscine rafraîchissante, explorer la forêt environnante et prendre des photos de la cascade pittoresque.', 1, NULL, NULL, '2026-04-05 11:20:00', '2026-04-05 11:20:00', NULL),
(210, 'attractions', 15, 'description', 8, 'Karacha Falls ist ein majestätischer Wasserfall, der von bewaldeten Hügeln umgeben ist, mit starken Wasserfällen und einem tiefen Becken am Fuß.Das Ambiente ist abenteuerlich, natürlich und belebend.Besucher können abseits der Straße wandern, im erfrischenden Pool schwimmen, den umliegenden Wald erkunden und Fotos vom malerischen Wasserfall machen.', 1, NULL, NULL, '2026-04-05 11:20:02', '2026-04-05 11:20:02', NULL),
(211, 'attractions', 16, 'name', 1, 'ORIC sa Bathala Waterfalls', 1, NULL, NULL, '2026-04-05 11:20:02', '2026-04-05 11:20:02', NULL),
(212, 'attractions', 16, 'name', 2, 'ORIC en las cascadas de Bathala', 1, NULL, NULL, '2026-04-05 11:20:05', '2026-04-05 11:20:05', NULL),
(213, 'attractions', 16, 'name', 3, 'ORIC sa Bathala Waterfalls', 1, NULL, NULL, '2026-04-05 11:20:07', '2026-04-05 11:20:07', NULL),
(214, 'attractions', 16, 'name', 5, 'ORIC サ バタラ滝', 1, NULL, NULL, '2026-04-05 11:20:09', '2026-04-05 11:20:09', NULL),
(215, 'attractions', 16, 'name', 6, 'ORIC 사 바탈라 폭포', 1, NULL, NULL, '2026-04-05 11:20:11', '2026-04-05 11:20:11', NULL),
(216, 'attractions', 16, 'name', 7, 'ORIC dans les cascades de Bathala', 1, NULL, NULL, '2026-04-05 11:20:13', '2026-04-05 11:20:13', NULL),
(217, 'attractions', 16, 'name', 8, 'ORIC mit den Bathala-Wasserfällen', 1, NULL, NULL, '2026-04-05 11:20:15', '2026-04-05 11:20:15', NULL),
(218, 'attractions', 16, 'description', 1, '\nORIC sa Bathala Waterfalls is an emerging eco-tourism destination with a thrilling hanging bridge and horseback access to the falls. The ambiance is exciting, scenic, and adventurous. Guests can cross the hanging bridge, ride horses to the falls, swim in cool waters, and explore the untouched natural beauty of Naujan.\n', 1, NULL, NULL, '2026-04-05 11:20:15', '2026-04-05 11:20:15', NULL),
(219, 'attractions', 16, 'description', 2, 'ORIC sa Bathala Waterfalls es un destino de ecoturismo emergente con un emocionante puente colgante y acceso a caballo a las cataratas.El ambiente es emocionante, pintoresco y aventurero.Los huéspedes pueden cruzar el puente colgante, montar a caballo hasta las cataratas, nadar en aguas frescas y explorar la belleza natural intacta de Naujan.', 1, NULL, NULL, '2026-04-05 11:20:17', '2026-04-05 11:20:17', NULL),
(220, 'attractions', 16, 'description', 3, 'Ang ORIC sa Bathala Waterfalls ay isang umuusbong na eco-tourism na destinasyon na may kapanapanabik na hanging bridge at horseback access sa talon.Ang ambiance ay exciting, scenic, at adventurous.Maaaring tumawid ang mga bisita sa hanging bridge, sumakay ng mga kabayo patungo sa talon, lumangoy sa malamig na tubig, at tuklasin ang hindi nagalaw na natural na kagandahan ng Naujan.', 1, NULL, NULL, '2026-04-05 11:20:19', '2026-04-05 11:20:19', NULL),
(221, 'attractions', 16, 'description', 5, 'ORIC サ バタラ滝は、スリル満点の吊り橋と馬に乗って滝にアクセスできる、新興のエコツーリズムの目的地です。雰囲気は刺激的で、風光明媚で、冒険的なものです。滞在中は、吊り橋を渡ったり、馬に乗って滝まで行ったり、冷たい水で泳いだり、ナウジャンの手つかずの自然の美しさを探索したりできます。', 1, NULL, NULL, '2026-04-05 11:20:20', '2026-04-05 11:20:20', NULL),
(222, 'attractions', 16, 'description', 6, 'ORIC 사 바탈라 폭포(ORIC sa Bathala Waterfalls)는 스릴 넘치는 현수교와 말을 타고 폭포까지 갈 수 있는 신흥 생태 관광 명소입니다.분위기는 흥미롭고 경치가 좋으며 모험적입니다.손님들은 현수교를 건너고, 말을 타고 폭포까지 가고, 시원한 물에서 수영을 하고, 손길이 닿지 않은 나우잔의 자연의 아름다움을 탐험할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:20:22', '2026-04-05 11:20:22', NULL),
(223, 'attractions', 16, 'description', 7, 'ORIC sa Bathala Waterfalls est une destination écotouristique émergente avec un pont suspendu passionnant et un accès à cheval aux chutes.L\'ambiance est excitante, pittoresque et aventureuse.Les clients peuvent traverser le pont suspendu, monter à cheval jusqu\'aux chutes, nager dans les eaux fraîches et explorer la beauté naturelle intacte de Naujan.', 1, NULL, NULL, '2026-04-05 11:20:23', '2026-04-05 11:20:23', NULL),
(224, 'attractions', 16, 'description', 8, 'ORIC sa Bathala Waterfalls ist ein aufstrebendes Reiseziel für Ökotourismus mit einer aufregenden Hängebrücke und Zugang zu den Wasserfällen zu Pferd.Die Atmosphäre ist aufregend, malerisch und abenteuerlich.Gäste können die Hängebrücke überqueren, zu den Wasserfällen reiten, im kühlen Wasser schwimmen und die unberührte Naturschönheit von Naujan erkunden.', 1, NULL, NULL, '2026-04-05 11:20:26', '2026-04-05 11:20:26', NULL),
(225, 'attractions', 17, 'name', 1, 'Bahay Tuklasan Plenary Hall', 1, NULL, NULL, '2026-04-05 11:20:26', '2026-04-05 11:20:26', NULL),
(226, 'attractions', 17, 'name', 2, 'Salón de Plenos Bahay Tuklasan', 1, NULL, NULL, '2026-04-05 11:20:27', '2026-04-05 11:20:27', NULL),
(227, 'attractions', 17, 'name', 3, 'Bahay Tuklasan Plenary Hall', 1, NULL, NULL, '2026-04-05 11:20:28', '2026-04-05 11:20:28', NULL),
(228, 'attractions', 17, 'name', 5, 'バハイ トゥクラサン プレナリー ホール', 1, NULL, NULL, '2026-04-05 11:20:31', '2026-04-05 11:20:31', NULL),
(229, 'attractions', 17, 'name', 6, '바하이 투클라산 총회 홀', 1, NULL, NULL, '2026-04-05 11:20:32', '2026-04-05 11:20:32', NULL),
(230, 'attractions', 17, 'name', 7, 'Salle plénière Bahay Tuklasan', 1, NULL, NULL, '2026-04-05 11:20:34', '2026-04-05 11:20:34', NULL),
(231, 'attractions', 17, 'name', 8, 'Plenarsaal Bahay Tuklasan', 1, NULL, NULL, '2026-04-05 11:20:36', '2026-04-05 11:20:36', NULL),
(232, 'attractions', 17, 'description', 1, 'Bahay Tuklasan Plenary Hall is a spacious venue for trainings, conferences, and community gatherings, surrounded by organized grounds. The ambiance is professional, accessible, and engaging. Visitors can attend seminars, workshops, and agricultural congresses, or participate in local government and community programs.', 1, NULL, NULL, '2026-04-05 11:20:36', '2026-04-05 11:20:36', NULL),
(233, 'attractions', 17, 'description', 2, 'La Sala Plenaria Bahay Tuklasan es un lugar espacioso para capacitaciones, conferencias y reuniones comunitarias, rodeado de terrenos organizados.El ambiente es profesional, accesible y atractivo.Los visitantes pueden asistir a seminarios, talleres y congresos agrícolas, o participar en programas comunitarios y del gobierno local.', 1, NULL, NULL, '2026-04-05 11:20:38', '2026-04-05 11:20:38', NULL),
(234, 'attractions', 17, 'description', 3, 'Ang Bahay Tuklasan Plenary Hall ay isang maluwag na lugar para sa mga pagsasanay, kumperensya, at pagtitipon ng komunidad, na napapalibutan ng mga organisadong lugar.Ang ambiance ay propesyonal, naa-access, at nakakaengganyo.Maaaring dumalo ang mga bisita sa mga seminar, workshop, at agricultural congresses, o lumahok sa mga programa ng lokal na pamahalaan at komunidad.', 1, NULL, NULL, '2026-04-05 11:20:40', '2026-04-05 11:20:40', NULL),
(235, 'attractions', 17, 'description', 5, 'バハイ トゥクラサン プレナリー ホールは、整然とした敷地に囲まれた、研修、会議、コミュニティの集まりのための広々とした会場です。雰囲気はプロフェッショナルで、アクセスしやすく、魅力的です。訪問者は、セミナー、ワークショップ、農業会議に参加したり、地方自治体や地域社会のプログラムに参加したりできます。', 1, NULL, NULL, '2026-04-05 11:20:41', '2026-04-05 11:20:41', NULL),
(236, 'attractions', 17, 'description', 6, 'Bahay Tuklasan Plenary Hall은 훈련, 회의, 지역사회 모임을 위한 넓은 장소로, 잘 정돈된 부지로 둘러싸여 있습니다.분위기는 전문적이고 접근하기 쉽고 매력적입니다.방문객들은 세미나, 워크숍, 농업 회의에 참석하거나 지방 정부 및 지역 사회 프로그램에 참여할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:20:43', '2026-04-05 11:20:43', NULL),
(237, 'attractions', 17, 'description', 7, 'La salle plénière Bahay Tuklasan est un lieu spacieux pour les formations, les conférences et les rassemblements communautaires, entouré de terrains aménagés.L\'ambiance est professionnelle, accessible et engageante.Les visiteurs peuvent assister à des séminaires, des ateliers et des congrès agricoles, ou participer aux programmes du gouvernement local et de la communauté.', 1, NULL, NULL, '2026-04-05 11:20:45', '2026-04-05 11:20:45', NULL),
(238, 'attractions', 17, 'description', 8, 'Der Plenarsaal Bahay Tuklasan ist ein geräumiger Veranstaltungsort für Schulungen, Konferenzen und Gemeindetreffen, umgeben von einem organisierten Gelände.Das Ambiente ist professionell, zugänglich und ansprechend.Besucher können an Seminaren, Workshops und Agrarkongressen teilnehmen oder an lokalen Regierungs- und Gemeindeprogrammen teilnehmen.', 1, NULL, NULL, '2026-04-05 11:20:47', '2026-04-05 11:20:47', NULL),
(239, 'attractions', 18, 'name', 1, 'Bahay Tuklasan Dormitory', 1, NULL, NULL, '2026-04-05 11:20:47', '2026-04-05 11:20:47', NULL),
(240, 'attractions', 18, 'name', 2, 'Dormitorio Bahay Tuklasan', 1, NULL, NULL, '2026-04-05 11:20:48', '2026-04-05 11:20:48', NULL),
(241, 'attractions', 18, 'name', 3, 'Bahay Tuklasan Dormitoryo', 1, NULL, NULL, '2026-04-05 11:20:49', '2026-04-05 11:20:49', NULL),
(242, 'attractions', 18, 'name', 5, 'バハイ トゥクラサン ドミトリー', 1, NULL, NULL, '2026-04-05 11:20:51', '2026-04-05 11:20:51', NULL),
(243, 'attractions', 18, 'name', 6, '바하이 투클라산 기숙사', 1, NULL, NULL, '2026-04-05 11:20:53', '2026-04-05 11:20:53', NULL),
(244, 'attractions', 18, 'name', 7, 'Dortoir Bahay Tuklasan', 1, NULL, NULL, '2026-04-05 11:20:54', '2026-04-05 11:20:54', NULL),
(245, 'attractions', 18, 'name', 8, 'Bahay Tuklasan-Schlafsaal', 1, NULL, NULL, '2026-04-05 11:20:57', '2026-04-05 11:20:57', NULL),
(246, 'attractions', 18, 'description', 1, 'Bahay Tuklasan Dormitory offers clean, practical shared accommodations for students, volunteers, and groups. The ambiance is simple, functional, and communal. Guests can stay overnight, prepare meals, rest comfortably, and easily access nearby training and agricultural facilities.', 1, NULL, NULL, '2026-04-05 11:20:57', '2026-04-05 11:20:57', NULL),
(247, 'attractions', 18, 'description', 2, 'Bahay Tuklasan Dormitory ofrece alojamiento compartido limpio y práctico para estudiantes, voluntarios y grupos.El ambiente es simple, funcional y comunitario.Los huéspedes pueden pasar la noche, preparar comidas, descansar cómodamente y acceder fácilmente a las instalaciones agrícolas y de capacitación cercanas.', 1, NULL, NULL, '2026-04-05 11:20:58', '2026-04-05 11:20:58', NULL),
(248, 'attractions', 18, 'description', 3, 'Nag-aalok ang Bahay Tuklasan Dormitory ng malinis, praktikal na shared accommodation para sa mga estudyante, boluntaryo, at grupo.Simple, functional, at communal ang ambiance.Maaaring mag-overnight ang mga bisita, maghanda ng mga pagkain, magpahinga nang kumportable, at madaling ma-access ang kalapit na mga pasilidad sa pagsasanay at agrikultura.', 1, NULL, NULL, '2026-04-05 11:21:01', '2026-04-05 11:21:01', NULL),
(249, 'attractions', 18, 'description', 5, 'Bahay Tuklasan Dormitory は、学生、ボランティア、グループ向けに清潔で実用的な共同宿泊施設を提供します。シンプルで機能的、そして共同的な雰囲気です。ゲストは一晩滞在し、食事を準備し、快適に休むことができ、近くのトレーニング施設や農業施設にも簡単にアクセスできます。', 1, NULL, NULL, '2026-04-05 11:21:02', '2026-04-05 11:21:02', NULL),
(250, 'attractions', 18, 'description', 6, 'Bahay Tuklasan Dormitory는 학생, 자원봉사자, 단체를 위한 깨끗하고 실용적인 공유 숙소를 제공합니다.분위기는 단순하고 기능적이며 공동체적입니다.투숙객은 숙박을 하고, 식사를 준비하고, 편안하게 휴식을 취할 수 있으며, 인근 훈련 및 농업 시설을 쉽게 이용할 수 있습니다.', 1, NULL, NULL, '2026-04-05 11:21:05', '2026-04-05 11:21:05', NULL),
(251, 'attractions', 18, 'description', 7, 'Le dortoir Bahay Tuklasan propose des logements partagés propres et pratiques pour les étudiants, les bénévoles et les groupes.L\'ambiance est simple, fonctionnelle et communautaire.Les clients peuvent passer la nuit, préparer leurs repas, se reposer confortablement et accéder facilement aux installations de formation et agricoles à proximité.', 1, NULL, NULL, '2026-04-05 11:21:07', '2026-04-05 11:21:07', NULL),
(252, 'attractions', 18, 'description', 8, 'Das Bahay Tuklasan Dormitory bietet saubere, praktische Gemeinschaftsunterkünfte für Studenten, Freiwillige und Gruppen.Das Ambiente ist einfach, funktional und gemeinschaftlich.Gäste können dort übernachten, Mahlzeiten zubereiten, sich bequem ausruhen und haben einfachen Zugang zu nahegelegenen Schulungs- und Landwirtschaftseinrichtungen.', 1, NULL, NULL, '2026-04-05 11:21:09', '2026-04-05 11:21:09', NULL),
(253, 'attractions', 1, 'name', 4, '333 步（梅尔加 A）', 1, NULL, NULL, '2026-04-05 11:23:24', '2026-04-05 11:23:24', NULL),
(254, 'attractions', 1, 'description', 4, '333 Steps 是一条山坡徒步路线，设有周围环绕着绿色植被的混凝土台阶，可欣赏连绵起伏的山丘和海岸线的全景。气氛清新、活跃、令人振奋。游客可以徒步拾级而上，拍摄美景，享受轻松运动，感受大自然的美好。', 1, NULL, NULL, '2026-04-05 11:23:29', '2026-04-05 11:23:29', NULL),
(255, 'attractions', 2, 'name', 4, '阿兰金瀑布', 1, NULL, NULL, '2026-04-05 11:23:38', '2026-04-05 11:23:38', NULL),
(256, 'attractions', 2, 'description', 4, '包含有关多层瀑布和野餐区的详细信息', 1, NULL, NULL, '2026-04-05 11:23:48', '2026-04-05 11:23:48', NULL),
(257, 'attractions', 3, 'name', 4, '利瓦桑·博尼法西奥', 1, NULL, NULL, '2026-04-05 11:23:56', '2026-04-05 11:23:56', NULL),
(258, 'attractions', 3, 'description', 4, '瑙詹湖国家公园是菲律宾第五大湖，周围环绕着郁郁葱葱的山脉和丰富的生物多样性。广阔的水域栖息着候鸟和特有野生动物，使其成为自然爱好者的天堂。这里的氛围平静、安宁、平和，非常适合乘船、观鸟、自然摄影，或者只是在玻璃般的湖面上欣赏令人惊叹的日落。', 1, NULL, NULL, '2026-04-05 11:24:04', '2026-04-05 11:24:04', NULL),
(259, 'attractions', 4, 'name', 4, '瑙詹湖', 1, NULL, NULL, '2026-04-05 11:24:11', '2026-04-05 11:24:11', NULL),
(260, 'attractions', 4, 'description', 4, '瑙詹湖是菲律宾第五大湖，也是东民都洛岛最大的淡水湖，被拉姆萨尔公约宣布为“国际重要湿地”。它与瑙扬市、维多利亚市、索科罗市和波拉市接壤。该湖是各种本地和候鸟鱼类和水鸟的家​​园。', 1, NULL, NULL, '2026-04-05 11:24:18', '2026-04-05 11:24:18', NULL),
(261, 'attractions', 5, 'name', 4, 'Simbahang Bato（班库罗遗址）', 1, NULL, NULL, '2026-04-05 11:24:28', '2026-04-05 11:24:28', NULL),
(262, 'attractions', 5, 'description', 4, 'Simbahang Bato 是一座历史悠久的 17 世纪珊瑚和土坯教堂遗址，具有独特的“教堂中的教堂”设计。长满青苔的墙壁和露天建筑营造出历史与信仰交汇的令人难以忘怀的美丽氛围。游客可以探索废墟、拍照、了解西班牙时代的遗产，并感受到对这个标志性遗址的安静敬畏。', 1, NULL, NULL, '2026-04-05 11:24:37', '2026-04-05 11:24:37', NULL),
(263, 'attractions', 6, 'name', 4, '道睡莲迷你公园', 1, NULL, NULL, '2026-04-05 11:24:44', '2026-04-05 11:24:44', NULL),
(264, 'attractions', 6, 'description', 4, '道睡莲迷你公园是一个风景优美的生态公园，色彩缤纷的睡莲覆盖着池塘，营造出如诗如画的环境。公园还展示了当地的手工艺，工匠们用干睡莲茎制作可持续的袋子和配饰。游客可以乘船游览、购买独特的纪念品、拍照，并在充满欢乐和自然气息的环境中放松身心。', 1, NULL, NULL, '2026-04-05 11:24:52', '2026-04-05 11:24:52', NULL),
(265, 'attractions', 7, 'name', 4, '蒙特拉戈温泉和森林瀑布', 1, NULL, NULL, '2026-04-05 11:24:59', '2026-04-05 11:24:59', NULL),
(266, 'attractions', 7, 'description', 4, '蒙特拉戈温泉和森林瀑布是一个天然的度假胜地，拥有温暖的矿泉池和坐落在火山岩和绿地之间的小型森林瀑布。气氛舒缓、清新、平和。客人可以泡温泉、在森林池中游泳、徒步小径、享受大自然漫步，并拍摄瑙扬湖沿岸的壮丽景色。', 1, NULL, NULL, '2026-04-05 11:25:08', '2026-04-05 11:25:08', NULL),
(267, 'attractions', 8, 'name', 4, 'AgriGold 农场学习中心有限公司', 1, NULL, NULL, '2026-04-05 11:25:16', '2026-04-05 11:25:16', NULL),
(268, 'attractions', 8, 'description', 4, 'AgriGold 农场学习中心是一个充满活力的教育农场，拥有绿色菜地、家禽区和互动学习设施。气氛欢快而热情，非常适合家庭和生态爱好者。游客可以参加有机农业研讨会，探索农作物和家禽，学习可持续农业技术，并在农场享受实践经验。', 1, NULL, NULL, '2026-04-05 11:25:25', '2026-04-05 11:25:25', NULL),
(269, 'attractions', 9, 'name', 4, '拉戈卡斯蒂略农舍', 1, NULL, NULL, '2026-04-05 11:25:33', '2026-04-05 11:25:33', NULL),
(270, 'attractions', 9, 'description', 4, 'Largo Castillo Farmhouse 是一座质朴且环保的农舍，周围环绕着开阔的绿色田野和花园。气氛平静而自然，非常适合放松身心并与大自然接触。游客可以在宁静的环境中野餐、庆祝生日或小型活动、探索场地以及体验从农场到餐桌的活动。', 1, NULL, NULL, '2026-04-05 11:25:42', '2026-04-05 11:25:42', NULL),
(271, 'attractions', 10, 'name', 4, '庄园', 1, NULL, NULL, '2026-04-05 11:25:51', '2026-04-05 11:25:51', NULL),
(272, 'attractions', 10, 'description', 4, 'La Hacienda 是一家巴厘岛风格的度假酒店，拥有典雅的别墅、热带花园和中央游泳池。氛围豪华、宁静、平和，非常适合安静的休息。客人可以在游泳池游泳、在花园中漫步、入住主题别墅，并在乡村享受轻松的热带度假。', 1, NULL, NULL, '2026-04-05 11:26:00', '2026-04-05 11:26:00', NULL),
(273, 'attractions', 11, 'name', 4, '瑙詹农业中心', 1, NULL, NULL, '2026-04-05 11:26:11', '2026-04-05 11:26:11', NULL),
(274, 'attractions', 11, 'description', 4, 'Naujan 农业中心是一个现代化的农场和培训设施，拥有开阔的田地、作物区和示范地。这里的氛围富有成效、富有教育意义且热情好客。游客可以参加培训项目，探索可持续农业实践，观察作物，并在支持性环境中学习现代农业技术。', 1, NULL, NULL, '2026-04-05 11:26:20', '2026-04-05 11:26:20', NULL),
(275, 'attractions', 12, 'name', 4, '穆拉温大道', 1, NULL, NULL, '2026-04-05 11:26:30', '2026-04-05 11:26:30', NULL),
(276, 'attractions', 12, 'description', 4, '穆拉文大道 (Mulawin Boulevard) 是一条风景优美的道路，两旁绿树成荫，连接着各个街区，展示了小镇的发展历程。气氛平静、现代且热情。游客可以在享受开放空间的同时步行、骑自行车、拍照、观察当地的日常生活。', 1, NULL, NULL, '2026-04-05 11:26:37', '2026-04-05 11:26:37', NULL),
(277, 'attractions', 13, 'name', 4, '里约热内亚', 1, NULL, NULL, '2026-04-05 11:26:51', '2026-04-05 11:26:51', NULL),
(278, 'attractions', 13, 'description', 4, '里约热拉河 (Rio del Sierra) 是一处隐蔽的河畔，拥有冰冷清爽的河水、当地的久保小屋和山景。这里的氛围原始、自然、舒缓。游客可以在河里游泳、在小屋里休息、野餐，在宁静的环境中聆听流水声。', 1, NULL, NULL, '2026-04-05 11:26:59', '2026-04-05 11:26:59', NULL),
(279, 'attractions', 14, 'name', 4, 'DJMV 有机疗愈公园', 1, NULL, NULL, '2026-04-05 11:27:06', '2026-04-05 11:27:06', NULL),
(280, 'attractions', 14, 'description', 4, 'DJMV 有机疗愈公园是一座生态友好型农场，拥有郁郁葱葱的绿色植物、不含化学物质的农作物和专为健康而设计的宁静空间。这里的氛围令人平静、清新、恢复活力。游客可以在花园中漫步，了解可持续有机农业，享受宁静的自然漫步，体验舒缓身心的健康轻松的环境。', 1, NULL, NULL, '2026-04-05 11:27:13', '2026-04-05 11:27:13', NULL),
(281, 'attractions', 15, 'name', 4, '卡拉查瀑布', 1, NULL, NULL, '2026-04-05 11:27:19', '2026-04-05 11:27:19', NULL),
(282, 'attractions', 15, 'description', 4, '卡拉查瀑布是一座雄伟的瀑布，周围环绕着森林覆盖的山丘，瀑布水流强劲，底部有一个深潭。这里的氛围充满冒险、自然且充满活力。游客可以徒步越野小径，在清凉的游泳池中游泳，探索周围的森林，并拍摄风景优美的瀑布的照片。', 1, NULL, NULL, '2026-04-05 11:27:23', '2026-04-05 11:27:23', NULL),
(283, 'attractions', 16, 'name', 4, 'ORIC 萨巴塔拉瀑布', 1, NULL, NULL, '2026-04-05 11:27:28', '2026-04-05 11:27:28', NULL),
(284, 'attractions', 16, 'description', 4, 'ORIC 萨巴塔拉瀑布是一个新兴的生态旅游目的地，拥有惊心动魄的吊桥和通往瀑布的骑马通道。这里的氛围令人兴奋、风景优美、充满冒险。客人可以穿过吊桥，骑马前往瀑布，在凉爽的水中游泳，并探索瑙扬未受破坏的自然美景。', 1, NULL, NULL, '2026-04-05 11:27:39', '2026-04-05 11:27:39', NULL),
(285, 'attractions', 17, 'name', 4, '巴哈·图克拉桑全体会议厅', 1, NULL, NULL, '2026-04-05 11:27:45', '2026-04-05 11:27:45', NULL),
(286, 'attractions', 17, 'description', 4, 'Bahay Tuklasan 全体会议厅是一个宽敞的场地，适合举办培训、会议和社区聚会，周围环绕着有序的场地。这里的氛围专业、平易近人、引人入胜。游客可以参加研讨会、讲习班和农业大会，或参加当地政府和社区项目。', 1, NULL, NULL, '2026-04-05 11:27:53', '2026-04-05 11:27:53', NULL),
(287, 'attractions', 18, 'name', 4, '巴哈图克拉桑宿舍', 1, NULL, NULL, '2026-04-05 11:27:58', '2026-04-05 11:27:58', NULL),
(288, 'attractions', 18, 'description', 4, 'Bahay Tuklasan 宿舍为学生、志愿者和团体提供干净、实用的共用住宿。氛围简单、实用且公共。客人可以过夜、准备餐点、舒适地休息，并轻松访问附近的培训和农业设施。', 1, NULL, NULL, '2026-04-05 11:28:04', '2026-04-05 11:28:04', NULL),
(289, 'hotels', 1, 'name', 1, 'Naujan Paradise Resort', 1, NULL, NULL, '2026-04-05 11:39:41', '2026-04-05 11:39:41', NULL),
(290, 'hotels', 1, 'name', 2, 'Naujan Paradise Resort', 1, NULL, NULL, '2026-04-05 11:39:42', '2026-04-05 11:39:42', NULL),
(291, 'hotels', 1, 'name', 3, 'Naujan Paradise Resort', 1, NULL, NULL, '2026-04-05 11:39:44', '2026-04-05 11:39:44', NULL),
(292, 'hotels', 1, 'name', 4, '瑙詹天堂度假村', 1, NULL, NULL, '2026-04-05 11:39:45', '2026-04-05 11:39:45', NULL),
(293, 'hotels', 1, 'name', 5, 'ナウジャン パラダイス リゾート', 1, NULL, NULL, '2026-04-05 11:39:46', '2026-04-05 11:39:46', NULL),
(294, 'hotels', 1, 'name', 6, '나우잔 파라다이스 리조트', 1, NULL, NULL, '2026-04-05 11:39:47', '2026-04-05 11:39:47', NULL),
(295, 'hotels', 1, 'name', 7, 'Naujan Paradise Resort', 1, NULL, NULL, '2026-04-05 11:39:48', '2026-04-05 11:39:48', NULL),
(296, 'hotels', 1, 'name', 8, 'Naujan Paradise Resort', 1, NULL, NULL, '2026-04-05 11:39:49', '2026-04-05 11:39:49', NULL),
(297, 'hotels', 1, 'description', 1, 'A luxury resort featuring stunning views of Naujan Lake with world-class amenities and services. Perfect for a relaxing getaway with family and friends.', 1, NULL, NULL, '2026-04-05 11:39:49', '2026-04-05 11:39:49', NULL),
(298, 'hotels', 1, 'description', 2, 'Un resort de lujo que ofrece impresionantes vistas del lago Naujan con comodidades y servicios de clase mundial.Perfecto para una escapada relajante con familiares y amigos.', 1, NULL, NULL, '2026-04-05 11:39:49', '2026-04-05 11:39:49', NULL),
(299, 'hotels', 1, 'description', 3, 'Isang marangyang resort na nagtatampok ng mga nakamamanghang tanawin ng Naujan Lake na may mga world-class na amenities at serbisyo.Perpekto para sa isang nakakarelaks na bakasyon kasama ang pamilya at mga kaibigan.', 1, NULL, NULL, '2026-04-05 11:39:50', '2026-04-05 11:39:50', NULL),
(300, 'hotels', 1, 'description', 4, '这家豪华度假村享有 Naujan 湖的壮丽景色，提供世界一流的设施和服务。非常适合与家人和朋友一起轻松度假。', 1, NULL, NULL, '2026-04-05 11:39:51', '2026-04-05 11:39:51', NULL),
(301, 'hotels', 1, 'description', 5, 'ナウハン湖の素晴らしい景色とワールドクラスのアメニティとサービスを備えた高級リゾートです。家族や友人とのリラックスした休暇に最適です。', 1, NULL, NULL, '2026-04-05 11:39:52', '2026-04-05 11:39:52', NULL),
(302, 'hotels', 1, 'description', 6, '세계적 수준의 편의 시설과 서비스를 갖춘 나우잔 호수(Naujan Lake)의 멋진 전망을 자랑하는 럭셔리 리조트입니다.가족, 친구들과 함께 편안한 휴가를 보내기에 적합합니다.', 1, NULL, NULL, '2026-04-05 11:39:53', '2026-04-05 11:39:53', NULL),
(303, 'hotels', 1, 'description', 7, 'Un complexe de luxe offrant une vue imprenable sur le lac Naujan et doté d\'équipements et de services de classe mondiale.Parfait pour une escapade relaxante en famille et entre amis.', 1, NULL, NULL, '2026-04-05 11:39:54', '2026-04-05 11:39:54', NULL),
(304, 'hotels', 1, 'description', 8, 'Ein Luxusresort mit atemberaubendem Blick auf den Naujan-See sowie erstklassigen Annehmlichkeiten und Dienstleistungen.Perfekt für einen erholsamen Urlaub mit Familie und Freunden.', 1, NULL, NULL, '2026-04-05 11:39:54', '2026-04-05 11:39:54', NULL),
(305, 'hotels', 1, 'amenities', 1, '[\"Swimming Pool\",\"Restaurant\",\"Bar\",\"WiFi\",\"Air Conditioning\",\"Spa\",\"Room Service\",\"TV\"]', 1, NULL, NULL, '2026-04-05 11:39:54', '2026-04-05 11:39:54', NULL),
(306, 'hotels', 1, 'amenities', 2, '[\"Piscina\",\"Restaurante\",\"Bar\",\"WiFi\",\"Aire acondicionado\",\"Spa\",\"Servicio de habitaciones\",\"TV\"]', 1, NULL, NULL, '2026-04-05 11:39:55', '2026-04-05 11:39:55', NULL),
(307, 'hotels', 1, 'amenities', 3, '[\"Swimming Pool\",\"Restaurant\",\"Bar\",\"WiFi\",\"Air Conditioning\",\"Spa\",\"Room Service\",\"TV\"]', 1, NULL, NULL, '2026-04-05 11:39:57', '2026-04-05 11:39:57', NULL),
(308, 'hotels', 1, 'amenities', 4, '[“游泳池”、“餐厅”、“酒吧”、“WiFi”、“空调”、“水疗中心”、“客房服务”、“电视”]', 1, NULL, NULL, '2026-04-05 11:39:58', '2026-04-05 11:39:58', NULL),
(309, 'hotels', 1, 'amenities', 5, '[\"スイミングプール\"、\"レストラン\"、\"バー\"、\"WiFi\"、\"エアコン\"、\"スパ\"、\"ルームサービス\"、\"テレビ\"]', 1, NULL, NULL, '2026-04-05 11:39:59', '2026-04-05 11:39:59', NULL),
(310, 'hotels', 1, 'amenities', 6, '[\"수영장\",\"레스토랑\",\"바\",\"WiFi\",\"에어컨\",\"스파\",\"룸서비스\",\"TV\"]', 1, NULL, NULL, '2026-04-05 11:40:01', '2026-04-05 11:40:01', NULL),
(311, 'hotels', 1, 'amenities', 7, '[\"Piscine\",\"Restaurant\",\"Bar\",\"WiFi\",\"Climatisation\",\"Spa\",\"Room Service\",\"TV\"]', 1, NULL, NULL, '2026-04-05 11:40:02', '2026-04-05 11:40:02', NULL),
(312, 'hotels', 1, 'amenities', 8, '[„Schwimmbad“, „Restaurant“, „Bar“, „WLAN“, „Klimaanlage“, „Spa“, „Zimmerservice“, „TV“]', 1, NULL, NULL, '2026-04-05 11:40:02', '2026-04-05 11:40:02', NULL),
(313, 'hotels', 2, 'name', 1, 'Lake View Hotel', 1, NULL, NULL, '2026-04-05 11:40:02', '2026-04-05 11:40:02', NULL),
(314, 'hotels', 2, 'name', 2, 'Hotel con vistas al lago', 1, NULL, NULL, '2026-04-05 11:40:04', '2026-04-05 11:40:04', NULL),
(315, 'hotels', 2, 'name', 3, 'Lake View Hotel', 1, NULL, NULL, '2026-04-05 11:40:06', '2026-04-05 11:40:06', NULL),
(316, 'hotels', 2, 'name', 4, '湖景酒店', 1, NULL, NULL, '2026-04-05 11:40:06', '2026-04-05 11:40:06', NULL),
(317, 'hotels', 2, 'name', 5, 'レイク ビュー ホテル', 1, NULL, NULL, '2026-04-05 11:40:07', '2026-04-05 11:40:07', NULL),
(318, 'hotels', 2, 'name', 6, '레이크뷰 호텔', 1, NULL, NULL, '2026-04-05 11:40:08', '2026-04-05 11:40:08', NULL),
(319, 'hotels', 2, 'name', 7, 'Hôtel avec vue sur le lac', 1, NULL, NULL, '2026-04-05 11:40:09', '2026-04-05 11:40:09', NULL),
(320, 'hotels', 2, 'name', 8, 'Hotel mit Seeblick', 1, NULL, NULL, '2026-04-05 11:40:09', '2026-04-05 11:40:09', NULL),
(321, 'hotels', 2, 'description', 1, 'Affordable and comfortable hotel with direct views of Naujan Lake. A perfect base for exploring local attractions with friendly staff and quality service.', 1, NULL, NULL, '2026-04-05 11:40:09', '2026-04-05 11:40:09', NULL),
(322, 'hotels', 2, 'description', 2, 'Hotel asequible y confortable con vistas directas al lago Naujan.Una base perfecta para explorar las atracciones locales con un personal amable y un servicio de calidad.', 1, NULL, NULL, '2026-04-05 11:40:10', '2026-04-05 11:40:10', NULL),
(323, 'hotels', 2, 'description', 3, 'Abot-kaya at kumportableng hotel na may mga direktang tanawin ng Naujan Lake.Isang perpektong lugar para tuklasin ang mga lokal na atraksyon na may magiliw na staff at kalidad ng serbisyo.', 1, NULL, NULL, '2026-04-05 11:40:11', '2026-04-05 11:40:11', NULL),
(324, 'hotels', 2, 'description', 4, '经济实惠且舒适的酒店，可直接欣赏 Naujan 湖的景色。友好的员工和优质的服务是探索当地景点的完美基地。', 1, NULL, NULL, '2026-04-05 11:40:12', '2026-04-05 11:40:12', NULL),
(325, 'hotels', 2, 'description', 5, 'ナウハン湖の景色を直接望む、手頃な料金の快適なホテル。フレンドリーなスタッフと質の高いサービスを提供する、地元の観光スポットを探索するのに最適な拠点です。', 1, NULL, NULL, '2026-04-05 11:40:12', '2026-04-05 11:40:12', NULL),
(326, 'hotels', 2, 'description', 6, '나우잔 호수(Naujan Lake)가 바로 보이는 저렴하고 편안한 호텔입니다.친절한 직원과 수준 높은 서비스로 지역 명소를 탐험하기에 완벽한 기지입니다.', 1, NULL, NULL, '2026-04-05 11:40:13', '2026-04-05 11:40:13', NULL),
(327, 'hotels', 2, 'description', 7, 'Hôtel abordable et confortable avec vue directe sur le lac de Naujan.Une base idéale pour explorer les attractions locales avec un personnel amical et un service de qualité.', 1, NULL, NULL, '2026-04-05 11:40:14', '2026-04-05 11:40:14', NULL),
(328, 'hotels', 2, 'description', 8, 'Erschwingliches und komfortables Hotel mit direktem Blick auf den Naujan-See.Ein perfekter Ausgangspunkt für die Erkundung lokaler Sehenswürdigkeiten mit freundlichem Personal und erstklassigem Service.', 1, NULL, NULL, '2026-04-05 11:40:16', '2026-04-05 11:40:16', NULL),
(329, 'hotels', 2, 'amenities', 1, '[\"Restaurant\",\"Bar\",\"WiFi\",\"Air Conditioning\",\"Room Service\",\"TV\",\"Parking\"]', 1, NULL, NULL, '2026-04-05 11:40:16', '2026-04-05 11:40:16', NULL),
(330, 'hotels', 2, 'amenities', 2, '[\"Restaurante\",\"Bar\",\"WiFi\",\"Aire acondicionado\",\"Servicio de habitaciones\",\"TV\",\"Parking\"]', 1, NULL, NULL, '2026-04-05 11:40:17', '2026-04-05 11:40:17', NULL),
(331, 'hotels', 2, 'amenities', 3, '[\"Restaurant\",\"Bar\",\"WiFi,\",\"Air Conditioning,\",\"Room Service,\",\"TV\",\"Parking\"]', 1, NULL, NULL, '2026-04-05 11:40:18', '2026-04-05 11:40:18', NULL),
(332, 'hotels', 2, 'amenities', 4, '[“餐厅”、“酒吧”、“WiFi”、“空调”、“客房服务”、“电视”、“停车”]', 1, NULL, NULL, '2026-04-05 11:40:19', '2026-04-05 11:40:19', NULL),
(333, 'hotels', 2, 'amenities', 5, '[「レストラン」、「バー」、「WiFi」、「エアコン」、「ルームサービス」、「テレビ」、「駐車場」]', 1, NULL, NULL, '2026-04-05 11:40:20', '2026-04-05 11:40:20', NULL),
(334, 'hotels', 2, 'amenities', 6, '[\"레스토랑\",\"바\",\"WiFi\",\"에어컨\",\"룸서비스\",\"TV\",\"주차장\"]', 1, NULL, NULL, '2026-04-05 11:40:23', '2026-04-05 11:40:23', NULL),
(335, 'hotels', 2, 'amenities', 7, '[\"Restaurant\",\"Bar\",\"WiFi\",\"Climatisation\",\"Room Service\",\"TV\",\"Parking\"]', 1, NULL, NULL, '2026-04-05 11:40:23', '2026-04-05 11:40:23', NULL),
(336, 'hotels', 2, 'amenities', 8, '[\"Restaurant\", \"Bar\", \"WLAN\", \"Klimaanlage\", \"Zimmerservice\", \"TV\", \"Parkplatz\"]', 1, NULL, NULL, '2026-04-05 11:40:24', '2026-04-05 11:40:24', NULL),
(337, 'hotels', 3, 'name', 1, 'Mountain View Inn', 1, NULL, NULL, '2026-04-05 11:40:24', '2026-04-05 11:40:24', NULL),
(338, 'hotels', 3, 'name', 2, 'Posada con vista a la montaña', 1, NULL, NULL, '2026-04-05 11:40:25', '2026-04-05 11:40:25', NULL),
(339, 'hotels', 3, 'name', 3, 'Mountain View Inn', 1, NULL, NULL, '2026-04-05 11:40:27', '2026-04-05 11:40:27', NULL),
(340, 'hotels', 3, 'name', 4, '山景旅馆', 1, NULL, NULL, '2026-04-05 11:40:30', '2026-04-05 11:40:30', NULL),
(341, 'hotels', 3, 'name', 5, 'マウンテン ビュー イン', 1, NULL, NULL, '2026-04-05 11:40:31', '2026-04-05 11:40:31', NULL),
(342, 'hotels', 3, 'name', 6, '마운틴 뷰 인', 1, NULL, NULL, '2026-04-05 11:40:31', '2026-04-05 11:40:31', NULL),
(343, 'hotels', 3, 'name', 7, 'Auberge avec vue sur la montagne', 1, NULL, NULL, '2026-04-05 11:40:32', '2026-04-05 11:40:32', NULL),
(344, 'hotels', 3, 'name', 8, 'Mountain View Inn', 1, NULL, NULL, '2026-04-05 11:40:32', '2026-04-05 11:40:32', NULL),
(345, 'hotels', 3, 'description', 1, 'Cozy inn located near Mt. Halcon foothills, ideal for trekkers and nature enthusiasts. Offers budget-friendly accommodations with authentic local hospitality.', 1, NULL, NULL, '2026-04-05 11:40:32', '2026-04-05 11:40:32', NULL),
(346, 'hotels', 3, 'description', 2, 'Acogedora posada ubicada cerca de las estribaciones del Monte Halcón, ideal para excursionistas y amantes de la naturaleza.Ofrece alojamiento económico con auténtica hospitalidad local.', 1, NULL, NULL, '2026-04-05 11:40:33', '2026-04-05 11:40:33', NULL),
(347, 'hotels', 3, 'description', 3, 'Maginhawang inn na matatagpuan malapit sa Mt. Halcon foothills, perpekto para sa mga trekker at mahilig sa kalikasan.Nag-aalok ng budget-friendly na mga accommodation na may tunay na lokal na mabuting pakikitungo.', 1, NULL, NULL, '2026-04-05 11:40:34', '2026-04-05 11:40:34', NULL),
(348, 'hotels', 3, 'description', 4, '舒适的旅馆位于哈尔康山 (Mt. Halcon) 山麓附近，是徒步旅行者和自然爱好者的理想选择。提供经济实惠的住宿和正宗的当地热情好客。', 1, NULL, NULL, '2026-04-05 11:40:34', '2026-04-05 11:40:34', NULL),
(349, 'hotels', 3, 'description', 5, 'ハルコン山の麓近くに位置する居心地の良い宿で、トレッカーや自然愛好家に最適です。本物の地元のおもてなしを備えた手頃な料金の宿泊施設を提供します。', 1, NULL, NULL, '2026-04-05 11:40:35', '2026-04-05 11:40:35', NULL),
(350, 'hotels', 3, 'description', 6, '할콘 산(Mt. Halcon) 산기슭 근처에 위치한 아늑한 여관으로 트레커와 자연 애호가에게 이상적입니다.정통 현지 환대와 함께 예산 친화적인 숙박 시설을 제공합니다.', 1, NULL, NULL, '2026-04-05 11:40:36', '2026-04-05 11:40:36', NULL),
(351, 'hotels', 3, 'description', 7, 'Auberge chaleureuse située près des contreforts du mont Halcon, idéale pour les randonneurs et les amoureux de la nature.Propose un hébergement économique avec une hospitalité locale authentique.', 1, NULL, NULL, '2026-04-05 11:40:36', '2026-04-05 11:40:36', NULL),
(352, 'hotels', 3, 'description', 8, 'Gemütliches Gasthaus in der Nähe der Ausläufer des Mt. Halcon, ideal für Wanderer und Naturliebhaber.Bietet preisgünstige Unterkünfte mit authentischer lokaler Gastfreundschaft.', 1, NULL, NULL, '2026-04-05 11:40:38', '2026-04-05 11:40:38', NULL),
(353, 'hotels', 3, 'amenities', 1, '[\"Restaurant\",\"WiFi\",\"Fan\",\"Parking\",\"Common Area\"]', 1, NULL, NULL, '2026-04-05 11:40:38', '2026-04-05 11:40:38', NULL),
(354, 'hotels', 3, 'amenities', 2, '[\"Restaurante\",\"WiFi\",\"Ventilador\",\"Estacionamiento\",\"Zona Común\"]', 1, NULL, NULL, '2026-04-05 11:40:39', '2026-04-05 11:40:39', NULL),
(355, 'hotels', 3, 'amenities', 3, '[\"Restaurant\",\"WiFi\",\"Fan\",\"Parking\",\"Common Area\"]', 1, NULL, NULL, '2026-04-05 11:40:39', '2026-04-05 11:40:39', NULL),
(356, 'hotels', 3, 'amenities', 4, '[“餐厅”、“WiFi”、“风扇”、“停车场”、“公共区域”]', 1, NULL, NULL, '2026-04-05 11:40:40', '2026-04-05 11:40:40', NULL),
(357, 'hotels', 3, 'amenities', 5, '[\"レストラン\"、\"WiFi\"、\"扇風機\"、\"駐車場\"、\"共用エリア\"]', 1, NULL, NULL, '2026-04-05 11:40:41', '2026-04-05 11:40:41', NULL),
(358, 'hotels', 3, 'amenities', 6, '[\"레스토랑\",\"WiFi\",\"선풍기\",\"주차장\",\"공용 구역\"]', 1, NULL, NULL, '2026-04-05 11:40:41', '2026-04-05 11:40:41', NULL),
(359, 'hotels', 3, 'amenities', 7, '[\"Restaurant\",\"WiFi\",\"Ventilateur\",\"Parking\",\"Espace commun\"]', 1, NULL, NULL, '2026-04-05 11:40:42', '2026-04-05 11:40:42', NULL),
(360, 'hotels', 3, 'amenities', 8, '[\"Restaurant\", \"WLAN\", \"Ventilator\", \"Parkplatz\", \"Gemeinschaftsbereich\"]', 1, NULL, NULL, '2026-04-05 11:40:43', '2026-04-05 11:40:43', NULL),
(361, 'restaurants', 1, 'name', 1, 'Arsenia\'s Hapag Kainan sa Kabukiran', 1, NULL, NULL, '2026-04-05 11:40:44', '2026-04-05 11:40:44', NULL),
(362, 'restaurants', 1, 'name', 2, 'Hapag Kainan sa Kabukiran de Arsenia', 1, NULL, NULL, '2026-04-05 11:40:45', '2026-04-05 11:40:45', NULL),
(363, 'restaurants', 1, 'name', 3, 'Arsenia\'s Hapag Kainan sa Kabukiran', 1, NULL, NULL, '2026-04-05 11:40:46', '2026-04-05 11:40:46', NULL),
(364, 'restaurants', 1, 'name', 4, '阿尔森尼亚的 Hapag Kainan sa Kabukiran', 1, NULL, NULL, '2026-04-05 11:40:47', '2026-04-05 11:40:47', NULL),
(365, 'restaurants', 1, 'name', 5, 'アルセニアのハパック・カイナン・サ・カブキラン', 1, NULL, NULL, '2026-04-05 11:40:49', '2026-04-05 11:40:49', NULL),
(366, 'restaurants', 1, 'name', 6, '아르세니아의 하팍 카이난 사 카부키란', 1, NULL, NULL, '2026-04-05 11:40:49', '2026-04-05 11:40:49', NULL),
(367, 'restaurants', 1, 'name', 7, 'Hapag Kainan d\'Arsenia et Kabukiran', 1, NULL, NULL, '2026-04-05 11:40:50', '2026-04-05 11:40:50', NULL),
(368, 'restaurants', 1, 'name', 8, 'Arsenias Hapag Kainan in Kabukiran', 1, NULL, NULL, '2026-04-05 11:40:51', '2026-04-05 11:40:51', NULL),
(369, 'restaurants', 1, 'description', 1, 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 1, NULL, NULL, '2026-04-05 11:40:51', '2026-04-05 11:40:51', NULL),
(370, 'restaurants', 1, 'description', 2, 'Auténtica cocina local con impresionantes vistas a la montaña.Especializado en la experiencia gastronómica tradicional filipina de la granja a la mesa.', 1, NULL, NULL, '2026-04-05 11:40:52', '2026-04-05 11:40:52', NULL),
(371, 'restaurants', 1, 'description', 3, 'Authentic local cuisine na may mga nakamamanghang tanawin ng bundok.Espesyalista sa tradisyonal na Filipino farm-to-table na karanasan sa kainan.', 1, NULL, NULL, '2026-04-05 11:40:52', '2026-04-05 11:40:52', NULL),
(372, 'restaurants', 1, 'description', 4, '正宗的当地美食和令人惊叹的山景。专注于传统菲律宾农场到餐桌的用餐体验。', 1, NULL, NULL, '2026-04-05 11:40:53', '2026-04-05 11:40:53', NULL),
(373, 'restaurants', 1, 'description', 5, '息を呑むような山の景色を眺めながらの本格的な郷土料理。伝統的なフィリピンの農場から食卓までのダイニング体験を専門としています。', 1, NULL, NULL, '2026-04-05 11:40:54', '2026-04-05 11:40:54', NULL),
(374, 'restaurants', 1, 'description', 6, '숨막히는 산의 전망을 감상하며 정통 현지 요리를 맛보세요.필리핀 전통 농장에서 식탁까지의 식사 경험을 전문으로 합니다.', 1, NULL, NULL, '2026-04-05 11:40:54', '2026-04-05 11:40:54', NULL),
(375, 'restaurants', 1, 'description', 7, 'Cuisine locale authentique avec vue imprenable sur les montagnes.Spécialisé dans l\'expérience culinaire philippine traditionnelle de la ferme à la table.', 1, NULL, NULL, '2026-04-05 11:40:55', '2026-04-05 11:40:55', NULL),
(376, 'restaurants', 1, 'description', 8, 'Authentische lokale Küche mit atemberaubendem Bergblick.Spezialisiert auf traditionelle philippinische Speiseerlebnisse direkt vom Bauernhof bis zum Tisch.', 1, NULL, NULL, '2026-04-05 11:40:56', '2026-04-05 11:40:56', NULL),
(377, 'restaurants', 1, 'cuisine_type', 1, 'Filipino', 1, NULL, NULL, '2026-04-05 11:40:56', '2026-04-05 11:40:56', NULL),
(378, 'restaurants', 1, 'cuisine_type', 2, 'Filipina', 1, NULL, NULL, '2026-04-05 11:40:56', '2026-04-05 11:40:56', NULL),
(379, 'restaurants', 1, 'cuisine_type', 3, 'Filipino', 1, NULL, NULL, '2026-04-05 11:40:57', '2026-04-05 11:40:57', NULL),
(380, 'restaurants', 1, 'cuisine_type', 4, '菲律宾人', 1, NULL, NULL, '2026-04-05 11:40:59', '2026-04-05 11:40:59', NULL),
(381, 'restaurants', 1, 'cuisine_type', 5, 'フィリピン人', 1, NULL, NULL, '2026-04-05 11:40:59', '2026-04-05 11:40:59', NULL),
(382, 'restaurants', 1, 'cuisine_type', 6, '필리핀 사람', 1, NULL, NULL, '2026-04-05 11:41:00', '2026-04-05 11:41:00', NULL),
(383, 'restaurants', 1, 'cuisine_type', 7, 'Philippin', 1, NULL, NULL, '2026-04-05 11:41:01', '2026-04-05 11:41:01', NULL),
(384, 'restaurants', 1, 'cuisine_type', 8, 'Philippinisch', 1, NULL, NULL, '2026-04-05 11:41:02', '2026-04-05 11:41:02', NULL),
(385, 'restaurants', 2, 'name', 1, 'Dine at Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:41:02', '2026-04-05 11:41:02', NULL),
(386, 'restaurants', 2, 'name', 2, 'Cene en Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:41:04', '2026-04-05 11:41:04', NULL),
(387, 'restaurants', 2, 'name', 3, 'Kumain sa Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:41:04', '2026-04-05 11:41:04', NULL),
(388, 'restaurants', 2, 'name', 4, '在 Log Grill 和 Resto 用餐', 1, NULL, NULL, '2026-04-05 11:41:05', '2026-04-05 11:41:05', NULL),
(389, 'restaurants', 2, 'name', 5, 'ログ グリル アンド レストでのお食事', 1, NULL, NULL, '2026-04-05 11:41:06', '2026-04-05 11:41:06', NULL),
(390, 'restaurants', 2, 'name', 6, '로그 그릴 앤 레스토(Log Grill and Resto)에서 식사하기', 1, NULL, NULL, '2026-04-05 11:41:07', '2026-04-05 11:41:07', NULL),
(391, 'restaurants', 2, 'name', 7, 'Dîner au Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:41:08', '2026-04-05 11:41:08', NULL),
(392, 'restaurants', 2, 'name', 8, 'Speisen Sie im Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:41:10', '2026-04-05 11:41:10', NULL),
(393, 'restaurants', 2, 'description', 1, 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 1, NULL, NULL, '2026-04-05 11:41:10', '2026-04-05 11:41:10', NULL),
(394, 'restaurants', 2, 'description', 2, 'Ambiente rústico con cocina moderna de fusión filipino-asiática.Famoso por sus especialidades a la parrilla y bebidas artesanales.', 1, NULL, NULL, '2026-04-05 11:41:11', '2026-04-05 11:41:11', NULL),
(395, 'restaurants', 2, 'description', 3, 'Rustic na ambiance na may modernong Filipino-Asian fusion cuisine.Sikat sa mga inihaw na specialty at craft beverage.', 1, NULL, NULL, '2026-04-05 11:41:12', '2026-04-05 11:41:12', NULL),
(396, 'restaurants', 2, 'description', 4, '乡村氛围与现代菲律宾-亚洲融合美食。以特色烧烤和精酿饮料而闻名。', 1, NULL, NULL, '2026-04-05 11:41:13', '2026-04-05 11:41:13', NULL),
(397, 'restaurants', 2, 'description', 5, '素朴な雰囲気の中で、モダンなフィリピンとアジアのフュージョン料理をお楽しみいただけます。グリル料理とクラフトドリンクで有名です。', 1, NULL, NULL, '2026-04-05 11:41:13', '2026-04-05 11:41:13', NULL),
(398, 'restaurants', 2, 'description', 6, '현대적인 필리핀-아시아 퓨전 요리를 선보이는 소박한 분위기입니다.구운 특선 요리와 수제 음료로 유명합니다.', 1, NULL, NULL, '2026-04-05 11:41:14', '2026-04-05 11:41:14', NULL),
(399, 'restaurants', 2, 'description', 7, 'Ambiance rustique avec une cuisine fusion philippino-asiatique moderne.Célèbre pour ses spécialités grillées et ses boissons artisanales.', 1, NULL, NULL, '2026-04-05 11:41:15', '2026-04-05 11:41:15', NULL),
(400, 'restaurants', 2, 'description', 8, 'Rustikales Ambiente mit moderner philippinisch-asiatischer Fusionsküche.Berühmt für Grillspezialitäten und handgemachte Getränke.', 1, NULL, NULL, '2026-04-05 11:41:15', '2026-04-05 11:41:15', NULL),
(401, 'restaurants', 2, 'cuisine_type', 1, 'Filipino-Asian Fusion', 1, NULL, NULL, '2026-04-05 11:41:15', '2026-04-05 11:41:15', NULL),
(402, 'restaurants', 2, 'cuisine_type', 2, 'Fusión filipino-asiática', 1, NULL, NULL, '2026-04-05 11:41:16', '2026-04-05 11:41:16', NULL),
(403, 'restaurants', 2, 'cuisine_type', 4, '菲律宾-亚洲融合', 1, NULL, NULL, '2026-04-05 11:41:17', '2026-04-05 11:41:17', NULL),
(404, 'restaurants', 2, 'cuisine_type', 5, 'フィリピンとアジアの融合', 1, NULL, NULL, '2026-04-05 11:41:19', '2026-04-05 11:41:19', NULL),
(405, 'restaurants', 2, 'cuisine_type', 6, '필리핀-아시아 퓨전', 1, NULL, NULL, '2026-04-05 11:41:20', '2026-04-05 11:41:20', NULL),
(406, 'restaurants', 2, 'cuisine_type', 7, 'Fusion philippino-asiatique', 1, NULL, NULL, '2026-04-05 11:41:22', '2026-04-05 11:41:22', NULL),
(407, 'restaurants', 2, 'cuisine_type', 8, 'Philippinisch-asiatische Fusion', 1, NULL, NULL, '2026-04-05 11:41:23', '2026-04-05 11:41:23', NULL),
(408, 'restaurants', 3, 'name', 1, 'Luca Cucina Italiana', 1, NULL, NULL, '2026-04-05 11:41:24', '2026-04-05 11:41:24', NULL),
(409, 'restaurants', 3, 'name', 2, 'Luca Cocina Italiana', 1, NULL, NULL, '2026-04-05 11:41:24', '2026-04-05 11:41:24', NULL),
(410, 'restaurants', 3, 'name', 3, 'Luca Cucina Italiana', 1, NULL, NULL, '2026-04-05 11:41:25', '2026-04-05 11:41:25', NULL),
(411, 'restaurants', 3, 'name', 4, '意大利卢卡·库西纳', 1, NULL, NULL, '2026-04-05 11:41:26', '2026-04-05 11:41:26', NULL),
(412, 'restaurants', 3, 'name', 5, 'ルカ・クチーナ・イタリアーナ', 1, NULL, NULL, '2026-04-05 11:41:27', '2026-04-05 11:41:27', NULL),
(413, 'restaurants', 3, 'name', 6, '루카 쿠치나 이탈리아나', 1, NULL, NULL, '2026-04-05 11:41:28', '2026-04-05 11:41:28', NULL),
(414, 'restaurants', 3, 'name', 7, 'Luca Cucina Italienne', 1, NULL, NULL, '2026-04-05 11:41:29', '2026-04-05 11:41:29', NULL),
(415, 'restaurants', 3, 'name', 8, 'Luca Cucina Italiana', 1, NULL, NULL, '2026-04-05 11:41:29', '2026-04-05 11:41:29', NULL),
(416, 'restaurants', 3, 'description', 1, 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 1, NULL, NULL, '2026-04-05 11:41:29', '2026-04-05 11:41:29', NULL),
(417, 'restaurants', 3, 'description', 2, 'Auténtico restaurante italiano con pasta casera e ingredientes premium importados.Perfecto para cenas románticas.', 1, NULL, NULL, '2026-04-05 11:41:30', '2026-04-05 11:41:30', NULL),
(418, 'restaurants', 3, 'description', 3, 'Tunay na Italian restaurant na may lutong bahay na pasta at mga premium na imported na sangkap.Perpekto para sa mga romantikong hapunan.', 1, NULL, NULL, '2026-04-05 11:41:31', '2026-04-05 11:41:31', NULL),
(419, 'restaurants', 3, 'description', 4, '正宗的意大利餐厅，提供自制面食和优质进口食材。非常适合浪漫晚餐。', 1, NULL, NULL, '2026-04-05 11:41:32', '2026-04-05 11:41:32', NULL),
(420, 'restaurants', 3, 'description', 5, '自家製パスタと高級輸入食材を使った本格イタリアンレストラン。ロマンチックなディナーに最適です。', 1, NULL, NULL, '2026-04-05 11:41:33', '2026-04-05 11:41:33', NULL),
(421, 'restaurants', 3, 'description', 6, '직접 만든 파스타와 프리미엄 수입 식재료를 사용한 정통 이탈리안 레스토랑입니다.낭만적인 저녁 식사에 적합합니다.', 1, NULL, NULL, '2026-04-05 11:41:34', '2026-04-05 11:41:34', NULL),
(422, 'restaurants', 3, 'description', 7, 'Restaurant italien authentique avec des pâtes faites maison et des ingrédients importés de première qualité.Parfait pour les dîners romantiques.', 1, NULL, NULL, '2026-04-05 11:41:35', '2026-04-05 11:41:35', NULL),
(423, 'restaurants', 3, 'description', 8, 'Authentisches italienisches Restaurant mit hausgemachter Pasta und hochwertigen importierten Zutaten.Perfekt für romantische Abendessen.', 1, NULL, NULL, '2026-04-05 11:41:37', '2026-04-05 11:41:37', NULL),
(424, 'restaurants', 3, 'cuisine_type', 1, 'Italian', 1, NULL, NULL, '2026-04-05 11:41:37', '2026-04-05 11:41:37', NULL),
(425, 'restaurants', 3, 'cuisine_type', 2, 'Italiana', 1, NULL, NULL, '2026-04-05 11:41:38', '2026-04-05 11:41:38', NULL),
(426, 'restaurants', 3, 'cuisine_type', 3, 'Italyano', 1, NULL, NULL, '2026-04-05 11:41:40', '2026-04-05 11:41:40', NULL),
(427, 'restaurants', 3, 'cuisine_type', 4, '意大利语', 1, NULL, NULL, '2026-04-05 11:41:40', '2026-04-05 11:41:40', NULL),
(428, 'restaurants', 3, 'cuisine_type', 5, 'イタリア語', 1, NULL, NULL, '2026-04-05 11:41:41', '2026-04-05 11:41:41', NULL),
(429, 'restaurants', 3, 'cuisine_type', 6, '이탈리아 사람', 1, NULL, NULL, '2026-04-05 11:41:42', '2026-04-05 11:41:42', NULL),
(430, 'restaurants', 3, 'cuisine_type', 7, 'Italienne', 1, NULL, NULL, '2026-04-05 11:41:42', '2026-04-05 11:41:42', NULL),
(431, 'restaurants', 3, 'cuisine_type', 8, 'Italienisch', 1, NULL, NULL, '2026-04-05 11:41:43', '2026-04-05 11:41:43', NULL),
(432, 'restaurants', 4, 'name', 1, 'Red Tomato Resto Farm', 1, NULL, NULL, '2026-04-05 11:41:43', '2026-04-05 11:41:43', NULL),
(433, 'restaurants', 4, 'name', 2, 'Granja Resto de Tomate Rojo', 1, NULL, NULL, '2026-04-05 11:41:44', '2026-04-05 11:41:44', NULL),
(434, 'restaurants', 4, 'name', 3, 'Red Tomato Resto Farm', 1, NULL, NULL, '2026-04-05 11:41:45', '2026-04-05 11:41:45', NULL),
(435, 'restaurants', 4, 'name', 4, '红番茄餐厅农场', 1, NULL, NULL, '2026-04-05 11:41:46', '2026-04-05 11:41:46', NULL),
(436, 'restaurants', 4, 'name', 5, 'レッドトマトレストファーム', 1, NULL, NULL, '2026-04-05 11:41:48', '2026-04-05 11:41:48', NULL);
INSERT INTO `translations` (`id`, `original_table`, `original_id`, `field_name`, `language_id`, `translated_value`, `is_approved`, `created_by`, `approved_by`, `created_at`, `updated_at`, `approved_at`) VALUES
(437, 'restaurants', 4, 'name', 6, '레드 토마토 레스토 농장', 1, NULL, NULL, '2026-04-05 11:41:48', '2026-04-05 11:41:48', NULL),
(438, 'restaurants', 4, 'name', 7, 'Ferme de resto de tomates rouges', 1, NULL, NULL, '2026-04-05 11:41:49', '2026-04-05 11:41:49', NULL),
(439, 'restaurants', 4, 'name', 8, 'Red Tomato Resto Farm', 1, NULL, NULL, '2026-04-05 11:41:50', '2026-04-05 11:41:50', NULL),
(440, 'restaurants', 4, 'description', 1, 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 1, NULL, NULL, '2026-04-05 11:41:50', '2026-04-05 11:41:50', NULL),
(441, 'restaurants', 4, 'description', 2, 'Cena de la granja a la mesa con productos orgánicos de nuestra propia granja.Mariscos frescos y especialidades locales.', 1, NULL, NULL, '2026-04-05 11:41:50', '2026-04-05 11:41:50', NULL),
(442, 'restaurants', 4, 'description', 3, 'Farm-to-table na kainan na may mga organikong ani mula sa sarili naming sakahan.Mga sariwang seafood at mga lokal na specialty.', 1, NULL, NULL, '2026-04-05 11:41:51', '2026-04-05 11:41:51', NULL),
(443, 'restaurants', 4, 'description', 4, '使用我们自己农场的有机农产品烹制从农场到餐桌的餐饮。新鲜的海鲜和当地特色菜。', 1, NULL, NULL, '2026-04-05 11:41:52', '2026-04-05 11:41:52', NULL),
(444, 'restaurants', 4, 'description', 5, '自社農場で採れた有機食材を使ったファーム・トゥ・テーブルのダイニング。新鮮な魚介類と地元の特産品。', 1, NULL, NULL, '2026-04-05 11:41:52', '2026-04-05 11:41:52', NULL),
(445, 'restaurants', 4, 'description', 6, '우리 농장에서 직접 재배한 유기농 농산물로 농장에서 식탁까지 식사를 즐겨보세요.신선한 해산물과 지역 특산품.', 1, NULL, NULL, '2026-04-05 11:41:53', '2026-04-05 11:41:53', NULL),
(446, 'restaurants', 4, 'description', 7, 'Repas de la ferme à la table avec des produits biologiques de notre propre ferme.Fruits de mer frais et spécialités locales.', 1, NULL, NULL, '2026-04-05 11:41:54', '2026-04-05 11:41:54', NULL),
(447, 'restaurants', 4, 'description', 8, 'Essen direkt vom Bauernhof auf den Tisch mit Bio-Produkten von unserem eigenen Bauernhof.Frische Meeresfrüchte und lokale Spezialitäten.', 1, NULL, NULL, '2026-04-05 11:41:55', '2026-04-05 11:41:55', NULL),
(448, 'restaurants', 4, 'cuisine_type', 1, 'Seafood & Filipino', 1, NULL, NULL, '2026-04-05 11:41:55', '2026-04-05 11:41:55', NULL),
(449, 'restaurants', 4, 'cuisine_type', 2, 'Mariscos y filipinos', 1, NULL, NULL, '2026-04-05 11:41:57', '2026-04-05 11:41:57', NULL),
(450, 'restaurants', 4, 'cuisine_type', 3, 'Seafood at Filipino', 1, NULL, NULL, '2026-04-05 11:41:57', '2026-04-05 11:41:57', NULL),
(451, 'restaurants', 4, 'cuisine_type', 4, '海鲜和菲律宾菜', 1, NULL, NULL, '2026-04-05 11:41:58', '2026-04-05 11:41:58', NULL),
(452, 'restaurants', 4, 'cuisine_type', 5, 'シーフード＆フィリピン料理', 1, NULL, NULL, '2026-04-05 11:41:59', '2026-04-05 11:41:59', NULL),
(453, 'restaurants', 4, 'cuisine_type', 6, '해산물 및 필리핀', 1, NULL, NULL, '2026-04-05 11:41:59', '2026-04-05 11:41:59', NULL),
(454, 'restaurants', 4, 'cuisine_type', 7, 'Fruits de mer et philippins', 1, NULL, NULL, '2026-04-05 11:42:00', '2026-04-05 11:42:00', NULL),
(455, 'restaurants', 4, 'cuisine_type', 8, 'Meeresfrüchte und Philippinisch', 1, NULL, NULL, '2026-04-05 11:42:00', '2026-04-05 11:42:00', NULL),
(456, 'restaurants', 5, 'name', 1, 'Casa del Mar Seafood', 1, NULL, NULL, '2026-04-05 11:42:00', '2026-04-05 11:42:00', NULL),
(457, 'restaurants', 5, 'name', 2, 'Mariscos Casa del Mar', 1, NULL, NULL, '2026-04-05 11:42:01', '2026-04-05 11:42:01', NULL),
(458, 'restaurants', 5, 'name', 3, 'Casa del Mar Seafood', 1, NULL, NULL, '2026-04-05 11:42:02', '2026-04-05 11:42:02', NULL),
(459, 'restaurants', 5, 'name', 4, '卡萨德尔玛海鲜餐厅', 1, NULL, NULL, '2026-04-05 11:42:04', '2026-04-05 11:42:04', NULL),
(460, 'restaurants', 5, 'name', 5, 'カーサ デル マール シーフード', 1, NULL, NULL, '2026-04-05 11:42:04', '2026-04-05 11:42:04', NULL),
(461, 'restaurants', 5, 'name', 6, '카사 델 마르 해산물', 1, NULL, NULL, '2026-04-05 11:42:05', '2026-04-05 11:42:05', NULL),
(462, 'restaurants', 5, 'name', 7, 'Fruits de mer Casa del Mar', 1, NULL, NULL, '2026-04-05 11:42:06', '2026-04-05 11:42:06', NULL),
(463, 'restaurants', 5, 'name', 8, 'Casa del Mar Meeresfrüchte', 1, NULL, NULL, '2026-04-05 11:42:06', '2026-04-05 11:42:06', NULL),
(464, 'restaurants', 5, 'description', 1, 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 1, NULL, NULL, '2026-04-05 11:42:06', '2026-04-05 11:42:06', NULL),
(465, 'restaurants', 5, 'description', 2, 'Restaurantes frente al mar con pesca fresca del día.Especializado en mariscos a la parrilla y platos de inspiración asiática.', 1, NULL, NULL, '2026-04-05 11:42:07', '2026-04-05 11:42:07', NULL),
(466, 'restaurants', 5, 'description', 3, 'Beachfront dining na may sariwang pang-araw-araw na catch.Espesyalista sa inihaw na seafood at Asian-inspired dish.', 1, NULL, NULL, '2026-04-05 11:42:08', '2026-04-05 11:42:08', NULL),
(467, 'restaurants', 5, 'description', 4, '海滨餐厅提供每日新鲜捕获的海鲜。专注于烤海鲜和亚洲风味菜肴。', 1, NULL, NULL, '2026-04-05 11:42:09', '2026-04-05 11:42:09', NULL),
(468, 'restaurants', 5, 'description', 5, '毎日新鮮な獲物を使ったビーチフロントのダイニング。シーフードのグリルとアジア風の料理が専門です。', 1, NULL, NULL, '2026-04-05 11:42:09', '2026-04-05 11:42:09', NULL),
(469, 'restaurants', 5, 'description', 6, '매일 신선한 어획물로 잡은 해변가 식사.구운 해산물과 아시아풍 요리를 전문으로 합니다.', 1, NULL, NULL, '2026-04-05 11:42:10', '2026-04-05 11:42:10', NULL),
(470, 'restaurants', 5, 'description', 7, 'Dîner en bord de mer avec des prises fraîches du jour.Spécialisé dans les fruits de mer grillés et les plats d\'inspiration asiatique.', 1, NULL, NULL, '2026-04-05 11:42:11', '2026-04-05 11:42:11', NULL),
(471, 'restaurants', 5, 'description', 8, 'Speisen am Strand mit täglich frischem Fang.Spezialisiert auf gegrillte Meeresfrüchte und asiatisch inspirierte Gerichte.', 1, NULL, NULL, '2026-04-05 11:42:12', '2026-04-05 11:42:12', NULL),
(472, 'restaurants', 5, 'cuisine_type', 1, 'Seafood', 1, NULL, NULL, '2026-04-05 11:42:12', '2026-04-05 11:42:12', NULL),
(473, 'restaurants', 5, 'cuisine_type', 2, 'Mariscos', 1, NULL, NULL, '2026-04-05 11:42:12', '2026-04-05 11:42:12', NULL),
(474, 'restaurants', 5, 'cuisine_type', 3, 'Seafood', 1, NULL, NULL, '2026-04-05 11:42:13', '2026-04-05 11:42:13', NULL),
(475, 'restaurants', 5, 'cuisine_type', 4, '海鲜', 1, NULL, NULL, '2026-04-05 11:42:14', '2026-04-05 11:42:14', NULL),
(476, 'restaurants', 5, 'cuisine_type', 5, 'シーフード', 1, NULL, NULL, '2026-04-05 11:42:14', '2026-04-05 11:42:14', NULL),
(477, 'restaurants', 5, 'cuisine_type', 6, '해산물', 1, NULL, NULL, '2026-04-05 11:42:15', '2026-04-05 11:42:15', NULL),
(478, 'restaurants', 5, 'cuisine_type', 7, 'Fruit de mer', 1, NULL, NULL, '2026-04-05 11:42:16', '2026-04-05 11:42:16', NULL),
(479, 'restaurants', 5, 'cuisine_type', 8, 'Meeresfrüchte', 1, NULL, NULL, '2026-04-05 11:42:17', '2026-04-05 11:42:17', NULL),
(480, 'restaurants', 6, 'name', 1, 'Kalesa Cafe & Bistro', 1, NULL, NULL, '2026-04-05 11:42:17', '2026-04-05 11:42:17', NULL),
(481, 'restaurants', 6, 'name', 2, 'Kalesa Café & Bistro', 1, NULL, NULL, '2026-04-05 11:42:18', '2026-04-05 11:42:18', NULL),
(482, 'restaurants', 6, 'description', 1, 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 1, NULL, NULL, '2026-04-05 11:42:41', '2026-04-05 11:42:41', NULL),
(483, 'restaurants', 6, 'cuisine_type', 1, 'Cafe & Bistro', 1, NULL, NULL, '2026-04-05 11:43:08', '2026-04-05 11:43:08', NULL),
(484, 'restaurants', 7, 'name', 1, 'Bahay Kubo Restaurant', 1, NULL, NULL, '2026-04-05 11:43:34', '2026-04-05 11:43:34', NULL),
(485, 'restaurants', 7, 'description', 1, 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 1, NULL, NULL, '2026-04-05 11:44:01', '2026-04-05 11:44:01', NULL),
(486, 'restaurants', 7, 'cuisine_type', 1, 'Filipino', 1, NULL, NULL, '2026-04-05 11:44:27', '2026-04-05 11:44:27', NULL),
(487, 'restaurants', 8, 'name', 1, 'Sushi & Sake House', 1, NULL, NULL, '2026-04-05 11:44:54', '2026-04-05 11:44:54', NULL),
(488, 'restaurants', 8, 'description', 1, 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 1, NULL, NULL, '2026-04-05 11:45:20', '2026-04-05 11:45:20', NULL),
(489, 'restaurants', 8, 'cuisine_type', 1, 'Japanese', 1, NULL, NULL, '2026-04-05 11:45:47', '2026-04-05 11:45:47', NULL),
(490, 'about_settings', 1, 'overview_text', 1, 'Naujan is a 1st class municipality in Oriental Mindoro with 70 barangays. It is known for its agricultural economy, cultural heritage, and tourism development.', 1, NULL, NULL, '2026-04-05 11:45:47', '2026-04-05 11:45:47', NULL),
(491, 'about_settings', 1, 'vision_text', 1, 'By 2030, Naujan envisions to be the leading agricultural municipality in MIMAROPA, with a livable and ecologically balanced environment demonstrating a vibrant economy inspired by God-loving, healthy, educated, and empowered citizenry under a dynamic and committed leadership.', 1, NULL, NULL, '2026-04-05 11:46:13', '2026-04-05 11:46:13', NULL),
(492, 'restaurants', 9, 'name', 1, 'Arsenia\'s Hapag Kainan sa Kabukiran', 1, NULL, NULL, '2026-04-05 11:46:13', '2026-04-05 11:46:13', NULL),
(493, 'about_settings', 1, 'mission_text', 1, '{\"points\": [\"Recognition and promotion of indigenous cultural communities while ensuring respect for cultural integrity\", \"Conservation and protection of natural resources for safe, adaptive, and resilient barangays\", \"Accountability and competency of people-centered governance through partnerships and development programs\", \"Promotion of eco-tourism and sustainable agricultural production with adequate social services and improved infrastructure\"]}', 1, NULL, NULL, '2026-04-05 11:46:40', '2026-04-05 11:46:40', NULL),
(494, 'restaurants', 9, 'description', 1, 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 1, NULL, NULL, '2026-04-05 11:46:40', '2026-04-05 11:46:40', NULL),
(495, 'restaurants', 9, 'cuisine_type', 1, 'Filipino', 1, NULL, NULL, '2026-04-05 11:47:07', '2026-04-05 11:47:07', NULL),
(496, 'restaurants', 10, 'name', 1, 'Dine at Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:47:33', '2026-04-05 11:47:33', NULL),
(497, 'restaurants', 10, 'description', 1, 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 1, NULL, NULL, '2026-04-05 11:48:00', '2026-04-05 11:48:00', NULL),
(498, 'restaurants', 10, 'cuisine_type', 1, 'Filipino-Asian Fusion', 1, NULL, NULL, '2026-04-05 11:48:26', '2026-04-05 11:48:26', NULL),
(499, 'restaurants', 11, 'name', 1, 'Luca Cucina Italiana', 1, NULL, NULL, '2026-04-05 11:48:53', '2026-04-05 11:48:53', NULL),
(500, 'restaurants', 11, 'description', 1, 'Authentic Italian restaurant with homemade pasta and premium imported ingredients. Perfect for romantic dinners.', 1, NULL, NULL, '2026-04-05 11:49:20', '2026-04-05 11:49:20', NULL),
(501, 'restaurants', 11, 'cuisine_type', 1, 'Italian', 1, NULL, NULL, '2026-04-05 11:49:46', '2026-04-05 11:49:46', NULL),
(502, 'restaurants', 12, 'name', 1, 'Red Tomato Resto Farm', 1, NULL, NULL, '2026-04-05 11:50:13', '2026-04-05 11:50:13', NULL),
(503, 'restaurants', 12, 'description', 1, 'Farm-to-table dining with organic produce from our own farm. Fresh seafood and local specialties.', 1, NULL, NULL, '2026-04-05 11:50:39', '2026-04-05 11:50:39', NULL),
(504, 'restaurants', 12, 'cuisine_type', 1, 'Seafood & Filipino', 1, NULL, NULL, '2026-04-05 11:51:06', '2026-04-05 11:51:06', NULL),
(505, 'restaurants', 13, 'name', 1, 'Casa del Mar Seafood', 1, NULL, NULL, '2026-04-05 11:51:33', '2026-04-05 11:51:33', NULL),
(506, 'restaurants', 13, 'description', 1, 'Beachfront dining with fresh daily catch. Specializing in grilled seafood and Asian-inspired dishes.', 1, NULL, NULL, '2026-04-05 11:52:00', '2026-04-05 11:52:00', NULL),
(507, 'restaurants', 13, 'cuisine_type', 1, 'Seafood', 1, NULL, NULL, '2026-04-05 11:52:26', '2026-04-05 11:52:26', NULL),
(508, 'restaurants', 14, 'name', 1, 'Kalesa Cafe & Bistro', 1, NULL, NULL, '2026-04-05 11:52:52', '2026-04-05 11:52:52', NULL),
(509, 'restaurants', 14, 'description', 1, 'Cozy cafe with local pastries, coffee, and light meals. Great for breakfast and casual lunch.', 1, NULL, NULL, '2026-04-05 11:53:19', '2026-04-05 11:53:19', NULL),
(510, 'restaurants', 14, 'cuisine_type', 1, 'Cafe & Bistro', 1, NULL, NULL, '2026-04-05 11:53:45', '2026-04-05 11:53:45', NULL),
(511, 'restaurants', 15, 'name', 1, 'Bahay Kubo Restaurant', 1, NULL, NULL, '2026-04-05 11:54:12', '2026-04-05 11:54:12', NULL),
(512, 'restaurants', 15, 'description', 1, 'Traditional Filipino comfort food in a beautiful garden setting. Famous for their fried chicken and fried fish.', 1, NULL, NULL, '2026-04-05 11:54:38', '2026-04-05 11:54:38', NULL),
(513, 'restaurants', 15, 'cuisine_type', 1, 'Filipino', 1, NULL, NULL, '2026-04-05 11:55:05', '2026-04-05 11:55:05', NULL),
(514, 'restaurants', 16, 'name', 1, 'Sushi & Sake House', 1, NULL, NULL, '2026-04-05 11:55:31', '2026-04-05 11:55:31', NULL),
(515, 'restaurants', 16, 'description', 1, 'Contemporary Japanese restaurant with sushi bar and private dining rooms. Fresh fish delivered daily.', 1, NULL, NULL, '2026-04-05 11:55:58', '2026-04-05 11:55:58', NULL),
(516, 'restaurants', 16, 'cuisine_type', 1, 'Japanese', 1, NULL, NULL, '2026-04-05 11:56:24', '2026-04-05 11:56:24', NULL),
(517, 'restaurants', 17, 'name', 1, 'Arsenia\'s Hapag Kainan sa Kabukiran', 1, NULL, NULL, '2026-04-05 11:56:51', '2026-04-05 11:56:51', NULL),
(518, 'restaurants', 17, 'description', 1, 'Authentic local cuisine with breathtaking mountain views. Specializing in traditional Filipino farm-to-table dining experience.', 1, NULL, NULL, '2026-04-05 11:57:17', '2026-04-05 11:57:17', NULL),
(519, 'restaurants', 17, 'cuisine_type', 1, 'Filipino', 1, NULL, NULL, '2026-04-05 11:57:44', '2026-04-05 11:57:44', NULL),
(520, 'restaurants', 18, 'name', 1, 'Dine at Log Grill and Resto', 1, NULL, NULL, '2026-04-05 11:58:10', '2026-04-05 11:58:10', NULL),
(521, 'restaurants', 18, 'description', 1, 'Rustic ambiance with modern Filipino-Asian fusion cuisine. Famous for grilled specialties and craft beverages.', 1, NULL, NULL, '2026-04-05 11:58:36', '2026-04-05 11:58:36', NULL),
(522, 'restaurants', 18, 'cuisine_type', 1, 'Filipino-Asian Fusion', 1, NULL, NULL, '2026-04-05 11:59:03', '2026-04-05 11:59:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `translation_cache`
--

CREATE TABLE `translation_cache` (
  `id` bigint(20) NOT NULL,
  `cache_key` varchar(255) NOT NULL COMMENT 'Hash of query parameters',
  `original_table` varchar(100) NOT NULL,
  `language_code` varchar(10) NOT NULL,
  `cached_data` longtext NOT NULL COMMENT 'JSON of merged translated data',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL COMMENT 'Cache expiration time'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cache layer for translated queries';

-- --------------------------------------------------------

--
-- Table structure for table `translation_fields`
--

CREATE TABLE `translation_fields` (
  `id` int(11) NOT NULL,
  `table_name` varchar(100) NOT NULL COMMENT 'Original table: attractions, hotels, itineraries, etc.',
  `field_name` varchar(100) NOT NULL COMMENT 'Field name: name, description, content, etc.',
  `display_name` varchar(150) NOT NULL COMMENT 'Human readable: Attraction Name, Hotel Description',
  `field_type` varchar(20) DEFAULT 'text' COMMENT 'text, longtext, json',
  `is_translatable` tinyint(1) DEFAULT 1,
  `max_length` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registry of translatable fields';

--
-- Dumping data for table `translation_fields`
--

INSERT INTO `translation_fields` (`id`, `table_name`, `field_name`, `display_name`, `field_type`, `is_translatable`, `max_length`, `created_at`) VALUES
(1, 'attractions', 'name', 'Attraction Name', 'text', 1, NULL, '2026-04-04 15:14:29'),
(2, 'attractions', 'description', 'Attraction Description', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(3, 'attractions', 'category', 'Category', 'text', 1, NULL, '2026-04-04 15:14:29'),
(4, 'attractions', 'best_time', 'Best Time to Visit', 'text', 1, NULL, '2026-04-04 15:14:29'),
(5, 'attractions', 'travel_tips', 'Travel Tips', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(6, 'hotels', 'name', 'Hotel Name', 'text', 1, NULL, '2026-04-04 15:14:29'),
(7, 'hotels', 'description', 'Hotel Description', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(8, 'hotels', 'amenities', 'Amenities', 'text', 1, NULL, '2026-04-04 15:14:29'),
(9, 'hotels', 'special_requests_info', 'Special Requests Info', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(10, 'itineraries', 'name', 'Itinerary Name', 'text', 1, NULL, '2026-04-04 15:14:29'),
(11, 'itineraries', 'description', 'Itinerary Description', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(12, 'about_settings', 'overview_text', 'Overview Text', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(13, 'about_settings', 'vision_text', 'Vision Text', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(14, 'about_settings', 'mission_text', 'Mission Text', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(15, 'restaurants', 'name', 'Restaurant Name', 'text', 1, NULL, '2026-04-04 15:14:29'),
(16, 'restaurants', 'description', 'Restaurant Description', 'longtext', 1, NULL, '2026-04-04 15:14:29'),
(17, 'restaurants', 'cuisine_type', 'Cuisine Type', 'text', 1, NULL, '2026-04-04 15:14:29');

-- --------------------------------------------------------

--
-- Table structure for table `translation_languages`
--

CREATE TABLE `translation_languages` (
  `id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL COMMENT 'Language code: en, es, tl, zh, ja, ko, fr, de',
  `name` varchar(50) NOT NULL COMMENT 'Language name in English: English, Spanish, etc.',
  `native_name` varchar(50) NOT NULL COMMENT 'Language name in native: English, Español, Tagalog, etc.',
  `flag` varchar(20) NOT NULL COMMENT 'Flag emoji',
  `is_active` tinyint(1) DEFAULT 1,
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Supported languages for translation';

--
-- Dumping data for table `translation_languages`
--

INSERT INTO `translation_languages` (`id`, `code`, `name`, `native_name`, `flag`, `is_active`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 'en', 'English', 'English', '🇺🇸', 1, 1, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(2, 'es', 'Spanish', 'Español', '🇪🇸', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(3, 'tl', 'Tagalog', 'Tagalog', '🇵🇭', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(4, 'zh', 'Chinese', '中文', '🇨🇳', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(5, 'ja', 'Japanese', '日本語', '🇯🇵', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(6, 'ko', 'Korean', '한국어', '🇰🇷', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(7, 'fr', 'French', 'Français', '🇫🇷', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29'),
(8, 'de', 'German', 'Deutsch', '🇩🇪', 1, 0, '2026-04-04 15:14:29', '2026-04-04 15:14:29');

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
  `role` enum('user','owner','admin','agent') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_picture` longtext DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other','prefer_not_to_say') DEFAULT 'prefer_not_to_say',
  `user_type` enum('local','resident','foreigner') DEFAULT 'foreigner',
  `visit_count` int(11) DEFAULT 0,
  `last_visited_at` datetime DEFAULT NULL,
  `archived` tinyint(1) DEFAULT 0,
  `archived_at` datetime DEFAULT NULL,
  `archived_by` int(11) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 1,
  `email_verified_at` datetime DEFAULT NULL,
  `password_changed_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `email`, `password_hash`, `preferred_language`, `role`, `created_at`, `updated_at`, `profile_picture`, `first_name`, `last_name`, `phone`, `date_of_birth`, `gender`, `user_type`, `visit_count`, `last_visited_at`, `archived`, `archived_at`, `archived_by`, `email_verified`, `email_verified_at`, `password_changed_at`) VALUES
(1, 'Blue', 'benedictmadrigal26@gmail.com', '$2b$10$eAf6Ki40dSkn6GGTuz41yuaTo04SbME7hwuchPwkwgjDJW4ew3S16', 'en', 'user', '2025-11-23 23:13:08', '2026-04-21 03:28:40', '/uploads/profiles/1772498448523-epr629bl.jpg', 'Benedict', 'Madrigal', NULL, '2005-08-26', 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(2, 'kyla', 'kymanalobearxkyqt21@gmail.com', '$2b$10$TeiV0xG5R5GMQLq0Mv90m./6rOEvRdCrQqSyide8fHKwHsM2fVQsK', 'en', 'owner', '2026-01-27 02:12:17', '2026-02-06 13:23:15', NULL, 'Kyla', 'Manalo', NULL, '2004-09-21', 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(4, 'admin', 'admin@naujango.com', '$2b$10$MjSI3fzd60L7Z1Y001OLueUPTEWvSERVlUSbD4WC5imPctfmVnsLO', 'en', 'admin', '2026-02-05 05:53:33', '2026-02-05 05:53:33', NULL, 'Admin', 'User', NULL, NULL, 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(5, 'owner', 'owner@naujango.com', '$2b$10$pfI0bZhYkxn/4LCGpvOBvujJEMYX2Isan2A1FJRl9yMv8Mk.FSl0K', 'en', 'owner', '2026-02-05 05:53:33', '2026-03-02 12:16:13', NULL, 'Hotel', 'Owner', NULL, NULL, 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(6, 'testuser', 'user@naujango.com', '$2b$10$36HAUlZ96trlWUmfL3737us05vafOlSSIA6MtLMfaUkkeX.3CKPx2', 'en', 'user', '2026-02-05 05:53:33', '2026-02-05 05:53:33', NULL, 'Test', 'User', NULL, NULL, 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(8, 'owner2', 'owner2@naujango.com', '$2b$10$xZ8YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK', 'en', 'owner', '2026-02-06 13:24:26', '2026-02-06 13:24:26', NULL, 'Mountain', 'Owner', NULL, NULL, 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(9, 'owner3', 'owner3@naujango.com', '$2b$10$xZ8YqS5F9YKhQ0YZlQXcvO.KJ1LxEKvp7/lxE.5PbGFGmXBN3kGDK', 'en', 'owner', '2026-02-06 13:24:26', '2026-02-06 13:24:26', NULL, 'Naujan', 'Owner', NULL, NULL, 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(10, 'Jhansen', 'marcjhansenf@gmail.com', '$2b$10$jMwZJT5wqXG9YxYjnhqhbeDqhVuuDtn6fyuHL1V4zPk6zzJmznXSm', 'en', 'owner', '2026-02-10 00:34:51', '2026-03-16 02:04:16', NULL, 'Marc Jhansen', 'Fabella', NULL, '2005-07-05', 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, NULL, NULL),
(11, 'BlueDoesCoding', 'bennokmadrigal26@gmail.com', '$2b$10$PUyjtuURO9fLd4H5HFTJpOzo.T7XPNBOmGmTIYfgiWAioAcEx7Htu', 'en', 'owner', '2026-04-19 03:33:02', '2026-05-02 05:26:45', NULL, 'Benok', 'Madrigal', '09652715532', '2005-08-26', 'prefer_not_to_say', 'foreigner', 0, NULL, 0, NULL, NULL, 1, '2026-04-19 11:33:02', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_last_conversation`
--

CREATE TABLE `user_last_conversation` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `last_updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_last_conversation`
--

INSERT INTO `user_last_conversation` (`id`, `user_id`, `conversation_id`, `last_updated_at`) VALUES
(1, 1, 52, '2026-05-03 08:00:44');

-- --------------------------------------------------------

--
-- Table structure for table `user_weather_preferences`
--

CREATE TABLE `user_weather_preferences` (
  `preference_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `temperature_unit` enum('celsius','fahrenheit') DEFAULT 'celsius',
  `wind_speed_unit` enum('kmh','mph','ms') DEFAULT 'kmh',
  `receive_alerts` tinyint(1) DEFAULT 1,
  `alert_types` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`alert_types`)),
  `min_safe_temperature` decimal(5,2) DEFAULT 15.00,
  `max_safe_temperature` decimal(5,2) DEFAULT 35.00,
  `max_safe_wind_speed` decimal(5,2) DEFAULT 20.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_weather_preferences`
--

INSERT INTO `user_weather_preferences` (`preference_id`, `user_id`, `temperature_unit`, `wind_speed_unit`, `receive_alerts`, `alert_types`, `min_safe_temperature`, `max_safe_temperature`, `max_safe_wind_speed`, `created_at`, `updated_at`) VALUES
(1, 3, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(2, 6, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(3, 2, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(4, 5, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(5, 8, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(6, 9, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(7, 1, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39'),
(8, 4, 'celsius', 'kmh', 1, '[\"storm\", \"rain\", \"heat\", \"wind\"]', 15.00, 35.00, 20.00, '2026-02-08 13:54:39', '2026-02-08 13:54:39');

-- --------------------------------------------------------

--
-- Table structure for table `weather_alerts`
--

CREATE TABLE `weather_alerts` (
  `alert_id` int(11) NOT NULL,
  `weather_id` int(11) NOT NULL,
  `alert_type` enum('heat','cold','storm','rain','wind','fog','humidity','flood','uv') NOT NULL,
  `severity_level` enum('low','medium','high','extreme') NOT NULL,
  `alert_message` text NOT NULL,
  `alert_icon` varchar(10) DEFAULT NULL,
  `alert_color` varchar(7) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_alerts`
--

INSERT INTO `weather_alerts` (`alert_id`, `weather_id`, `alert_type`, `severity_level`, `alert_message`, `alert_icon`, `alert_color`, `is_active`, `created_at`, `expires_at`) VALUES
(1, 17, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-09 14:01:08', NULL),
(2, 18, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-09 14:01:13', NULL),
(3, 21, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-09 14:12:11', NULL),
(4, 22, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-02-09 14:12:14', NULL),
(5, 30, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-02-10 00:35:38', NULL),
(6, 31, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-10 00:35:43', NULL),
(7, 33, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-02-10 00:35:53', NULL),
(8, 87, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-22 08:37:36', NULL),
(9, 94, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-23 07:39:38', NULL),
(10, 97, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-02-23 07:39:53', NULL),
(11, 110, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-23 14:26:23', NULL),
(12, 119, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-24 00:36:07', NULL),
(13, 279, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-02-28 03:51:04', NULL),
(14, 301, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-02-28 07:27:17', NULL),
(15, 401, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-03-03 00:12:53', NULL),
(16, 402, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-03-03 00:12:58', NULL),
(17, 464, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-03-10 07:28:09', NULL),
(18, 465, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-03-10 07:46:02', NULL),
(19, 497, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-03-13 11:20:39', NULL),
(20, 498, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-03-13 11:20:44', NULL),
(21, 502, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-03-13 11:31:37', NULL),
(22, 503, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-03-13 11:31:42', NULL),
(23, 615, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-01 15:08:16', NULL),
(24, 616, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-01 15:08:16', NULL),
(25, 617, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-01 15:08:16', NULL),
(26, 619, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-01 15:08:16', NULL),
(27, 623, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-01 15:23:20', NULL),
(28, 875, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-09 22:33:51', NULL),
(29, 981, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-11 09:33:22', NULL),
(30, 1004, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-13 12:01:44', NULL),
(31, 1022, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-14 00:58:00', NULL),
(32, 1028, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-16 03:45:39', NULL),
(33, 1029, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-16 03:45:40', NULL),
(34, 1031, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-16 03:45:41', NULL),
(35, 1032, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-16 03:45:41', NULL),
(36, 1043, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-18 00:50:56', NULL),
(37, 1053, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-18 05:06:08', NULL),
(38, 1303, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-20 14:00:52', NULL),
(39, 1388, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-20 19:50:47', NULL),
(40, 1546, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-28 00:43:32', NULL),
(41, 1547, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-28 02:09:42', NULL),
(42, 1550, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-04-28 02:10:23', NULL),
(43, 1551, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-04-28 02:10:24', NULL),
(44, 1576, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-05-01 08:21:19', NULL),
(45, 1577, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-05-01 08:21:19', NULL),
(46, 1580, 'storm', 'high', 'Thunderstorm alert - Seek indoor shelter immediately', '⛈️', '#ff1744', 1, '2026-05-01 08:21:21', NULL),
(47, 1612, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-05-02 07:55:17', NULL),
(48, 1614, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-05-02 07:55:18', NULL),
(49, 1700, 'rain', 'medium', 'Moderate rain expected - Carry umbrella', '🌧️', '#ff9800', 1, '2026-05-02 11:28:55', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `weather_alternatives`
--

CREATE TABLE `weather_alternatives` (
  `alternative_id` int(11) NOT NULL,
  `original_attraction_id` int(11) NOT NULL,
  `alternative_attraction_id` int(11) NOT NULL,
  `weather_conditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`weather_conditions`)),
  `suitability_score` int(11) DEFAULT 0,
  `reason` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_alternatives`
--

INSERT INTO `weather_alternatives` (`alternative_id`, `original_attraction_id`, `alternative_attraction_id`, `weather_conditions`, `suitability_score`, `reason`, `is_active`, `created_at`) VALUES
(1, 1, 3, '[\"rain\", \"storm\"]', 90, 'Indoor activities available at town plaza during bad weather', 1, '2026-02-08 13:54:39'),
(2, 2, 3, '[\"storm\", \"wind\"]', 85, 'Town plaza offers shelter during severe weather conditions', 1, '2026-02-08 13:54:39'),
(3, 3, 1, '[\"heat\"]', 75, '333 Steps provides elevated views and cooler temperatures', 1, '2026-02-08 13:54:39');

-- --------------------------------------------------------

--
-- Table structure for table `weather_data`
--

CREATE TABLE `weather_data` (
  `weather_id` int(11) NOT NULL,
  `attraction_id` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `temperature` decimal(5,2) NOT NULL,
  `feels_like` decimal(5,2) DEFAULT NULL,
  `humidity` int(11) NOT NULL,
  `pressure` decimal(7,2) DEFAULT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `wind_direction` int(11) DEFAULT NULL,
  `visibility` int(11) DEFAULT NULL,
  `weather_condition` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `icon_code` varchar(10) DEFAULT NULL,
  `cloudiness` int(11) DEFAULT NULL,
  `uv_index` decimal(3,1) DEFAULT NULL,
  `rainfall_1h` decimal(5,2) DEFAULT 0.00,
  `rainfall_3h` decimal(5,2) DEFAULT 0.00,
  `snowfall_1h` decimal(5,2) DEFAULT 0.00,
  `recorded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `api_source` varchar(50) DEFAULT 'openweathermap',
  `is_forecast` tinyint(1) DEFAULT 0,
  `forecast_hours` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_data`
--

INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(1, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 70, 1012.00, 54.40, 42, 10000, 'Clouds', 'scattered clouds', '03d', 39, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:17:17', '2026-02-09 02:17:17', '2026-02-09 02:27:17', 'openweathermap', 0, NULL),
(2, 2, 12.39730000, 121.21500000, 'Arangin Falls', 25.00, 25.00, 66, 1012.00, 42.90, 44, 10000, 'Clouds', 'broken clouds', '04d', 56, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:17:18', '2026-02-09 02:17:18', '2026-02-09 02:27:18', 'openweathermap', 0, NULL),
(3, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 25.00, 70, 1013.00, 40.10, 42, 10000, 'Clouds', 'broken clouds', '04d', 61, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:17:18', '2026-02-09 02:17:18', '2026-02-09 02:27:18', 'openweathermap', 0, NULL),
(4, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 29.00, 61, 1012.00, 38.00, 48, 10000, 'Clouds', 'broken clouds', '04d', 64, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:17:18', '2026-02-09 02:17:18', '2026-02-09 02:27:18', 'openweathermap', 0, NULL),
(5, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 72, 1012.00, 51.00, 41, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:43:56', '2026-02-09 02:43:56', '2026-02-09 02:53:56', 'openweathermap', 0, NULL),
(6, 2, 12.39730000, 121.21500000, 'Arangin Falls', 23.00, 24.00, 71, 1012.00, 38.80, 44, 10000, 'Clouds', 'broken clouds', '04d', 68, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:43:56', '2026-02-09 02:43:56', '2026-02-09 02:53:56', 'openweathermap', 0, NULL),
(7, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 23.00, 75, 1012.00, 36.10, 42, 10000, 'Clouds', 'broken clouds', '04d', 73, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:43:56', '2026-02-09 02:43:56', '2026-02-09 02:53:56', 'openweathermap', 0, NULL),
(8, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 64, 1012.00, 34.10, 50, 10000, 'Clouds', 'broken clouds', '04d', 73, NULL, 0.00, 0.00, 0.00, '2026-02-09 02:43:56', '2026-02-09 02:43:56', '2026-02-09 02:53:56', 'openweathermap', 0, NULL),
(9, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 74, 1011.00, 40.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-02-09 10:49:00', '2026-02-09 10:49:00', '2026-02-09 10:59:00', 'openweathermap', 0, NULL),
(10, 2, 12.39730000, 121.21500000, 'Arangin Falls', 22.00, 22.00, 78, 1012.00, 25.60, 47, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-02-09 10:49:00', '2026-02-09 10:49:00', '2026-02-09 10:59:00', 'openweathermap', 0, NULL),
(11, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 80, 1012.00, 23.90, 44, 10000, 'Clouds', 'overcast clouds', '04n', 89, NULL, 0.00, 0.00, 0.00, '2026-02-09 10:49:00', '2026-02-09 10:49:00', '2026-02-09 10:59:00', 'openweathermap', 0, NULL),
(12, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 77, 1012.00, 18.90, 55, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-02-09 10:49:00', '2026-02-09 10:49:00', '2026-02-09 10:59:00', 'openweathermap', 0, NULL),
(13, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 75, 1013.00, 41.10, 44, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-02-09 13:41:29', '2026-02-09 13:41:29', '2026-02-09 13:51:29', 'openweathermap', 0, NULL),
(14, 2, 12.39730000, 121.21500000, 'Arangin Falls', 22.00, 22.00, 79, 1013.00, 25.40, 48, 10000, 'Clouds', 'broken clouds', '04n', 79, NULL, 0.00, 0.00, 0.00, '2026-02-09 13:41:29', '2026-02-09 13:41:29', '2026-02-09 13:51:29', 'openweathermap', 0, NULL),
(15, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 81, 1013.00, 23.10, 44, 10000, 'Clouds', 'broken clouds', '04n', 84, NULL, 0.00, 0.00, 0.00, '2026-02-09 13:41:29', '2026-02-09 13:41:29', '2026-02-09 13:51:29', 'openweathermap', 0, NULL),
(16, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 78, 1013.00, 19.50, 54, 10000, 'Clouds', 'broken clouds', '04n', 65, NULL, 0.00, 0.00, 0.00, '2026-02-09 13:41:29', '2026-02-09 13:41:29', '2026-02-09 13:51:29', 'openweathermap', 0, NULL),
(17, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 30.00, 55, 1019.00, 6.00, 153, 6833, 'Rain', 'light rain', '10d', 68, NULL, 6.77, 0.00, 0.00, '2026-02-09 14:01:08', '2026-02-09 14:01:08', '2026-02-09 14:11:08', 'openweathermap', 0, NULL),
(18, 2, 12.39730000, 121.21500000, 'Arangin Falls', 25.00, 24.00, 76, 1025.00, 2.00, 315, 13322, 'Rain', 'light rain', '10d', 33, NULL, 9.42, 0.00, 0.00, '2026-02-09 14:01:13', '2026-02-09 14:01:13', '2026-02-09 14:11:13', 'openweathermap', 0, NULL),
(19, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 81, 1013.00, 23.10, 44, 10000, 'Clouds', 'broken clouds', '04n', 84, NULL, 0.00, 0.00, 0.00, '2026-02-09 14:01:14', '2026-02-09 14:01:14', '2026-02-09 14:11:14', 'openweathermap', 0, NULL),
(20, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 78, 1013.00, 19.50, 54, 10000, 'Clouds', 'broken clouds', '04n', 65, NULL, 0.00, 0.00, 0.00, '2026-02-09 14:01:14', '2026-02-09 14:01:14', '2026-02-09 14:11:14', 'openweathermap', 0, NULL),
(21, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 30.00, 70, 1016.00, 9.00, 212, 7605, 'Rain', 'light rain', '10d', 24, NULL, 7.82, 0.00, 0.00, '2026-02-09 14:12:11', '2026-02-09 14:12:11', '2026-02-09 14:22:11', 'openweathermap', 0, NULL),
(22, 2, 12.39730000, 121.21500000, 'Arangin Falls', 33.00, 27.00, 40, 1008.00, 6.00, 72, 11448, 'Thunderstorm', 'thunderstorm with rain', '11d', 36, NULL, 0.00, 0.00, 0.00, '2026-02-09 14:12:14', '2026-02-09 14:12:14', '2026-02-09 14:22:14', 'openweathermap', 0, NULL),
(23, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 81, 1013.00, 23.10, 44, 10000, 'Clouds', 'broken clouds', '04n', 84, NULL, 0.00, 0.00, 0.00, '2026-02-09 14:12:14', '2026-02-09 14:12:14', '2026-02-09 14:22:14', 'openweathermap', 0, NULL),
(24, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 78, 1013.00, 19.50, 54, 10000, 'Clouds', 'broken clouds', '04n', 65, NULL, 0.00, 0.00, 0.00, '2026-02-09 14:12:14', '2026-02-09 14:12:14', '2026-02-09 14:22:14', 'openweathermap', 0, NULL),
(25, 2, 12.39730000, 121.21500000, 'Arangin Falls', 21.00, 22.00, 81, 1013.00, 22.50, 44, 10000, 'Clouds', 'overcast clouds', '04n', 85, NULL, 0.00, 0.00, 0.00, '2026-02-09 15:45:30', '2026-02-09 15:45:30', '2026-02-09 15:55:30', 'openweathermap', 0, NULL),
(26, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1013.00, 37.70, 40, 10000, 'Clouds', 'overcast clouds', '04n', 85, NULL, 0.00, 0.00, 0.00, '2026-02-09 16:03:30', '2026-02-09 16:03:30', '2026-02-09 16:13:30', 'openweathermap', 0, NULL),
(27, 2, 12.39730000, 121.21500000, 'Arangin Falls', 21.00, 22.00, 81, 1013.00, 22.50, 44, 10000, 'Clouds', 'overcast clouds', '04n', 85, NULL, 0.00, 0.00, 0.00, '2026-02-09 16:03:30', '2026-02-09 16:03:30', '2026-02-09 16:13:30', 'openweathermap', 0, NULL),
(28, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 83, 1013.00, 20.90, 40, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-02-09 16:03:30', '2026-02-09 16:03:30', '2026-02-09 16:13:30', 'openweathermap', 0, NULL),
(29, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 80, 1013.00, 16.70, 52, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-02-09 16:03:30', '2026-02-09 16:03:30', '2026-02-09 16:13:30', 'openweathermap', 0, NULL),
(30, 1, 12.27100000, 121.19400000, '333 Steps', 33.00, 34.00, 60, 1030.00, 6.00, 290, 5470, 'Thunderstorm', 'thunderstorm with rain', '11d', 77, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:35:38', '2026-02-10 00:35:38', '2026-02-10 00:45:38', 'openweathermap', 0, NULL),
(31, 2, 12.39730000, 121.21500000, 'Arangin Falls', 20.00, 30.00, 46, 1044.00, 2.00, 316, 14692, 'Rain', 'light rain', '10d', 30, NULL, 4.37, 0.00, 0.00, '2026-02-10 00:35:43', '2026-02-10 00:35:43', '2026-02-10 00:45:43', 'openweathermap', 0, NULL),
(32, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 27.00, 27.00, 46, 1043.00, 19.00, 283, 14017, 'Clear', 'clear sky', '01d', 20, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:35:48', '2026-02-10 00:35:48', '2026-02-10 00:45:48', 'openweathermap', 0, NULL),
(33, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 24.00, 41, 1038.00, 13.00, 289, 14007, 'Thunderstorm', 'thunderstorm with rain', '11d', 38, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:35:53', '2026-02-10 00:35:53', '2026-02-10 00:45:53', 'openweathermap', 0, NULL),
(34, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 72, 1015.00, 26.40, 41, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:53:49', '2026-02-10 00:53:49', '2026-02-10 01:03:49', 'openweathermap', 0, NULL),
(35, 2, 12.39730000, 121.21500000, 'Arangin Falls', 23.00, 23.00, 77, 1015.00, 15.20, 49, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:53:49', '2026-02-10 00:53:49', '2026-02-10 01:03:49', 'openweathermap', 0, NULL),
(36, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 23.00, 79, 1015.00, 15.20, 46, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:53:49', '2026-02-10 00:53:49', '2026-02-10 01:03:49', 'openweathermap', 0, NULL),
(37, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1015.00, 10.20, 63, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 00:53:49', '2026-02-10 00:53:49', '2026-02-10 01:03:49', 'openweathermap', 0, NULL),
(38, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 73, 1015.00, 25.90, 41, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 01:30:25', '2026-02-10 01:30:25', '2026-02-10 01:40:25', 'openweathermap', 0, NULL),
(39, 2, 12.39730000, 121.21500000, 'Arangin Falls', 23.00, 23.00, 78, 1015.00, 15.00, 48, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 01:30:25', '2026-02-10 01:30:25', '2026-02-10 01:40:25', 'openweathermap', 0, NULL),
(40, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 23.00, 80, 1015.00, 15.40, 46, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 01:30:25', '2026-02-10 01:30:25', '2026-02-10 01:40:25', 'openweathermap', 0, NULL),
(41, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 78, 1015.00, 9.70, 56, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-02-10 01:30:25', '2026-02-10 01:30:25', '2026-02-10 01:40:25', 'openweathermap', 0, NULL),
(42, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 73, 1013.00, 38.20, 59, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:29:27', '2026-02-19 11:29:27', '2026-02-19 11:39:27', 'openweathermap', 0, NULL),
(43, 2, 12.39730000, 121.21500000, 'Arangin Falls', 24.00, 24.00, 73, 1013.00, 23.80, 57, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:29:27', '2026-02-19 11:29:27', '2026-02-19 11:39:27', 'openweathermap', 0, NULL),
(44, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 75, 1014.00, 21.10, 54, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:29:27', '2026-02-19 11:29:27', '2026-02-19 11:39:27', 'openweathermap', 0, NULL),
(45, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 71, 1013.00, 19.00, 60, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:29:28', '2026-02-19 11:29:28', '2026-02-19 11:39:28', 'openweathermap', 0, NULL),
(46, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 75, 1014.00, 38.30, 61, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:43:59', '2026-02-19 11:43:59', '2026-02-19 11:53:59', 'openweathermap', 0, NULL),
(47, 2, 12.39730000, 121.21500000, 'Arangin Falls', 23.00, 24.00, 75, 1014.00, 23.70, 62, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:43:59', '2026-02-19 11:43:59', '2026-02-19 11:53:59', 'openweathermap', 0, NULL),
(48, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 24.00, 77, 1014.00, 21.40, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:43:59', '2026-02-19 11:43:59', '2026-02-19 11:53:59', 'openweathermap', 0, NULL),
(49, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 73, 1014.00, 18.10, 68, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-19 11:43:59', '2026-02-19 11:43:59', '2026-02-19 11:53:59', 'openweathermap', 0, NULL),
(50, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 31.00, 67, 1012.00, 39.40, 66, 10000, 'Clouds', 'overcast clouds', '04d', 91, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:35:16', '2026-02-20 03:35:16', '2026-02-20 03:45:16', 'openweathermap', 0, NULL),
(51, 2, 12.39730000, 121.21500000, 'Arangin Falls', 28.00, 29.00, 57, 1012.00, 25.50, 67, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:35:16', '2026-02-20 03:35:16', '2026-02-20 03:45:16', 'openweathermap', 0, NULL),
(52, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 29.00, 57, 1013.00, 24.60, 63, 10000, 'Clouds', 'overcast clouds', '04d', 87, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:35:16', '2026-02-20 03:35:16', '2026-02-20 03:45:16', 'openweathermap', 0, NULL),
(53, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 53, 1012.00, 15.80, 69, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:35:16', '2026-02-20 03:35:16', '2026-02-20 03:45:16', 'openweathermap', 0, NULL),
(54, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 31.00, 68, 1012.00, 39.40, 66, 10000, 'Clouds', 'overcast clouds', '04d', 91, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:55:03', '2026-02-20 03:55:03', '2026-02-20 04:05:03', 'openweathermap', 0, NULL),
(55, 2, 12.39730000, 121.21500000, 'Arangin Falls', 28.00, 29.00, 57, 1012.00, 25.50, 67, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:55:03', '2026-02-20 03:55:03', '2026-02-20 04:05:03', 'openweathermap', 0, NULL),
(56, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 29.00, 57, 1013.00, 24.60, 63, 10000, 'Clouds', 'overcast clouds', '04d', 87, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:55:03', '2026-02-20 03:55:03', '2026-02-20 04:05:03', 'openweathermap', 0, NULL),
(57, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 53, 1012.00, 15.80, 69, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-02-20 03:55:03', '2026-02-20 03:55:03', '2026-02-20 04:05:03', 'openweathermap', 0, NULL),
(58, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 78, 1013.00, 19.60, 56, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-20 13:38:06', '2026-02-20 13:38:06', '2026-02-20 13:48:06', 'openweathermap', 0, NULL),
(59, 2, 12.39730000, 121.21500000, 'Arangin Falls', 22.00, 22.00, 84, 1014.00, 11.70, 63, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-20 13:38:06', '2026-02-20 13:38:06', '2026-02-20 13:48:06', 'openweathermap', 0, NULL),
(60, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 86, 1014.00, 10.70, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-20 13:38:06', '2026-02-20 13:38:06', '2026-02-20 13:48:06', 'openweathermap', 0, NULL),
(61, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 84, 1014.00, 10.20, 71, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-20 13:38:06', '2026-02-20 13:38:06', '2026-02-20 13:48:06', 'openweathermap', 0, NULL),
(62, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 67, 1009.00, 36.90, 72, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-02-21 03:58:39', '2026-02-21 03:58:39', '2026-02-21 04:08:39', 'openweathermap', 0, NULL),
(63, 2, 12.39730000, 121.21500000, 'Arangin Falls', 28.00, 29.00, 55, 1009.00, 24.10, 71, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-02-21 03:58:39', '2026-02-21 03:58:39', '2026-02-21 04:08:39', 'openweathermap', 0, NULL),
(64, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 29.00, 55, 1009.00, 22.90, 66, 10000, 'Clouds', 'scattered clouds', '03d', 36, NULL, 0.00, 0.00, 0.00, '2026-02-21 03:58:39', '2026-02-21 03:58:39', '2026-02-21 04:08:39', 'openweathermap', 0, NULL),
(65, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 50, 1009.00, 15.80, 76, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-02-21 03:58:39', '2026-02-21 03:58:39', '2026-02-21 04:08:39', 'openweathermap', 0, NULL),
(66, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 75, 1010.00, 28.20, 51, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-02-21 14:13:10', '2026-02-21 14:13:10', '2026-02-21 14:23:10', 'openweathermap', 0, NULL),
(67, 2, 12.39730000, 121.21500000, 'Arangin Falls', 22.00, 22.00, 83, 1011.00, 15.80, 59, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-21 14:13:10', '2026-02-21 14:13:10', '2026-02-21 14:23:10', 'openweathermap', 0, NULL),
(68, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 86, 1011.00, 14.40, 57, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-02-21 14:13:10', '2026-02-21 14:13:10', '2026-02-21 14:23:10', 'openweathermap', 0, NULL),
(69, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 84, 1011.00, 11.30, 72, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-02-21 14:13:10', '2026-02-21 14:13:10', '2026-02-21 14:23:10', 'openweathermap', 0, NULL),
(70, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1010.00, 21.30, 71, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:22:03', '2026-02-22 02:22:03', '2026-02-22 02:32:03', 'openweathermap', 0, NULL),
(71, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1010.00, 7.70, 102, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:22:03', '2026-02-22 02:22:03', '2026-02-22 02:32:03', 'openweathermap', 0, NULL),
(72, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 29.00, 53, 1010.00, 12.70, 66, 10000, 'Clouds', 'broken clouds', '04d', 61, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:22:03', '2026-02-22 02:22:03', '2026-02-22 02:32:03', 'openweathermap', 0, NULL),
(73, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 31.00, 50, 1010.00, 4.60, 103, 10000, 'Clouds', 'broken clouds', '04d', 58, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:22:03', '2026-02-22 02:22:03', '2026-02-22 02:32:03', 'openweathermap', 0, NULL),
(74, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1009.00, 25.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:52:07', '2026-02-22 02:52:07', '2026-02-22 03:02:07', 'openweathermap', 0, NULL),
(75, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 66, 1009.00, 7.10, 105, 10000, 'Clouds', 'scattered clouds', '03d', 41, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:52:07', '2026-02-22 02:52:07', '2026-02-22 03:02:07', 'openweathermap', 0, NULL),
(76, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 52, 1010.00, 15.20, 68, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:52:07', '2026-02-22 02:52:07', '2026-02-22 03:02:07', 'openweathermap', 0, NULL),
(77, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 49, 1009.00, 3.50, 104, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-02-22 02:52:07', '2026-02-22 02:52:07', '2026-02-22 03:02:07', 'openweathermap', 0, NULL),
(78, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1009.00, 25.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-22 03:09:55', '2026-02-22 03:09:55', '2026-02-22 03:19:55', 'openweathermap', 0, NULL),
(79, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 66, 1009.00, 7.10, 105, 10000, 'Clouds', 'scattered clouds', '03d', 41, NULL, 0.00, 0.00, 0.00, '2026-02-22 03:09:55', '2026-02-22 03:09:55', '2026-02-22 03:19:55', 'openweathermap', 0, NULL),
(80, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 52, 1010.00, 15.20, 68, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-22 03:09:55', '2026-02-22 03:09:55', '2026-02-22 03:19:55', 'openweathermap', 0, NULL),
(81, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 49, 1009.00, 3.50, 104, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-02-22 03:09:55', '2026-02-22 03:09:55', '2026-02-22 03:19:55', 'openweathermap', 0, NULL),
(82, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 31.00, 63, 1006.00, 20.20, 52, 10000, 'Clouds', 'few clouds', '02d', 21, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:16:43', '2026-02-22 08:16:43', '2026-02-22 08:26:43', 'openweathermap', 0, NULL),
(83, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 68, 1006.00, 6.60, 308, 10000, 'Clear', 'clear sky', '01d', 10, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:16:43', '2026-02-22 08:16:43', '2026-02-22 08:26:43', 'openweathermap', 0, NULL),
(84, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 29.00, 54, 1006.00, 12.20, 57, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:16:43', '2026-02-22 08:16:43', '2026-02-22 08:26:43', 'openweathermap', 0, NULL),
(85, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 32.00, 54, 1006.00, 2.40, 321, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:16:43', '2026-02-22 08:16:43', '2026-02-22 08:26:43', 'openweathermap', 0, NULL),
(86, 1, 12.27100000, 121.19400000, '333 Steps', 31.00, 28.00, 61, 1041.00, 8.00, 157, 14416, 'Clouds', 'scattered clouds', '03d', 28, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:37:31', '2026-02-22 08:37:31', '2026-02-22 08:47:31', 'openweathermap', 0, NULL),
(87, 2, 12.23800000, 121.06900000, 'Arangin Falls', 21.00, 26.00, 54, 1005.00, 10.00, 6, 9414, 'Rain', 'light rain', '10d', 31, NULL, 6.98, 0.00, 0.00, '2026-02-22 08:37:36', '2026-02-22 08:37:36', '2026-02-22 08:47:36', 'openweathermap', 0, NULL),
(88, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 27.00, 28.00, 59, 1007.00, 11.60, 76, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:37:37', '2026-02-22 08:37:37', '2026-02-22 08:47:37', 'openweathermap', 0, NULL),
(89, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 30.00, 59, 1007.00, 1.30, 83, 10000, 'Clouds', 'scattered clouds', '03d', 48, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:37:37', '2026-02-22 08:37:37', '2026-02-22 08:47:37', 'openweathermap', 0, NULL),
(90, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 66, 1006.00, 20.10, 62, 10000, 'Clouds', 'scattered clouds', '03d', 35, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:53:49', '2026-02-22 08:53:49', '2026-02-22 09:03:49', 'openweathermap', 0, NULL),
(91, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 71, 1006.00, 5.60, 292, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:53:49', '2026-02-22 08:53:49', '2026-02-22 09:03:49', 'openweathermap', 0, NULL),
(92, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 27.00, 28.00, 59, 1007.00, 11.60, 76, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:53:49', '2026-02-22 08:53:49', '2026-02-22 09:03:49', 'openweathermap', 0, NULL),
(93, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 30.00, 59, 1007.00, 1.30, 83, 10000, 'Clouds', 'scattered clouds', '03d', 48, NULL, 0.00, 0.00, 0.00, '2026-02-22 08:53:49', '2026-02-22 08:53:49', '2026-02-22 09:03:49', 'openweathermap', 0, NULL),
(94, 1, 12.27100000, 121.19400000, '333 Steps', 20.00, 32.00, 79, 1007.00, 5.00, 355, 6143, 'Rain', 'light rain', '10d', 91, NULL, 1.23, 0.00, 0.00, '2026-02-23 07:39:38', '2026-02-23 07:39:38', '2026-02-23 07:49:38', 'openweathermap', 0, NULL),
(95, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 32.00, 74, 1028.00, 17.00, 47, 14009, 'Mist', 'mist', '50d', 18, NULL, 0.00, 0.00, 0.00, '2026-02-23 07:39:43', '2026-02-23 07:39:43', '2026-02-23 07:49:43', 'openweathermap', 0, NULL),
(96, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 25.00, 35.00, 70, 1036.00, 8.00, 148, 12858, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-23 07:39:48', '2026-02-23 07:39:48', '2026-02-23 07:49:48', 'openweathermap', 0, NULL),
(97, 4, 12.44130000, 121.15300000, 'Naujan Lake', 21.00, 35.00, 44, 1027.00, 2.00, 275, 13243, 'Thunderstorm', 'thunderstorm with rain', '11d', 21, NULL, 0.00, 0.00, 0.00, '2026-02-23 07:39:53', '2026-02-23 07:39:53', '2026-02-23 07:49:53', 'openweathermap', 0, NULL),
(98, 1, 12.27100000, 121.19400000, '333 Steps', 30.00, 33.00, 63, 1006.00, 32.60, 57, 10000, 'Clouds', 'overcast clouds', '04d', 91, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:09:08', '2026-02-23 08:09:08', '2026-02-23 08:19:08', 'openweathermap', 0, NULL),
(99, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 66, 1006.00, 18.50, 59, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:09:08', '2026-02-23 08:09:08', '2026-02-23 08:19:08', 'openweathermap', 0, NULL),
(100, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 57, 1007.00, 21.80, 53, 10000, 'Clouds', 'broken clouds', '04d', 73, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:09:08', '2026-02-23 08:09:08', '2026-02-23 08:19:08', 'openweathermap', 0, NULL),
(101, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 33.00, 54, 1006.00, 11.60, 49, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:09:08', '2026-02-23 08:09:08', '2026-02-23 08:19:08', 'openweathermap', 0, NULL),
(102, 1, 12.27100000, 121.19400000, '333 Steps', 30.00, 33.00, 63, 1006.00, 32.60, 57, 10000, 'Clouds', 'overcast clouds', '04d', 91, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:21:37', '2026-02-23 08:21:37', '2026-02-23 08:31:37', 'openweathermap', 0, NULL),
(103, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 66, 1006.00, 18.50, 59, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:21:37', '2026-02-23 08:21:37', '2026-02-23 08:31:37', 'openweathermap', 0, NULL),
(104, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 57, 1007.00, 21.80, 53, 10000, 'Clouds', 'broken clouds', '04d', 73, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:21:37', '2026-02-23 08:21:37', '2026-02-23 08:31:37', 'openweathermap', 0, NULL),
(105, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 33.00, 54, 1006.00, 11.60, 49, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-02-23 08:21:37', '2026-02-23 08:21:37', '2026-02-23 08:31:37', 'openweathermap', 0, NULL),
(106, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 80, 1010.00, 23.90, 49, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-02-23 12:34:29', '2026-02-23 12:34:29', '2026-02-23 12:44:29', 'openweathermap', 0, NULL),
(107, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 27.00, 76, 1009.00, 12.80, 82, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-02-23 12:34:29', '2026-02-23 12:34:29', '2026-02-23 12:44:29', 'openweathermap', 0, NULL),
(108, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 24.00, 87, 1010.00, 14.40, 49, 10000, 'Clouds', 'few clouds', '02n', 21, NULL, 0.00, 0.00, 0.00, '2026-02-23 12:34:29', '2026-02-23 12:34:29', '2026-02-23 12:44:29', 'openweathermap', 0, NULL),
(109, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 84, 1010.00, 11.20, 79, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-23 12:34:29', '2026-02-23 12:34:29', '2026-02-23 12:44:29', 'openweathermap', 0, NULL),
(110, 1, 12.27100000, 121.19400000, '333 Steps', 30.00, 34.00, 66, 1023.00, 13.00, 71, 9753, 'Rain', 'light rain', '10d', 94, NULL, 4.43, 0.00, 0.00, '2026-02-23 14:26:23', '2026-02-23 14:26:23', '2026-02-23 14:36:23', 'openweathermap', 0, NULL),
(111, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1010.00, 21.30, 66, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:26:23', '2026-02-23 14:26:23', '2026-02-23 14:36:23', 'openweathermap', 0, NULL),
(112, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 24.00, 86, 1010.00, 14.70, 49, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:26:23', '2026-02-23 14:26:23', '2026-02-23 14:36:23', 'openweathermap', 0, NULL),
(113, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 83, 1010.00, 12.20, 67, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:26:23', '2026-02-23 14:26:23', '2026-02-23 14:36:23', 'openweathermap', 0, NULL),
(114, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 78, 1010.00, 26.60, 50, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:36:30', '2026-02-23 14:36:30', '2026-02-23 14:46:30', 'openweathermap', 0, NULL),
(115, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1009.00, 25.10, 62, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:36:30', '2026-02-23 14:36:30', '2026-02-23 14:46:30', 'openweathermap', 0, NULL),
(116, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 23.00, 87, 1010.00, 14.00, 53, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:36:30', '2026-02-23 14:36:30', '2026-02-23 14:46:30', 'openweathermap', 0, NULL),
(117, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 84, 1010.00, 12.70, 65, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-02-23 14:36:30', '2026-02-23 14:36:30', '2026-02-23 14:46:30', 'openweathermap', 0, NULL),
(118, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 32.00, 49, 1010.00, 17.00, 25, 12452, 'Clouds', 'scattered clouds', '03d', 65, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:36:02', '2026-02-24 00:36:02', '2026-02-24 00:46:02', 'openweathermap', 0, NULL),
(119, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 22.00, 77, 1043.00, 17.00, 142, 12878, 'Rain', 'light rain', '10d', 84, NULL, 4.06, 0.00, 0.00, '2026-02-24 00:36:07', '2026-02-24 00:36:07', '2026-02-24 00:46:07', 'openweathermap', 0, NULL),
(120, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 25.00, 60, 1021.00, 7.00, 102, 9985, 'Clear', 'clear sky', '01d', 21, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:36:12', '2026-02-24 00:36:12', '2026-02-24 00:46:12', 'openweathermap', 0, NULL),
(121, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 35.00, 51, 1020.00, 19.00, 94, 9020, 'Clear', 'clear sky', '01d', 97, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:36:17', '2026-02-24 00:36:17', '2026-02-24 00:46:17', 'openweathermap', 0, NULL),
(122, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 72, 1011.00, 31.60, 61, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:47:01', '2026-02-24 00:47:01', '2026-02-24 00:57:01', 'openweathermap', 0, NULL),
(123, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1010.00, 29.50, 69, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:47:01', '2026-02-24 00:47:01', '2026-02-24 00:57:01', 'openweathermap', 0, NULL),
(124, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 27.00, 28.00, 66, 1011.00, 23.40, 62, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:47:01', '2026-02-24 00:47:01', '2026-02-24 00:57:01', 'openweathermap', 0, NULL),
(125, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 32.00, 61, 1011.00, 23.50, 68, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-02-24 00:47:01', '2026-02-24 00:47:01', '2026-02-24 00:57:01', 'openweathermap', 0, NULL),
(126, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 82, 1010.00, 15.70, 55, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 13:28:41', '2026-02-25 13:28:41', '2026-02-25 13:38:41', 'openweathermap', 0, NULL),
(127, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 82, 1010.00, 10.20, 67, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 13:28:41', '2026-02-25 13:28:41', '2026-02-25 13:38:41', 'openweathermap', 0, NULL),
(128, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 89, 1011.00, 9.80, 56, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 13:28:41', '2026-02-25 13:28:41', '2026-02-25 13:38:41', 'openweathermap', 0, NULL),
(129, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 88, 1011.00, 8.80, 80, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-02-25 13:28:42', '2026-02-25 13:28:42', '2026-02-25 13:38:42', 'openweathermap', 0, NULL),
(130, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 27.00, 81, 1010.00, 14.30, 54, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:11:12', '2026-02-25 14:11:12', '2026-02-25 14:21:12', 'openweathermap', 0, NULL),
(131, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 81, 1010.00, 8.10, 74, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:11:12', '2026-02-25 14:11:12', '2026-02-25 14:21:12', 'openweathermap', 0, NULL),
(132, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 88, 1011.00, 9.90, 53, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:11:12', '2026-02-25 14:11:12', '2026-02-25 14:21:12', 'openweathermap', 0, NULL),
(133, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 87, 1011.00, 8.80, 77, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:11:12', '2026-02-25 14:11:12', '2026-02-25 14:21:12', 'openweathermap', 0, NULL),
(134, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 27.00, 81, 1010.00, 14.30, 54, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:22:53', '2026-02-25 14:22:53', '2026-02-25 14:32:53', 'openweathermap', 0, NULL),
(135, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 81, 1010.00, 8.10, 74, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:22:53', '2026-02-25 14:22:53', '2026-02-25 14:32:53', 'openweathermap', 0, NULL),
(136, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 88, 1011.00, 9.90, 53, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:22:53', '2026-02-25 14:22:53', '2026-02-25 14:32:53', 'openweathermap', 0, NULL),
(137, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 87, 1011.00, 8.80, 77, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:22:54', '2026-02-25 14:22:54', '2026-02-25 14:32:54', 'openweathermap', 0, NULL),
(138, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 80, 1011.00, 13.40, 56, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:35:52', '2026-02-25 14:35:52', '2026-02-25 14:45:52', 'openweathermap', 0, NULL),
(139, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 80, 1010.00, 8.10, 78, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:35:52', '2026-02-25 14:35:52', '2026-02-25 14:45:52', 'openweathermap', 0, NULL),
(140, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 89, 1011.00, 9.10, 54, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:35:53', '2026-02-25 14:35:53', '2026-02-25 14:45:53', 'openweathermap', 0, NULL),
(141, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 87, 1011.00, 7.90, 79, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:35:54', '2026-02-25 14:35:54', '2026-02-25 14:45:54', 'openweathermap', 0, NULL),
(142, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 80, 1011.00, 13.40, 56, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:45:52', '2026-02-25 14:45:52', '2026-02-25 14:55:52', 'openweathermap', 0, NULL),
(143, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 80, 1010.00, 8.10, 78, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:45:53', '2026-02-25 14:45:53', '2026-02-25 14:55:53', 'openweathermap', 0, NULL),
(144, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 89, 1011.00, 9.10, 54, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:45:53', '2026-02-25 14:45:53', '2026-02-25 14:55:53', 'openweathermap', 0, NULL),
(145, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 87, 1011.00, 7.90, 79, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-02-25 14:46:31', '2026-02-25 14:46:31', '2026-02-25 14:56:31', 'openweathermap', 0, NULL),
(146, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 27.00, 72, 1007.00, 27.40, 69, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:27:07', '2026-02-26 10:27:07', '2026-02-26 10:37:07', 'openweathermap', 0, NULL),
(147, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1006.00, 21.60, 78, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:27:07', '2026-02-26 10:27:07', '2026-02-26 10:37:07', 'openweathermap', 0, NULL),
(148, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 25.00, 73, 1007.00, 11.20, 71, 10000, 'Clouds', 'scattered clouds', '03n', 43, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:27:07', '2026-02-26 10:27:07', '2026-02-26 10:37:07', 'openweathermap', 0, NULL),
(149, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 71, 1007.00, 5.80, 55, 10000, 'Clouds', 'scattered clouds', '03n', 40, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:27:07', '2026-02-26 10:27:07', '2026-02-26 10:37:07', 'openweathermap', 0, NULL),
(150, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 74, 1007.00, 22.80, 56, 10000, 'Clouds', 'scattered clouds', '03n', 26, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:37:46', '2026-02-26 10:37:46', '2026-02-26 10:47:46', 'openweathermap', 0, NULL),
(151, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1007.00, 19.00, 61, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:37:46', '2026-02-26 10:37:46', '2026-02-26 10:47:46', 'openweathermap', 0, NULL),
(152, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 82, 1008.00, 11.30, 52, 10000, 'Clouds', 'scattered clouds', '03n', 36, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:37:46', '2026-02-26 10:37:46', '2026-02-26 10:47:46', 'openweathermap', 0, NULL),
(153, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 81, 1008.00, 9.20, 42, 10000, 'Clouds', 'scattered clouds', '03n', 33, NULL, 0.00, 0.00, 0.00, '2026-02-26 10:37:46', '2026-02-26 10:37:46', '2026-02-26 10:47:46', 'openweathermap', 0, NULL),
(154, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 74, 1007.00, 22.80, 56, 10000, 'Clouds', 'scattered clouds', '03n', 26, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:04:53', '2026-02-26 11:04:53', '2026-02-26 11:14:53', 'openweathermap', 0, NULL),
(155, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1007.00, 19.00, 61, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:04:54', '2026-02-26 11:04:54', '2026-02-26 11:14:54', 'openweathermap', 0, NULL),
(156, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 82, 1008.00, 11.30, 52, 10000, 'Clouds', 'scattered clouds', '03n', 36, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:04:54', '2026-02-26 11:04:54', '2026-02-26 11:14:54', 'openweathermap', 0, NULL),
(157, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 81, 1008.00, 9.20, 42, 10000, 'Clouds', 'scattered clouds', '03n', 33, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:04:54', '2026-02-26 11:04:54', '2026-02-26 11:14:54', 'openweathermap', 0, NULL),
(158, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 74, 1007.00, 22.80, 56, 10000, 'Clouds', 'scattered clouds', '03n', 26, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:15:32', '2026-02-26 11:15:32', '2026-02-26 11:25:32', 'openweathermap', 0, NULL),
(159, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1007.00, 19.00, 61, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:15:32', '2026-02-26 11:15:32', '2026-02-26 11:25:32', 'openweathermap', 0, NULL),
(160, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 82, 1008.00, 11.30, 52, 10000, 'Clouds', 'scattered clouds', '03n', 36, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:15:32', '2026-02-26 11:15:32', '2026-02-26 11:25:32', 'openweathermap', 0, NULL),
(161, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 81, 1008.00, 9.20, 42, 10000, 'Clouds', 'scattered clouds', '03n', 33, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:15:32', '2026-02-26 11:15:32', '2026-02-26 11:25:32', 'openweathermap', 0, NULL),
(162, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 76, 1008.00, 17.60, 46, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:39:20', '2026-02-26 11:39:20', '2026-02-26 11:49:20', 'openweathermap', 0, NULL),
(163, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1008.00, 15.90, 32, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:39:20', '2026-02-26 11:39:20', '2026-02-26 11:49:20', 'openweathermap', 0, NULL),
(164, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 84, 1009.00, 10.20, 45, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:39:20', '2026-02-26 11:39:20', '2026-02-26 11:49:20', 'openweathermap', 0, NULL),
(165, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 83, 1009.00, 9.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 29, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:39:20', '2026-02-26 11:39:20', '2026-02-26 11:49:20', 'openweathermap', 0, NULL),
(166, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 76, 1008.00, 17.60, 46, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:52:32', '2026-02-26 11:52:32', '2026-02-26 12:02:32', 'openweathermap', 0, NULL),
(167, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1008.00, 15.90, 32, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:52:32', '2026-02-26 11:52:32', '2026-02-26 12:02:32', 'openweathermap', 0, NULL),
(168, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 84, 1009.00, 10.20, 45, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:52:32', '2026-02-26 11:52:32', '2026-02-26 12:02:32', 'openweathermap', 0, NULL),
(169, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 83, 1009.00, 9.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 29, NULL, 0.00, 0.00, 0.00, '2026-02-26 11:52:32', '2026-02-26 11:52:32', '2026-02-26 12:02:32', 'openweathermap', 0, NULL),
(170, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 76, 1008.00, 17.60, 46, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:04:43', '2026-02-26 12:04:43', '2026-02-26 12:14:43', 'openweathermap', 0, NULL),
(171, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1008.00, 15.90, 32, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:04:43', '2026-02-26 12:04:43', '2026-02-26 12:14:43', 'openweathermap', 0, NULL),
(172, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 84, 1009.00, 10.20, 45, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:04:43', '2026-02-26 12:04:43', '2026-02-26 12:14:43', 'openweathermap', 0, NULL),
(173, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 83, 1009.00, 9.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 29, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:04:43', '2026-02-26 12:04:43', '2026-02-26 12:14:43', 'openweathermap', 0, NULL),
(174, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 76, 1008.00, 17.60, 46, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:22:22', '2026-02-26 12:22:22', '2026-02-26 12:32:22', 'openweathermap', 0, NULL),
(175, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1008.00, 15.90, 32, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:22:22', '2026-02-26 12:22:22', '2026-02-26 12:32:22', 'openweathermap', 0, NULL),
(176, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 84, 1009.00, 10.20, 45, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:22:22', '2026-02-26 12:22:22', '2026-02-26 12:32:22', 'openweathermap', 0, NULL),
(177, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 83, 1009.00, 9.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 29, NULL, 0.00, 0.00, 0.00, '2026-02-26 12:22:22', '2026-02-26 12:22:22', '2026-02-26 12:32:22', 'openweathermap', 0, NULL),
(178, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 74, 1009.00, 11.30, 35, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-02-26 13:47:01', '2026-02-26 13:47:01', '2026-02-26 13:57:01', 'openweathermap', 0, NULL),
(179, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 75, 1009.00, 11.20, 33, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-02-26 13:47:01', '2026-02-26 13:47:01', '2026-02-26 13:57:01', 'openweathermap', 0, NULL),
(180, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 81, 1010.00, 7.70, 33, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-02-26 13:47:01', '2026-02-26 13:47:01', '2026-02-26 13:57:01', 'openweathermap', 0, NULL),
(181, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 81, 1010.00, 7.10, 49, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-26 13:47:01', '2026-02-26 13:47:01', '2026-02-26 13:57:01', 'openweathermap', 0, NULL),
(182, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 74, 1009.00, 11.30, 35, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:09:25', '2026-02-26 14:09:25', '2026-02-26 14:19:25', 'openweathermap', 0, NULL),
(183, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 75, 1009.00, 11.20, 33, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:09:25', '2026-02-26 14:09:25', '2026-02-26 14:19:25', 'openweathermap', 0, NULL),
(184, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 81, 1010.00, 7.70, 33, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:09:25', '2026-02-26 14:09:25', '2026-02-26 14:19:25', 'openweathermap', 0, NULL),
(185, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 81, 1010.00, 7.10, 49, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:09:25', '2026-02-26 14:09:25', '2026-02-26 14:19:25', 'openweathermap', 0, NULL),
(186, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 73, 1009.00, 10.00, 28, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:33:13', '2026-02-26 14:33:13', '2026-02-26 14:43:13', 'openweathermap', 0, NULL),
(187, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 25.00, 74, 1009.00, 9.90, 30, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:33:13', '2026-02-26 14:33:13', '2026-02-26 14:43:13', 'openweathermap', 0, NULL),
(188, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 21.00, 79, 1010.00, 7.50, 27, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:33:13', '2026-02-26 14:33:13', '2026-02-26 14:43:13', 'openweathermap', 0, NULL),
(189, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 78, 1009.00, 6.60, 47, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-02-26 14:33:14', '2026-02-26 14:33:14', '2026-02-26 14:43:14', 'openweathermap', 0, NULL),
(190, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 73, 1009.00, 10.00, 28, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-02-26 15:01:31', '2026-02-26 15:01:31', '2026-02-26 15:11:31', 'openweathermap', 0, NULL),
(191, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 25.00, 74, 1009.00, 9.90, 30, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-02-26 15:01:31', '2026-02-26 15:01:31', '2026-02-26 15:11:31', 'openweathermap', 0, NULL),
(192, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 79, 1010.00, 7.50, 27, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-26 15:01:31', '2026-02-26 15:01:31', '2026-02-26 15:11:31', 'openweathermap', 0, NULL),
(193, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 78, 1009.00, 6.60, 47, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-02-26 15:01:31', '2026-02-26 15:01:31', '2026-02-26 15:11:31', 'openweathermap', 0, NULL),
(194, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 29.00, 58, 1010.00, 10.40, 77, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:37:01', '2026-02-27 01:37:01', '2026-02-27 01:47:01', 'openweathermap', 0, NULL),
(195, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 68, 1010.00, 4.10, 146, 10000, 'Clouds', 'few clouds', '02d', 16, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:37:01', '2026-02-27 01:37:01', '2026-02-27 01:47:01', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(196, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 28.00, 45, 1010.00, 4.50, 74, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:37:01', '2026-02-27 01:37:01', '2026-02-27 01:47:01', 'openweathermap', 0, NULL),
(197, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 30.00, 46, 1010.00, 3.60, 198, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:37:01', '2026-02-27 01:37:01', '2026-02-27 01:47:01', 'openweathermap', 0, NULL),
(198, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 29.00, 58, 1010.00, 10.40, 77, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:51:56', '2026-02-27 01:51:56', '2026-02-27 02:01:56', 'openweathermap', 0, NULL),
(199, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 67, 1010.00, 4.10, 146, 10000, 'Clouds', 'few clouds', '02d', 16, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:51:56', '2026-02-27 01:51:56', '2026-02-27 02:01:56', 'openweathermap', 0, NULL),
(200, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 28.00, 45, 1010.00, 4.50, 74, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:51:56', '2026-02-27 01:51:56', '2026-02-27 02:01:56', 'openweathermap', 0, NULL),
(201, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 30.00, 46, 1010.00, 3.60, 198, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-02-27 01:51:56', '2026-02-27 01:51:56', '2026-02-27 02:01:56', 'openweathermap', 0, NULL),
(202, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 29.00, 58, 1010.00, 10.40, 77, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-02-27 02:02:33', '2026-02-27 02:02:33', '2026-02-27 02:12:33', 'openweathermap', 0, NULL),
(203, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 68, 1010.00, 4.10, 146, 10000, 'Clouds', 'few clouds', '02d', 16, NULL, 0.00, 0.00, 0.00, '2026-02-27 02:05:20', '2026-02-27 02:05:20', '2026-02-27 02:15:20', 'openweathermap', 0, NULL),
(204, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 28.00, 45, 1010.00, 4.50, 74, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-27 02:05:20', '2026-02-27 02:05:20', '2026-02-27 02:15:20', 'openweathermap', 0, NULL),
(205, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 30.00, 47, 1010.00, 3.60, 198, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-02-27 02:05:20', '2026-02-27 02:05:20', '2026-02-27 02:15:20', 'openweathermap', 0, NULL),
(206, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 29.00, 58, 1010.00, 10.40, 77, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-02-27 02:19:09', '2026-02-27 02:19:09', '2026-02-27 02:29:09', 'openweathermap', 0, NULL),
(207, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 29.00, 60, 1009.00, 14.40, 103, 10000, 'Clouds', 'broken clouds', '04d', 58, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:16:56', '2026-02-27 03:16:56', '2026-02-27 03:26:56', 'openweathermap', 0, NULL),
(208, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 29.00, 60, 1009.00, 14.40, 103, 10000, 'Clouds', 'broken clouds', '04d', 58, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:28:16', '2026-02-27 03:28:16', '2026-02-27 03:38:16', 'openweathermap', 0, NULL),
(209, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1009.00, 21.60, 97, 10000, 'Clouds', 'broken clouds', '04d', 70, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:39:33', '2026-02-27 03:39:33', '2026-02-27 03:49:33', 'openweathermap', 0, NULL),
(210, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 68, 1009.00, 10.40, 138, 10000, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:39:33', '2026-02-27 03:39:33', '2026-02-27 03:49:33', 'openweathermap', 0, NULL),
(211, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 41, 1008.00, 6.30, 131, 10000, 'Clouds', 'broken clouds', '04d', 68, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:39:33', '2026-02-27 03:39:33', '2026-02-27 03:49:33', 'openweathermap', 0, NULL),
(212, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 43, 1008.00, 9.90, 205, 10000, 'Clouds', 'broken clouds', '04d', 69, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:39:33', '2026-02-27 03:39:33', '2026-02-27 03:49:33', 'openweathermap', 0, NULL),
(213, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1009.00, 21.60, 97, 10000, 'Clouds', 'broken clouds', '04d', 70, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:53:31', '2026-02-27 03:53:31', '2026-02-27 04:03:31', 'openweathermap', 0, NULL),
(214, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 68, 1009.00, 10.40, 138, 10000, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:53:31', '2026-02-27 03:53:31', '2026-02-27 04:03:31', 'openweathermap', 0, NULL),
(215, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 41, 1008.00, 6.30, 131, 10000, 'Clouds', 'broken clouds', '04d', 68, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:53:32', '2026-02-27 03:53:32', '2026-02-27 04:03:32', 'openweathermap', 0, NULL),
(216, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 43, 1008.00, 9.90, 205, 10000, 'Clouds', 'broken clouds', '04d', 69, NULL, 0.00, 0.00, 0.00, '2026-02-27 03:53:32', '2026-02-27 03:53:32', '2026-02-27 04:03:32', 'openweathermap', 0, NULL),
(217, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1009.00, 6.70, 358, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:41:04', '2026-02-27 13:41:04', '2026-02-27 13:51:04', 'openweathermap', 0, NULL),
(218, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 75, 1009.00, 7.10, 344, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:41:04', '2026-02-27 13:41:04', '2026-02-27 13:51:04', 'openweathermap', 0, NULL),
(219, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 82, 1010.00, 4.80, 22, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:41:04', '2026-02-27 13:41:04', '2026-02-27 13:51:04', 'openweathermap', 0, NULL),
(220, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1010.00, 4.20, 17, 10000, 'Clouds', 'overcast clouds', '04n', 88, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:41:05', '2026-02-27 13:41:05', '2026-02-27 13:51:05', 'openweathermap', 0, NULL),
(221, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1009.00, 6.70, 358, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:51:44', '2026-02-27 13:51:44', '2026-02-27 14:01:44', 'openweathermap', 0, NULL),
(222, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 75, 1009.00, 7.10, 344, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:51:45', '2026-02-27 13:51:45', '2026-02-27 14:01:45', 'openweathermap', 0, NULL),
(223, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 82, 1010.00, 4.80, 22, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:51:45', '2026-02-27 13:51:45', '2026-02-27 14:01:45', 'openweathermap', 0, NULL),
(224, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1010.00, 4.20, 17, 10000, 'Clouds', 'overcast clouds', '04n', 88, NULL, 0.00, 0.00, 0.00, '2026-02-27 13:51:45', '2026-02-27 13:51:45', '2026-02-27 14:01:45', 'openweathermap', 0, NULL),
(225, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1009.00, 6.70, 358, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:02:40', '2026-02-27 14:02:40', '2026-02-27 14:12:40', 'openweathermap', 0, NULL),
(226, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 75, 1009.00, 7.10, 344, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:02:40', '2026-02-27 14:02:40', '2026-02-27 14:12:40', 'openweathermap', 0, NULL),
(227, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 82, 1010.00, 4.80, 22, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:02:40', '2026-02-27 14:02:40', '2026-02-27 14:12:40', 'openweathermap', 0, NULL),
(228, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1010.00, 4.20, 17, 10000, 'Clouds', 'overcast clouds', '04n', 88, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:02:40', '2026-02-27 14:02:40', '2026-02-27 14:12:40', 'openweathermap', 0, NULL),
(229, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1009.00, 6.70, 358, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:17:16', '2026-02-27 14:17:16', '2026-02-27 14:27:16', 'openweathermap', 0, NULL),
(230, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 75, 1009.00, 7.10, 344, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:17:17', '2026-02-27 14:17:17', '2026-02-27 14:27:17', 'openweathermap', 0, NULL),
(231, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 82, 1010.00, 4.80, 22, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:17:17', '2026-02-27 14:17:17', '2026-02-27 14:27:17', 'openweathermap', 0, NULL),
(232, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1010.00, 4.20, 17, 10000, 'Clouds', 'overcast clouds', '04n', 88, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:17:18', '2026-02-27 14:17:18', '2026-02-27 14:27:18', 'openweathermap', 0, NULL),
(233, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 75, 1009.00, 6.10, 16, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:32:49', '2026-02-27 14:32:49', '2026-02-27 14:42:49', 'openweathermap', 0, NULL),
(234, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 25.00, 76, 1009.00, 7.10, 356, 10000, 'Clouds', 'broken clouds', '04n', 82, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:32:50', '2026-02-27 14:32:50', '2026-02-27 14:42:50', 'openweathermap', 0, NULL),
(235, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 77, 1010.00, 5.10, 27, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:32:51', '2026-02-27 14:32:51', '2026-02-27 14:42:51', 'openweathermap', 0, NULL),
(236, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 83, 1010.00, 5.00, 31, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:32:52', '2026-02-27 14:32:52', '2026-02-27 14:42:52', 'openweathermap', 0, NULL),
(237, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 75, 1009.00, 6.10, 16, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:43:40', '2026-02-27 14:43:40', '2026-02-27 14:53:40', 'openweathermap', 0, NULL),
(238, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 25.00, 76, 1009.00, 7.10, 356, 10000, 'Clouds', 'broken clouds', '04n', 82, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:43:41', '2026-02-27 14:43:41', '2026-02-27 14:53:41', 'openweathermap', 0, NULL),
(239, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 77, 1010.00, 5.10, 27, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:43:41', '2026-02-27 14:43:41', '2026-02-27 14:53:41', 'openweathermap', 0, NULL),
(240, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 83, 1010.00, 5.00, 31, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-02-27 14:43:41', '2026-02-27 14:43:41', '2026-02-27 14:53:41', 'openweathermap', 0, NULL),
(241, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 75, 1009.00, 6.10, 16, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-02-27 15:11:30', '2026-02-27 15:11:30', '2026-02-27 15:21:30', 'openweathermap', 0, NULL),
(242, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 25.00, 76, 1009.00, 7.10, 356, 10000, 'Clouds', 'broken clouds', '04n', 82, NULL, 0.00, 0.00, 0.00, '2026-02-27 15:11:31', '2026-02-27 15:11:31', '2026-02-27 15:21:31', 'openweathermap', 0, NULL),
(243, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 77, 1010.00, 5.10, 27, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-02-27 15:11:31', '2026-02-27 15:11:31', '2026-02-27 15:21:31', 'openweathermap', 0, NULL),
(244, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 83, 1010.00, 5.00, 31, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-02-27 15:11:32', '2026-02-27 15:11:32', '2026-02-27 15:21:32', 'openweathermap', 0, NULL),
(245, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 72, 1008.00, 7.30, 18, 10000, 'Clouds', 'scattered clouds', '03n', 49, NULL, 0.00, 0.00, 0.00, '2026-02-27 16:54:18', '2026-02-27 16:54:18', '2026-02-27 17:04:18', 'openweathermap', 0, NULL),
(246, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 79, 1008.00, 8.40, 16, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-02-27 16:54:18', '2026-02-27 16:54:18', '2026-02-27 17:04:18', 'openweathermap', 0, NULL),
(247, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 73, 1009.00, 5.30, 24, 10000, 'Clouds', 'overcast clouds', '04n', 85, NULL, 0.00, 0.00, 0.00, '2026-02-27 16:54:18', '2026-02-27 16:54:18', '2026-02-27 17:04:18', 'openweathermap', 0, NULL),
(248, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 79, 1009.00, 5.40, 38, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-02-27 16:54:18', '2026-02-27 16:54:18', '2026-02-27 17:04:18', 'openweathermap', 0, NULL),
(249, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 72, 1008.00, 7.30, 18, 10000, 'Clouds', 'scattered clouds', '03n', 49, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:15:15', '2026-02-27 17:15:15', '2026-02-27 17:25:15', 'openweathermap', 0, NULL),
(250, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 79, 1008.00, 8.40, 16, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:15:15', '2026-02-27 17:15:15', '2026-02-27 17:25:15', 'openweathermap', 0, NULL),
(251, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 73, 1009.00, 5.30, 24, 10000, 'Clouds', 'overcast clouds', '04n', 85, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:15:15', '2026-02-27 17:15:15', '2026-02-27 17:25:15', 'openweathermap', 0, NULL),
(252, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 79, 1009.00, 5.40, 38, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:15:15', '2026-02-27 17:15:15', '2026-02-27 17:25:15', 'openweathermap', 0, NULL),
(253, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 71, 1008.00, 6.80, 23, 10000, 'Clouds', 'scattered clouds', '03n', 43, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:38:34', '2026-02-27 17:38:34', '2026-02-27 17:48:34', 'openweathermap', 0, NULL),
(254, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 24.00, 80, 1008.00, 8.20, 29, 10000, 'Clouds', 'scattered clouds', '03n', 42, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:38:34', '2026-02-27 17:38:34', '2026-02-27 17:48:34', 'openweathermap', 0, NULL),
(255, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 72, 1008.00, 5.50, 25, 10000, 'Clouds', 'broken clouds', '04n', 82, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:38:34', '2026-02-27 17:38:34', '2026-02-27 17:48:34', 'openweathermap', 0, NULL),
(256, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 76, 1008.00, 5.50, 39, 10000, 'Clouds', 'broken clouds', '04n', 79, NULL, 0.00, 0.00, 0.00, '2026-02-27 17:38:34', '2026-02-27 17:38:34', '2026-02-27 17:48:34', 'openweathermap', 0, NULL),
(257, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 71, 1008.00, 8.00, 25, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:02:00', '2026-02-27 18:02:00', '2026-02-27 18:12:00', 'openweathermap', 0, NULL),
(258, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 24.00, 80, 1008.00, 9.50, 33, 10000, 'Clouds', 'broken clouds', '04n', 62, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:02:00', '2026-02-27 18:02:00', '2026-02-27 18:12:00', 'openweathermap', 0, NULL),
(259, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 72, 1008.00, 6.00, 28, 10000, 'Clouds', 'broken clouds', '04n', 83, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:02:00', '2026-02-27 18:02:00', '2026-02-27 18:12:00', 'openweathermap', 0, NULL),
(260, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 76, 1008.00, 6.10, 41, 10000, 'Clouds', 'broken clouds', '04n', 80, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:02:00', '2026-02-27 18:02:00', '2026-02-27 18:12:00', 'openweathermap', 0, NULL),
(261, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 71, 1008.00, 8.00, 25, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:14:09', '2026-02-27 18:14:09', '2026-02-27 18:24:09', 'openweathermap', 0, NULL),
(262, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 24.00, 80, 1008.00, 9.50, 33, 10000, 'Clouds', 'broken clouds', '04n', 62, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:14:09', '2026-02-27 18:14:09', '2026-02-27 18:24:09', 'openweathermap', 0, NULL),
(263, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 72, 1008.00, 6.00, 28, 10000, 'Clouds', 'broken clouds', '04n', 83, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:14:09', '2026-02-27 18:14:09', '2026-02-27 18:24:09', 'openweathermap', 0, NULL),
(264, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 76, 1008.00, 6.10, 41, 10000, 'Clouds', 'broken clouds', '04n', 80, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:14:09', '2026-02-27 18:14:09', '2026-02-27 18:24:09', 'openweathermap', 0, NULL),
(265, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 71, 1008.00, 8.00, 25, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:26:47', '2026-02-27 18:26:47', '2026-02-27 18:36:47', 'openweathermap', 0, NULL),
(266, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 24.00, 80, 1008.00, 9.50, 33, 10000, 'Clouds', 'broken clouds', '04n', 62, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:26:47', '2026-02-27 18:26:47', '2026-02-27 18:36:47', 'openweathermap', 0, NULL),
(267, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 72, 1008.00, 6.00, 28, 10000, 'Clouds', 'broken clouds', '04n', 83, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:26:47', '2026-02-27 18:26:47', '2026-02-27 18:36:47', 'openweathermap', 0, NULL),
(268, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 76, 1008.00, 6.10, 41, 10000, 'Clouds', 'broken clouds', '04n', 80, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:26:47', '2026-02-27 18:26:47', '2026-02-27 18:36:47', 'openweathermap', 0, NULL),
(269, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 72, 1008.00, 7.50, 30, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:42:21', '2026-02-27 18:42:21', '2026-02-27 18:52:21', 'openweathermap', 0, NULL),
(270, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 23.00, 81, 1008.00, 7.90, 39, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:42:21', '2026-02-27 18:42:21', '2026-02-27 18:52:21', 'openweathermap', 0, NULL),
(271, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 75, 1008.00, 6.00, 38, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:42:21', '2026-02-27 18:42:21', '2026-02-27 18:52:21', 'openweathermap', 0, NULL),
(272, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 77, 1008.00, 5.80, 52, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:42:21', '2026-02-27 18:42:21', '2026-02-27 18:52:21', 'openweathermap', 0, NULL),
(273, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 75, 1008.00, 6.00, 38, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:53:41', '2026-02-27 18:53:41', '2026-02-27 19:03:41', 'openweathermap', 0, NULL),
(274, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 72, 1008.00, 7.50, 30, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:53:43', '2026-02-27 18:53:43', '2026-02-27 19:03:43', 'openweathermap', 0, NULL),
(275, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 23.00, 81, 1008.00, 7.90, 39, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:53:43', '2026-02-27 18:53:43', '2026-02-27 19:03:43', 'openweathermap', 0, NULL),
(276, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 77, 1008.00, 5.80, 52, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-02-27 18:53:43', '2026-02-27 18:53:43', '2026-02-27 19:03:43', 'openweathermap', 0, NULL),
(277, 1, 12.27100000, 121.19400000, '333 Steps', 22.00, 33.00, 62, 1011.00, 9.00, 336, 5222, 'Clear', 'clear sky', '01d', 37, NULL, 0.00, 0.00, 0.00, '2026-02-28 03:51:04', '2026-02-28 03:51:04', '2026-02-28 04:01:04', 'openweathermap', 0, NULL),
(278, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 31.00, 65, 1013.00, 1.00, 168, 7252, 'Clear', 'clear sky', '01d', 94, NULL, 0.00, 0.00, 0.00, '2026-02-28 03:51:04', '2026-02-28 03:51:04', '2026-02-28 04:01:04', 'openweathermap', 0, NULL),
(279, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 26.00, 28.00, 70, 1036.00, 9.00, 181, 11385, 'Thunderstorm', 'thunderstorm with rain', '11d', 68, NULL, 0.00, 0.00, 0.00, '2026-02-28 03:51:04', '2026-02-28 03:51:04', '2026-02-28 04:01:04', 'openweathermap', 0, NULL),
(280, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 30.00, 66, 1029.00, 16.00, 222, 12361, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-02-28 03:51:04', '2026-02-28 03:51:04', '2026-02-28 04:01:04', 'openweathermap', 0, NULL),
(281, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 30.00, 61, 1008.00, 20.80, 84, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:09:47', '2026-02-28 05:09:47', '2026-02-28 05:19:47', 'openweathermap', 0, NULL),
(282, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1009.00, 8.10, 158, 10000, 'Clouds', 'scattered clouds', '03d', 35, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:09:47', '2026-02-28 05:09:47', '2026-02-28 05:19:47', 'openweathermap', 0, NULL),
(283, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 40, 1008.00, 9.40, 85, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:09:47', '2026-02-28 05:09:47', '2026-02-28 05:19:47', 'openweathermap', 0, NULL),
(284, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 32.00, 44, 1008.00, 7.20, 193, 10000, 'Clouds', 'few clouds', '02d', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:09:47', '2026-02-28 05:09:47', '2026-02-28 05:19:47', 'openweathermap', 0, NULL),
(285, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 63, 1007.00, 24.20, 83, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:44:18', '2026-02-28 05:44:18', '2026-02-28 05:54:18', 'openweathermap', 0, NULL),
(286, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1007.00, 9.10, 145, 10000, 'Clouds', 'scattered clouds', '03d', 36, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:44:18', '2026-02-28 05:44:18', '2026-02-28 05:54:18', 'openweathermap', 0, NULL),
(287, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 43, 1007.00, 9.30, 77, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:44:18', '2026-02-28 05:44:18', '2026-02-28 05:54:18', 'openweathermap', 0, NULL),
(288, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 46, 1007.00, 4.90, 190, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-02-28 05:44:18', '2026-02-28 05:44:18', '2026-02-28 05:54:18', 'openweathermap', 0, NULL),
(289, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 63, 1006.00, 25.30, 80, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:32:08', '2026-02-28 06:32:08', '2026-02-28 06:42:08', 'openweathermap', 0, NULL),
(290, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 66, 1006.00, 12.30, 117, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:32:08', '2026-02-28 06:32:08', '2026-02-28 06:42:08', 'openweathermap', 0, NULL),
(291, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 43, 1007.00, 9.90, 79, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:32:08', '2026-02-28 06:32:08', '2026-02-28 06:42:08', 'openweathermap', 0, NULL),
(292, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 48, 1006.00, 2.40, 164, 10000, 'Clouds', 'broken clouds', '04d', 83, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:32:08', '2026-02-28 06:32:08', '2026-02-28 06:42:08', 'openweathermap', 0, NULL),
(293, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1006.00, 25.30, 80, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:49:07', '2026-02-28 06:49:07', '2026-02-28 06:59:07', 'openweathermap', 0, NULL),
(294, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1007.00, 12.30, 117, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:49:07', '2026-02-28 06:49:07', '2026-02-28 06:59:07', 'openweathermap', 0, NULL),
(295, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 46, 1007.00, 10.00, 71, 10000, 'Clouds', 'broken clouds', '04d', 78, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:49:07', '2026-02-28 06:49:07', '2026-02-28 06:59:07', 'openweathermap', 0, NULL),
(296, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 48, 1007.00, 2.40, 164, 10000, 'Clouds', 'broken clouds', '04d', 83, NULL, 0.00, 0.00, 0.00, '2026-02-28 06:49:07', '2026-02-28 06:49:07', '2026-02-28 06:59:07', 'openweathermap', 0, NULL),
(297, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1006.00, 25.30, 80, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:11:18', '2026-02-28 07:11:18', '2026-02-28 07:21:18', 'openweathermap', 0, NULL),
(298, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1007.00, 12.30, 117, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:11:19', '2026-02-28 07:11:19', '2026-02-28 07:21:19', 'openweathermap', 0, NULL),
(299, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 46, 1007.00, 10.00, 71, 10000, 'Clouds', 'broken clouds', '04d', 78, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:11:19', '2026-02-28 07:11:19', '2026-02-28 07:21:19', 'openweathermap', 0, NULL),
(300, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 49, 1007.00, 2.40, 164, 10000, 'Clouds', 'broken clouds', '04d', 83, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:11:19', '2026-02-28 07:11:19', '2026-02-28 07:21:19', 'openweathermap', 0, NULL),
(301, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 64, 1006.00, 25.30, 80, 10000, 'Rain', 'light rain', '10d', 52, NULL, 0.15, 0.00, 0.00, '2026-02-28 07:27:17', '2026-02-28 07:27:17', '2026-02-28 07:37:17', 'openweathermap', 0, NULL),
(302, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1007.00, 12.30, 117, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:27:17', '2026-02-28 07:27:17', '2026-02-28 07:37:17', 'openweathermap', 0, NULL),
(303, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 30.00, 46, 1007.00, 10.00, 71, 10000, 'Clouds', 'broken clouds', '04d', 78, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:27:17', '2026-02-28 07:27:17', '2026-02-28 07:37:17', 'openweathermap', 0, NULL),
(304, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 48, 1007.00, 2.40, 164, 10000, 'Clouds', 'broken clouds', '04d', 83, NULL, 0.00, 0.00, 0.00, '2026-02-28 07:27:18', '2026-02-28 07:27:18', '2026-02-28 07:37:18', 'openweathermap', 0, NULL),
(305, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 63, 1006.00, 21.90, 63, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-02-28 08:46:44', '2026-02-28 08:46:44', '2026-02-28 08:56:44', 'openweathermap', 0, NULL),
(306, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 67, 1006.00, 11.30, 74, 10000, 'Clouds', 'few clouds', '02d', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 08:46:45', '2026-02-28 08:46:45', '2026-02-28 08:56:45', 'openweathermap', 0, NULL),
(307, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 27.00, 28.00, 53, 1007.00, 10.70, 64, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-28 08:46:45', '2026-02-28 08:46:45', '2026-02-28 08:56:45', 'openweathermap', 0, NULL),
(308, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 30.00, 54, 1007.00, 2.20, 54, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-02-28 08:46:45', '2026-02-28 08:46:45', '2026-02-28 08:56:45', 'openweathermap', 0, NULL),
(309, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 63, 1006.00, 21.90, 63, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-02-28 09:23:15', '2026-02-28 09:23:15', '2026-02-28 09:33:15', 'openweathermap', 0, NULL),
(310, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 67, 1006.00, 11.30, 74, 10000, 'Clouds', 'few clouds', '02d', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 09:23:15', '2026-02-28 09:23:15', '2026-02-28 09:33:15', 'openweathermap', 0, NULL),
(311, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 27.00, 28.00, 53, 1007.00, 10.70, 64, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-02-28 09:23:15', '2026-02-28 09:23:15', '2026-02-28 09:33:15', 'openweathermap', 0, NULL),
(312, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 30.00, 54, 1007.00, 2.20, 54, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-02-28 09:23:15', '2026-02-28 09:23:15', '2026-02-28 09:33:15', 'openweathermap', 0, NULL),
(313, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 29.00, 68, 1007.00, 18.50, 54, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 10:22:16', '2026-02-28 10:22:16', '2026-02-28 10:32:16', 'openweathermap', 0, NULL),
(314, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1007.00, 11.30, 37, 10000, 'Clouds', 'few clouds', '02n', 21, NULL, 0.00, 0.00, 0.00, '2026-02-28 10:22:17', '2026-02-28 10:22:17', '2026-02-28 10:32:17', 'openweathermap', 0, NULL),
(315, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 66, 1008.00, 8.80, 58, 10000, 'Clouds', 'scattered clouds', '03n', 36, NULL, 0.00, 0.00, 0.00, '2026-02-28 10:22:17', '2026-02-28 10:22:17', '2026-02-28 10:32:17', 'openweathermap', 0, NULL),
(316, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 66, 1008.00, 3.80, 21, 10000, 'Clouds', 'scattered clouds', '03n', 35, NULL, 0.00, 0.00, 0.00, '2026-02-28 10:22:17', '2026-02-28 10:22:17', '2026-02-28 10:32:17', 'openweathermap', 0, NULL),
(317, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 70, 1009.00, 12.40, 45, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:31:18', '2026-02-28 12:31:18', '2026-02-28 12:41:18', 'openweathermap', 0, NULL),
(318, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 71, 1009.00, 9.80, 33, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:31:18', '2026-02-28 12:31:18', '2026-02-28 12:41:18', 'openweathermap', 0, NULL),
(319, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 74, 1010.00, 8.90, 49, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:31:18', '2026-02-28 12:31:18', '2026-02-28 12:41:18', 'openweathermap', 0, NULL),
(320, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 75, 1010.00, 7.20, 62, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:31:18', '2026-02-28 12:31:18', '2026-02-28 12:41:18', 'openweathermap', 0, NULL),
(321, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 70, 1009.00, 12.40, 45, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:51:46', '2026-02-28 12:51:46', '2026-02-28 13:01:46', 'openweathermap', 0, NULL),
(322, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 71, 1009.00, 9.80, 33, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:51:47', '2026-02-28 12:51:47', '2026-02-28 13:01:47', 'openweathermap', 0, NULL),
(323, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 74, 1010.00, 8.90, 49, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:51:47', '2026-02-28 12:51:47', '2026-02-28 13:01:47', 'openweathermap', 0, NULL),
(324, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 75, 1010.00, 7.20, 62, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-02-28 12:51:47', '2026-02-28 12:51:47', '2026-02-28 13:01:47', 'openweathermap', 0, NULL),
(325, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 26.00, 70, 1009.00, 12.40, 45, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-28 13:07:57', '2026-02-28 13:07:57', '2026-02-28 13:17:57', 'openweathermap', 0, NULL),
(326, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 71, 1009.00, 9.80, 33, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-02-28 13:07:57', '2026-02-28 13:07:57', '2026-02-28 13:17:57', 'openweathermap', 0, NULL),
(327, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 74, 1010.00, 8.90, 49, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-02-28 13:07:58', '2026-02-28 13:07:58', '2026-02-28 13:17:58', 'openweathermap', 0, NULL),
(328, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 75, 1010.00, 7.20, 62, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-02-28 13:07:58', '2026-02-28 13:07:58', '2026-02-28 13:17:58', 'openweathermap', 0, NULL),
(329, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 73, 1009.00, 12.80, 39, 10000, 'Clouds', 'scattered clouds', '03n', 41, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:17:31', '2026-02-28 15:17:31', '2026-02-28 15:27:31', 'openweathermap', 0, NULL),
(330, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 71, 1009.00, 9.60, 31, 10000, 'Clouds', 'scattered clouds', '03n', 40, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:17:31', '2026-02-28 15:17:31', '2026-02-28 15:27:31', 'openweathermap', 0, NULL),
(331, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 84, 1009.00, 9.90, 48, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:17:31', '2026-02-28 15:17:31', '2026-02-28 15:27:31', 'openweathermap', 0, NULL),
(332, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 78, 1009.00, 8.20, 63, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:17:31', '2026-02-28 15:17:31', '2026-02-28 15:27:31', 'openweathermap', 0, NULL),
(333, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 75, 1008.00, 12.50, 41, 10000, 'Clouds', 'broken clouds', '04n', 53, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:36:34', '2026-02-28 15:36:34', '2026-02-28 15:46:34', 'openweathermap', 0, NULL),
(334, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 70, 1008.00, 10.20, 34, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:36:34', '2026-02-28 15:36:34', '2026-02-28 15:46:34', 'openweathermap', 0, NULL),
(335, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 89, 1009.00, 9.30, 48, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:36:34', '2026-02-28 15:36:34', '2026-02-28 15:46:34', 'openweathermap', 0, NULL),
(336, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 82, 1009.00, 7.70, 63, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:36:34', '2026-02-28 15:36:34', '2026-02-28 15:46:34', 'openweathermap', 0, NULL),
(337, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1008.00, 12.50, 41, 10000, 'Clouds', 'broken clouds', '04n', 53, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:56:06', '2026-02-28 15:56:06', '2026-02-28 16:06:06', 'openweathermap', 0, NULL),
(338, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 70, 1008.00, 10.20, 34, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:56:07', '2026-02-28 15:56:07', '2026-02-28 16:06:07', 'openweathermap', 0, NULL),
(339, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 89, 1009.00, 9.30, 48, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:56:07', '2026-02-28 15:56:07', '2026-02-28 16:06:07', 'openweathermap', 0, NULL),
(340, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 82, 1009.00, 7.70, 63, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 15:56:07', '2026-02-28 15:56:07', '2026-02-28 16:06:07', 'openweathermap', 0, NULL),
(341, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 76, 1008.00, 12.50, 41, 10000, 'Clouds', 'broken clouds', '04n', 53, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:28:24', '2026-02-28 16:28:24', '2026-02-28 16:38:24', 'openweathermap', 0, NULL),
(342, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 70, 1008.00, 10.20, 34, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:28:25', '2026-02-28 16:28:25', '2026-02-28 16:38:25', 'openweathermap', 0, NULL),
(343, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 89, 1009.00, 9.30, 48, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:28:25', '2026-02-28 16:28:25', '2026-02-28 16:38:25', 'openweathermap', 0, NULL),
(344, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 82, 1009.00, 7.70, 63, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:28:25', '2026-02-28 16:28:25', '2026-02-28 16:38:25', 'openweathermap', 0, NULL),
(345, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 79, 1008.00, 12.90, 43, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:54:01', '2026-02-28 16:54:01', '2026-02-28 17:04:01', 'openweathermap', 0, NULL),
(346, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 70, 1008.00, 9.50, 39, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:54:01', '2026-02-28 16:54:01', '2026-02-28 17:04:01', 'openweathermap', 0, NULL),
(347, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 90, 1008.00, 8.90, 51, 10000, 'Clouds', 'scattered clouds', '03n', 36, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:54:02', '2026-02-28 16:54:02', '2026-02-28 17:04:02', 'openweathermap', 0, NULL),
(348, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 85, 1008.00, 7.30, 70, 10000, 'Clouds', 'scattered clouds', '03n', 38, NULL, 0.00, 0.00, 0.00, '2026-02-28 16:54:02', '2026-02-28 16:54:02', '2026-02-28 17:04:02', 'openweathermap', 0, NULL),
(349, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 80, 1007.00, 12.90, 45, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-02-28 17:55:37', '2026-02-28 17:55:37', '2026-02-28 18:05:37', 'openweathermap', 0, NULL),
(350, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 24.00, 71, 1007.00, 8.50, 40, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-02-28 17:55:37', '2026-02-28 17:55:37', '2026-02-28 18:05:37', 'openweathermap', 0, NULL),
(351, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 91, 1008.00, 8.80, 53, 10000, 'Clouds', 'scattered clouds', '03n', 41, NULL, 0.00, 0.00, 0.00, '2026-02-28 17:55:37', '2026-02-28 17:55:37', '2026-02-28 18:05:37', 'openweathermap', 0, NULL),
(352, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 86, 1008.00, 6.80, 67, 10000, 'Clouds', 'scattered clouds', '03n', 40, NULL, 0.00, 0.00, 0.00, '2026-02-28 17:55:37', '2026-02-28 17:55:37', '2026-02-28 18:05:37', 'openweathermap', 0, NULL),
(353, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 80, 1007.00, 12.90, 45, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-02-28 18:09:33', '2026-02-28 18:09:33', '2026-02-28 18:19:33', 'openweathermap', 0, NULL),
(354, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 24.00, 71, 1007.00, 8.50, 40, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-02-28 18:09:33', '2026-02-28 18:09:33', '2026-02-28 18:19:33', 'openweathermap', 0, NULL),
(355, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 91, 1008.00, 8.80, 53, 10000, 'Clouds', 'scattered clouds', '03n', 41, NULL, 0.00, 0.00, 0.00, '2026-02-28 18:09:34', '2026-02-28 18:09:34', '2026-02-28 18:19:34', 'openweathermap', 0, NULL),
(356, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 86, 1008.00, 6.80, 67, 10000, 'Clouds', 'scattered clouds', '03n', 40, NULL, 0.00, 0.00, 0.00, '2026-02-28 18:09:34', '2026-02-28 18:09:34', '2026-02-28 18:19:34', 'openweathermap', 0, NULL),
(357, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 67, 1010.00, 8.60, 52, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-03-01 00:33:48', '2026-03-01 00:33:48', '2026-03-01 00:43:48', 'openweathermap', 0, NULL),
(358, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 71, 1010.00, 6.00, 0, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-03-01 00:33:48', '2026-03-01 00:33:48', '2026-03-01 00:43:48', 'openweathermap', 0, NULL),
(359, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 29.00, 60, 1010.00, 10.20, 55, 10000, 'Clear', 'clear sky', '01d', 6, NULL, 0.00, 0.00, 0.00, '2026-03-01 00:33:48', '2026-03-01 00:33:48', '2026-03-01 00:43:48', 'openweathermap', 0, NULL),
(360, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 31.00, 58, 1010.00, 4.60, 50, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-03-01 00:33:48', '2026-03-01 00:33:48', '2026-03-01 00:43:48', 'openweathermap', 0, NULL),
(361, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 32.00, 67, 1009.00, 17.70, 76, 10000, 'Clouds', 'few clouds', '02d', 20, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:38:15', '2026-03-01 02:38:15', '2026-03-01 02:48:15', 'openweathermap', 0, NULL),
(362, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1010.00, 9.90, 220, 10000, 'Clouds', 'scattered clouds', '03d', 32, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:38:15', '2026-03-01 02:38:15', '2026-03-01 02:48:15', 'openweathermap', 0, NULL),
(363, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 31.00, 56, 1010.00, 16.00, 68, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:38:15', '2026-03-01 02:38:15', '2026-03-01 02:48:15', 'openweathermap', 0, NULL),
(364, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 54, 1009.00, 4.10, 120, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:38:16', '2026-03-01 02:38:16', '2026-03-01 02:48:16', 'openweathermap', 0, NULL),
(365, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 32.00, 67, 1009.00, 17.70, 76, 10000, 'Clouds', 'few clouds', '02d', 20, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:51:57', '2026-03-01 02:51:57', '2026-03-01 03:01:57', 'openweathermap', 0, NULL),
(366, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1010.00, 9.90, 220, 10000, 'Clouds', 'scattered clouds', '03d', 32, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:51:57', '2026-03-01 02:51:57', '2026-03-01 03:01:57', 'openweathermap', 0, NULL),
(367, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 31.00, 56, 1010.00, 16.00, 68, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:51:57', '2026-03-01 02:51:57', '2026-03-01 03:01:57', 'openweathermap', 0, NULL),
(368, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 54, 1009.00, 4.10, 120, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-03-01 02:51:57', '2026-03-01 02:51:57', '2026-03-01 03:01:57', 'openweathermap', 0, NULL),
(369, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 33.00, 68, 1009.00, 17.70, 76, 10000, 'Clouds', 'few clouds', '02d', 20, NULL, 0.00, 0.00, 0.00, '2026-03-01 03:21:45', '2026-03-01 03:21:45', '2026-03-01 03:31:45', 'openweathermap', 0, NULL),
(370, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 27.00, 75, 1010.00, 9.90, 220, 10000, 'Clouds', 'scattered clouds', '03d', 32, NULL, 0.00, 0.00, 0.00, '2026-03-01 03:21:45', '2026-03-01 03:21:45', '2026-03-01 03:31:45', 'openweathermap', 0, NULL),
(371, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 29.00, 31.00, 56, 1010.00, 16.00, 68, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-03-01 03:21:45', '2026-03-01 03:21:45', '2026-03-01 03:31:45', 'openweathermap', 0, NULL),
(372, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 54, 1009.00, 4.10, 120, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-03-01 03:21:45', '2026-03-01 03:21:45', '2026-03-01 03:31:45', 'openweathermap', 0, NULL),
(373, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 32.00, 70, 1007.00, 2.70, 358, 10000, 'Clouds', 'broken clouds', '04d', 66, NULL, 0.00, 0.00, 0.00, '2026-03-01 08:12:10', '2026-03-01 08:12:10', '2026-03-01 08:22:10', 'openweathermap', 0, NULL),
(374, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 70, 1007.00, 9.10, 302, 10000, 'Clouds', 'broken clouds', '04d', 84, NULL, 0.00, 0.00, 0.00, '2026-03-01 08:12:10', '2026-03-01 08:12:10', '2026-03-01 08:22:10', 'openweathermap', 0, NULL),
(375, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 30.00, 63, 1007.00, 3.90, 87, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-03-01 08:12:10', '2026-03-01 08:12:10', '2026-03-01 08:22:10', 'openweathermap', 0, NULL),
(376, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 32.00, 62, 1007.00, 3.90, 244, 10000, 'Clouds', 'overcast clouds', '04d', 89, NULL, 0.00, 0.00, 0.00, '2026-03-01 08:12:10', '2026-03-01 08:12:10', '2026-03-01 08:22:10', 'openweathermap', 0, NULL),
(377, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 29.00, 79, 1009.00, 6.70, 315, 10000, 'Clouds', 'scattered clouds', '03n', 42, NULL, 0.00, 0.00, 0.00, '2026-03-01 12:16:28', '2026-03-01 12:16:28', '2026-03-01 12:26:28', 'openweathermap', 0, NULL),
(378, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1009.00, 7.30, 328, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-03-01 12:16:28', '2026-03-01 12:16:28', '2026-03-01 12:26:28', 'openweathermap', 0, NULL),
(379, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 24.00, 87, 1010.00, 3.80, 22, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-03-01 12:16:28', '2026-03-01 12:16:28', '2026-03-01 12:26:28', 'openweathermap', 0, NULL),
(380, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 85, 1010.00, 2.30, 37, 10000, 'Clouds', 'broken clouds', '04n', 68, NULL, 0.00, 0.00, 0.00, '2026-03-01 12:16:28', '2026-03-01 12:16:28', '2026-03-01 12:26:28', 'openweathermap', 0, NULL),
(381, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 31.00, 82, 1010.00, 4.90, 3, 10000, 'Clouds', 'overcast clouds', '04n', 90, NULL, 0.00, 0.00, 0.00, '2026-03-02 10:55:12', '2026-03-02 10:55:12', '2026-03-02 11:05:12', 'openweathermap', 0, NULL),
(382, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 81, 1009.00, 13.80, 325, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-03-02 10:55:12', '2026-03-02 10:55:12', '2026-03-02 11:05:12', 'openweathermap', 0, NULL),
(383, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 25.00, 89, 1010.00, 2.40, 83, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-03-02 10:55:12', '2026-03-02 10:55:12', '2026-03-02 11:05:12', 'openweathermap', 0, NULL),
(384, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 86, 1010.00, 1.70, 330, 10000, 'Clouds', 'overcast clouds', '04n', 88, NULL, 0.00, 0.00, 0.00, '2026-03-02 10:55:12', '2026-03-02 10:55:12', '2026-03-02 11:05:12', 'openweathermap', 0, NULL),
(385, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 30.00, 83, 1010.00, 5.90, 22, 10000, 'Clouds', 'broken clouds', '04n', 80, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:15:30', '2026-03-02 12:15:30', '2026-03-02 12:25:30', 'openweathermap', 0, NULL),
(386, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 81, 1010.00, 11.20, 347, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:15:30', '2026-03-02 12:15:30', '2026-03-02 12:25:30', 'openweathermap', 0, NULL),
(387, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 24.00, 92, 1011.00, 4.30, 53, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:15:30', '2026-03-02 12:15:30', '2026-03-02 12:25:30', 'openweathermap', 0, NULL),
(388, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 89, 1011.00, 4.60, 44, 10000, 'Clouds', 'overcast clouds', '04n', 88, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:15:30', '2026-03-02 12:15:30', '2026-03-02 12:25:30', 'openweathermap', 0, NULL),
(389, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 83, 1011.00, 8.70, 49, 10000, 'Clouds', 'scattered clouds', '03n', 32, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:53:55', '2026-03-02 12:53:55', '2026-03-02 13:03:55', 'openweathermap', 0, NULL),
(390, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 82, 1011.00, 8.40, 19, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:53:55', '2026-03-02 12:53:55', '2026-03-02 13:03:55', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(391, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 24.00, 92, 1011.00, 6.30, 57, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:53:55', '2026-03-02 12:53:55', '2026-03-02 13:03:55', 'openweathermap', 0, NULL),
(392, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 91, 1011.00, 5.90, 67, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-03-02 12:53:55', '2026-03-02 12:53:55', '2026-03-02 13:03:55', 'openweathermap', 0, NULL),
(393, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 83, 1011.00, 8.70, 49, 10000, 'Clouds', 'scattered clouds', '03n', 32, NULL, 0.00, 0.00, 0.00, '2026-03-02 13:27:52', '2026-03-02 13:27:52', '2026-03-02 13:37:52', 'openweathermap', 0, NULL),
(394, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 80, 1011.00, 8.40, 19, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-03-02 13:27:52', '2026-03-02 13:27:52', '2026-03-02 13:37:52', 'openweathermap', 0, NULL),
(395, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 23.00, 92, 1011.00, 6.30, 57, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-03-02 13:27:53', '2026-03-02 13:27:53', '2026-03-02 13:37:53', 'openweathermap', 0, NULL),
(396, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 90, 1011.00, 5.90, 67, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-03-02 13:27:53', '2026-03-02 13:27:53', '2026-03-02 13:37:53', 'openweathermap', 0, NULL),
(397, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 84, 1011.00, 10.20, 53, 10000, 'Clouds', 'few clouds', '02n', 24, NULL, 0.00, 0.00, 0.00, '2026-03-02 14:08:48', '2026-03-02 14:08:48', '2026-03-02 14:18:48', 'openweathermap', 0, NULL),
(398, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 81, 1011.00, 8.50, 56, 10000, 'Clouds', 'few clouds', '02n', 15, NULL, 0.00, 0.00, 0.00, '2026-03-02 14:08:48', '2026-03-02 14:08:48', '2026-03-02 14:18:48', 'openweathermap', 0, NULL),
(399, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 92, 1011.00, 7.20, 50, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-03-02 14:08:48', '2026-03-02 14:08:48', '2026-03-02 14:18:48', 'openweathermap', 0, NULL),
(400, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 91, 1011.00, 6.90, 71, 10000, 'Clouds', 'broken clouds', '04n', 51, NULL, 0.00, 0.00, 0.00, '2026-03-02 14:08:48', '2026-03-02 14:08:48', '2026-03-02 14:18:48', 'openweathermap', 0, NULL),
(401, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 35.00, 64, 1001.00, 7.00, 3, 6433, 'Thunderstorm', 'thunderstorm with rain', '11d', 46, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:12:53', '2026-03-03 00:12:53', '2026-03-03 00:22:53', 'openweathermap', 0, NULL),
(402, 2, 12.23800000, 121.06900000, 'Arangin Falls', 22.00, 26.00, 61, 1015.00, 12.00, 4, 14695, 'Rain', 'light rain', '10d', 28, NULL, 9.15, 0.00, 0.00, '2026-03-03 00:12:58', '2026-03-03 00:12:58', '2026-03-03 00:22:58', 'openweathermap', 0, NULL),
(403, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 34.00, 33.00, 76, 1025.00, 17.00, 143, 10818, 'Clear', 'clear sky', '01d', 48, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:13:03', '2026-03-03 00:13:03', '2026-03-03 00:23:03', 'openweathermap', 0, NULL),
(404, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 31.00, 61, 1041.00, 9.00, 344, 14545, 'Mist', 'mist', '50d', 39, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:13:08', '2026-03-03 00:13:08', '2026-03-03 00:23:08', 'openweathermap', 0, NULL),
(405, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 31.00, 40, 1032.00, 5.00, 205, 10876, 'Clouds', 'scattered clouds', '03d', 51, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:28:17', '2026-03-03 00:28:17', '2026-03-03 00:38:17', 'openweathermap', 0, NULL),
(406, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 24.00, 47, 1037.00, 10.00, 192, 13117, 'Clear', 'clear sky', '01d', 85, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:28:22', '2026-03-03 00:28:22', '2026-03-03 00:38:22', 'openweathermap', 0, NULL),
(407, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 25.00, 64, 1002.00, 12.00, 129, 6659, 'Clouds', 'scattered clouds', '03d', 0, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:28:27', '2026-03-03 00:28:27', '2026-03-03 00:38:27', 'openweathermap', 0, NULL),
(408, 4, 12.44130000, 121.15300000, 'Naujan Lake', 21.00, 30.00, 62, 1049.00, 17.00, 319, 9396, 'Mist', 'mist', '50d', 3, NULL, 0.00, 0.00, 0.00, '2026-03-03 00:28:32', '2026-03-03 00:28:32', '2026-03-03 00:38:32', 'openweathermap', 0, NULL),
(409, 1, 12.27100000, 121.19400000, '333 Steps', 22.00, 22.00, 58, 1029.00, 10.00, 197, 14606, 'Clouds', 'scattered clouds', '03d', 14, NULL, 0.00, 0.00, 0.00, '2026-03-03 01:07:20', '2026-03-03 01:07:20', '2026-03-03 01:17:20', 'openweathermap', 0, NULL),
(410, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 36.00, 43, 1043.00, 12.00, 13, 8899, 'Clear', 'clear sky', '01d', 71, NULL, 0.00, 0.00, 0.00, '2026-03-03 01:07:25', '2026-03-03 01:07:25', '2026-03-03 01:17:25', 'openweathermap', 0, NULL),
(411, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 36.00, 43, 1023.00, 8.00, 254, 13855, 'Mist', 'mist', '50d', 35, NULL, 0.00, 0.00, 0.00, '2026-03-03 01:07:30', '2026-03-03 01:07:30', '2026-03-03 01:17:30', 'openweathermap', 0, NULL),
(412, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 27.00, 47, 1005.00, 16.00, 11, 13016, 'Clear', 'clear sky', '01d', 93, NULL, 0.00, 0.00, 0.00, '2026-03-03 01:07:35', '2026-03-03 01:07:35', '2026-03-03 01:17:35', 'openweathermap', 0, NULL),
(413, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 81, 1010.00, 19.70, 45, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 16:41:39', '2026-03-04 16:41:39', '2026-03-04 16:51:39', 'openweathermap', 0, NULL),
(414, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 77, 1010.00, 15.30, 47, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-03-04 16:41:39', '2026-03-04 16:41:39', '2026-03-04 16:51:39', 'openweathermap', 0, NULL),
(415, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 90, 1010.00, 10.70, 51, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 16:41:39', '2026-03-04 16:41:39', '2026-03-04 16:51:39', 'openweathermap', 0, NULL),
(416, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 86, 1010.00, 9.50, 57, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 16:41:39', '2026-03-04 16:41:39', '2026-03-04 16:51:39', 'openweathermap', 0, NULL),
(417, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 81, 1010.00, 19.70, 45, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:05:16', '2026-03-04 17:05:16', '2026-03-04 17:15:16', 'openweathermap', 0, NULL),
(418, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 77, 1010.00, 15.30, 47, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:05:16', '2026-03-04 17:05:16', '2026-03-04 17:15:16', 'openweathermap', 0, NULL),
(419, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 90, 1010.00, 10.70, 51, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:05:16', '2026-03-04 17:05:16', '2026-03-04 17:15:16', 'openweathermap', 0, NULL),
(420, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 86, 1010.00, 9.50, 57, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:05:16', '2026-03-04 17:05:16', '2026-03-04 17:15:16', 'openweathermap', 0, NULL),
(421, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 81, 1010.00, 19.70, 45, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:20:10', '2026-03-04 17:20:10', '2026-03-04 17:30:10', 'openweathermap', 0, NULL),
(422, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 77, 1010.00, 15.30, 47, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:20:10', '2026-03-04 17:20:10', '2026-03-04 17:30:10', 'openweathermap', 0, NULL),
(423, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 22.00, 90, 1010.00, 10.70, 51, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:20:10', '2026-03-04 17:20:10', '2026-03-04 17:30:10', 'openweathermap', 0, NULL),
(424, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 86, 1010.00, 9.50, 57, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:20:11', '2026-03-04 17:20:11', '2026-03-04 17:30:11', 'openweathermap', 0, NULL),
(425, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 82, 1009.00, 17.90, 51, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:30:57', '2026-03-04 17:30:57', '2026-03-04 17:40:57', 'openweathermap', 0, NULL),
(426, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 78, 1009.00, 14.10, 60, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:30:57', '2026-03-04 17:30:57', '2026-03-04 17:40:57', 'openweathermap', 0, NULL),
(427, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 90, 1010.00, 9.90, 55, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:30:57', '2026-03-04 17:30:57', '2026-03-04 17:40:57', 'openweathermap', 0, NULL),
(428, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 87, 1010.00, 9.10, 66, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-03-04 17:30:57', '2026-03-04 17:30:57', '2026-03-04 17:40:57', 'openweathermap', 0, NULL),
(429, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 82, 1009.00, 17.30, 50, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:09:18', '2026-03-04 18:09:18', '2026-03-04 18:19:18', 'openweathermap', 0, NULL),
(430, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 78, 1009.00, 13.40, 59, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:09:18', '2026-03-04 18:09:18', '2026-03-04 18:19:18', 'openweathermap', 0, NULL),
(431, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 90, 1010.00, 9.80, 53, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:09:19', '2026-03-04 18:09:19', '2026-03-04 18:19:19', 'openweathermap', 0, NULL),
(432, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 87, 1010.00, 8.90, 65, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:09:19', '2026-03-04 18:09:19', '2026-03-04 18:19:19', 'openweathermap', 0, NULL),
(433, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 82, 1009.00, 17.30, 50, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:23:47', '2026-03-04 18:23:47', '2026-03-04 18:33:47', 'openweathermap', 0, NULL),
(434, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 78, 1009.00, 13.40, 59, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:23:47', '2026-03-04 18:23:47', '2026-03-04 18:33:47', 'openweathermap', 0, NULL),
(435, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 21.00, 21.00, 90, 1010.00, 9.80, 53, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:23:47', '2026-03-04 18:23:47', '2026-03-04 18:33:47', 'openweathermap', 0, NULL),
(436, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 87, 1010.00, 8.90, 65, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:23:47', '2026-03-04 18:23:47', '2026-03-04 18:33:47', 'openweathermap', 0, NULL),
(437, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 25.00, 80, 1009.00, 16.70, 51, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:33:59', '2026-03-04 18:33:59', '2026-03-04 18:43:59', 'openweathermap', 0, NULL),
(438, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 78, 1009.00, 12.60, 65, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:33:59', '2026-03-04 18:33:59', '2026-03-04 18:43:59', 'openweathermap', 0, NULL),
(439, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 21.00, 90, 1010.00, 9.80, 55, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:33:59', '2026-03-04 18:33:59', '2026-03-04 18:43:59', 'openweathermap', 0, NULL),
(440, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 88, 1010.00, 8.50, 69, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-03-04 18:33:59', '2026-03-04 18:33:59', '2026-03-04 18:43:59', 'openweathermap', 0, NULL),
(441, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 31.00, 62, 1009.00, 36.80, 81, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:03:48', '2026-03-05 05:03:48', '2026-03-05 05:13:48', 'openweathermap', 0, NULL),
(442, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 66, 1008.00, 32.50, 101, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:03:49', '2026-03-05 05:03:49', '2026-03-05 05:13:49', 'openweathermap', 0, NULL),
(443, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 45, 1009.00, 19.80, 72, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:03:49', '2026-03-05 05:03:49', '2026-03-05 05:13:49', 'openweathermap', 0, NULL),
(444, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 45, 1009.00, 5.00, 87, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:03:49', '2026-03-05 05:03:49', '2026-03-05 05:13:49', 'openweathermap', 0, NULL),
(445, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 31.00, 61, 1009.00, 36.80, 81, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:27:58', '2026-03-05 05:27:58', '2026-03-05 05:37:58', 'openweathermap', 0, NULL),
(446, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 65, 1008.00, 32.50, 101, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:27:58', '2026-03-05 05:27:58', '2026-03-05 05:37:58', 'openweathermap', 0, NULL),
(447, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 30.00, 30.00, 43, 1009.00, 19.80, 72, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:27:58', '2026-03-05 05:27:58', '2026-03-05 05:37:58', 'openweathermap', 0, NULL),
(448, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 43, 1009.00, 5.00, 87, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-03-05 05:27:58', '2026-03-05 05:27:58', '2026-03-05 05:37:58', 'openweathermap', 0, NULL),
(449, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 74, 1011.00, 6.00, 21, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:15:18', '2026-03-06 14:15:18', '2026-03-06 14:25:18', 'openweathermap', 0, NULL),
(450, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1011.00, 9.10, 355, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:15:18', '2026-03-06 14:15:18', '2026-03-06 14:25:18', 'openweathermap', 0, NULL),
(451, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 23.00, 23.00, 83, 1011.00, 5.20, 46, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:15:18', '2026-03-06 14:15:18', '2026-03-06 14:25:18', 'openweathermap', 0, NULL),
(452, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 81, 1011.00, 4.60, 54, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:15:19', '2026-03-06 14:15:19', '2026-03-06 14:25:19', 'openweathermap', 0, NULL),
(453, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 74, 1011.00, 4.20, 18, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:34:24', '2026-03-06 14:34:24', '2026-03-06 14:44:24', 'openweathermap', 0, NULL),
(454, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1011.00, 7.70, 357, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:34:24', '2026-03-06 14:34:24', '2026-03-06 14:44:24', 'openweathermap', 0, NULL),
(455, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 84, 1011.00, 4.40, 43, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:34:25', '2026-03-06 14:34:25', '2026-03-06 14:44:25', 'openweathermap', 0, NULL),
(456, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 4.10, 53, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:34:25', '2026-03-06 14:34:25', '2026-03-06 14:44:25', 'openweathermap', 0, NULL),
(457, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 74, 1011.00, 4.20, 18, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:51:20', '2026-03-06 14:51:20', '2026-03-06 15:01:20', 'openweathermap', 0, NULL),
(458, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1011.00, 7.70, 357, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:51:20', '2026-03-06 14:51:20', '2026-03-06 15:01:20', 'openweathermap', 0, NULL),
(459, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 23.00, 84, 1011.00, 4.40, 43, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:51:20', '2026-03-06 14:51:20', '2026-03-06 15:01:20', 'openweathermap', 0, NULL),
(460, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 4.10, 53, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-03-06 14:51:20', '2026-03-06 14:51:20', '2026-03-06 15:01:20', 'openweathermap', 0, NULL),
(461, 1, 12.27100000, 121.19400000, '333 Steps', 29.00, 30.00, 55, 1010.00, 40.40, 55, 10000, 'Clear', 'clear sky', '01d', 3, NULL, 0.00, 0.00, 0.00, '2026-03-10 07:28:08', '2026-03-10 07:28:08', '2026-03-10 07:38:08', 'openweathermap', 0, NULL),
(462, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 29.00, 59, 1009.00, 22.00, 56, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-03-10 07:28:09', '2026-03-10 07:28:09', '2026-03-10 07:38:09', 'openweathermap', 0, NULL),
(463, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 28.00, 46, 1010.00, 28.30, 48, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-03-10 07:28:09', '2026-03-10 07:28:09', '2026-03-10 07:38:09', 'openweathermap', 0, NULL),
(464, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 31.00, 44, 1009.00, 12.60, 42, 10000, 'Rain', 'light rain', '10d', 31, NULL, 0.13, 0.00, 0.00, '2026-03-10 07:28:09', '2026-03-10 07:28:09', '2026-03-10 07:38:09', 'openweathermap', 0, NULL),
(465, 1, 12.27100000, 121.19400000, '333 Steps', 28.00, 30.00, 58, 1010.00, 38.30, 55, 10000, 'Rain', 'light rain', '10d', 5, NULL, 0.18, 0.00, 0.00, '2026-03-10 07:46:02', '2026-03-10 07:46:02', '2026-03-10 07:56:02', 'openweathermap', 0, NULL),
(466, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 62, 1009.00, 17.20, 56, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-03-10 07:46:02', '2026-03-10 07:46:02', '2026-03-10 07:56:02', 'openweathermap', 0, NULL),
(467, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 28.00, 28.00, 48, 1010.00, 25.80, 49, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-03-10 07:46:02', '2026-03-10 07:46:02', '2026-03-10 07:56:02', 'openweathermap', 0, NULL),
(468, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 30.00, 48, 1009.00, 10.20, 46, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-03-10 07:46:02', '2026-03-10 07:46:02', '2026-03-10 07:56:02', 'openweathermap', 0, NULL),
(469, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 69, 1012.00, 33.00, 42, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-03-10 12:24:38', '2026-03-10 12:24:38', '2026-03-10 12:34:38', 'openweathermap', 0, NULL),
(470, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 66, 1012.00, 23.50, 52, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-03-10 12:24:39', '2026-03-10 12:24:39', '2026-03-10 12:34:39', 'openweathermap', 0, NULL),
(471, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 75, 1013.00, 17.30, 43, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-03-10 12:24:40', '2026-03-10 12:24:40', '2026-03-10 12:34:40', 'openweathermap', 0, NULL),
(472, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 71, 1012.00, 13.30, 60, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-03-10 12:24:40', '2026-03-10 12:24:40', '2026-03-10 12:34:40', 'openweathermap', 0, NULL),
(473, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 29.00, 63, 1011.00, 44.90, 58, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-03-13 05:42:50', '2026-03-13 05:42:50', '2026-03-13 05:52:50', 'openweathermap', 0, NULL),
(474, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 63, 1011.00, 42.00, 63, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-03-13 05:42:50', '2026-03-13 05:42:50', '2026-03-13 05:52:50', 'openweathermap', 0, NULL),
(475, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 26.00, 26.00, 59, 1012.00, 29.20, 51, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-03-13 05:42:50', '2026-03-13 05:42:50', '2026-03-13 05:52:50', 'openweathermap', 0, NULL),
(476, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 29.00, 53, 1011.00, 25.80, 56, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 05:42:50', '2026-03-13 05:42:50', '2026-03-13 05:52:50', 'openweathermap', 0, NULL),
(477, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 65, 1011.00, 45.10, 48, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:21:06', '2026-03-13 08:21:06', '2026-03-13 08:31:06', 'openweathermap', 0, NULL),
(478, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 65, 1010.00, 48.10, 59, 10000, 'Clouds', 'scattered clouds', '03d', 39, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:21:06', '2026-03-13 08:21:06', '2026-03-13 08:31:06', 'openweathermap', 0, NULL),
(479, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 25.00, 25.00, 62, 1011.00, 30.40, 45, 10000, 'Clouds', 'scattered clouds', '03d', 29, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:21:06', '2026-03-13 08:21:06', '2026-03-13 08:31:06', 'openweathermap', 0, NULL),
(480, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 55, 1010.00, 31.00, 49, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:21:06', '2026-03-13 08:21:06', '2026-03-13 08:31:06', 'openweathermap', 0, NULL),
(481, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 65, 1011.00, 41.10, 50, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:35:25', '2026-03-13 08:35:25', '2026-03-13 08:45:25', 'openweathermap', 0, NULL),
(482, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 66, 1011.00, 43.80, 58, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:35:25', '2026-03-13 08:35:25', '2026-03-13 08:45:25', 'openweathermap', 0, NULL),
(483, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 65, 1011.00, 29.30, 44, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:35:25', '2026-03-13 08:35:25', '2026-03-13 08:45:25', 'openweathermap', 0, NULL),
(484, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 60, 1011.00, 26.80, 50, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:35:25', '2026-03-13 08:35:25', '2026-03-13 08:45:25', 'openweathermap', 0, NULL),
(485, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 66, 1011.00, 41.10, 50, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:57:22', '2026-03-13 08:57:22', '2026-03-13 09:07:22', 'openweathermap', 0, NULL),
(486, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 66, 1011.00, 43.80, 58, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:57:22', '2026-03-13 08:57:22', '2026-03-13 09:07:22', 'openweathermap', 0, NULL),
(487, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 66, 1011.00, 29.30, 44, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:57:22', '2026-03-13 08:57:22', '2026-03-13 09:07:22', 'openweathermap', 0, NULL),
(488, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 60, 1011.00, 26.80, 50, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 08:57:22', '2026-03-13 08:57:22', '2026-03-13 09:07:22', 'openweathermap', 0, NULL),
(489, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 66, 1011.00, 41.10, 50, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-03-13 09:10:27', '2026-03-13 09:10:27', '2026-03-13 09:20:27', 'openweathermap', 0, NULL),
(490, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 66, 1011.00, 43.80, 58, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-03-13 09:10:27', '2026-03-13 09:10:27', '2026-03-13 09:20:27', 'openweathermap', 0, NULL),
(491, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 66, 1011.00, 29.30, 44, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 09:10:27', '2026-03-13 09:10:27', '2026-03-13 09:20:27', 'openweathermap', 0, NULL),
(492, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 60, 1011.00, 26.80, 50, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-03-13 09:10:27', '2026-03-13 09:10:27', '2026-03-13 09:20:27', 'openweathermap', 0, NULL),
(493, 1, 12.27100000, 121.19400000, '333 Steps', 25.00, 25.00, 69, 1012.00, 45.70, 48, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:01:48', '2026-03-13 11:01:48', '2026-03-13 11:11:48', 'openweathermap', 0, NULL),
(494, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 25.00, 69, 1012.00, 44.90, 59, 10000, 'Clouds', 'scattered clouds', '03n', 27, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:01:48', '2026-03-13 11:01:48', '2026-03-13 11:11:48', 'openweathermap', 0, NULL),
(495, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 22.00, 22.00, 73, 1013.00, 29.80, 45, 10000, 'Clouds', 'few clouds', '02n', 22, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:01:48', '2026-03-13 11:01:48', '2026-03-13 11:11:48', 'openweathermap', 0, NULL),
(496, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 71, 1012.00, 24.60, 54, 10000, 'Clouds', 'few clouds', '02n', 22, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:01:48', '2026-03-13 11:01:48', '2026-03-13 11:11:48', 'openweathermap', 0, NULL),
(497, 1, 12.27100000, 121.19400000, '333 Steps', 32.00, 30.00, 53, 1020.00, 6.00, 345, 5896, 'Rain', 'light rain', '10d', 74, NULL, 5.84, 0.00, 0.00, '2026-03-13 11:20:39', '2026-03-13 11:20:39', '2026-03-13 11:30:39', 'openweathermap', 0, NULL),
(498, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 26.00, 42, 1049.00, 3.00, 173, 11554, 'Rain', 'light rain', '10d', 61, NULL, 6.96, 0.00, 0.00, '2026-03-13 11:20:44', '2026-03-13 11:20:44', '2026-03-13 11:30:44', 'openweathermap', 0, NULL),
(499, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 31.00, 33.00, 56, 1040.00, 12.00, 91, 5137, 'Mist', 'mist', '50d', 60, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:20:49', '2026-03-13 11:20:49', '2026-03-13 11:30:49', 'openweathermap', 0, NULL),
(500, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 26.00, 64, 1043.00, 15.00, 108, 8328, 'Clouds', 'scattered clouds', '03d', 20, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:20:54', '2026-03-13 11:20:54', '2026-03-13 11:30:54', 'openweathermap', 0, NULL),
(501, 1, 12.27100000, 121.19400000, '333 Steps', 27.00, 23.00, 44, 1006.00, 2.00, 358, 5402, 'Clear', 'clear sky', '01d', 15, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:31:32', '2026-03-13 11:31:32', '2026-03-13 11:41:32', 'openweathermap', 0, NULL),
(502, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 28.00, 65, 1032.00, 1.00, 134, 12454, 'Thunderstorm', 'thunderstorm with rain', '11d', 23, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:31:37', '2026-03-13 11:31:37', '2026-03-13 11:41:37', 'openweathermap', 0, NULL),
(503, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 33.00, 36.00, 57, 1001.00, 10.00, 196, 6700, 'Rain', 'light rain', '10d', 49, NULL, 4.31, 0.00, 0.00, '2026-03-13 11:31:42', '2026-03-13 11:31:42', '2026-03-13 11:41:42', 'openweathermap', 0, NULL),
(504, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 73, 1013.00, 26.10, 59, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-03-13 11:31:42', '2026-03-13 11:31:42', '2026-03-13 11:41:42', 'openweathermap', 0, NULL),
(505, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 57, 1013.00, 48.80, 54, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-03-14 07:52:13', '2026-03-14 07:52:13', '2026-03-14 08:02:13', 'openweathermap', 0, NULL),
(506, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 58, 1012.00, 45.00, 63, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-03-14 07:52:13', '2026-03-14 07:52:13', '2026-03-14 08:02:13', 'openweathermap', 0, NULL),
(507, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 52, 1013.00, 35.80, 49, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-03-14 07:52:13', '2026-03-14 07:52:13', '2026-03-14 08:02:13', 'openweathermap', 0, NULL),
(508, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 47, 1012.00, 25.90, 57, 10000, 'Clear', 'clear sky', '01d', 10, NULL, 0.00, 0.00, 0.00, '2026-03-14 07:52:13', '2026-03-14 07:52:13', '2026-03-14 08:02:13', 'openweathermap', 0, NULL),
(509, 1, 12.27100000, 121.19400000, '333 Steps', 26.00, 26.00, 57, 1013.00, 48.80, 54, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-03-14 08:10:29', '2026-03-14 08:10:29', '2026-03-14 08:20:29', 'openweathermap', 0, NULL),
(510, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 58, 1012.00, 45.00, 63, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-03-14 08:10:30', '2026-03-14 08:10:30', '2026-03-14 08:20:30', 'openweathermap', 0, NULL),
(511, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 24.00, 24.00, 52, 1013.00, 35.80, 49, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-03-14 08:10:30', '2026-03-14 08:10:30', '2026-03-14 08:20:30', 'openweathermap', 0, NULL),
(512, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 27.00, 47, 1012.00, 25.90, 57, 10000, 'Clear', 'clear sky', '01d', 10, NULL, 0.00, 0.00, 0.00, '2026-03-14 08:10:30', '2026-03-14 08:10:30', '2026-03-14 08:20:30', 'openweathermap', 0, NULL),
(513, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 69, 1015.00, 31.80, 42, 10000, 'Clouds', 'few clouds', '02n', 22, NULL, 0.00, 0.00, 0.00, '2026-03-15 12:41:20', '2026-03-15 12:41:20', '2026-03-15 12:51:20', 'openweathermap', 0, NULL),
(514, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 66, 1014.00, 32.30, 57, 10000, 'Clouds', 'broken clouds', '04n', 65, NULL, 0.00, 0.00, 0.00, '2026-03-15 12:41:20', '2026-03-15 12:41:20', '2026-03-15 12:51:20', 'openweathermap', 0, NULL),
(515, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 75, 1015.00, 17.30, 47, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-03-15 12:41:20', '2026-03-15 12:41:20', '2026-03-15 12:51:20', 'openweathermap', 0, NULL),
(516, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 75, 1015.00, 15.80, 62, 10000, 'Clouds', 'scattered clouds', '03n', 28, NULL, 0.00, 0.00, 0.00, '2026-03-15 12:41:20', '2026-03-15 12:41:20', '2026-03-15 12:51:20', 'openweathermap', 0, NULL),
(517, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 71, 1015.00, 31.80, 42, 10000, 'Clouds', 'few clouds', '02n', 22, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:08:19', '2026-03-15 13:08:19', '2026-03-15 13:18:19', 'openweathermap', 0, NULL),
(518, 2, 12.23800000, 121.06900000, 'Arangin Falls', 23.00, 23.00, 70, 1015.00, 32.30, 57, 10000, 'Clouds', 'broken clouds', '04n', 65, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:08:19', '2026-03-15 13:08:19', '2026-03-15 13:18:19', 'openweathermap', 0, NULL),
(519, 3, 12.43990000, 121.25100000, 'Naujan Town Plaza', 20.00, 20.00, 76, 1016.00, 17.30, 47, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:08:19', '2026-03-15 13:08:19', '2026-03-15 13:18:19', 'openweathermap', 0, NULL),
(520, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 76, 1015.00, 15.80, 62, 10000, 'Clouds', 'scattered clouds', '03n', 28, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:08:19', '2026-03-15 13:08:19', '2026-03-15 13:18:19', 'openweathermap', 0, NULL),
(521, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 65, 1015.00, 36.60, 52, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:35:24', '2026-03-15 13:35:24', '2026-03-15 13:45:24', 'openweathermap', 0, NULL),
(522, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 65, 1015.00, 36.60, 52, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:49:42', '2026-03-15 13:49:42', '2026-03-15 13:59:42', 'openweathermap', 0, NULL),
(523, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 65, 1015.00, 36.60, 52, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-03-15 13:59:45', '2026-03-15 13:59:45', '2026-03-15 14:09:45', 'openweathermap', 0, NULL),
(524, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 65, 1015.00, 36.60, 52, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-03-15 14:10:42', '2026-03-15 14:10:42', '2026-03-15 14:20:42', 'openweathermap', 0, NULL),
(525, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 65, 1015.00, 36.60, 52, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-03-15 14:24:13', '2026-03-15 14:24:13', '2026-03-15 14:34:13', 'openweathermap', 0, NULL),
(526, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 68, 1015.00, 37.20, 48, 10000, 'Clouds', 'few clouds', '02n', 14, NULL, 0.00, 0.00, 0.00, '2026-03-15 14:38:41', '2026-03-15 14:38:41', '2026-03-15 14:48:41', 'openweathermap', 0, NULL),
(527, 1, 12.27100000, 121.19400000, '333 Steps', 24.00, 24.00, 68, 1015.00, 37.20, 48, 10000, 'Clouds', 'few clouds', '02n', 14, NULL, 0.00, 0.00, 0.00, '2026-03-15 14:52:14', '2026-03-15 14:52:14', '2026-03-15 15:02:14', 'openweathermap', 0, NULL),
(528, 1, 12.27100000, 121.19400000, '333 Steps', 23.00, 36.00, 49, 1048.00, 18.00, 115, 11781, 'Clear', 'clear sky', '01d', 73, NULL, 0.00, 0.00, 0.00, '2026-03-16 01:47:03', '2026-03-16 01:47:03', '2026-03-16 01:57:03', 'openweathermap', 0, NULL),
(529, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 67, 1012.00, 35.80, 92, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:17:27', '2026-04-01 04:17:27', '2026-04-01 04:27:27', 'openweathermap', 0, NULL),
(530, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1011.00, 36.50, 94, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:43:10', '2026-04-01 04:43:10', '2026-04-01 04:53:10', 'openweathermap', 0, NULL),
(531, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 73, 1011.00, 42.00, 112, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:43:10', '2026-04-01 04:43:10', '2026-04-01 04:53:10', 'openweathermap', 0, NULL),
(532, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 42, 1011.00, 14.70, 96, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:43:10', '2026-04-01 04:43:10', '2026-04-01 04:53:10', 'openweathermap', 0, NULL),
(533, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 43, 1011.00, 4.30, 137, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:43:11', '2026-04-01 04:43:11', '2026-04-01 04:53:11', 'openweathermap', 0, NULL),
(534, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 67, 1011.00, 36.50, 94, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:53:32', '2026-04-01 04:53:32', '2026-04-01 05:03:32', 'openweathermap', 0, NULL),
(535, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 73, 1011.00, 42.00, 112, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:53:32', '2026-04-01 04:53:32', '2026-04-01 05:03:32', 'openweathermap', 0, NULL),
(536, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 42, 1011.00, 14.70, 96, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:53:33', '2026-04-01 04:53:33', '2026-04-01 05:03:33', 'openweathermap', 0, NULL),
(537, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 43, 1011.00, 4.30, 137, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 04:53:33', '2026-04-01 04:53:33', '2026-04-01 05:03:33', 'openweathermap', 0, NULL),
(538, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1011.00, 36.50, 94, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:03:33', '2026-04-01 05:03:33', '2026-04-01 05:13:33', 'openweathermap', 0, NULL),
(539, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1011.00, 42.00, 112, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:03:33', '2026-04-01 05:03:33', '2026-04-01 05:13:33', 'openweathermap', 0, NULL),
(540, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1011.00, 14.70, 96, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:03:34', '2026-04-01 05:03:34', '2026-04-01 05:13:34', 'openweathermap', 0, NULL),
(541, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 44, 1011.00, 4.30, 137, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:03:34', '2026-04-01 05:03:34', '2026-04-01 05:13:34', 'openweathermap', 0, NULL),
(542, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1011.00, 36.50, 94, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:19:05', '2026-04-01 05:19:05', '2026-04-01 05:29:05', 'openweathermap', 0, NULL),
(543, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1011.00, 42.00, 112, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:19:05', '2026-04-01 05:19:05', '2026-04-01 05:29:05', 'openweathermap', 0, NULL),
(544, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1011.00, 14.70, 96, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:19:06', '2026-04-01 05:19:06', '2026-04-01 05:29:06', 'openweathermap', 0, NULL),
(545, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 44, 1011.00, 4.30, 137, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:19:06', '2026-04-01 05:19:06', '2026-04-01 05:29:06', 'openweathermap', 0, NULL),
(546, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1011.00, 36.50, 94, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:29:05', '2026-04-01 05:29:05', '2026-04-01 05:39:05', 'openweathermap', 0, NULL),
(547, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1011.00, 42.00, 112, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:29:05', '2026-04-01 05:29:05', '2026-04-01 05:39:05', 'openweathermap', 0, NULL),
(548, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1011.00, 14.70, 96, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:29:06', '2026-04-01 05:29:06', '2026-04-01 05:39:06', 'openweathermap', 0, NULL),
(549, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 44, 1011.00, 4.30, 137, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:29:06', '2026-04-01 05:29:06', '2026-04-01 05:39:06', 'openweathermap', 0, NULL),
(550, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1010.00, 34.20, 93, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:39:05', '2026-04-01 05:39:05', '2026-04-01 05:49:05', 'openweathermap', 0, NULL),
(551, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1010.00, 41.40, 111, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:39:05', '2026-04-01 05:39:05', '2026-04-01 05:49:05', 'openweathermap', 0, NULL),
(552, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1010.00, 13.90, 98, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:39:06', '2026-04-01 05:39:06', '2026-04-01 05:49:06', 'openweathermap', 0, NULL),
(553, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 43, 1010.00, 2.70, 117, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:39:06', '2026-04-01 05:39:06', '2026-04-01 05:49:06', 'openweathermap', 0, NULL),
(554, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1010.00, 34.60, 90, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:49:41', '2026-04-01 05:49:41', '2026-04-01 05:59:41', 'openweathermap', 0, NULL),
(555, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1010.00, 41.50, 109, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:49:42', '2026-04-01 05:49:42', '2026-04-01 05:59:42', 'openweathermap', 0, NULL),
(556, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1010.00, 14.00, 98, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:49:42', '2026-04-01 05:49:42', '2026-04-01 05:59:42', 'openweathermap', 0, NULL),
(557, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 43, 1010.00, 3.30, 128, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 05:49:43', '2026-04-01 05:49:43', '2026-04-01 05:59:43', 'openweathermap', 0, NULL),
(558, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1010.00, 34.60, 90, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:01:56', '2026-04-01 06:01:56', '2026-04-01 06:11:56', 'openweathermap', 0, NULL),
(559, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1010.00, 41.50, 109, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:01:57', '2026-04-01 06:01:57', '2026-04-01 06:11:57', 'openweathermap', 0, NULL),
(560, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1010.00, 14.00, 98, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:01:57', '2026-04-01 06:01:57', '2026-04-01 06:11:57', 'openweathermap', 0, NULL),
(561, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 43, 1010.00, 3.30, 128, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:01:58', '2026-04-01 06:01:58', '2026-04-01 06:11:58', 'openweathermap', 0, NULL),
(562, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 72, 1011.00, 14.40, 93, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:01:59', '2026-04-01 06:01:59', '2026-04-01 06:11:59', 'openweathermap', 0, NULL),
(563, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1010.00, 34.60, 90, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:11:56', '2026-04-01 06:11:56', '2026-04-01 06:21:56', 'openweathermap', 0, NULL),
(564, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1010.00, 41.50, 109, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:11:57', '2026-04-01 06:11:57', '2026-04-01 06:21:57', 'openweathermap', 0, NULL),
(565, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1010.00, 14.00, 98, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:11:57', '2026-04-01 06:11:57', '2026-04-01 06:21:57', 'openweathermap', 0, NULL),
(566, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 43, 1010.00, 3.30, 128, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:11:58', '2026-04-01 06:11:58', '2026-04-01 06:21:58', 'openweathermap', 0, NULL),
(567, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 72, 1011.00, 14.40, 93, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:11:59', '2026-04-01 06:11:59', '2026-04-01 06:21:59', 'openweathermap', 0, NULL),
(568, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1010.00, 34.60, 90, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:23:25', '2026-04-01 06:23:25', '2026-04-01 06:33:25', 'openweathermap', 0, NULL),
(569, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1010.00, 41.50, 109, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:23:25', '2026-04-01 06:23:25', '2026-04-01 06:33:25', 'openweathermap', 0, NULL),
(570, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 43, 1010.00, 14.00, 98, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:23:26', '2026-04-01 06:23:26', '2026-04-01 06:33:26', 'openweathermap', 0, NULL),
(571, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 43, 1010.00, 3.30, 128, 10000, 'Clear', 'clear sky', '01d', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:23:26', '2026-04-01 06:23:26', '2026-04-01 06:33:26', 'openweathermap', 0, NULL),
(572, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 72, 1011.00, 14.40, 93, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:23:26', '2026-04-01 06:23:26', '2026-04-01 06:33:26', 'openweathermap', 0, NULL),
(573, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 64, 1010.00, 31.30, 86, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:35:24', '2026-04-01 06:35:24', '2026-04-01 06:45:24', 'openweathermap', 0, NULL),
(574, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 37.60, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:35:24', '2026-04-01 06:35:24', '2026-04-01 06:45:24', 'openweathermap', 0, NULL),
(575, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 43, 1010.00, 15.90, 88, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:35:25', '2026-04-01 06:35:25', '2026-04-01 06:45:25', 'openweathermap', 0, NULL),
(576, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 43, 1010.00, 4.50, 79, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:35:25', '2026-04-01 06:35:25', '2026-04-01 06:45:25', 'openweathermap', 0, NULL),
(577, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 71, 1010.00, 12.70, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:35:26', '2026-04-01 06:35:26', '2026-04-01 06:45:26', 'openweathermap', 0, NULL),
(578, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 63, 1010.00, 31.30, 86, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:50:01', '2026-04-01 06:50:01', '2026-04-01 07:00:01', 'openweathermap', 0, NULL),
(579, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 67, 1010.00, 37.60, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:50:02', '2026-04-01 06:50:02', '2026-04-01 07:00:02', 'openweathermap', 0, NULL),
(580, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 42, 1010.00, 15.90, 88, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:50:02', '2026-04-01 06:50:02', '2026-04-01 07:00:02', 'openweathermap', 0, NULL),
(581, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1010.00, 4.50, 79, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:50:02', '2026-04-01 06:50:02', '2026-04-01 07:00:02', 'openweathermap', 0, NULL),
(582, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 71, 1010.00, 12.70, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 06:50:03', '2026-04-01 06:50:03', '2026-04-01 07:00:03', 'openweathermap', 0, NULL),
(583, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 63, 1010.00, 31.30, 86, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:00:02', '2026-04-01 07:00:02', '2026-04-01 07:10:02', 'openweathermap', 0, NULL),
(584, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 67, 1010.00, 37.60, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:00:02', '2026-04-01 07:00:02', '2026-04-01 07:10:02', 'openweathermap', 0, NULL),
(585, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 42, 1010.00, 15.90, 88, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:00:03', '2026-04-01 07:00:03', '2026-04-01 07:10:03', 'openweathermap', 0, NULL),
(586, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1010.00, 4.50, 79, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:00:03', '2026-04-01 07:00:03', '2026-04-01 07:10:03', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(587, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 32.00, 44, 1010.00, 12.70, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:00:04', '2026-04-01 07:00:04', '2026-04-01 07:10:04', 'openweathermap', 0, NULL),
(588, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 63, 1010.00, 31.30, 86, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:10:06', '2026-04-01 07:10:06', '2026-04-01 07:20:06', 'openweathermap', 0, NULL),
(589, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 67, 1010.00, 37.60, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:10:06', '2026-04-01 07:10:06', '2026-04-01 07:20:06', 'openweathermap', 0, NULL),
(590, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 42, 1010.00, 15.90, 88, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:10:06', '2026-04-01 07:10:06', '2026-04-01 07:20:06', 'openweathermap', 0, NULL),
(591, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1010.00, 4.50, 79, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:10:06', '2026-04-01 07:10:06', '2026-04-01 07:20:06', 'openweathermap', 0, NULL),
(592, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 31.00, 36, 1010.00, 12.70, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:10:07', '2026-04-01 07:10:07', '2026-04-01 07:20:07', 'openweathermap', 0, NULL),
(593, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 42, 1010.00, 15.90, 88, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:20:06', '2026-04-01 07:20:06', '2026-04-01 07:30:06', 'openweathermap', 0, NULL),
(594, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1010.00, 4.50, 79, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:20:06', '2026-04-01 07:20:06', '2026-04-01 07:30:06', 'openweathermap', 0, NULL),
(595, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 31.00, 36, 1010.00, 12.70, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:20:07', '2026-04-01 07:20:07', '2026-04-01 07:30:07', 'openweathermap', 0, NULL),
(596, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 64, 1010.00, 31.30, 86, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:25:06', '2026-04-01 07:25:06', '2026-04-01 07:35:06', 'openweathermap', 0, NULL),
(597, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 37.60, 106, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:25:06', '2026-04-01 07:25:06', '2026-04-01 07:35:06', 'openweathermap', 0, NULL),
(598, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 30.00, 45, 1010.00, 15.10, 75, 10000, 'Clouds', 'scattered clouds', '03d', 41, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:30:06', '2026-04-01 07:30:06', '2026-04-01 07:40:06', 'openweathermap', 0, NULL),
(599, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 45, 1010.00, 7.60, 42, 10000, 'Clouds', 'scattered clouds', '03d', 41, NULL, 0.00, 0.00, 0.00, '2026-04-01 07:30:06', '2026-04-01 07:30:06', '2026-04-01 07:40:06', 'openweathermap', 0, NULL),
(600, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 66, 1013.00, 9.30, 41, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:28:00', '2026-04-01 14:28:00', '2026-04-01 14:38:00', 'openweathermap', 0, NULL),
(601, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1012.00, 4.90, 20, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:28:00', '2026-04-01 14:28:00', '2026-04-01 14:38:00', 'openweathermap', 0, NULL),
(602, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 70, 1013.00, 8.10, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:28:00', '2026-04-01 14:28:00', '2026-04-01 14:38:00', 'openweathermap', 0, NULL),
(603, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 70, 1013.00, 6.90, 60, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:28:00', '2026-04-01 14:28:00', '2026-04-01 14:38:00', 'openweathermap', 0, NULL),
(604, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 76, 1013.00, 7.20, 34, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:28:00', '2026-04-01 14:28:00', '2026-04-01 14:38:00', 'openweathermap', 0, NULL),
(605, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 67, 1013.00, 11.00, 45, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:43:00', '2026-04-01 14:43:00', '2026-04-01 14:53:00', 'openweathermap', 0, NULL),
(606, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1012.00, 5.60, 46, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:43:00', '2026-04-01 14:43:00', '2026-04-01 14:53:00', 'openweathermap', 0, NULL),
(607, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 72, 1013.00, 8.40, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:43:00', '2026-04-01 14:43:00', '2026-04-01 14:53:00', 'openweathermap', 0, NULL),
(608, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 70, 1013.00, 7.60, 60, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:43:00', '2026-04-01 14:43:00', '2026-04-01 14:53:00', 'openweathermap', 0, NULL),
(609, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 76, 1013.00, 7.90, 28, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:43:00', '2026-04-01 14:43:00', '2026-04-01 14:53:00', 'openweathermap', 0, NULL),
(610, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 67, 1013.00, 11.00, 45, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:58:00', '2026-04-01 14:58:00', '2026-04-01 15:08:00', 'openweathermap', 0, NULL),
(611, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1012.00, 5.60, 46, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:58:00', '2026-04-01 14:58:00', '2026-04-01 15:08:00', 'openweathermap', 0, NULL),
(612, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 72, 1013.00, 8.40, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:58:00', '2026-04-01 14:58:00', '2026-04-01 15:08:00', 'openweathermap', 0, NULL),
(613, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 70, 1013.00, 7.60, 60, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:58:00', '2026-04-01 14:58:00', '2026-04-01 15:08:00', 'openweathermap', 0, NULL),
(614, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 76, 1013.00, 7.90, 28, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 14:58:00', '2026-04-01 14:58:00', '2026-04-01 15:08:00', 'openweathermap', 0, NULL),
(615, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 22.00, 57, 1020.00, 11.00, 255, 11124, 'Thunderstorm', 'thunderstorm with rain', '11d', 6, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:08:16', '2026-04-01 15:08:16', '2026-04-01 15:18:16', 'openweathermap', 0, NULL),
(616, 2, 12.23800000, 121.06900000, 'Arangin Falls', 20.00, 24.00, 78, 1001.00, 1.00, 224, 6763, 'Rain', 'light rain', '10d', 89, NULL, 9.89, 0.00, 0.00, '2026-04-01 15:08:16', '2026-04-01 15:08:16', '2026-04-01 15:18:16', 'openweathermap', 0, NULL),
(617, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 30.00, 59, 1028.00, 16.00, 147, 9415, 'Rain', 'light rain', '10d', 98, NULL, 2.20, 0.00, 0.00, '2026-04-01 15:08:16', '2026-04-01 15:08:16', '2026-04-01 15:18:16', 'openweathermap', 0, NULL),
(618, 4, 12.44130000, 121.15300000, 'Naujan Lake', 34.00, 22.00, 61, 1015.00, 9.00, 280, 8279, 'Clear', 'clear sky', '01d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:08:16', '2026-04-01 15:08:16', '2026-04-01 15:18:16', 'openweathermap', 0, NULL),
(619, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 35.00, 57, 1013.00, 8.00, 322, 5507, 'Thunderstorm', 'thunderstorm with rain', '11d', 89, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:08:16', '2026-04-01 15:08:16', '2026-04-01 15:18:16', 'openweathermap', 0, NULL),
(620, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 33.00, 27.00, 73, 1043.00, 2.00, 46, 7053, 'Clouds', 'scattered clouds', '03d', 97, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:23:09', '2026-04-01 15:23:09', '2026-04-01 15:33:09', 'openweathermap', 0, NULL),
(621, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1012.00, 5.60, 46, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:23:12', '2026-04-01 15:23:12', '2026-04-01 15:33:12', 'openweathermap', 0, NULL),
(622, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 72, 1013.00, 8.40, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:23:15', '2026-04-01 15:23:15', '2026-04-01 15:33:15', 'openweathermap', 0, NULL),
(623, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 27.00, 75, 1035.00, 18.00, 151, 6285, 'Thunderstorm', 'thunderstorm with rain', '11d', 56, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:23:20', '2026-04-01 15:23:20', '2026-04-01 15:33:20', 'openweathermap', 0, NULL),
(624, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 24.00, 42, 1041.00, 0.00, 85, 8348, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:23:25', '2026-04-01 15:23:25', '2026-04-01 15:33:25', 'openweathermap', 0, NULL),
(625, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 70, 1012.00, 11.90, 45, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:42:43', '2026-04-01 15:42:43', '2026-04-01 15:52:43', 'openweathermap', 0, NULL),
(626, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 68, 1012.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:42:43', '2026-04-01 15:42:43', '2026-04-01 15:52:43', 'openweathermap', 0, NULL),
(627, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 21.00, 76, 1013.00, 8.60, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:42:44', '2026-04-01 15:42:44', '2026-04-01 15:52:44', 'openweathermap', 0, NULL),
(628, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 72, 1012.00, 7.60, 59, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:42:44', '2026-04-01 15:42:44', '2026-04-01 15:52:44', 'openweathermap', 0, NULL),
(629, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 75, 1013.00, 9.60, 34, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:42:44', '2026-04-01 15:42:44', '2026-04-01 15:52:44', 'openweathermap', 0, NULL),
(630, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 70, 1012.00, 11.90, 45, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:57:27', '2026-04-01 15:57:27', '2026-04-01 16:07:27', 'openweathermap', 0, NULL),
(631, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 68, 1012.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:57:27', '2026-04-01 15:57:27', '2026-04-01 16:07:27', 'openweathermap', 0, NULL),
(632, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 21.00, 76, 1013.00, 8.60, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:57:27', '2026-04-01 15:57:27', '2026-04-01 16:07:27', 'openweathermap', 0, NULL),
(633, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 72, 1012.00, 7.60, 59, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:57:28', '2026-04-01 15:57:28', '2026-04-01 16:07:28', 'openweathermap', 0, NULL),
(634, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 75, 1013.00, 9.60, 34, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 15:57:28', '2026-04-01 15:57:28', '2026-04-01 16:07:28', 'openweathermap', 0, NULL),
(635, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 70, 1012.00, 11.90, 45, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 16:10:51', '2026-04-01 16:10:51', '2026-04-01 16:20:51', 'openweathermap', 0, NULL),
(636, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 68, 1012.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 16:10:52', '2026-04-01 16:10:52', '2026-04-01 16:20:52', 'openweathermap', 0, NULL),
(637, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 22.00, 76, 1013.00, 8.60, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 16:10:52', '2026-04-01 16:10:52', '2026-04-01 16:20:52', 'openweathermap', 0, NULL),
(638, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 72, 1012.00, 7.60, 59, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 16:10:52', '2026-04-01 16:10:52', '2026-04-01 16:20:52', 'openweathermap', 0, NULL),
(639, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 75, 1013.00, 9.60, 34, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 16:10:52', '2026-04-01 16:10:52', '2026-04-01 16:20:52', 'openweathermap', 0, NULL),
(640, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 71, 1011.00, 11.70, 39, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:12:16', '2026-04-01 17:12:16', '2026-04-01 17:22:16', 'openweathermap', 0, NULL),
(641, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 67, 1011.00, 6.90, 49, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:12:17', '2026-04-01 17:12:17', '2026-04-01 17:22:17', 'openweathermap', 0, NULL),
(642, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 21.00, 79, 1012.00, 8.60, 42, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:12:17', '2026-04-01 17:12:17', '2026-04-01 17:22:17', 'openweathermap', 0, NULL),
(643, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 73, 1012.00, 7.20, 54, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:12:17', '2026-04-01 17:12:17', '2026-04-01 17:22:17', 'openweathermap', 0, NULL),
(644, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 75, 1012.00, 10.30, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:12:18', '2026-04-01 17:12:18', '2026-04-01 17:22:18', 'openweathermap', 0, NULL),
(645, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 25.00, 71, 1011.00, 12.10, 42, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:33:11', '2026-04-01 17:33:11', '2026-04-01 17:43:11', 'openweathermap', 0, NULL),
(646, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 67, 1011.00, 8.00, 38, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:33:12', '2026-04-01 17:33:12', '2026-04-01 17:43:12', 'openweathermap', 0, NULL),
(647, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 21.00, 81, 1012.00, 8.90, 44, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:33:12', '2026-04-01 17:33:12', '2026-04-01 17:43:12', 'openweathermap', 0, NULL),
(648, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 74, 1011.00, 7.30, 50, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:33:12', '2026-04-01 17:33:12', '2026-04-01 17:43:12', 'openweathermap', 0, NULL),
(649, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 25.00, 26.00, 75, 1012.00, 9.20, 41, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 17:33:13', '2026-04-01 17:33:13', '2026-04-01 17:43:13', 'openweathermap', 0, NULL),
(650, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 25.00, 71, 1011.00, 13.70, 46, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:07:25', '2026-04-01 18:07:25', '2026-04-01 18:17:25', 'openweathermap', 0, NULL),
(651, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 67, 1011.00, 9.70, 45, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:07:25', '2026-04-01 18:07:25', '2026-04-01 18:17:25', 'openweathermap', 0, NULL),
(652, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 21.00, 81, 1012.00, 9.70, 47, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:07:25', '2026-04-01 18:07:25', '2026-04-01 18:17:25', 'openweathermap', 0, NULL),
(653, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 23.00, 74, 1011.00, 8.40, 51, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:07:26', '2026-04-01 18:07:26', '2026-04-01 18:17:26', 'openweathermap', 0, NULL),
(654, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 25.00, 26.00, 75, 1012.00, 9.10, 48, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:07:26', '2026-04-01 18:07:26', '2026-04-01 18:17:26', 'openweathermap', 0, NULL),
(655, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 26.00, 73, 1011.00, 13.70, 46, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:20:07', '2026-04-01 18:20:07', '2026-04-01 18:30:07', 'openweathermap', 0, NULL),
(656, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 69, 1011.00, 9.70, 45, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:20:07', '2026-04-01 18:20:07', '2026-04-01 18:30:07', 'openweathermap', 0, NULL),
(657, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 22.00, 82, 1011.00, 9.70, 47, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:20:08', '2026-04-01 18:20:08', '2026-04-01 18:30:08', 'openweathermap', 0, NULL),
(658, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 23.00, 77, 1011.00, 8.40, 51, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:20:08', '2026-04-01 18:20:08', '2026-04-01 18:30:08', 'openweathermap', 0, NULL),
(659, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 74, 1012.00, 9.10, 48, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 18:20:09', '2026-04-01 18:20:09', '2026-04-01 18:30:09', 'openweathermap', 0, NULL),
(660, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 25.00, 25.00, 75, 1011.00, 17.40, 48, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-01 19:44:12', '2026-04-01 19:44:12', '2026-04-01 19:54:12', 'openweathermap', 0, NULL),
(661, 2, 12.23800000, 121.06900000, 'Arangin Falls', 24.00, 24.00, 71, 1011.00, 10.90, 46, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-04-01 19:44:12', '2026-04-01 19:44:12', '2026-04-01 19:54:12', 'openweathermap', 0, NULL),
(662, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 21.00, 21.00, 83, 1011.00, 11.30, 52, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-01 19:44:13', '2026-04-01 19:44:13', '2026-04-01 19:54:13', 'openweathermap', 0, NULL),
(663, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 22.00, 78, 1011.00, 9.50, 58, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-04-01 19:44:13', '2026-04-01 19:44:13', '2026-04-01 19:54:13', 'openweathermap', 0, NULL),
(664, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 25.00, 25.00, 74, 1012.00, 9.30, 50, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-01 19:44:14', '2026-04-01 19:44:14', '2026-04-01 19:54:14', 'openweathermap', 0, NULL),
(665, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 30.00, 63, 1013.00, 29.70, 79, 10000, 'Clouds', 'broken clouds', '04d', 78, NULL, 0.00, 0.00, 0.00, '2026-04-02 02:11:42', '2026-04-02 02:11:42', '2026-04-02 02:21:42', 'openweathermap', 0, NULL),
(666, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 66, 1013.00, 27.30, 95, 10000, 'Clouds', 'broken clouds', '04d', 63, NULL, 0.00, 0.00, 0.00, '2026-04-02 02:11:43', '2026-04-02 02:11:43', '2026-04-02 02:21:43', 'openweathermap', 0, NULL),
(667, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 29.00, 40, 1014.00, 19.50, 76, 10000, 'Clouds', 'overcast clouds', '04d', 96, NULL, 0.00, 0.00, 0.00, '2026-04-02 02:11:43', '2026-04-02 02:11:43', '2026-04-02 02:21:43', 'openweathermap', 0, NULL),
(668, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 32.00, 34, 1013.00, 11.40, 91, 10000, 'Clouds', 'overcast clouds', '04d', 96, NULL, 0.00, 0.00, 0.00, '2026-04-02 02:11:44', '2026-04-02 02:11:44', '2026-04-02 02:21:44', 'openweathermap', 0, NULL),
(669, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 31.00, 64, 1015.00, 15.40, 57, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-02 02:11:44', '2026-04-02 02:11:44', '2026-04-02 02:21:44', 'openweathermap', 0, NULL),
(670, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 31.00, 47, 1009.00, 34.30, 67, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-02 07:20:18', '2026-04-02 07:20:18', '2026-04-02 07:30:18', 'openweathermap', 0, NULL),
(671, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 57, 1009.00, 20.10, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-02 07:20:18', '2026-04-02 07:20:18', '2026-04-02 07:30:18', 'openweathermap', 0, NULL),
(672, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 30.00, 29, 1010.00, 21.60, 63, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-02 07:20:19', '2026-04-02 07:20:19', '2026-04-02 07:30:19', 'openweathermap', 0, NULL),
(673, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 32.00, 32, 1009.00, 9.70, 28, 10000, 'Clouds', 'scattered clouds', '03d', 41, NULL, 0.00, 0.00, 0.00, '2026-04-02 07:20:19', '2026-04-02 07:20:19', '2026-04-02 07:30:19', 'openweathermap', 0, NULL),
(674, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 34.00, 57, 1011.00, 11.90, 63, 10000, 'Clear', 'clear sky', '01d', 6, NULL, 0.00, 0.00, 0.00, '2026-04-02 07:20:20', '2026-04-02 07:20:20', '2026-04-02 07:30:20', 'openweathermap', 0, NULL),
(675, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 30.00, 49, 1010.00, 26.60, 53, 10000, 'Clouds', 'overcast clouds', '04d', 90, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:36:07', '2026-04-02 08:36:07', '2026-04-02 08:46:07', 'openweathermap', 0, NULL),
(676, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 61, 1010.00, 11.20, 3, 10000, 'Clouds', 'overcast clouds', '04d', 85, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:36:07', '2026-04-02 08:36:07', '2026-04-02 08:46:07', 'openweathermap', 0, NULL),
(677, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 28.00, 34, 1010.00, 18.50, 60, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:36:08', '2026-04-02 08:36:08', '2026-04-02 08:46:08', 'openweathermap', 0, NULL),
(678, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 30.00, 35, 1010.00, 9.60, 47, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:36:08', '2026-04-02 08:36:08', '2026-04-02 08:46:08', 'openweathermap', 0, NULL),
(679, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 65, 1011.00, 19.60, 55, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:36:08', '2026-04-02 08:36:08', '2026-04-02 08:46:08', 'openweathermap', 0, NULL),
(680, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 30.00, 49, 1010.00, 26.60, 53, 10000, 'Clouds', 'overcast clouds', '04d', 90, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:50:23', '2026-04-02 08:50:23', '2026-04-02 09:00:23', 'openweathermap', 0, NULL),
(681, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 61, 1010.00, 11.20, 3, 10000, 'Clouds', 'overcast clouds', '04d', 85, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:50:23', '2026-04-02 08:50:23', '2026-04-02 09:00:23', 'openweathermap', 0, NULL),
(682, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 28.00, 34, 1010.00, 18.50, 60, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:50:24', '2026-04-02 08:50:24', '2026-04-02 09:00:24', 'openweathermap', 0, NULL),
(683, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 30.00, 35, 1010.00, 9.60, 47, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:50:25', '2026-04-02 08:50:25', '2026-04-02 09:00:25', 'openweathermap', 0, NULL),
(684, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 65, 1011.00, 19.60, 55, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-04-02 08:50:25', '2026-04-02 08:50:25', '2026-04-02 09:00:25', 'openweathermap', 0, NULL),
(685, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 76, 1011.00, 8.40, 340, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:15:40', '2026-04-04 14:15:40', '2026-04-04 14:25:40', 'openweathermap', 0, NULL),
(686, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1011.00, 9.60, 354, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:15:40', '2026-04-04 14:15:40', '2026-04-04 14:25:40', 'openweathermap', 0, NULL),
(687, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 80, 1012.00, 4.80, 355, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:15:40', '2026-04-04 14:15:40', '2026-04-04 14:25:40', 'openweathermap', 0, NULL),
(688, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 77, 1012.00, 6.00, 9, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:15:41', '2026-04-04 14:15:41', '2026-04-04 14:25:41', 'openweathermap', 0, NULL),
(689, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 77, 1011.00, 5.50, 264, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:15:41', '2026-04-04 14:15:41', '2026-04-04 14:25:41', 'openweathermap', 0, NULL),
(690, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 76, 1011.00, 8.40, 340, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:25:40', '2026-04-04 14:25:40', '2026-04-04 14:35:40', 'openweathermap', 0, NULL),
(691, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1011.00, 9.60, 354, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:25:41', '2026-04-04 14:25:41', '2026-04-04 14:35:41', 'openweathermap', 0, NULL),
(692, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 80, 1012.00, 4.80, 355, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:25:42', '2026-04-04 14:25:42', '2026-04-04 14:35:42', 'openweathermap', 0, NULL),
(693, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 77, 1012.00, 6.00, 9, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:25:42', '2026-04-04 14:25:42', '2026-04-04 14:35:42', 'openweathermap', 0, NULL),
(694, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 77, 1011.00, 5.50, 264, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:25:43', '2026-04-04 14:25:43', '2026-04-04 14:35:43', 'openweathermap', 0, NULL),
(695, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1011.00, 7.70, 338, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:35:43', '2026-04-04 14:35:43', '2026-04-04 14:45:43', 'openweathermap', 0, NULL),
(696, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1011.00, 10.90, 350, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:35:44', '2026-04-04 14:35:44', '2026-04-04 14:45:44', 'openweathermap', 0, NULL),
(697, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 80, 1012.00, 4.60, 1, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:35:44', '2026-04-04 14:35:44', '2026-04-04 14:45:44', 'openweathermap', 0, NULL),
(698, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1012.00, 5.80, 6, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:35:45', '2026-04-04 14:35:45', '2026-04-04 14:45:45', 'openweathermap', 0, NULL),
(699, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 78, 1011.00, 6.50, 285, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:35:45', '2026-04-04 14:35:45', '2026-04-04 14:45:45', 'openweathermap', 0, NULL),
(700, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1011.00, 7.70, 338, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:45:57', '2026-04-04 14:45:57', '2026-04-04 14:55:57', 'openweathermap', 0, NULL),
(701, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1011.00, 10.90, 350, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:45:58', '2026-04-04 14:45:58', '2026-04-04 14:55:58', 'openweathermap', 0, NULL),
(702, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 80, 1012.00, 4.60, 1, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:45:58', '2026-04-04 14:45:58', '2026-04-04 14:55:58', 'openweathermap', 0, NULL),
(703, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1012.00, 5.80, 6, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:45:59', '2026-04-04 14:45:59', '2026-04-04 14:55:59', 'openweathermap', 0, NULL),
(704, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 78, 1011.00, 6.50, 285, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:45:59', '2026-04-04 14:45:59', '2026-04-04 14:55:59', 'openweathermap', 0, NULL),
(705, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1011.00, 7.70, 338, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:56:14', '2026-04-04 14:56:14', '2026-04-04 15:06:14', 'openweathermap', 0, NULL),
(706, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1011.00, 10.90, 350, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:56:15', '2026-04-04 14:56:15', '2026-04-04 15:06:15', 'openweathermap', 0, NULL),
(707, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 80, 1012.00, 4.60, 1, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:56:15', '2026-04-04 14:56:15', '2026-04-04 15:06:15', 'openweathermap', 0, NULL),
(708, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1012.00, 5.80, 6, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:56:16', '2026-04-04 14:56:16', '2026-04-04 15:06:16', 'openweathermap', 0, NULL),
(709, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 78, 1011.00, 6.50, 285, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-04 14:56:16', '2026-04-04 14:56:16', '2026-04-04 15:06:16', 'openweathermap', 0, NULL),
(710, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 75, 1011.00, 7.70, 338, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:09:21', '2026-04-04 15:09:21', '2026-04-04 15:19:21', 'openweathermap', 0, NULL),
(711, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1011.00, 10.90, 350, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:09:21', '2026-04-04 15:09:21', '2026-04-04 15:19:21', 'openweathermap', 0, NULL),
(712, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 80, 1012.00, 4.60, 1, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:09:21', '2026-04-04 15:09:21', '2026-04-04 15:19:21', 'openweathermap', 0, NULL),
(713, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1012.00, 5.80, 6, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:09:22', '2026-04-04 15:09:22', '2026-04-04 15:19:22', 'openweathermap', 0, NULL),
(714, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 77, 1011.00, 6.50, 285, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:09:22', '2026-04-04 15:09:22', '2026-04-04 15:19:22', 'openweathermap', 0, NULL),
(715, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1010.00, 7.30, 347, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:38:08', '2026-04-04 15:38:08', '2026-04-04 15:48:08', 'openweathermap', 0, NULL),
(716, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1010.00, 10.80, 352, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:38:08', '2026-04-04 15:38:08', '2026-04-04 15:48:08', 'openweathermap', 0, NULL),
(717, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 81, 1011.00, 4.40, 19, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:38:08', '2026-04-04 15:38:08', '2026-04-04 15:48:08', 'openweathermap', 0, NULL),
(718, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 78, 1011.00, 5.00, 20, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:38:09', '2026-04-04 15:38:09', '2026-04-04 15:48:09', 'openweathermap', 0, NULL),
(719, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 78, 1010.00, 5.00, 282, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-04 15:38:09', '2026-04-04 15:38:09', '2026-04-04 15:48:09', 'openweathermap', 0, NULL),
(720, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1010.00, 7.30, 347, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 16:02:27', '2026-04-04 16:02:27', '2026-04-04 16:12:27', 'openweathermap', 0, NULL),
(721, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1010.00, 10.80, 352, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-04 16:02:27', '2026-04-04 16:02:27', '2026-04-04 16:12:27', 'openweathermap', 0, NULL),
(722, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 81, 1011.00, 4.40, 19, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 16:02:28', '2026-04-04 16:02:28', '2026-04-04 16:12:28', 'openweathermap', 0, NULL),
(723, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 78, 1011.00, 5.00, 20, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-04 16:02:29', '2026-04-04 16:02:29', '2026-04-04 16:12:29', 'openweathermap', 0, NULL),
(724, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 78, 1010.00, 5.00, 282, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-04 16:02:29', '2026-04-04 16:02:29', '2026-04-04 16:12:29', 'openweathermap', 0, NULL),
(725, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 30.00, 60, 1009.00, 19.20, 61, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:47:59', '2026-04-05 09:47:59', '2026-04-05 09:57:59', 'openweathermap', 0, NULL),
(726, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 63, 1008.00, 18.80, 52, 10000, 'Clear', 'clear sky', '01d', 3, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:48:00', '2026-04-05 09:48:00', '2026-04-05 09:58:00', 'openweathermap', 0, NULL),
(727, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 49, 1009.00, 9.80, 62, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:48:01', '2026-04-05 09:48:01', '2026-04-05 09:58:01', 'openweathermap', 0, NULL),
(728, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 29.00, 52, 1009.00, 6.40, 40, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:48:01', '2026-04-05 09:48:01', '2026-04-05 09:58:01', 'openweathermap', 0, NULL),
(729, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 70, 1009.00, 12.00, 118, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:48:02', '2026-04-05 09:48:02', '2026-04-05 09:58:02', 'openweathermap', 0, NULL),
(730, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 30.00, 60, 1009.00, 19.20, 61, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:58:31', '2026-04-05 09:58:31', '2026-04-05 10:08:31', 'openweathermap', 0, NULL),
(731, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 63, 1008.00, 18.80, 52, 10000, 'Clear', 'clear sky', '01d', 3, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:58:31', '2026-04-05 09:58:31', '2026-04-05 10:08:31', 'openweathermap', 0, NULL),
(732, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 49, 1009.00, 9.80, 62, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:58:32', '2026-04-05 09:58:32', '2026-04-05 10:08:32', 'openweathermap', 0, NULL),
(733, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 29.00, 52, 1009.00, 6.40, 40, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:58:32', '2026-04-05 09:58:32', '2026-04-05 10:08:32', 'openweathermap', 0, NULL),
(734, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 70, 1009.00, 12.00, 118, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-05 09:58:33', '2026-04-05 09:58:33', '2026-04-05 10:08:33', 'openweathermap', 0, NULL),
(735, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 29.00, 62, 1009.00, 14.30, 37, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:18:32', '2026-04-05 11:18:32', '2026-04-05 11:28:32', 'openweathermap', 0, NULL),
(736, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1009.00, 14.10, 8, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:18:32', '2026-04-05 11:18:32', '2026-04-05 11:28:32', 'openweathermap', 0, NULL),
(737, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 57, 1010.00, 9.30, 35, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:18:33', '2026-04-05 11:18:33', '2026-04-05 11:28:33', 'openweathermap', 0, NULL),
(738, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 61, 1010.00, 7.70, 19, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:18:33', '2026-04-05 11:18:33', '2026-04-05 11:28:33', 'openweathermap', 0, NULL),
(739, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 72, 1010.00, 10.50, 92, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:18:34', '2026-04-05 11:18:34', '2026-04-05 11:28:34', 'openweathermap', 0, NULL),
(740, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 29.00, 62, 1009.00, 14.30, 37, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:29:00', '2026-04-05 11:29:00', '2026-04-05 11:39:00', 'openweathermap', 0, NULL),
(741, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1009.00, 14.10, 8, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:29:00', '2026-04-05 11:29:00', '2026-04-05 11:39:00', 'openweathermap', 0, NULL),
(742, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 57, 1010.00, 9.30, 35, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:29:00', '2026-04-05 11:29:00', '2026-04-05 11:39:00', 'openweathermap', 0, NULL),
(743, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 61, 1010.00, 7.70, 19, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:29:01', '2026-04-05 11:29:01', '2026-04-05 11:39:01', 'openweathermap', 0, NULL),
(744, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 72, 1010.00, 10.50, 92, 10000, 'Clear', 'clear sky', '01n', 2, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:29:01', '2026-04-05 11:29:01', '2026-04-05 11:39:01', 'openweathermap', 0, NULL),
(745, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 61, 1010.00, 10.90, 22, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:58:57', '2026-04-05 11:58:57', '2026-04-05 12:08:57', 'openweathermap', 0, NULL),
(746, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 71, 1010.00, 13.80, 354, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:58:58', '2026-04-05 11:58:58', '2026-04-05 12:08:58', 'openweathermap', 0, NULL),
(747, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 58, 1011.00, 8.90, 33, 10000, 'Clouds', 'few clouds', '02n', 22, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:58:59', '2026-04-05 11:58:59', '2026-04-05 12:08:59', 'openweathermap', 0, NULL),
(748, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 61, 1010.00, 7.90, 25, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:58:59', '2026-04-05 11:58:59', '2026-04-05 12:08:59', 'openweathermap', 0, NULL),
(749, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 77, 1010.00, 10.40, 70, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-05 11:59:00', '2026-04-05 11:59:00', '2026-04-05 12:09:00', 'openweathermap', 0, NULL),
(750, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 61, 1010.00, 10.90, 22, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:09:37', '2026-04-05 12:09:37', '2026-04-05 12:19:37', 'openweathermap', 0, NULL),
(751, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 71, 1010.00, 13.80, 354, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:09:38', '2026-04-05 12:09:38', '2026-04-05 12:19:38', 'openweathermap', 0, NULL),
(752, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 58, 1011.00, 8.90, 33, 10000, 'Clouds', 'few clouds', '02n', 22, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:09:39', '2026-04-05 12:09:39', '2026-04-05 12:19:39', 'openweathermap', 0, NULL),
(753, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 61, 1010.00, 7.90, 25, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:09:40', '2026-04-05 12:09:40', '2026-04-05 12:19:40', 'openweathermap', 0, NULL),
(754, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 77, 1010.00, 10.40, 70, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:09:40', '2026-04-05 12:09:40', '2026-04-05 12:19:40', 'openweathermap', 0, NULL),
(755, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 58, 1010.00, 10.30, 39, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:38:22', '2026-04-05 12:38:22', '2026-04-05 12:48:22', 'openweathermap', 0, NULL),
(756, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1010.00, 10.80, 12, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:38:22', '2026-04-05 12:38:22', '2026-04-05 12:48:22', 'openweathermap', 0, NULL),
(757, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 51, 1011.00, 9.30, 46, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:38:23', '2026-04-05 12:38:23', '2026-04-05 12:48:23', 'openweathermap', 0, NULL),
(758, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 55, 1011.00, 8.40, 50, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:38:24', '2026-04-05 12:38:24', '2026-04-05 12:48:24', 'openweathermap', 0, NULL),
(759, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 80, 1011.00, 10.20, 49, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:38:24', '2026-04-05 12:38:24', '2026-04-05 12:48:24', 'openweathermap', 0, NULL),
(760, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 58, 1010.00, 10.30, 39, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:50:15', '2026-04-05 12:50:15', '2026-04-05 13:00:15', 'openweathermap', 0, NULL),
(761, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1010.00, 10.80, 12, 10000, 'Clear', 'clear sky', '01n', 9, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:50:16', '2026-04-05 12:50:16', '2026-04-05 13:00:16', 'openweathermap', 0, NULL),
(762, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 51, 1011.00, 9.30, 46, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:50:16', '2026-04-05 12:50:16', '2026-04-05 13:00:16', 'openweathermap', 0, NULL),
(763, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 55, 1011.00, 8.40, 50, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:50:18', '2026-04-05 12:50:18', '2026-04-05 13:00:18', 'openweathermap', 0, NULL),
(764, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 80, 1011.00, 10.20, 49, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-05 12:50:18', '2026-04-05 12:50:18', '2026-04-05 13:00:18', 'openweathermap', 0, NULL),
(765, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 63, 1011.00, 9.80, 42, 10000, 'Clouds', 'scattered clouds', '03n', 27, NULL, 0.00, 0.00, 0.00, '2026-04-06 11:44:35', '2026-04-06 11:44:35', '2026-04-06 11:54:35', 'openweathermap', 0, NULL),
(766, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1011.00, 10.40, 357, 10000, 'Clouds', 'scattered clouds', '03n', 35, NULL, 0.00, 0.00, 0.00, '2026-04-06 11:44:36', '2026-04-06 11:44:36', '2026-04-06 11:54:36', 'openweathermap', 0, NULL),
(767, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 58, 1012.00, 8.70, 38, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-04-06 11:44:37', '2026-04-06 11:44:37', '2026-04-06 11:54:37', 'openweathermap', 0, NULL),
(768, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 61, 1011.00, 8.20, 39, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-06 11:44:38', '2026-04-06 11:44:38', '2026-04-06 11:54:38', 'openweathermap', 0, NULL),
(769, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 30.00, 73, 1011.00, 9.00, 72, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-06 11:44:38', '2026-04-06 11:44:38', '2026-04-06 11:54:38', 'openweathermap', 0, NULL),
(770, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1011.00, 8.60, 29, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:08:50', '2026-04-09 17:08:50', '2026-04-09 17:18:50', 'openweathermap', 0, NULL),
(771, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1011.00, 9.30, 18, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:08:51', '2026-04-09 17:08:51', '2026-04-09 17:18:51', 'openweathermap', 0, NULL),
(772, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 82, 1012.00, 7.00, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:08:51', '2026-04-09 17:08:51', '2026-04-09 17:18:51', 'openweathermap', 0, NULL),
(773, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 79, 1012.00, 6.70, 46, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:08:51', '2026-04-09 17:08:51', '2026-04-09 17:18:51', 'openweathermap', 0, NULL),
(774, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 81, 1012.00, 9.10, 18, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:08:52', '2026-04-09 17:08:52', '2026-04-09 17:18:52', 'openweathermap', 0, NULL),
(775, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1011.00, 10.00, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:30:14', '2026-04-09 17:30:14', '2026-04-09 17:40:14', 'openweathermap', 0, NULL),
(776, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1011.00, 8.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:30:15', '2026-04-09 17:30:15', '2026-04-09 17:40:15', 'openweathermap', 0, NULL),
(777, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 83, 1011.00, 6.90, 47, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:30:15', '2026-04-09 17:30:15', '2026-04-09 17:40:15', 'openweathermap', 0, NULL),
(778, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 80, 1011.00, 6.40, 52, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:30:16', '2026-04-09 17:30:16', '2026-04-09 17:40:16', 'openweathermap', 0, NULL),
(779, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 82, 1011.00, 9.00, 19, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:30:16', '2026-04-09 17:30:16', '2026-04-09 17:40:16', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(780, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1011.00, 9.50, 39, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:52:36', '2026-04-09 17:52:36', '2026-04-09 18:02:36', 'openweathermap', 0, NULL),
(781, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1011.00, 8.30, 29, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:52:37', '2026-04-09 17:52:37', '2026-04-09 18:02:37', 'openweathermap', 0, NULL),
(782, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 83, 1011.00, 6.70, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:52:38', '2026-04-09 17:52:38', '2026-04-09 18:02:38', 'openweathermap', 0, NULL),
(783, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 80, 1011.00, 6.20, 49, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:52:38', '2026-04-09 17:52:38', '2026-04-09 18:02:38', 'openweathermap', 0, NULL),
(784, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 82, 1011.00, 8.30, 15, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-09 17:52:38', '2026-04-09 17:52:38', '2026-04-09 18:02:38', 'openweathermap', 0, NULL),
(785, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1011.00, 9.50, 39, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:20:40', '2026-04-09 18:20:40', '2026-04-09 18:30:40', 'openweathermap', 0, NULL),
(786, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1011.00, 8.30, 29, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:20:40', '2026-04-09 18:20:40', '2026-04-09 18:30:40', 'openweathermap', 0, NULL),
(787, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 83, 1011.00, 6.70, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:20:40', '2026-04-09 18:20:40', '2026-04-09 18:30:40', 'openweathermap', 0, NULL),
(788, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 80, 1011.00, 6.20, 49, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:20:41', '2026-04-09 18:20:41', '2026-04-09 18:30:41', 'openweathermap', 0, NULL),
(789, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 82, 1011.00, 8.30, 15, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:20:41', '2026-04-09 18:20:41', '2026-04-09 18:30:41', 'openweathermap', 0, NULL),
(790, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 75, 1010.00, 9.60, 44, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:30:40', '2026-04-09 18:30:40', '2026-04-09 18:40:40', 'openweathermap', 0, NULL),
(791, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 71, 1010.00, 7.10, 39, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:30:40', '2026-04-09 18:30:40', '2026-04-09 18:40:40', 'openweathermap', 0, NULL),
(792, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 84, 1011.00, 7.20, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:30:41', '2026-04-09 18:30:41', '2026-04-09 18:40:41', 'openweathermap', 0, NULL),
(793, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 81, 1011.00, 5.50, 55, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:30:41', '2026-04-09 18:30:41', '2026-04-09 18:40:41', 'openweathermap', 0, NULL),
(794, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 81, 1011.00, 7.30, 27, 10000, 'Clouds', 'broken clouds', '04n', 67, NULL, 0.00, 0.00, 0.00, '2026-04-09 18:30:42', '2026-04-09 18:30:42', '2026-04-09 18:40:42', 'openweathermap', 0, NULL),
(795, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1010.00, 9.60, 44, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:14:55', '2026-04-09 19:14:55', '2026-04-09 19:24:55', 'openweathermap', 0, NULL),
(796, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.10, 39, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:14:55', '2026-04-09 19:14:55', '2026-04-09 19:24:55', 'openweathermap', 0, NULL),
(797, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 83, 1011.00, 7.20, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:14:56', '2026-04-09 19:14:56', '2026-04-09 19:24:56', 'openweathermap', 0, NULL),
(798, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 80, 1011.00, 5.50, 55, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:14:56', '2026-04-09 19:14:56', '2026-04-09 19:24:56', 'openweathermap', 0, NULL),
(799, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 81, 1011.00, 7.30, 27, 10000, 'Clouds', 'broken clouds', '04n', 67, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:14:56', '2026-04-09 19:14:56', '2026-04-09 19:24:56', 'openweathermap', 0, NULL),
(800, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 11.50, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:37:01', '2026-04-09 19:37:01', '2026-04-09 19:47:01', 'openweathermap', 0, NULL),
(801, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:37:02', '2026-04-09 19:37:02', '2026-04-09 19:47:02', 'openweathermap', 0, NULL),
(802, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 85, 1011.00, 8.10, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:37:02', '2026-04-09 19:37:02', '2026-04-09 19:47:02', 'openweathermap', 0, NULL),
(803, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 82, 1011.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:37:03', '2026-04-09 19:37:03', '2026-04-09 19:47:03', 'openweathermap', 0, NULL),
(804, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 81, 1011.00, 6.20, 47, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:37:03', '2026-04-09 19:37:03', '2026-04-09 19:47:03', 'openweathermap', 0, NULL),
(805, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 11.50, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:47:02', '2026-04-09 19:47:02', '2026-04-09 19:57:02', 'openweathermap', 0, NULL),
(806, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:47:02', '2026-04-09 19:47:02', '2026-04-09 19:57:02', 'openweathermap', 0, NULL),
(807, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 85, 1011.00, 8.10, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:47:03', '2026-04-09 19:47:03', '2026-04-09 19:57:03', 'openweathermap', 0, NULL),
(808, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 82, 1011.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:47:03', '2026-04-09 19:47:03', '2026-04-09 19:57:03', 'openweathermap', 0, NULL),
(809, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 81, 1011.00, 6.20, 47, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:47:03', '2026-04-09 19:47:03', '2026-04-09 19:57:03', 'openweathermap', 0, NULL),
(810, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:57:02', '2026-04-09 19:57:02', '2026-04-09 20:07:02', 'openweathermap', 0, NULL),
(811, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 85, 1011.00, 8.10, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:57:03', '2026-04-09 19:57:03', '2026-04-09 20:07:03', 'openweathermap', 0, NULL),
(812, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 82, 1011.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:57:03', '2026-04-09 19:57:03', '2026-04-09 20:07:03', 'openweathermap', 0, NULL),
(813, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 81, 1011.00, 6.20, 47, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-09 19:57:03', '2026-04-09 19:57:03', '2026-04-09 20:07:03', 'openweathermap', 0, NULL),
(814, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 11.50, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:02:02', '2026-04-09 20:02:02', '2026-04-09 20:12:02', 'openweathermap', 0, NULL),
(815, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:07:02', '2026-04-09 20:07:02', '2026-04-09 20:17:02', 'openweathermap', 0, NULL),
(816, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 85, 1011.00, 8.10, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:07:03', '2026-04-09 20:07:03', '2026-04-09 20:17:03', 'openweathermap', 0, NULL),
(817, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:07:03', '2026-04-09 20:07:03', '2026-04-09 20:17:03', 'openweathermap', 0, NULL),
(818, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 81, 1011.00, 6.20, 47, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:07:03', '2026-04-09 20:07:03', '2026-04-09 20:17:03', 'openweathermap', 0, NULL),
(819, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 11.50, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:12:50', '2026-04-09 20:12:50', '2026-04-09 20:22:50', 'openweathermap', 0, NULL),
(820, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:17:50', '2026-04-09 20:17:50', '2026-04-09 20:27:50', 'openweathermap', 0, NULL),
(821, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 85, 1011.00, 8.10, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:17:51', '2026-04-09 20:17:51', '2026-04-09 20:27:51', 'openweathermap', 0, NULL),
(822, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:17:51', '2026-04-09 20:17:51', '2026-04-09 20:27:51', 'openweathermap', 0, NULL),
(823, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 81, 1011.00, 6.20, 47, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:17:51', '2026-04-09 20:17:51', '2026-04-09 20:27:51', 'openweathermap', 0, NULL),
(824, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 11.50, 43, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:27:50', '2026-04-09 20:27:50', '2026-04-09 20:37:50', 'openweathermap', 0, NULL),
(825, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1010.00, 7.00, 34, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:27:50', '2026-04-09 20:27:50', '2026-04-09 20:37:50', 'openweathermap', 0, NULL),
(826, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 85, 1011.00, 8.10, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:27:51', '2026-04-09 20:27:51', '2026-04-09 20:37:51', 'openweathermap', 0, NULL),
(827, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 6.10, 57, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:27:51', '2026-04-09 20:27:51', '2026-04-09 20:37:51', 'openweathermap', 0, NULL),
(828, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 81, 1011.00, 6.20, 47, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:27:51', '2026-04-09 20:27:51', '2026-04-09 20:37:51', 'openweathermap', 0, NULL),
(829, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 79, 1011.00, 12.50, 44, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:39:15', '2026-04-09 20:39:15', '2026-04-09 20:49:15', 'openweathermap', 0, NULL),
(830, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1011.00, 7.40, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:39:15', '2026-04-09 20:39:15', '2026-04-09 20:49:15', 'openweathermap', 0, NULL),
(831, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 88, 1012.00, 8.40, 47, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:39:16', '2026-04-09 20:39:16', '2026-04-09 20:49:16', 'openweathermap', 0, NULL),
(832, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 83, 1011.00, 6.40, 59, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:39:16', '2026-04-09 20:39:16', '2026-04-09 20:49:16', 'openweathermap', 0, NULL),
(833, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1011.00, 5.50, 70, 10000, 'Clouds', 'broken clouds', '04n', 72, NULL, 0.00, 0.00, 0.00, '2026-04-09 20:39:17', '2026-04-09 20:39:17', '2026-04-09 20:49:17', 'openweathermap', 0, NULL),
(834, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 79, 1011.00, 12.50, 44, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:07:53', '2026-04-09 21:07:53', '2026-04-09 21:17:53', 'openweathermap', 0, NULL),
(835, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1011.00, 7.40, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:07:53', '2026-04-09 21:07:53', '2026-04-09 21:17:53', 'openweathermap', 0, NULL),
(836, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 88, 1012.00, 8.40, 47, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:07:54', '2026-04-09 21:07:54', '2026-04-09 21:17:54', 'openweathermap', 0, NULL),
(837, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 83, 1011.00, 6.40, 59, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:07:55', '2026-04-09 21:07:55', '2026-04-09 21:17:55', 'openweathermap', 0, NULL),
(838, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1011.00, 5.50, 70, 10000, 'Clouds', 'broken clouds', '04n', 72, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:07:56', '2026-04-09 21:07:56', '2026-04-09 21:17:56', 'openweathermap', 0, NULL),
(839, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 79, 1011.00, 12.50, 44, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:17:55', '2026-04-09 21:17:55', '2026-04-09 21:27:55', 'openweathermap', 0, NULL),
(840, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1011.00, 7.40, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:17:55', '2026-04-09 21:17:55', '2026-04-09 21:27:55', 'openweathermap', 0, NULL),
(841, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 88, 1012.00, 8.40, 47, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:17:56', '2026-04-09 21:17:56', '2026-04-09 21:27:56', 'openweathermap', 0, NULL),
(842, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 83, 1011.00, 6.40, 59, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:17:56', '2026-04-09 21:17:56', '2026-04-09 21:27:56', 'openweathermap', 0, NULL),
(843, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1011.00, 5.50, 70, 10000, 'Clouds', 'broken clouds', '04n', 72, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:17:56', '2026-04-09 21:17:56', '2026-04-09 21:27:56', 'openweathermap', 0, NULL),
(844, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 72, 1011.00, 7.40, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:27:55', '2026-04-09 21:27:55', '2026-04-09 21:37:55', 'openweathermap', 0, NULL),
(845, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 83, 1011.00, 6.40, 59, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:27:56', '2026-04-09 21:27:56', '2026-04-09 21:37:56', 'openweathermap', 0, NULL),
(846, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1011.00, 5.50, 70, 10000, 'Clouds', 'broken clouds', '04n', 72, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:27:57', '2026-04-09 21:27:57', '2026-04-09 21:37:57', 'openweathermap', 0, NULL),
(847, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 81, 1012.00, 12.50, 46, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:32:55', '2026-04-09 21:32:55', '2026-04-09 21:42:55', 'openweathermap', 0, NULL),
(848, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 90, 1012.00, 8.00, 49, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:32:56', '2026-04-09 21:32:56', '2026-04-09 21:42:56', 'openweathermap', 0, NULL),
(849, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 73, 1011.00, 7.50, 54, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:37:55', '2026-04-09 21:37:55', '2026-04-09 21:47:55', 'openweathermap', 0, NULL),
(850, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1012.00, 6.30, 64, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:37:56', '2026-04-09 21:37:56', '2026-04-09 21:47:56', 'openweathermap', 0, NULL),
(851, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 81, 1012.00, 12.50, 46, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:43:50', '2026-04-09 21:43:50', '2026-04-09 21:53:50', 'openweathermap', 0, NULL),
(852, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 90, 1012.00, 8.00, 49, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:43:51', '2026-04-09 21:43:51', '2026-04-09 21:53:51', 'openweathermap', 0, NULL),
(853, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1012.00, 5.70, 90, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:43:51', '2026-04-09 21:43:51', '2026-04-09 21:53:51', 'openweathermap', 0, NULL),
(854, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 73, 1011.00, 7.50, 54, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:48:50', '2026-04-09 21:48:50', '2026-04-09 21:58:50', 'openweathermap', 0, NULL),
(855, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1012.00, 6.30, 64, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:48:51', '2026-04-09 21:48:51', '2026-04-09 21:58:51', 'openweathermap', 0, NULL),
(856, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1012.00, 5.70, 90, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:53:51', '2026-04-09 21:53:51', '2026-04-09 22:03:51', 'openweathermap', 0, NULL),
(857, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 81, 1012.00, 12.50, 46, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:58:50', '2026-04-09 21:58:50', '2026-04-09 22:08:50', 'openweathermap', 0, NULL),
(858, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 73, 1011.00, 7.50, 54, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:58:50', '2026-04-09 21:58:50', '2026-04-09 22:08:50', 'openweathermap', 0, NULL),
(859, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 90, 1012.00, 8.00, 49, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:58:51', '2026-04-09 21:58:51', '2026-04-09 22:08:51', 'openweathermap', 0, NULL),
(860, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1012.00, 6.30, 64, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 21:58:51', '2026-04-09 21:58:51', '2026-04-09 22:08:51', 'openweathermap', 0, NULL),
(861, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1012.00, 5.70, 90, 10000, 'Clouds', 'broken clouds', '04d', 75, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:03:51', '2026-04-09 22:03:51', '2026-04-09 22:13:51', 'openweathermap', 0, NULL),
(862, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 73, 1011.00, 7.50, 54, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:08:50', '2026-04-09 22:08:50', '2026-04-09 22:18:50', 'openweathermap', 0, NULL),
(863, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 90, 1012.00, 8.00, 49, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:08:51', '2026-04-09 22:08:51', '2026-04-09 22:18:51', 'openweathermap', 0, NULL),
(864, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1012.00, 6.30, 64, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:08:51', '2026-04-09 22:08:51', '2026-04-09 22:18:51', 'openweathermap', 0, NULL),
(865, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 81, 1012.00, 12.50, 46, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:13:50', '2026-04-09 22:13:50', '2026-04-09 22:23:50', 'openweathermap', 0, NULL),
(866, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1012.00, 5.70, 90, 10000, 'Clouds', 'broken clouds', '04d', 75, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:13:51', '2026-04-09 22:13:51', '2026-04-09 22:23:51', 'openweathermap', 0, NULL),
(867, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 73, 1011.00, 7.50, 54, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:18:50', '2026-04-09 22:18:50', '2026-04-09 22:28:50', 'openweathermap', 0, NULL),
(868, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 90, 1012.00, 8.00, 49, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:18:51', '2026-04-09 22:18:51', '2026-04-09 22:28:51', 'openweathermap', 0, NULL),
(869, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1012.00, 6.30, 64, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:18:51', '2026-04-09 22:18:51', '2026-04-09 22:28:51', 'openweathermap', 0, NULL),
(870, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 27.00, 81, 1012.00, 5.70, 90, 10000, 'Clouds', 'broken clouds', '04d', 75, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:23:51', '2026-04-09 22:23:51', '2026-04-09 22:33:51', 'openweathermap', 0, NULL),
(871, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 81, 1012.00, 12.50, 46, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:28:50', '2026-04-09 22:28:50', '2026-04-09 22:38:50', 'openweathermap', 0, NULL),
(872, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 25.00, 73, 1011.00, 7.50, 54, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:28:50', '2026-04-09 22:28:50', '2026-04-09 22:38:50', 'openweathermap', 0, NULL),
(873, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 22.00, 90, 1012.00, 8.00, 49, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:28:51', '2026-04-09 22:28:51', '2026-04-09 22:38:51', 'openweathermap', 0, NULL),
(874, 4, 12.44130000, 121.15300000, 'Naujan Lake', 23.00, 24.00, 85, 1012.00, 6.30, 64, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:28:51', '2026-04-09 22:28:51', '2026-04-09 22:38:51', 'openweathermap', 0, NULL),
(875, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 80, 1012.00, 5.80, 106, 10000, 'Rain', 'light rain', '10d', 74, NULL, 0.15, 0.00, 0.00, '2026-04-09 22:33:51', '2026-04-09 22:33:51', '2026-04-09 22:43:51', 'openweathermap', 0, NULL),
(876, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 73, 1012.00, 8.40, 59, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:38:50', '2026-04-09 22:38:50', '2026-04-09 22:48:50', 'openweathermap', 0, NULL),
(877, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 78, 1013.00, 7.80, 57, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:38:51', '2026-04-09 22:38:51', '2026-04-09 22:48:51', 'openweathermap', 0, NULL),
(878, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 73, 1013.00, 6.00, 71, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:38:51', '2026-04-09 22:38:51', '2026-04-09 22:48:51', 'openweathermap', 0, NULL),
(879, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 78, 1012.00, 13.20, 49, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:43:50', '2026-04-09 22:43:50', '2026-04-09 22:53:50', 'openweathermap', 0, NULL),
(880, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 80, 1012.00, 5.80, 106, 10000, 'Clouds', 'broken clouds', '04d', 74, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:43:51', '2026-04-09 22:43:51', '2026-04-09 22:53:51', 'openweathermap', 0, NULL),
(881, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 73, 1012.00, 8.40, 59, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:48:50', '2026-04-09 22:48:50', '2026-04-09 22:58:50', 'openweathermap', 0, NULL),
(882, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 78, 1013.00, 7.80, 57, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:48:51', '2026-04-09 22:48:51', '2026-04-09 22:58:51', 'openweathermap', 0, NULL),
(883, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 73, 1013.00, 6.00, 71, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:48:51', '2026-04-09 22:48:51', '2026-04-09 22:58:51', 'openweathermap', 0, NULL),
(884, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 80, 1012.00, 5.80, 106, 10000, 'Clouds', 'broken clouds', '04d', 74, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:53:51', '2026-04-09 22:53:51', '2026-04-09 23:03:51', 'openweathermap', 0, NULL),
(885, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 78, 1012.00, 13.20, 49, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:58:50', '2026-04-09 22:58:50', '2026-04-09 23:08:50', 'openweathermap', 0, NULL),
(886, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 73, 1012.00, 8.40, 59, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:58:50', '2026-04-09 22:58:50', '2026-04-09 23:08:50', 'openweathermap', 0, NULL),
(887, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 78, 1013.00, 7.80, 57, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:58:51', '2026-04-09 22:58:51', '2026-04-09 23:08:51', 'openweathermap', 0, NULL),
(888, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 73, 1013.00, 6.00, 71, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 22:58:51', '2026-04-09 22:58:51', '2026-04-09 23:08:51', 'openweathermap', 0, NULL),
(889, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 80, 1012.00, 5.80, 106, 10000, 'Clouds', 'broken clouds', '04d', 74, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:03:51', '2026-04-09 23:03:51', '2026-04-09 23:13:51', 'openweathermap', 0, NULL),
(890, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 73, 1012.00, 8.40, 59, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:08:50', '2026-04-09 23:08:50', '2026-04-09 23:18:50', 'openweathermap', 0, NULL),
(891, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 78, 1013.00, 7.80, 57, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:08:51', '2026-04-09 23:08:51', '2026-04-09 23:18:51', 'openweathermap', 0, NULL),
(892, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 73, 1013.00, 6.00, 71, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:08:51', '2026-04-09 23:08:51', '2026-04-09 23:18:51', 'openweathermap', 0, NULL),
(893, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 78, 1012.00, 13.20, 49, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:13:50', '2026-04-09 23:13:50', '2026-04-09 23:23:50', 'openweathermap', 0, NULL),
(894, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 80, 1012.00, 5.80, 106, 10000, 'Clouds', 'broken clouds', '04d', 74, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:13:52', '2026-04-09 23:13:52', '2026-04-09 23:23:52', 'openweathermap', 0, NULL),
(895, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 73, 1012.00, 8.40, 59, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:18:50', '2026-04-09 23:18:50', '2026-04-09 23:28:50', 'openweathermap', 0, NULL),
(896, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 78, 1013.00, 7.80, 57, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:18:51', '2026-04-09 23:18:51', '2026-04-09 23:28:51', 'openweathermap', 0, NULL),
(897, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 73, 1013.00, 6.00, 71, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:18:51', '2026-04-09 23:18:51', '2026-04-09 23:28:51', 'openweathermap', 0, NULL),
(898, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 78, 1012.00, 13.20, 49, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:28:50', '2026-04-09 23:28:50', '2026-04-09 23:38:50', 'openweathermap', 0, NULL),
(899, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 73, 1012.00, 8.40, 59, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:28:50', '2026-04-09 23:28:50', '2026-04-09 23:38:50', 'openweathermap', 0, NULL),
(900, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 78, 1013.00, 7.80, 57, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:28:51', '2026-04-09 23:28:51', '2026-04-09 23:38:51', 'openweathermap', 0, NULL),
(901, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 73, 1013.00, 6.00, 71, 10000, 'Clear', 'clear sky', '01d', 1, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:28:51', '2026-04-09 23:28:51', '2026-04-09 23:38:51', 'openweathermap', 0, NULL),
(902, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 79, 1012.00, 5.80, 106, 10000, 'Clouds', 'broken clouds', '04d', 74, NULL, 0.00, 0.00, 0.00, '2026-04-09 23:28:52', '2026-04-09 23:28:52', '2026-04-09 23:38:52', 'openweathermap', 0, NULL),
(903, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 70, 1013.00, 21.00, 100, 10000, 'Clear', 'clear sky', '01d', 10, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:34:08', '2026-04-10 01:34:08', '2026-04-10 01:44:08', 'openweathermap', 0, NULL),
(904, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1014.00, 11.10, 129, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:34:11', '2026-04-10 01:34:11', '2026-04-10 01:44:11', 'openweathermap', 0, NULL),
(905, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 32.00, 51, 1013.00, 11.00, 98, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:34:11', '2026-04-10 01:34:11', '2026-04-10 01:44:11', 'openweathermap', 0, NULL),
(906, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 47, 1013.00, 5.20, 168, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:34:12', '2026-04-10 01:34:12', '2026-04-10 01:44:12', 'openweathermap', 0, NULL),
(907, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 34.00, 69, 1014.00, 12.50, 94, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:34:12', '2026-04-10 01:34:12', '2026-04-10 01:44:12', 'openweathermap', 0, NULL),
(908, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 70, 1013.00, 21.00, 100, 10000, 'Clear', 'clear sky', '01d', 10, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:54:50', '2026-04-10 01:54:50', '2026-04-10 02:04:50', 'openweathermap', 0, NULL),
(909, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1014.00, 11.10, 129, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:54:52', '2026-04-10 01:54:52', '2026-04-10 02:04:52', 'openweathermap', 0, NULL),
(910, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 52, 1013.00, 11.00, 98, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:54:52', '2026-04-10 01:54:52', '2026-04-10 02:04:52', 'openweathermap', 0, NULL),
(911, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 48, 1013.00, 5.20, 168, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:54:53', '2026-04-10 01:54:53', '2026-04-10 02:04:53', 'openweathermap', 0, NULL),
(912, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 78, 1014.00, 12.50, 94, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-10 01:54:53', '2026-04-10 01:54:53', '2026-04-10 02:04:53', 'openweathermap', 0, NULL),
(913, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 71, 1013.00, 21.00, 100, 10000, 'Clear', 'clear sky', '01d', 10, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:09:33', '2026-04-10 02:09:33', '2026-04-10 02:19:33', 'openweathermap', 0, NULL),
(914, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1014.00, 11.10, 129, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:09:33', '2026-04-10 02:09:33', '2026-04-10 02:19:33', 'openweathermap', 0, NULL),
(915, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 52, 1013.00, 11.00, 98, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:09:33', '2026-04-10 02:09:33', '2026-04-10 02:19:33', 'openweathermap', 0, NULL),
(916, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 49, 1013.00, 5.20, 168, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:09:34', '2026-04-10 02:09:34', '2026-04-10 02:19:34', 'openweathermap', 0, NULL),
(917, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 37.00, 83, 1014.00, 12.50, 94, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:09:34', '2026-04-10 02:09:34', '2026-04-10 02:19:34', 'openweathermap', 0, NULL),
(918, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 72, 1013.00, 24.70, 117, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:55:19', '2026-04-10 02:55:19', '2026-04-10 03:05:19', 'openweathermap', 0, NULL),
(919, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 76, 1013.00, 15.60, 132, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:55:19', '2026-04-10 02:55:19', '2026-04-10 03:05:19', 'openweathermap', 0, NULL),
(920, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 47, 1013.00, 9.80, 129, 10000, 'Clouds', 'scattered clouds', '03d', 35, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:55:20', '2026-04-10 02:55:20', '2026-04-10 03:05:20', 'openweathermap', 0, NULL),
(921, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 47, 1013.00, 10.70, 202, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:55:20', '2026-04-10 02:55:20', '2026-04-10 03:05:20', 'openweathermap', 0, NULL),
(922, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 69, 1013.00, 14.90, 87, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-10 02:55:21', '2026-04-10 02:55:21', '2026-04-10 03:05:21', 'openweathermap', 0, NULL),
(923, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 72, 1013.00, 24.70, 117, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:10:16', '2026-04-10 03:10:16', '2026-04-10 03:20:16', 'openweathermap', 0, NULL),
(924, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 76, 1013.00, 15.60, 132, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:10:16', '2026-04-10 03:10:16', '2026-04-10 03:20:16', 'openweathermap', 0, NULL),
(925, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 34.00, 48, 1013.00, 9.80, 129, 10000, 'Clouds', 'scattered clouds', '03d', 35, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:10:16', '2026-04-10 03:10:16', '2026-04-10 03:20:16', 'openweathermap', 0, NULL),
(926, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 47, 1013.00, 10.70, 202, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:10:17', '2026-04-10 03:10:17', '2026-04-10 03:20:17', 'openweathermap', 0, NULL),
(927, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 37.00, 69, 1013.00, 14.90, 87, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:10:17', '2026-04-10 03:10:17', '2026-04-10 03:20:17', 'openweathermap', 0, NULL),
(928, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 73, 1013.00, 21.10, 131, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:49:19', '2026-04-10 03:49:19', '2026-04-10 03:59:19', 'openweathermap', 0, NULL),
(929, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 75, 1013.00, 11.10, 149, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:49:19', '2026-04-10 03:49:19', '2026-04-10 03:59:19', 'openweathermap', 0, NULL),
(930, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 33.00, 49, 1012.00, 11.30, 187, 10000, 'Clouds', 'scattered clouds', '03d', 39, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:49:19', '2026-04-10 03:49:19', '2026-04-10 03:59:19', 'openweathermap', 0, NULL),
(931, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 49, 1012.00, 16.20, 215, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:49:19', '2026-04-10 03:49:19', '2026-04-10 03:59:19', 'openweathermap', 0, NULL),
(932, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 67, 1013.00, 16.20, 88, 10000, 'Clouds', 'few clouds', '02d', 21, NULL, 0.00, 0.00, 0.00, '2026-04-10 03:49:20', '2026-04-10 03:49:20', '2026-04-10 03:59:20', 'openweathermap', 0, NULL),
(933, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 71, 1012.00, 12.20, 131, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:14:03', '2026-04-10 05:14:03', '2026-04-10 05:24:03', 'openweathermap', 0, NULL),
(934, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1012.00, 7.10, 156, 10000, 'Clouds', 'few clouds', '02d', 11, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:14:04', '2026-04-10 05:14:04', '2026-04-10 05:24:04', 'openweathermap', 0, NULL),
(935, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 55, 1012.00, 10.80, 187, 10000, 'Clouds', 'scattered clouds', '03d', 47, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:14:05', '2026-04-10 05:14:05', '2026-04-10 05:24:05', 'openweathermap', 0, NULL),
(936, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 53, 1012.00, 15.30, 210, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:14:07', '2026-04-10 05:14:07', '2026-04-10 05:24:07', 'openweathermap', 0, NULL),
(937, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 38.00, 62, 1011.00, 16.60, 92, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:14:07', '2026-04-10 05:14:07', '2026-04-10 05:24:07', 'openweathermap', 0, NULL),
(938, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 71, 1012.00, 8.70, 136, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:35:10', '2026-04-10 05:35:10', '2026-04-10 05:45:10', 'openweathermap', 0, NULL),
(939, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1012.00, 5.00, 170, 10000, 'Clear', 'clear sky', '01d', 9, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:35:10', '2026-04-10 05:35:10', '2026-04-10 05:45:10', 'openweathermap', 0, NULL),
(940, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 31.00, 61, 1012.00, 8.60, 171, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:35:11', '2026-04-10 05:35:11', '2026-04-10 05:45:11', 'openweathermap', 0, NULL),
(941, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 35.00, 57, 1011.00, 12.30, 205, 10000, 'Clouds', 'scattered clouds', '03d', 48, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:35:11', '2026-04-10 05:35:11', '2026-04-10 05:45:11', 'openweathermap', 0, NULL),
(942, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 33.00, 39.00, 61, 1011.00, 15.60, 109, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:35:11', '2026-04-10 05:35:11', '2026-04-10 05:45:11', 'openweathermap', 0, NULL),
(943, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 71, 1012.00, 8.70, 136, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:56:39', '2026-04-10 05:56:39', '2026-04-10 06:06:39', 'openweathermap', 0, NULL),
(944, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1012.00, 5.00, 170, 10000, 'Clear', 'clear sky', '01d', 9, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:56:39', '2026-04-10 05:56:39', '2026-04-10 06:06:39', 'openweathermap', 0, NULL),
(945, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 31.00, 61, 1012.00, 8.60, 171, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:56:39', '2026-04-10 05:56:39', '2026-04-10 06:06:39', 'openweathermap', 0, NULL),
(946, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 35.00, 57, 1011.00, 12.30, 205, 10000, 'Clouds', 'scattered clouds', '03d', 48, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:56:40', '2026-04-10 05:56:40', '2026-04-10 06:06:40', 'openweathermap', 0, NULL),
(947, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 33.00, 39.00, 62, 1011.00, 15.60, 109, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-10 05:56:40', '2026-04-10 05:56:40', '2026-04-10 06:06:40', 'openweathermap', 0, NULL),
(948, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 71, 1012.00, 17.20, 115, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-10 06:14:20', '2026-04-10 06:14:20', '2026-04-10 06:24:20', 'openweathermap', 0, NULL),
(949, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1012.00, 11.60, 137, 10000, 'Clear', 'clear sky', '01d', 3, NULL, 0.00, 0.00, 0.00, '2026-04-10 06:14:22', '2026-04-10 06:14:22', '2026-04-10 06:24:22', 'openweathermap', 0, NULL),
(950, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 31.00, 61, 1012.00, 3.60, 154, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-10 06:14:22', '2026-04-10 06:14:22', '2026-04-10 06:24:22', 'openweathermap', 0, NULL),
(951, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 35.00, 57, 1011.00, 9.90, 212, 10000, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-04-10 06:14:23', '2026-04-10 06:14:23', '2026-04-10 06:24:23', 'openweathermap', 0, NULL),
(952, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 33.00, 39.00, 62, 1011.00, 16.80, 117, 10000, 'Clouds', 'few clouds', '02d', 20, NULL, 0.00, 0.00, 0.00, '2026-04-10 06:14:24', '2026-04-10 06:14:24', '2026-04-10 06:24:24', 'openweathermap', 0, NULL),
(953, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 73, 1011.00, 10.00, 96, 10000, 'Clouds', 'few clouds', '02d', 20, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:19:24', '2026-04-10 09:19:24', '2026-04-10 09:29:24', 'openweathermap', 0, NULL),
(954, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1011.00, 7.30, 99, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:19:24', '2026-04-10 09:19:24', '2026-04-10 09:29:24', 'openweathermap', 0, NULL),
(955, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 29.00, 72, 1011.00, 0.50, 23, 10000, 'Clouds', 'broken clouds', '04d', 82, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:19:25', '2026-04-10 09:19:25', '2026-04-10 09:29:25', 'openweathermap', 0, NULL),
(956, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 32.00, 68, 1011.00, 4.20, 232, 10000, 'Clouds', 'broken clouds', '04d', 73, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:19:26', '2026-04-10 09:19:26', '2026-04-10 09:29:26', 'openweathermap', 0, NULL),
(957, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 67, 1010.00, 7.30, 109, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:19:27', '2026-04-10 09:19:27', '2026-04-10 09:29:27', 'openweathermap', 0, NULL),
(958, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 74, 1011.00, 5.10, 92, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:49:44', '2026-04-10 09:49:44', '2026-04-10 09:59:44', 'openweathermap', 0, NULL),
(959, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 74, 1011.00, 3.70, 71, 10000, 'Clear', 'clear sky', '01d', 3, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:49:45', '2026-04-10 09:49:45', '2026-04-10 09:59:45', 'openweathermap', 0, NULL),
(960, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1012.00, 2.70, 276, 10000, 'Clouds', 'broken clouds', '04d', 79, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:49:45', '2026-04-10 09:49:45', '2026-04-10 09:59:45', 'openweathermap', 0, NULL),
(961, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 73, 1011.00, 4.50, 258, 10000, 'Clouds', 'broken clouds', '04d', 70, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:49:46', '2026-04-10 09:49:46', '2026-04-10 09:59:46', 'openweathermap', 0, NULL),
(962, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 34.00, 74, 1011.00, 7.20, 100, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-10 09:49:46', '2026-04-10 09:49:46', '2026-04-10 09:59:46', 'openweathermap', 0, NULL),
(963, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 79, 1013.00, 7.30, 311, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:39:36', '2026-04-10 13:39:36', '2026-04-10 13:49:36', 'openweathermap', 0, NULL),
(964, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 75, 1013.00, 7.90, 333, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:39:37', '2026-04-10 13:39:37', '2026-04-10 13:49:37', 'openweathermap', 0, NULL),
(965, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 87, 1014.00, 4.10, 2, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:39:37', '2026-04-10 13:39:37', '2026-04-10 13:49:37', 'openweathermap', 0, NULL),
(966, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 27.00, 85, 1013.00, 4.50, 2, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:39:38', '2026-04-10 13:39:38', '2026-04-10 13:49:38', 'openweathermap', 0, NULL),
(967, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 82, 1013.00, 3.50, 171, 10000, 'Clouds', 'scattered clouds', '03n', 44, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:39:39', '2026-04-10 13:39:39', '2026-04-10 13:49:39', 'openweathermap', 0, NULL),
(968, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 79, 1013.00, 7.30, 311, 10000, 'Clear', 'clear sky', '01n', 4, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:52:29', '2026-04-10 13:52:29', '2026-04-10 14:02:29', 'openweathermap', 0, NULL),
(969, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 75, 1013.00, 7.90, 333, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:52:30', '2026-04-10 13:52:30', '2026-04-10 14:02:30', 'openweathermap', 0, NULL),
(970, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 87, 1014.00, 4.10, 2, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:52:31', '2026-04-10 13:52:31', '2026-04-10 14:02:31', 'openweathermap', 0, NULL),
(971, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 27.00, 85, 1013.00, 4.50, 2, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:52:31', '2026-04-10 13:52:31', '2026-04-10 14:02:31', 'openweathermap', 0, NULL),
(972, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 82, 1013.00, 3.50, 171, 10000, 'Clouds', 'scattered clouds', '03n', 44, NULL, 0.00, 0.00, 0.00, '2026-04-10 13:52:32', '2026-04-10 13:52:32', '2026-04-10 14:02:32', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(973, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 78, 1011.00, 3.90, 16, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-10 17:20:11', '2026-04-10 17:20:11', '2026-04-10 17:30:11', 'openweathermap', 0, NULL),
(974, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 76, 1011.00, 4.60, 10, 10000, 'Clouds', 'few clouds', '02n', 19, NULL, 0.00, 0.00, 0.00, '2026-04-10 17:20:12', '2026-04-10 17:20:12', '2026-04-10 17:30:12', 'openweathermap', 0, NULL),
(975, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 24.00, 87, 1012.00, 4.70, 53, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-10 17:20:12', '2026-04-10 17:20:12', '2026-04-10 17:30:12', 'openweathermap', 0, NULL),
(976, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 85, 1012.00, 5.40, 58, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-10 17:20:13', '2026-04-10 17:20:13', '2026-04-10 17:30:13', 'openweathermap', 0, NULL),
(977, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 84, 1011.00, 2.60, 60, 10000, 'Clouds', 'broken clouds', '04n', 77, NULL, 0.00, 0.00, 0.00, '2026-04-10 17:20:13', '2026-04-10 17:20:13', '2026-04-10 17:30:13', 'openweathermap', 0, NULL),
(978, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 75, 1010.00, 7.80, 82, 10000, 'Clouds', 'broken clouds', '04d', 65, NULL, 0.00, 0.00, 0.00, '2026-04-11 09:33:19', '2026-04-11 09:33:19', '2026-04-11 09:43:19', 'openweathermap', 0, NULL),
(979, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1010.00, 7.00, 100, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-11 09:33:20', '2026-04-11 09:33:20', '2026-04-11 09:43:20', 'openweathermap', 0, NULL),
(980, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 81, 1011.00, 2.30, 333, 10000, 'Clouds', 'overcast clouds', '04d', 95, NULL, 0.00, 0.00, 0.00, '2026-04-11 09:33:21', '2026-04-11 09:33:21', '2026-04-11 09:43:21', 'openweathermap', 0, NULL),
(981, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 77, 1010.00, 1.90, 244, 10000, 'Rain', 'light rain', '10d', 87, NULL, 0.14, 0.00, 0.00, '2026-04-11 09:33:22', '2026-04-11 09:33:22', '2026-04-11 09:43:22', 'openweathermap', 0, NULL),
(982, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 34.00, 76, 1010.00, 11.50, 80, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-11 09:33:23', '2026-04-11 09:33:23', '2026-04-11 09:43:23', 'openweathermap', 0, NULL),
(983, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1009.00, 29.10, 103, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:31:10', '2026-04-12 05:31:10', '2026-04-12 05:41:10', 'openweathermap', 0, NULL),
(984, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 70, 1010.00, 23.20, 128, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:31:11', '2026-04-12 05:31:11', '2026-04-12 05:41:11', 'openweathermap', 0, NULL),
(985, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 47, 1009.00, 2.70, 213, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:31:12', '2026-04-12 05:31:12', '2026-04-12 05:41:12', 'openweathermap', 0, NULL),
(986, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 48, 1009.00, 11.80, 222, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:31:12', '2026-04-12 05:31:12', '2026-04-12 05:41:12', 'openweathermap', 0, NULL),
(987, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 32.00, 44, 1010.00, 10.50, 72, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:31:13', '2026-04-12 05:31:13', '2026-04-12 05:41:13', 'openweathermap', 0, NULL),
(988, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1009.00, 29.10, 103, 10000, 'Clouds', 'few clouds', '02d', 15, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:46:00', '2026-04-12 05:46:00', '2026-04-12 05:56:00', 'openweathermap', 0, NULL),
(989, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 70, 1010.00, 23.20, 128, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:46:00', '2026-04-12 05:46:00', '2026-04-12 05:56:00', 'openweathermap', 0, NULL),
(990, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 47, 1009.00, 2.70, 213, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:46:00', '2026-04-12 05:46:00', '2026-04-12 05:56:00', 'openweathermap', 0, NULL),
(991, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 48, 1009.00, 11.80, 222, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:46:01', '2026-04-12 05:46:01', '2026-04-12 05:56:01', 'openweathermap', 0, NULL),
(992, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 32.00, 44, 1010.00, 10.50, 72, 10000, 'Clouds', 'scattered clouds', '03d', 44, NULL, 0.00, 0.00, 0.00, '2026-04-12 05:46:01', '2026-04-12 05:46:01', '2026-04-12 05:56:01', 'openweathermap', 0, NULL),
(993, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 73, 1011.00, 13.70, 319, 10000, 'Clouds', 'scattered clouds', '03n', 40, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:18:55', '2026-04-13 11:18:55', '2026-04-13 11:28:55', 'openweathermap', 0, NULL),
(994, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 75, 1011.00, 18.80, 321, 10000, 'Clouds', 'scattered clouds', '03n', 46, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:18:56', '2026-04-13 11:18:56', '2026-04-13 11:28:56', 'openweathermap', 0, NULL),
(995, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 25.00, 77, 1012.00, 6.70, 328, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:18:57', '2026-04-13 11:18:57', '2026-04-13 11:28:57', 'openweathermap', 0, NULL),
(996, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 27.00, 74, 1011.00, 8.60, 323, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:18:57', '2026-04-13 11:18:57', '2026-04-13 11:28:57', 'openweathermap', 0, NULL),
(997, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 76, 1011.00, 11.40, 51, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:18:58', '2026-04-13 11:18:58', '2026-04-13 11:28:58', 'openweathermap', 0, NULL),
(998, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 73, 1011.00, 13.70, 319, 10000, 'Clouds', 'scattered clouds', '03n', 40, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:29:57', '2026-04-13 11:29:57', '2026-04-13 11:39:57', 'openweathermap', 0, NULL),
(999, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 75, 1011.00, 18.80, 321, 10000, 'Clouds', 'scattered clouds', '03n', 46, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:29:58', '2026-04-13 11:29:58', '2026-04-13 11:39:58', 'openweathermap', 0, NULL),
(1000, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 25.00, 77, 1012.00, 6.70, 328, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:29:59', '2026-04-13 11:29:59', '2026-04-13 11:39:59', 'openweathermap', 0, NULL),
(1001, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 27.00, 74, 1011.00, 8.60, 323, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:29:59', '2026-04-13 11:29:59', '2026-04-13 11:39:59', 'openweathermap', 0, NULL),
(1002, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 76, 1011.00, 11.40, 51, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-13 11:29:59', '2026-04-13 11:29:59', '2026-04-13 11:39:59', 'openweathermap', 0, NULL),
(1003, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 33.00, 24.00, 59, 1025.00, 12.00, 123, 14390, 'Clear', 'clear sky', '01d', 58, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:01:38', '2026-04-13 12:01:38', '2026-04-13 12:11:38', 'openweathermap', 0, NULL),
(1004, 2, 12.23800000, 121.06900000, 'Arangin Falls', 22.00, 24.00, 70, 1048.00, 15.00, 233, 8146, 'Thunderstorm', 'thunderstorm with rain', '11d', 39, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:01:44', '2026-04-13 12:01:44', '2026-04-13 12:11:44', 'openweathermap', 0, NULL),
(1005, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 24.00, 82, 1012.00, 4.90, 7, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:01:49', '2026-04-13 12:01:49', '2026-04-13 12:11:49', 'openweathermap', 0, NULL),
(1006, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 80, 1012.00, 6.30, 344, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:01:51', '2026-04-13 12:01:51', '2026-04-13 12:11:51', 'openweathermap', 0, NULL),
(1007, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 79, 1012.00, 9.20, 40, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:01:54', '2026-04-13 12:01:54', '2026-04-13 12:11:54', 'openweathermap', 0, NULL),
(1008, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 30.00, 75, 1012.00, 9.20, 343, 10000, 'Clouds', 'few clouds', '02n', 15, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:21:09', '2026-04-13 12:21:09', '2026-04-13 12:31:09', 'openweathermap', 0, NULL),
(1009, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 76, 1012.00, 16.50, 324, 10000, 'Clear', 'clear sky', '01n', 8, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:21:11', '2026-04-13 12:21:11', '2026-04-13 12:31:11', 'openweathermap', 0, NULL),
(1010, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 24.00, 82, 1012.00, 4.90, 7, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:21:11', '2026-04-13 12:21:11', '2026-04-13 12:31:11', 'openweathermap', 0, NULL),
(1011, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 80, 1012.00, 6.30, 344, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:21:12', '2026-04-13 12:21:12', '2026-04-13 12:31:12', 'openweathermap', 0, NULL),
(1012, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 79, 1012.00, 9.20, 40, 10000, 'Clear', 'clear sky', '01n', 1, NULL, 0.00, 0.00, 0.00, '2026-04-13 12:21:13', '2026-04-13 12:21:13', '2026-04-13 12:31:13', 'openweathermap', 0, NULL),
(1013, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1013.00, 18.80, 75, 10000, 'Clear', 'clear sky', '01d', 7, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:43:11', '2026-04-14 00:43:11', '2026-04-14 00:53:11', 'openweathermap', 0, NULL),
(1014, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1013.00, 7.60, 107, 10000, 'Clear', 'clear sky', '01d', 7, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:43:13', '2026-04-14 00:43:13', '2026-04-14 00:53:13', 'openweathermap', 0, NULL),
(1015, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 49, 1013.00, 12.00, 76, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:43:15', '2026-04-14 00:43:15', '2026-04-14 00:53:15', 'openweathermap', 0, NULL),
(1016, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 44, 1013.00, 5.40, 101, 10000, 'Clear', 'clear sky', '01d', 7, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:43:16', '2026-04-14 00:43:16', '2026-04-14 00:53:16', 'openweathermap', 0, NULL),
(1017, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 69, 1014.00, 12.60, 69, 10000, 'Clouds', 'broken clouds', '04d', 66, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:43:18', '2026-04-14 00:43:18', '2026-04-14 00:53:18', 'openweathermap', 0, NULL),
(1018, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 26.00, 56, 1014.00, 8.00, 333, 5800, 'Mist', 'mist', '50d', 48, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:57:59', '2026-04-14 00:57:59', '2026-04-14 01:07:59', 'openweathermap', 0, NULL),
(1019, 2, 12.23800000, 121.06900000, 'Arangin Falls', 21.00, 28.00, 66, 1025.00, 18.00, 186, 12132, 'Mist', 'mist', '50d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:57:59', '2026-04-14 00:57:59', '2026-04-14 01:07:59', 'openweathermap', 0, NULL),
(1020, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 24.00, 52, 1046.00, 18.00, 179, 12936, 'Mist', 'mist', '50d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:58:00', '2026-04-14 00:58:00', '2026-04-14 01:08:00', 'openweathermap', 0, NULL),
(1021, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 30.00, 45, 1042.00, 16.00, 238, 11522, 'Clouds', 'scattered clouds', '03d', 64, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:58:00', '2026-04-14 00:58:00', '2026-04-14 01:08:00', 'openweathermap', 0, NULL),
(1022, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 25.00, 72, 1037.00, 15.00, 99, 7596, 'Thunderstorm', 'thunderstorm with rain', '11d', 41, NULL, 0.00, 0.00, 0.00, '2026-04-14 00:58:00', '2026-04-14 00:58:00', '2026-04-14 01:08:00', 'openweathermap', 0, NULL),
(1023, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1013.00, 18.80, 75, 10000, 'Clear', 'clear sky', '01d', 7, NULL, 0.00, 0.00, 0.00, '2026-04-14 01:12:54', '2026-04-14 01:12:54', '2026-04-14 01:22:54', 'openweathermap', 0, NULL),
(1024, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1013.00, 7.60, 107, 10000, 'Clear', 'clear sky', '01d', 7, NULL, 0.00, 0.00, 0.00, '2026-04-14 01:12:55', '2026-04-14 01:12:55', '2026-04-14 01:22:55', 'openweathermap', 0, NULL),
(1025, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 30.00, 49, 1013.00, 12.00, 76, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-14 01:12:56', '2026-04-14 01:12:56', '2026-04-14 01:22:56', 'openweathermap', 0, NULL),
(1026, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 44, 1013.00, 5.40, 101, 10000, 'Clear', 'clear sky', '01d', 7, NULL, 0.00, 0.00, 0.00, '2026-04-14 01:12:56', '2026-04-14 01:12:56', '2026-04-14 01:22:56', 'openweathermap', 0, NULL),
(1027, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 68, 1014.00, 12.60, 69, 10000, 'Clouds', 'broken clouds', '04d', 66, NULL, 0.00, 0.00, 0.00, '2026-04-14 01:12:57', '2026-04-14 01:12:57', '2026-04-14 01:22:57', 'openweathermap', 0, NULL),
(1028, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 31.00, 25.00, 74, 1037.00, 16.00, 100, 5966, 'Thunderstorm', 'thunderstorm with rain', '11d', 24, NULL, 0.00, 0.00, 0.00, '2026-04-16 03:45:39', '2026-04-16 03:45:39', '2026-04-16 03:55:39', 'openweathermap', 0, NULL),
(1029, 2, 12.23800000, 121.06900000, 'Arangin Falls', 30.00, 35.00, 64, 1034.00, 14.00, 112, 11600, 'Rain', 'light rain', '10d', 45, NULL, 0.33, 0.00, 0.00, '2026-04-16 03:45:40', '2026-04-16 03:45:40', '2026-04-16 03:55:40', 'openweathermap', 0, NULL),
(1030, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 30.00, 62, 1035.00, 5.00, 251, 8427, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-16 03:45:40', '2026-04-16 03:45:40', '2026-04-16 03:55:40', 'openweathermap', 0, NULL),
(1031, 4, 12.44130000, 121.15300000, 'Naujan Lake', 22.00, 34.00, 45, 1028.00, 8.00, 8, 12839, 'Thunderstorm', 'thunderstorm with rain', '11d', 32, NULL, 0.00, 0.00, 0.00, '2026-04-16 03:45:40', '2026-04-16 03:45:40', '2026-04-16 03:55:40', 'openweathermap', 0, NULL),
(1032, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 27.00, 64, 1003.00, 2.00, 95, 11434, 'Rain', 'light rain', '10d', 38, NULL, 4.23, 0.00, 0.00, '2026-04-16 03:45:41', '2026-04-16 03:45:41', '2026-04-16 03:55:41', 'openweathermap', 0, NULL),
(1033, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 71, 1011.00, 9.30, 338, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:18:58', '2026-04-17 14:18:58', '2026-04-17 14:28:58', 'openweathermap', 0, NULL),
(1034, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 70, 1011.00, 10.80, 351, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:18:59', '2026-04-17 14:18:59', '2026-04-17 14:28:59', 'openweathermap', 0, NULL),
(1035, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 77, 1012.00, 5.80, 7, 10000, 'Clouds', 'few clouds', '02n', 15, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:18:59', '2026-04-17 14:18:59', '2026-04-17 14:28:59', 'openweathermap', 0, NULL),
(1036, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 76, 1012.00, 6.40, 23, 10000, 'Clouds', 'few clouds', '02n', 14, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:19:00', '2026-04-17 14:19:00', '2026-04-17 14:29:00', 'openweathermap', 0, NULL),
(1037, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 69, 1011.00, 3.60, 266, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:19:01', '2026-04-17 14:19:01', '2026-04-17 14:29:01', 'openweathermap', 0, NULL),
(1038, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 71, 1011.00, 9.30, 338, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:29:02', '2026-04-17 14:29:02', '2026-04-17 14:39:02', 'openweathermap', 0, NULL),
(1039, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 70, 1011.00, 10.80, 351, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:29:02', '2026-04-17 14:29:02', '2026-04-17 14:39:02', 'openweathermap', 0, NULL),
(1040, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 77, 1012.00, 5.80, 7, 10000, 'Clouds', 'few clouds', '02n', 15, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:29:04', '2026-04-17 14:29:04', '2026-04-17 14:39:04', 'openweathermap', 0, NULL),
(1041, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 76, 1012.00, 6.40, 23, 10000, 'Clouds', 'few clouds', '02n', 14, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:29:04', '2026-04-17 14:29:04', '2026-04-17 14:39:04', 'openweathermap', 0, NULL),
(1042, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 69, 1011.00, 3.60, 266, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-04-17 14:29:05', '2026-04-17 14:29:05', '2026-04-17 14:39:05', 'openweathermap', 0, NULL),
(1043, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 22.00, 69, 1028.00, 7.00, 296, 14823, 'Rain', 'light rain', '10d', 72, NULL, 9.56, 0.00, 0.00, '2026-04-18 00:50:56', '2026-04-18 00:50:56', '2026-04-18 01:00:56', 'openweathermap', 0, NULL),
(1044, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 60, 1013.00, 7.00, 125, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-18 00:51:00', '2026-04-18 00:51:00', '2026-04-18 01:01:00', 'openweathermap', 0, NULL),
(1045, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 29.00, 41, 1013.00, 4.50, 123, 10000, 'Clouds', 'overcast clouds', '04d', 88, NULL, 0.00, 0.00, 0.00, '2026-04-18 00:51:02', '2026-04-18 00:51:02', '2026-04-18 01:01:02', 'openweathermap', 0, NULL),
(1046, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 31.00, 38, 1013.00, 5.50, 181, 10000, 'Clouds', 'scattered clouds', '03d', 50, NULL, 0.00, 0.00, 0.00, '2026-04-18 00:51:03', '2026-04-18 00:51:03', '2026-04-18 01:01:03', 'openweathermap', 0, NULL),
(1047, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 67, 1013.00, 9.50, 87, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-18 00:51:03', '2026-04-18 00:51:03', '2026-04-18 01:01:03', 'openweathermap', 0, NULL),
(1048, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1011.00, 23.10, 119, 10000, 'Clouds', 'overcast clouds', '04d', 88, NULL, 0.00, 0.00, 0.00, '2026-04-18 04:18:26', '2026-04-18 04:18:26', '2026-04-18 04:28:26', 'openweathermap', 0, NULL),
(1049, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 69, 1011.00, 14.40, 132, 10000, 'Clouds', 'scattered clouds', '03d', 50, NULL, 0.00, 0.00, 0.00, '2026-04-18 04:18:26', '2026-04-18 04:18:26', '2026-04-18 04:28:26', 'openweathermap', 0, NULL),
(1050, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 33.00, 33.00, 35, 1010.00, 10.00, 162, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-18 04:18:28', '2026-04-18 04:18:28', '2026-04-18 04:28:28', 'openweathermap', 0, NULL),
(1051, 4, 12.44130000, 121.15300000, 'Naujan Lake', 34.00, 35.00, 36, 1010.00, 14.90, 200, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-04-18 04:18:28', '2026-04-18 04:18:28', '2026-04-18 04:28:28', 'openweathermap', 0, NULL),
(1052, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 58, 1011.00, 14.50, 74, 10000, 'Clear', 'clear sky', '01d', 5, NULL, 0.00, 0.00, 0.00, '2026-04-18 04:18:29', '2026-04-18 04:18:29', '2026-04-18 04:28:29', 'openweathermap', 0, NULL),
(1053, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 30.00, 30.00, 44, 1038.00, 13.00, 78, 14235, 'Rain', 'light rain', '10d', 49, NULL, 4.23, 0.00, 0.00, '2026-04-18 05:06:08', '2026-04-18 05:06:08', '2026-04-18 05:16:08', 'openweathermap', 0, NULL),
(1054, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 32.00, 34.00, 44, 1009.00, 14.40, 81, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-18 06:08:36', '2026-04-18 06:08:36', '2026-04-18 06:18:36', 'openweathermap', 0, NULL),
(1055, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 32.00, 34.00, 49, 1008.00, 13.70, 102, 10000, 'Clear', 'clear sky', '01d', 0, NULL, 0.00, 0.00, 0.00, '2026-04-18 07:58:50', '2026-04-18 07:58:50', '2026-04-18 08:08:50', 'openweathermap', 0, NULL),
(1056, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 29.00, 63, 1010.00, 15.60, 55, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-18 11:23:29', '2026-04-18 11:23:29', '2026-04-18 11:33:29', 'openweathermap', 0, NULL),
(1057, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 64, 1010.00, 10.30, 72, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-18 11:23:30', '2026-04-18 11:23:30', '2026-04-18 11:33:30', 'openweathermap', 0, NULL),
(1058, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 64, 1010.00, 5.40, 22, 10000, 'Clouds', 'few clouds', '02n', 24, NULL, 0.00, 0.00, 0.00, '2026-04-18 11:23:30', '2026-04-18 11:23:30', '2026-04-18 11:33:30', 'openweathermap', 0, NULL),
(1059, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 65, 1010.00, 4.80, 357, 10000, 'Clouds', 'few clouds', '02n', 17, NULL, 0.00, 0.00, 0.00, '2026-04-18 11:23:31', '2026-04-18 11:23:31', '2026-04-18 11:33:31', 'openweathermap', 0, NULL),
(1060, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 70, 1010.00, 4.70, 80, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-18 11:23:31', '2026-04-18 11:23:31', '2026-04-18 11:33:31', 'openweathermap', 0, NULL),
(1061, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 30.00, 69, 1012.00, 15.60, 63, 10000, 'Clouds', 'broken clouds', '04d', 84, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:18:58', '2026-04-19 00:18:58', '2026-04-19 00:28:58', 'openweathermap', 0, NULL),
(1062, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1012.00, 10.30, 75, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:18:58', '2026-04-19 00:18:58', '2026-04-19 00:28:58', 'openweathermap', 0, NULL),
(1063, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 28.00, 62, 1012.00, 8.80, 76, 10000, 'Clouds', 'overcast clouds', '04d', 85, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:18:59', '2026-04-19 00:18:59', '2026-04-19 00:28:59', 'openweathermap', 0, NULL),
(1064, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 30.00, 57, 1012.00, 6.70, 100, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:19:00', '2026-04-19 00:19:00', '2026-04-19 00:29:00', 'openweathermap', 0, NULL),
(1065, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 70, 1012.00, 4.50, 61, 10000, 'Clouds', 'broken clouds', '04d', 83, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:19:00', '2026-04-19 00:19:00', '2026-04-19 00:29:00', 'openweathermap', 0, NULL),
(1066, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1012.00, 17.70, 83, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:44:40', '2026-04-19 00:44:40', '2026-04-19 00:54:40', 'openweathermap', 0, NULL),
(1067, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1012.00, 11.20, 91, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:44:40', '2026-04-19 00:44:40', '2026-04-19 00:54:40', 'openweathermap', 0, NULL),
(1068, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 30.00, 51, 1012.00, 9.40, 88, 10000, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:44:40', '2026-04-19 00:44:40', '2026-04-19 00:54:40', 'openweathermap', 0, NULL),
(1069, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 48, 1012.00, 4.80, 128, 10000, 'Clouds', 'broken clouds', '04d', 59, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:44:41', '2026-04-19 00:44:41', '2026-04-19 00:54:41', 'openweathermap', 0, NULL),
(1070, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 68, 1012.00, 7.60, 66, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 00:44:42', '2026-04-19 00:44:42', '2026-04-19 00:54:42', 'openweathermap', 0, NULL),
(1071, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 66, 1012.00, 17.70, 83, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:02:04', '2026-04-19 01:02:04', '2026-04-19 01:12:04', 'openweathermap', 0, NULL),
(1072, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 67, 1012.00, 11.20, 91, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:02:04', '2026-04-19 01:02:04', '2026-04-19 01:12:04', 'openweathermap', 0, NULL),
(1073, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 30.00, 52, 1012.00, 9.40, 88, 10000, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:02:04', '2026-04-19 01:02:04', '2026-04-19 01:12:04', 'openweathermap', 0, NULL),
(1074, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 32.00, 48, 1012.00, 4.80, 128, 10000, 'Clouds', 'broken clouds', '04d', 59, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:02:05', '2026-04-19 01:02:05', '2026-04-19 01:12:05', 'openweathermap', 0, NULL),
(1075, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 68, 1012.00, 7.60, 66, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:02:05', '2026-04-19 01:02:05', '2026-04-19 01:12:05', 'openweathermap', 0, NULL),
(1076, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 67, 1012.00, 23.80, 101, 10000, 'Clouds', 'overcast clouds', '04d', 97, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:54:56', '2026-04-19 01:54:56', '2026-04-19 02:04:56', 'openweathermap', 0, NULL),
(1077, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 69, 1012.00, 14.70, 117, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:54:56', '2026-04-19 01:54:56', '2026-04-19 02:04:56', 'openweathermap', 0, NULL),
(1078, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 44, 1012.00, 12.00, 110, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:54:57', '2026-04-19 01:54:57', '2026-04-19 02:04:57', 'openweathermap', 0, NULL),
(1079, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1012.00, 7.10, 172, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:54:57', '2026-04-19 01:54:57', '2026-04-19 02:04:57', 'openweathermap', 0, NULL),
(1080, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 34.00, 66, 1012.00, 10.30, 69, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-04-19 01:54:58', '2026-04-19 01:54:58', '2026-04-19 02:04:58', 'openweathermap', 0, NULL),
(1081, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 67, 1012.00, 23.80, 101, 10000, 'Clouds', 'overcast clouds', '04d', 97, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:09:14', '2026-04-19 02:09:14', '2026-04-19 02:19:14', 'openweathermap', 0, NULL),
(1082, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 69, 1012.00, 14.70, 117, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:09:15', '2026-04-19 02:09:15', '2026-04-19 02:19:15', 'openweathermap', 0, NULL),
(1083, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 45, 1012.00, 12.00, 110, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:09:16', '2026-04-19 02:09:16', '2026-04-19 02:19:16', 'openweathermap', 0, NULL),
(1084, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1012.00, 7.10, 172, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:09:16', '2026-04-19 02:09:16', '2026-04-19 02:19:16', 'openweathermap', 0, NULL),
(1085, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 34.00, 66, 1012.00, 10.30, 69, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:09:16', '2026-04-19 02:09:16', '2026-04-19 02:19:16', 'openweathermap', 0, NULL),
(1086, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 67, 1012.00, 23.80, 101, 10000, 'Clouds', 'overcast clouds', '04d', 97, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:19:14', '2026-04-19 02:19:14', '2026-04-19 02:29:14', 'openweathermap', 0, NULL),
(1087, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 69, 1012.00, 14.70, 117, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:24:14', '2026-04-19 02:24:14', '2026-04-19 02:34:14', 'openweathermap', 0, NULL),
(1088, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 45, 1012.00, 12.00, 110, 10000, 'Clouds', 'scattered clouds', '03d', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:24:15', '2026-04-19 02:24:15', '2026-04-19 02:34:15', 'openweathermap', 0, NULL),
(1089, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 33.00, 42, 1012.00, 7.10, 172, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:24:15', '2026-04-19 02:24:15', '2026-04-19 02:34:15', 'openweathermap', 0, NULL),
(1090, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 34.00, 65, 1012.00, 10.30, 69, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:24:16', '2026-04-19 02:24:16', '2026-04-19 02:34:16', 'openweathermap', 0, NULL),
(1091, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 67, 1012.00, 23.80, 101, 10000, 'Clouds', 'overcast clouds', '04d', 97, NULL, 0.00, 0.00, 0.00, '2026-04-19 02:29:14', '2026-04-19 02:29:14', '2026-04-19 02:39:14', 'openweathermap', 0, NULL),
(1092, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1012.00, 27.30, 106, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:08:03', '2026-04-19 03:08:03', '2026-04-19 03:18:03', 'openweathermap', 0, NULL),
(1093, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1012.00, 21.20, 120, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:12:00', '2026-04-19 03:12:00', '2026-04-19 03:22:00', 'openweathermap', 0, NULL),
(1094, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 32.00, 41, 1011.00, 14.20, 112, 10000, 'Clouds', 'broken clouds', '04d', 64, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:12:01', '2026-04-19 03:12:01', '2026-04-19 03:22:01', 'openweathermap', 0, NULL),
(1095, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 34.00, 42, 1011.00, 10.20, 175, 10000, 'Clouds', 'broken clouds', '04d', 75, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:12:01', '2026-04-19 03:12:01', '2026-04-19 03:22:01', 'openweathermap', 0, NULL),
(1096, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 64, 1012.00, 13.10, 76, 10000, 'Clouds', 'few clouds', '02d', 20, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:12:02', '2026-04-19 03:12:02', '2026-04-19 03:22:02', 'openweathermap', 0, NULL),
(1097, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1011.00, 26.00, 113, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:35:53', '2026-04-19 03:35:53', '2026-04-19 03:45:53', 'openweathermap', 0, NULL),
(1098, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 71, 1011.00, 21.30, 127, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:35:53', '2026-04-19 03:35:53', '2026-04-19 03:45:53', 'openweathermap', 0, NULL),
(1099, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 32.00, 41, 1010.00, 9.70, 124, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:35:54', '2026-04-19 03:35:54', '2026-04-19 03:45:54', 'openweathermap', 0, NULL),
(1100, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 42, 1011.00, 10.50, 189, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:35:54', '2026-04-19 03:35:54', '2026-04-19 03:45:54', 'openweathermap', 0, NULL),
(1101, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 63, 1011.00, 16.00, 83, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:35:55', '2026-04-19 03:35:55', '2026-04-19 03:45:55', 'openweathermap', 0, NULL),
(1102, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1011.00, 26.00, 113, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:45:53', '2026-04-19 03:45:53', '2026-04-19 03:55:53', 'openweathermap', 0, NULL),
(1103, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 71, 1011.00, 21.30, 127, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:45:53', '2026-04-19 03:45:53', '2026-04-19 03:55:53', 'openweathermap', 0, NULL),
(1104, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 32.00, 41, 1010.00, 9.70, 124, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:45:54', '2026-04-19 03:45:54', '2026-04-19 03:55:54', 'openweathermap', 0, NULL),
(1105, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 42, 1011.00, 10.50, 189, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:45:54', '2026-04-19 03:45:54', '2026-04-19 03:55:54', 'openweathermap', 0, NULL),
(1106, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 63, 1011.00, 16.00, 83, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:45:55', '2026-04-19 03:45:55', '2026-04-19 03:55:55', 'openweathermap', 0, NULL),
(1107, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1011.00, 26.00, 113, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:55:53', '2026-04-19 03:55:53', '2026-04-19 04:05:53', 'openweathermap', 0, NULL),
(1108, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 71, 1011.00, 21.30, 127, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:55:53', '2026-04-19 03:55:53', '2026-04-19 04:05:53', 'openweathermap', 0, NULL),
(1109, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 32.00, 41, 1010.00, 9.70, 124, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:55:54', '2026-04-19 03:55:54', '2026-04-19 04:05:54', 'openweathermap', 0, NULL),
(1110, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 42, 1011.00, 10.50, 189, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:55:54', '2026-04-19 03:55:54', '2026-04-19 04:05:54', 'openweathermap', 0, NULL),
(1111, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 63, 1011.00, 16.00, 83, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-19 03:55:55', '2026-04-19 03:55:55', '2026-04-19 04:05:55', 'openweathermap', 0, NULL),
(1112, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1011.00, 26.00, 113, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-19 04:05:53', '2026-04-19 04:05:53', '2026-04-19 04:15:53', 'openweathermap', 0, NULL),
(1113, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 71, 1011.00, 21.30, 127, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 04:05:53', '2026-04-19 04:05:53', '2026-04-19 04:15:53', 'openweathermap', 0, NULL),
(1114, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 32.00, 41, 1010.00, 9.70, 124, 10000, 'Clouds', 'broken clouds', '04d', 72, NULL, 0.00, 0.00, 0.00, '2026-04-19 04:05:54', '2026-04-19 04:05:54', '2026-04-19 04:15:54', 'openweathermap', 0, NULL),
(1115, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 42, 1011.00, 10.50, 189, 10000, 'Clouds', 'broken clouds', '04d', 81, NULL, 0.00, 0.00, 0.00, '2026-04-19 04:05:54', '2026-04-19 04:05:54', '2026-04-19 04:15:54', 'openweathermap', 0, NULL),
(1116, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 32.00, 35.00, 53, 1009.00, 15.30, 84, 10000, 'Clouds', 'broken clouds', '04d', 56, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:52:19', '2026-04-19 05:52:19', '2026-04-19 06:02:19', 'openweathermap', 0, NULL),
(1117, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', 32.00, 35.00, 52, 1009.00, 15.10, 83, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:53:02', '2026-04-19 05:53:02', '2026-04-19 06:03:02', 'openweathermap', 0, NULL),
(1118, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 45, 1009.00, 6.70, 96, 10000, 'Clouds', 'broken clouds', '04d', 77, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:53:16', '2026-04-19 05:53:16', '2026-04-19 06:03:16', 'openweathermap', 0, NULL),
(1119, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1009.00, 26.20, 110, 10000, 'Clouds', 'broken clouds', '04d', 67, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:54:01', '2026-04-19 05:54:01', '2026-04-19 06:04:01', 'openweathermap', 0, NULL),
(1120, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1009.00, 25.50, 130, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:54:01', '2026-04-19 05:54:01', '2026-04-19 06:04:01', 'openweathermap', 0, NULL),
(1121, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 45, 1009.00, 9.20, 186, 10000, 'Clouds', 'overcast clouds', '04d', 88, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:54:02', '2026-04-19 05:54:02', '2026-04-19 06:04:02', 'openweathermap', 0, NULL),
(1122, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 57, 1009.00, 15.80, 89, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-19 05:54:02', '2026-04-19 05:54:02', '2026-04-19 06:04:02', 'openweathermap', 0, NULL),
(1123, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1009.00, 26.20, 110, 10000, 'Clouds', 'broken clouds', '04d', 67, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:04:01', '2026-04-19 06:04:01', '2026-04-19 06:14:01', 'openweathermap', 0, NULL),
(1124, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1009.00, 25.50, 130, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:04:01', '2026-04-19 06:04:01', '2026-04-19 06:14:01', 'openweathermap', 0, NULL),
(1125, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 45, 1009.00, 6.70, 96, 10000, 'Clouds', 'broken clouds', '04d', 77, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:04:02', '2026-04-19 06:04:02', '2026-04-19 06:14:02', 'openweathermap', 0, NULL),
(1126, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 45, 1009.00, 9.20, 186, 10000, 'Clouds', 'overcast clouds', '04d', 88, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:04:02', '2026-04-19 06:04:02', '2026-04-19 06:14:02', 'openweathermap', 0, NULL),
(1127, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 57, 1009.00, 15.80, 89, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:04:03', '2026-04-19 06:04:03', '2026-04-19 06:14:03', 'openweathermap', 0, NULL),
(1128, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1009.00, 26.20, 110, 10000, 'Clouds', 'broken clouds', '04d', 67, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:14:01', '2026-04-19 06:14:01', '2026-04-19 06:24:01', 'openweathermap', 0, NULL),
(1129, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1009.00, 25.50, 130, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:14:01', '2026-04-19 06:14:01', '2026-04-19 06:24:01', 'openweathermap', 0, NULL),
(1130, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 45, 1009.00, 6.70, 96, 10000, 'Clouds', 'broken clouds', '04d', 77, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:14:02', '2026-04-19 06:14:02', '2026-04-19 06:24:02', 'openweathermap', 0, NULL),
(1131, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 45, 1009.00, 9.20, 186, 10000, 'Clouds', 'overcast clouds', '04d', 88, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:14:02', '2026-04-19 06:14:02', '2026-04-19 06:24:02', 'openweathermap', 0, NULL),
(1132, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 57, 1009.00, 15.80, 89, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:14:03', '2026-04-19 06:14:03', '2026-04-19 06:24:03', 'openweathermap', 0, NULL),
(1133, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1009.00, 26.20, 110, 10000, 'Clouds', 'broken clouds', '04d', 67, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:24:01', '2026-04-19 06:24:01', '2026-04-19 06:34:01', 'openweathermap', 0, NULL),
(1134, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 72, 1009.00, 25.50, 130, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:24:01', '2026-04-19 06:24:01', '2026-04-19 06:34:01', 'openweathermap', 0, NULL),
(1135, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 33.00, 45, 1009.00, 6.70, 96, 10000, 'Clouds', 'broken clouds', '04d', 77, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:24:02', '2026-04-19 06:24:02', '2026-04-19 06:34:02', 'openweathermap', 0, NULL),
(1136, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 35.00, 45, 1009.00, 9.20, 186, 10000, 'Clouds', 'overcast clouds', '04d', 88, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:24:02', '2026-04-19 06:24:02', '2026-04-19 06:34:02', 'openweathermap', 0, NULL),
(1137, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 57, 1009.00, 15.80, 89, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:24:03', '2026-04-19 06:24:03', '2026-04-19 06:34:03', 'openweathermap', 0, NULL),
(1138, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 69, 1009.00, 23.90, 107, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:34:45', '2026-04-19 06:34:45', '2026-04-19 06:44:45', 'openweathermap', 0, NULL),
(1139, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1009.00, 21.40, 130, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:34:45', '2026-04-19 06:34:45', '2026-04-19 06:44:45', 'openweathermap', 0, NULL),
(1140, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 51, 1009.00, 4.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:34:46', '2026-04-19 06:34:46', '2026-04-19 06:44:46', 'openweathermap', 0, NULL),
(1141, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 51, 1009.00, 7.20, 203, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:34:46', '2026-04-19 06:34:46', '2026-04-19 06:44:46', 'openweathermap', 0, NULL),
(1142, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 58, 1008.00, 15.20, 105, 10000, 'Clouds', 'overcast clouds', '04d', 94, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:34:47', '2026-04-19 06:34:47', '2026-04-19 06:44:47', 'openweathermap', 0, NULL),
(1143, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 69, 1009.00, 23.90, 107, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:44:45', '2026-04-19 06:44:45', '2026-04-19 06:54:45', 'openweathermap', 0, NULL),
(1144, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1009.00, 21.40, 130, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:44:45', '2026-04-19 06:44:45', '2026-04-19 06:54:45', 'openweathermap', 0, NULL),
(1145, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 51, 1009.00, 4.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:44:46', '2026-04-19 06:44:46', '2026-04-19 06:54:46', 'openweathermap', 0, NULL),
(1146, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 51, 1009.00, 7.20, 203, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:44:46', '2026-04-19 06:44:46', '2026-04-19 06:54:46', 'openweathermap', 0, NULL),
(1147, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 58, 1008.00, 15.20, 105, 10000, 'Clouds', 'overcast clouds', '04d', 94, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:44:47', '2026-04-19 06:44:47', '2026-04-19 06:54:47', 'openweathermap', 0, NULL),
(1148, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 69, 1009.00, 23.90, 107, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:54:45', '2026-04-19 06:54:45', '2026-04-19 07:04:45', 'openweathermap', 0, NULL),
(1149, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1009.00, 21.40, 130, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:54:45', '2026-04-19 06:54:45', '2026-04-19 07:04:45', 'openweathermap', 0, NULL),
(1150, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 51, 1009.00, 4.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:54:46', '2026-04-19 06:54:46', '2026-04-19 07:04:46', 'openweathermap', 0, NULL),
(1151, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 51, 1009.00, 7.20, 203, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:54:46', '2026-04-19 06:54:46', '2026-04-19 07:04:46', 'openweathermap', 0, NULL),
(1152, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 58, 1008.00, 15.20, 105, 10000, 'Clouds', 'overcast clouds', '04d', 94, NULL, 0.00, 0.00, 0.00, '2026-04-19 06:59:47', '2026-04-19 06:59:47', '2026-04-19 07:09:47', 'openweathermap', 0, NULL),
(1153, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 69, 1009.00, 23.90, 107, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:04:45', '2026-04-19 07:04:45', '2026-04-19 07:14:45', 'openweathermap', 0, NULL),
(1154, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1009.00, 21.40, 130, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:04:45', '2026-04-19 07:04:45', '2026-04-19 07:14:45', 'openweathermap', 0, NULL),
(1155, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 51, 1009.00, 4.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:04:46', '2026-04-19 07:04:46', '2026-04-19 07:14:46', 'openweathermap', 0, NULL),
(1156, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 51, 1009.00, 7.20, 203, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:04:46', '2026-04-19 07:04:46', '2026-04-19 07:14:46', 'openweathermap', 0, NULL),
(1157, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 69, 1009.00, 23.90, 107, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:14:45', '2026-04-19 07:14:45', '2026-04-19 07:24:45', 'openweathermap', 0, NULL),
(1158, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1009.00, 21.40, 130, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:14:45', '2026-04-19 07:14:45', '2026-04-19 07:24:45', 'openweathermap', 0, NULL),
(1159, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 51, 1009.00, 4.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:14:46', '2026-04-19 07:14:46', '2026-04-19 07:24:46', 'openweathermap', 0, NULL),
(1160, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 51, 1009.00, 7.20, 203, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:14:46', '2026-04-19 07:14:46', '2026-04-19 07:24:46', 'openweathermap', 0, NULL),
(1161, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 57, 1008.00, 15.20, 105, 10000, 'Clouds', 'overcast clouds', '04d', 94, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:14:47', '2026-04-19 07:14:47', '2026-04-19 07:24:47', 'openweathermap', 0, NULL),
(1162, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 69, 1009.00, 23.90, 107, 10000, 'Clear', 'clear sky', '01d', 8, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:24:45', '2026-04-19 07:24:45', '2026-04-19 07:34:45', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(1163, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1009.00, 21.40, 130, 10000, 'Clear', 'clear sky', '01d', 4, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:24:45', '2026-04-19 07:24:45', '2026-04-19 07:34:45', 'openweathermap', 0, NULL),
(1164, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 51, 1009.00, 4.60, 70, 10000, 'Clouds', 'scattered clouds', '03d', 46, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:24:46', '2026-04-19 07:24:46', '2026-04-19 07:34:46', 'openweathermap', 0, NULL),
(1165, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 51, 1009.00, 7.20, 203, 10000, 'Clouds', 'broken clouds', '04d', 54, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:24:46', '2026-04-19 07:24:46', '2026-04-19 07:34:46', 'openweathermap', 0, NULL),
(1166, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 36.00, 57, 1008.00, 15.20, 105, 10000, 'Clouds', 'overcast clouds', '04d', 94, NULL, 0.00, 0.00, 0.00, '2026-04-19 07:24:47', '2026-04-19 07:24:47', '2026-04-19 07:34:47', 'openweathermap', 0, NULL),
(1167, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 68, 1009.00, 20.70, 101, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:17:35', '2026-04-19 08:17:35', '2026-04-19 08:27:35', 'openweathermap', 0, NULL),
(1168, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1009.00, 19.00, 127, 10000, 'Clouds', 'scattered clouds', '03d', 35, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:17:36', '2026-04-19 08:17:36', '2026-04-19 08:27:36', 'openweathermap', 0, NULL),
(1169, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 30.00, 54, 1009.00, 5.60, 357, 10000, 'Clouds', 'broken clouds', '04d', 57, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:17:36', '2026-04-19 08:17:36', '2026-04-19 08:27:36', 'openweathermap', 0, NULL),
(1170, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 33.00, 55, 1009.00, 6.50, 242, 10000, 'Clouds', 'broken clouds', '04d', 70, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:17:37', '2026-04-19 08:17:37', '2026-04-19 08:27:37', 'openweathermap', 0, NULL),
(1171, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 59, 1008.00, 13.80, 111, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:17:38', '2026-04-19 08:17:38', '2026-04-19 08:27:38', 'openweathermap', 0, NULL),
(1172, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 68, 1009.00, 20.70, 101, 10000, 'Clouds', 'few clouds', '02d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:27:40', '2026-04-19 08:27:40', '2026-04-19 08:37:40', 'openweathermap', 0, NULL),
(1173, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 73, 1009.00, 19.00, 127, 10000, 'Clouds', 'scattered clouds', '03d', 35, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:27:41', '2026-04-19 08:27:41', '2026-04-19 08:37:41', 'openweathermap', 0, NULL),
(1174, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 30.00, 54, 1009.00, 5.60, 357, 10000, 'Clouds', 'broken clouds', '04d', 57, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:27:41', '2026-04-19 08:27:41', '2026-04-19 08:37:41', 'openweathermap', 0, NULL),
(1175, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 33.00, 55, 1009.00, 6.50, 242, 10000, 'Clouds', 'broken clouds', '04d', 70, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:27:42', '2026-04-19 08:27:42', '2026-04-19 08:37:42', 'openweathermap', 0, NULL),
(1176, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 35.00, 59, 1008.00, 13.80, 111, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-19 08:27:42', '2026-04-19 08:27:42', '2026-04-19 08:37:42', 'openweathermap', 0, NULL),
(1177, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 66, 1009.00, 19.30, 91, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:02:38', '2026-04-19 09:02:38', '2026-04-19 09:12:38', 'openweathermap', 0, NULL),
(1178, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 71, 1009.00, 16.20, 126, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:02:39', '2026-04-19 09:02:39', '2026-04-19 09:12:39', 'openweathermap', 0, NULL),
(1179, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 29.00, 58, 1009.00, 5.20, 17, 10000, 'Clouds', 'broken clouds', '04d', 57, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:02:39', '2026-04-19 09:02:39', '2026-04-19 09:12:39', 'openweathermap', 0, NULL),
(1180, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 32.00, 58, 1009.00, 3.70, 259, 10000, 'Clouds', 'broken clouds', '04d', 67, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:02:40', '2026-04-19 09:02:40', '2026-04-19 09:12:40', 'openweathermap', 0, NULL),
(1181, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 34.00, 63, 1008.00, 13.10, 117, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:02:40', '2026-04-19 09:02:40', '2026-04-19 09:12:40', 'openweathermap', 0, NULL),
(1182, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 31.00, 66, 1009.00, 19.30, 91, 10000, 'Clouds', 'scattered clouds', '03d', 26, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:12:51', '2026-04-19 09:12:51', '2026-04-19 09:22:51', 'openweathermap', 0, NULL),
(1183, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 71, 1009.00, 16.20, 126, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:12:52', '2026-04-19 09:12:52', '2026-04-19 09:22:52', 'openweathermap', 0, NULL),
(1184, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 29.00, 58, 1009.00, 5.20, 17, 10000, 'Clouds', 'broken clouds', '04d', 57, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:12:52', '2026-04-19 09:12:52', '2026-04-19 09:22:52', 'openweathermap', 0, NULL),
(1185, 4, 12.44130000, 121.15300000, 'Naujan Lake', 30.00, 32.00, 58, 1009.00, 3.70, 259, 10000, 'Clouds', 'broken clouds', '04d', 67, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:12:52', '2026-04-19 09:12:52', '2026-04-19 09:22:52', 'openweathermap', 0, NULL),
(1186, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 34.00, 63, 1008.00, 13.10, 117, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:12:52', '2026-04-19 09:12:52', '2026-04-19 09:22:52', 'openweathermap', 0, NULL),
(1187, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1009.00, 17.60, 98, 10000, 'Clouds', 'scattered clouds', '03d', 28, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:54:35', '2026-04-19 09:54:35', '2026-04-19 10:04:35', 'openweathermap', 0, NULL),
(1188, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 70, 1009.00, 15.40, 133, 10000, 'Clouds', 'scattered clouds', '03d', 33, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:54:35', '2026-04-19 09:54:35', '2026-04-19 10:04:35', 'openweathermap', 0, NULL),
(1189, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 66, 1010.00, 3.30, 55, 10000, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:54:36', '2026-04-19 09:54:36', '2026-04-19 10:04:36', 'openweathermap', 0, NULL),
(1190, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 30.00, 65, 1010.00, 2.20, 274, 10000, 'Clouds', 'broken clouds', '04d', 57, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:54:36', '2026-04-19 09:54:36', '2026-04-19 10:04:36', 'openweathermap', 0, NULL),
(1191, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 33.00, 68, 1009.00, 9.50, 114, 10000, 'Clouds', 'broken clouds', '04d', 78, NULL, 0.00, 0.00, 0.00, '2026-04-19 09:54:36', '2026-04-19 09:54:36', '2026-04-19 10:04:36', 'openweathermap', 0, NULL),
(1192, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1009.00, 17.60, 98, 10000, 'Clouds', 'scattered clouds', '03n', 28, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:28:21', '2026-04-19 10:28:21', '2026-04-19 10:38:21', 'openweathermap', 0, NULL),
(1193, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 70, 1009.00, 15.40, 133, 10000, 'Clouds', 'scattered clouds', '03n', 33, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:28:21', '2026-04-19 10:28:21', '2026-04-19 10:38:21', 'openweathermap', 0, NULL),
(1194, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 66, 1010.00, 3.30, 55, 10000, 'Clouds', 'scattered clouds', '03n', 49, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:28:21', '2026-04-19 10:28:21', '2026-04-19 10:38:21', 'openweathermap', 0, NULL),
(1195, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 30.00, 65, 1010.00, 2.20, 274, 10000, 'Clouds', 'broken clouds', '04n', 57, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:28:22', '2026-04-19 10:28:22', '2026-04-19 10:38:22', 'openweathermap', 0, NULL),
(1196, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 68, 1009.00, 9.50, 114, 10000, 'Clouds', 'broken clouds', '04n', 78, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:28:22', '2026-04-19 10:28:22', '2026-04-19 10:38:22', 'openweathermap', 0, NULL),
(1197, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 30.00, 69, 1010.00, 14.00, 63, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:39:18', '2026-04-19 10:39:18', '2026-04-19 10:49:18', 'openweathermap', 0, NULL),
(1198, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 8.60, 101, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:39:33', '2026-04-19 10:39:33', '2026-04-19 10:49:33', 'openweathermap', 0, NULL),
(1199, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 74, 1011.00, 5.10, 24, 10000, 'Clouds', 'scattered clouds', '03n', 42, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:39:33', '2026-04-19 10:39:33', '2026-04-19 10:49:33', 'openweathermap', 0, NULL),
(1200, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 74, 1011.00, 3.30, 354, 10000, 'Clouds', 'scattered clouds', '03n', 48, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:39:34', '2026-04-19 10:39:34', '2026-04-19 10:49:34', 'openweathermap', 0, NULL),
(1201, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 70, 1010.00, 6.40, 106, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:39:35', '2026-04-19 10:39:35', '2026-04-19 10:49:35', 'openweathermap', 0, NULL),
(1202, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 30.00, 69, 1010.00, 14.00, 63, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:49:24', '2026-04-19 10:49:24', '2026-04-19 10:59:24', 'openweathermap', 0, NULL),
(1203, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 8.60, 101, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:49:44', '2026-04-19 10:49:44', '2026-04-19 10:59:44', 'openweathermap', 0, NULL),
(1204, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 74, 1011.00, 5.10, 24, 10000, 'Clouds', 'scattered clouds', '03n', 42, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:49:46', '2026-04-19 10:49:46', '2026-04-19 10:59:46', 'openweathermap', 0, NULL),
(1205, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 74, 1011.00, 3.30, 354, 10000, 'Clouds', 'scattered clouds', '03n', 48, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:49:47', '2026-04-19 10:49:47', '2026-04-19 10:59:47', 'openweathermap', 0, NULL),
(1206, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 70, 1010.00, 6.40, 106, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-04-19 10:49:49', '2026-04-19 10:49:49', '2026-04-19 10:59:49', 'openweathermap', 0, NULL),
(1207, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 30.00, 69, 1010.00, 14.00, 63, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:13:22', '2026-04-19 11:13:22', '2026-04-19 11:23:22', 'openweathermap', 0, NULL),
(1208, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 8.60, 101, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:13:22', '2026-04-19 11:13:22', '2026-04-19 11:23:22', 'openweathermap', 0, NULL),
(1209, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 74, 1011.00, 5.10, 24, 10000, 'Clouds', 'scattered clouds', '03n', 42, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:13:23', '2026-04-19 11:13:23', '2026-04-19 11:23:23', 'openweathermap', 0, NULL),
(1210, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 74, 1011.00, 3.30, 354, 10000, 'Clouds', 'scattered clouds', '03n', 48, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:13:27', '2026-04-19 11:13:27', '2026-04-19 11:23:27', 'openweathermap', 0, NULL),
(1211, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 70, 1010.00, 6.40, 106, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:13:28', '2026-04-19 11:13:28', '2026-04-19 11:23:28', 'openweathermap', 0, NULL),
(1212, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 30.00, 69, 1010.00, 14.00, 63, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:24:36', '2026-04-19 11:24:36', '2026-04-19 11:34:36', 'openweathermap', 0, NULL),
(1213, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 8.60, 101, 10000, 'Clouds', 'scattered clouds', '03n', 30, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:24:37', '2026-04-19 11:24:37', '2026-04-19 11:34:37', 'openweathermap', 0, NULL),
(1214, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 74, 1011.00, 5.10, 24, 10000, 'Clouds', 'scattered clouds', '03n', 42, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:24:37', '2026-04-19 11:24:37', '2026-04-19 11:34:37', 'openweathermap', 0, NULL),
(1215, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 74, 1011.00, 3.30, 354, 10000, 'Clouds', 'scattered clouds', '03n', 48, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:24:38', '2026-04-19 11:24:38', '2026-04-19 11:34:38', 'openweathermap', 0, NULL),
(1216, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 32.00, 70, 1010.00, 6.40, 106, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:24:38', '2026-04-19 11:24:38', '2026-04-19 11:34:38', 'openweathermap', 0, NULL),
(1217, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 70, 1011.00, 10.00, 9, 10000, 'Clouds', 'scattered clouds', '03n', 32, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:35:07', '2026-04-19 11:35:07', '2026-04-19 11:45:07', 'openweathermap', 0, NULL),
(1218, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 3.90, 359, 10000, 'Clouds', 'scattered clouds', '03n', 33, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:35:07', '2026-04-19 11:35:07', '2026-04-19 11:45:07', 'openweathermap', 0, NULL),
(1219, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 24.00, 76, 1011.00, 6.90, 2, 10000, 'Clouds', 'scattered clouds', '03n', 38, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:35:07', '2026-04-19 11:35:07', '2026-04-19 11:45:07', 'openweathermap', 0, NULL),
(1220, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 76, 1011.00, 6.40, 356, 10000, 'Clouds', 'scattered clouds', '03n', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:35:08', '2026-04-19 11:35:08', '2026-04-19 11:45:08', 'openweathermap', 0, NULL),
(1221, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 71, 1011.00, 3.70, 89, 10000, 'Clouds', 'broken clouds', '04n', 53, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:35:09', '2026-04-19 11:35:09', '2026-04-19 11:45:09', 'openweathermap', 0, NULL),
(1222, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 70, 1011.00, 10.00, 9, 10000, 'Clouds', 'scattered clouds', '03n', 32, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:51:40', '2026-04-19 11:51:40', '2026-04-19 12:01:40', 'openweathermap', 0, NULL),
(1223, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 3.90, 359, 10000, 'Clouds', 'scattered clouds', '03n', 33, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:51:41', '2026-04-19 11:51:41', '2026-04-19 12:01:41', 'openweathermap', 0, NULL),
(1224, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 24.00, 76, 1011.00, 6.90, 2, 10000, 'Clouds', 'scattered clouds', '03n', 38, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:51:42', '2026-04-19 11:51:42', '2026-04-19 12:01:42', 'openweathermap', 0, NULL),
(1225, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 76, 1011.00, 6.40, 356, 10000, 'Clouds', 'scattered clouds', '03n', 43, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:51:42', '2026-04-19 11:51:42', '2026-04-19 12:01:42', 'openweathermap', 0, NULL),
(1226, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 71, 1011.00, 3.70, 89, 10000, 'Clouds', 'broken clouds', '04n', 53, NULL, 0.00, 0.00, 0.00, '2026-04-19 11:51:42', '2026-04-19 11:51:42', '2026-04-19 12:01:42', 'openweathermap', 0, NULL),
(1227, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 70, 1011.00, 9.90, 18, 10000, 'Clouds', 'few clouds', '02n', 16, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:02:44', '2026-04-19 12:02:44', '2026-04-19 12:12:44', 'openweathermap', 0, NULL),
(1228, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 68, 1010.00, 4.40, 49, 10000, 'Clouds', 'few clouds', '02n', 15, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:02:44', '2026-04-19 12:02:44', '2026-04-19 12:12:44', 'openweathermap', 0, NULL),
(1229, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 24.00, 76, 1011.00, 6.10, 359, 10000, 'Clouds', 'scattered clouds', '03n', 34, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:02:45', '2026-04-19 12:02:45', '2026-04-19 12:12:45', 'openweathermap', 0, NULL),
(1230, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 76, 1011.00, 5.50, 355, 10000, 'Clouds', 'scattered clouds', '03n', 41, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:02:45', '2026-04-19 12:02:45', '2026-04-19 12:12:45', 'openweathermap', 0, NULL),
(1231, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 71, 1011.00, 1.90, 99, 10000, 'Clouds', 'scattered clouds', '03n', 47, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:02:45', '2026-04-19 12:02:45', '2026-04-19 12:12:45', 'openweathermap', 0, NULL),
(1232, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 74, 1011.00, 11.40, 334, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:57:44', '2026-04-19 12:57:44', '2026-04-19 13:07:44', 'openweathermap', 0, NULL),
(1233, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 70, 1011.00, 7.40, 327, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:57:44', '2026-04-19 12:57:44', '2026-04-19 13:07:44', 'openweathermap', 0, NULL),
(1234, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 78, 1012.00, 6.60, 351, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:57:44', '2026-04-19 12:57:44', '2026-04-19 13:07:44', 'openweathermap', 0, NULL),
(1235, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 77, 1012.00, 6.30, 354, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:57:45', '2026-04-19 12:57:45', '2026-04-19 13:07:45', 'openweathermap', 0, NULL),
(1236, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 73, 1011.00, 0.80, 24, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-19 12:57:45', '2026-04-19 12:57:45', '2026-04-19 13:07:45', 'openweathermap', 0, NULL),
(1237, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 74, 1011.00, 11.40, 334, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:23:19', '2026-04-19 13:23:19', '2026-04-19 13:33:19', 'openweathermap', 0, NULL),
(1238, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 70, 1011.00, 7.40, 327, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:23:20', '2026-04-19 13:23:20', '2026-04-19 13:33:20', 'openweathermap', 0, NULL),
(1239, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 78, 1012.00, 6.60, 351, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:23:20', '2026-04-19 13:23:20', '2026-04-19 13:33:20', 'openweathermap', 0, NULL),
(1240, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 77, 1012.00, 6.30, 354, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:23:20', '2026-04-19 13:23:20', '2026-04-19 13:33:20', 'openweathermap', 0, NULL),
(1241, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 30.00, 73, 1011.00, 0.80, 24, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:23:20', '2026-04-19 13:23:20', '2026-04-19 13:33:20', 'openweathermap', 0, NULL),
(1242, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 76, 1012.00, 11.00, 333, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:40:04', '2026-04-19 13:40:04', '2026-04-19 13:50:04', 'openweathermap', 0, NULL),
(1243, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1012.00, 9.80, 331, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:40:04', '2026-04-19 13:40:04', '2026-04-19 13:50:04', 'openweathermap', 0, NULL),
(1244, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 77, 1012.00, 6.20, 3, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:40:04', '2026-04-19 13:40:04', '2026-04-19 13:50:04', 'openweathermap', 0, NULL),
(1245, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1012.00, 6.50, 7, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:40:04', '2026-04-19 13:40:04', '2026-04-19 13:50:04', 'openweathermap', 0, NULL),
(1246, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 74, 1012.00, 2.90, 51, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-19 13:40:05', '2026-04-19 13:40:05', '2026-04-19 13:50:05', 'openweathermap', 0, NULL),
(1247, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 76, 1012.00, 11.00, 333, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:18:28', '2026-04-19 14:18:28', '2026-04-19 14:28:28', 'openweathermap', 0, NULL),
(1248, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1012.00, 9.80, 331, 10000, 'Clouds', 'few clouds', '02n', 20, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:18:29', '2026-04-19 14:18:29', '2026-04-19 14:28:29', 'openweathermap', 0, NULL),
(1249, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 77, 1012.00, 6.20, 3, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:18:39', '2026-04-19 14:18:39', '2026-04-19 14:28:39', 'openweathermap', 0, NULL),
(1250, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 77, 1012.00, 6.50, 7, 10000, 'Clouds', 'few clouds', '02n', 11, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:18:40', '2026-04-19 14:18:40', '2026-04-19 14:28:40', 'openweathermap', 0, NULL),
(1251, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 74, 1012.00, 2.90, 51, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:18:43', '2026-04-19 14:18:43', '2026-04-19 14:28:43', 'openweathermap', 0, NULL),
(1252, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1012.00, 7.60, 5, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:30:22', '2026-04-19 14:30:22', '2026-04-19 14:40:22', 'openweathermap', 0, NULL),
(1253, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1012.00, 10.90, 359, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:30:23', '2026-04-19 14:30:23', '2026-04-19 14:40:23', 'openweathermap', 0, NULL),
(1254, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 73, 1012.00, 6.00, 33, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:30:23', '2026-04-19 14:30:23', '2026-04-19 14:40:23', 'openweathermap', 0, NULL),
(1255, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 74, 1012.00, 6.40, 31, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:30:23', '2026-04-19 14:30:23', '2026-04-19 14:40:23', 'openweathermap', 0, NULL),
(1256, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 75, 1012.00, 6.50, 34, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:30:24', '2026-04-19 14:30:24', '2026-04-19 14:40:24', 'openweathermap', 0, NULL),
(1257, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1012.00, 7.60, 5, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:41:16', '2026-04-19 14:41:16', '2026-04-19 14:51:16', 'openweathermap', 0, NULL),
(1258, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1012.00, 10.90, 359, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:41:17', '2026-04-19 14:41:17', '2026-04-19 14:51:17', 'openweathermap', 0, NULL),
(1259, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 73, 1012.00, 6.00, 33, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:41:17', '2026-04-19 14:41:17', '2026-04-19 14:51:17', 'openweathermap', 0, NULL),
(1260, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 74, 1012.00, 6.40, 31, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:41:18', '2026-04-19 14:41:18', '2026-04-19 14:51:18', 'openweathermap', 0, NULL),
(1261, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 75, 1012.00, 6.50, 34, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:41:18', '2026-04-19 14:41:18', '2026-04-19 14:51:18', 'openweathermap', 0, NULL),
(1262, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1012.00, 7.60, 5, 10000, 'Clouds', 'few clouds', '02n', 12, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:52:56', '2026-04-19 14:52:56', '2026-04-19 15:02:56', 'openweathermap', 0, NULL),
(1263, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 72, 1012.00, 10.90, 359, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:52:56', '2026-04-19 14:52:56', '2026-04-19 15:02:56', 'openweathermap', 0, NULL),
(1264, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 73, 1012.00, 6.00, 33, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:52:57', '2026-04-19 14:52:57', '2026-04-19 15:02:57', 'openweathermap', 0, NULL),
(1265, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 74, 1012.00, 6.40, 31, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:52:57', '2026-04-19 14:52:57', '2026-04-19 15:02:57', 'openweathermap', 0, NULL),
(1266, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 75, 1012.00, 6.50, 34, 10000, 'Clear', 'clear sky', '01n', 6, NULL, 0.00, 0.00, 0.00, '2026-04-19 14:53:07', '2026-04-19 14:53:07', '2026-04-19 15:03:07', 'openweathermap', 0, NULL),
(1267, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 30.00, 71, 1011.00, 8.10, 22, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-04-20 11:53:19', '2026-04-20 11:53:19', '2026-04-20 12:03:19', 'openweathermap', 0, NULL),
(1268, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1010.00, 15.70, 345, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-04-20 11:53:20', '2026-04-20 11:53:20', '2026-04-20 12:03:20', 'openweathermap', 0, NULL),
(1269, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 69, 1011.00, 6.50, 38, 10000, 'Clouds', 'broken clouds', '04n', 57, NULL, 0.00, 0.00, 0.00, '2026-04-20 11:53:20', '2026-04-20 11:53:20', '2026-04-20 12:03:20', 'openweathermap', 0, NULL),
(1270, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 71, 1011.00, 6.60, 13, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 11:53:21', '2026-04-20 11:53:21', '2026-04-20 12:03:21', 'openweathermap', 0, NULL),
(1271, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 77, 1011.00, 13.80, 38, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 11:53:21', '2026-04-20 11:53:21', '2026-04-20 12:03:21', 'openweathermap', 0, NULL),
(1272, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 28.00, 31.00, 79, 1011.00, 8.10, 35, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 11:53:49', '2026-04-20 11:53:49', '2026-04-20 12:03:49', 'openweathermap', 0, NULL),
(1273, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 30.00, 71, 1011.00, 8.10, 22, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:06:43', '2026-04-20 12:06:43', '2026-04-20 12:16:43', 'openweathermap', 0, NULL),
(1274, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1010.00, 15.70, 345, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:06:43', '2026-04-20 12:06:43', '2026-04-20 12:16:43', 'openweathermap', 0, NULL),
(1275, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 69, 1011.00, 6.50, 38, 10000, 'Clouds', 'broken clouds', '04n', 57, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:06:44', '2026-04-20 12:06:44', '2026-04-20 12:16:44', 'openweathermap', 0, NULL),
(1276, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 71, 1011.00, 6.60, 13, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:06:44', '2026-04-20 12:06:44', '2026-04-20 12:16:44', 'openweathermap', 0, NULL),
(1277, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 77, 1011.00, 13.80, 38, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:06:44', '2026-04-20 12:06:44', '2026-04-20 12:16:44', 'openweathermap', 0, NULL),
(1278, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 30.00, 71, 1011.00, 8.10, 22, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:17:13', '2026-04-20 12:17:13', '2026-04-20 12:27:13', 'openweathermap', 0, NULL),
(1279, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1010.00, 15.70, 345, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:17:14', '2026-04-20 12:17:14', '2026-04-20 12:27:14', 'openweathermap', 0, NULL),
(1280, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 69, 1011.00, 6.50, 38, 10000, 'Clouds', 'broken clouds', '04n', 57, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:17:14', '2026-04-20 12:17:14', '2026-04-20 12:27:14', 'openweathermap', 0, NULL),
(1281, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 71, 1011.00, 6.60, 13, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:17:15', '2026-04-20 12:17:15', '2026-04-20 12:27:15', 'openweathermap', 0, NULL),
(1282, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 77, 1011.00, 13.80, 38, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:17:15', '2026-04-20 12:17:15', '2026-04-20 12:27:15', 'openweathermap', 0, NULL),
(1283, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 30.00, 71, 1011.00, 8.10, 22, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:27:14', '2026-04-20 12:27:14', '2026-04-20 12:37:14', 'openweathermap', 0, NULL),
(1284, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 29.00, 74, 1010.00, 15.70, 345, 10000, 'Clouds', 'overcast clouds', '04n', 86, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:27:14', '2026-04-20 12:27:14', '2026-04-20 12:37:14', 'openweathermap', 0, NULL),
(1285, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 69, 1011.00, 6.50, 38, 10000, 'Clouds', 'broken clouds', '04n', 57, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:27:14', '2026-04-20 12:27:14', '2026-04-20 12:37:14', 'openweathermap', 0, NULL),
(1286, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 71, 1011.00, 6.60, 13, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:27:15', '2026-04-20 12:27:15', '2026-04-20 12:37:15', 'openweathermap', 0, NULL),
(1287, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 77, 1011.00, 13.80, 38, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:27:15', '2026-04-20 12:27:15', '2026-04-20 12:37:15', 'openweathermap', 0, NULL),
(1288, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 69, 1011.00, 11.00, 44, 10000, 'Clouds', 'overcast clouds', '04n', 85, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:37:14', '2026-04-20 12:37:14', '2026-04-20 12:47:14', 'openweathermap', 0, NULL),
(1289, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 72, 1011.00, 14.30, 18, 10000, 'Clouds', 'scattered clouds', '03n', 38, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:37:14', '2026-04-20 12:37:14', '2026-04-20 12:47:14', 'openweathermap', 0, NULL),
(1290, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 24.00, 24.00, 69, 1011.00, 6.50, 38, 10000, 'Clouds', 'broken clouds', '04n', 57, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:37:14', '2026-04-20 12:37:14', '2026-04-20 12:47:14', 'openweathermap', 0, NULL),
(1291, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 26.00, 69, 1012.00, 8.20, 44, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:38:21', '2026-04-20 12:38:21', '2026-04-20 12:48:21', 'openweathermap', 0, NULL),
(1292, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 31.00, 80, 1012.00, 15.80, 43, 10000, 'Clouds', 'overcast clouds', '04n', 87, NULL, 0.00, 0.00, 0.00, '2026-04-20 12:38:21', '2026-04-20 12:38:21', '2026-04-20 12:48:21', 'openweathermap', 0, NULL),
(1293, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 67, 1012.00, 11.60, 46, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:38:50', '2026-04-20 13:38:50', '2026-04-20 13:48:50', 'openweathermap', 0, NULL),
(1294, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 70, 1012.00, 11.00, 33, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:38:50', '2026-04-20 13:38:50', '2026-04-20 13:48:50', 'openweathermap', 0, NULL),
(1295, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 70, 1013.00, 8.60, 52, 10000, 'Clouds', 'broken clouds', '04n', 71, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:38:50', '2026-04-20 13:38:50', '2026-04-20 13:48:50', 'openweathermap', 0, NULL),
(1296, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 70, 1013.00, 7.80, 57, 10000, 'Clouds', 'broken clouds', '04n', 69, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:38:51', '2026-04-20 13:38:51', '2026-04-20 13:48:51', 'openweathermap', 0, NULL),
(1297, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 80, 1013.00, 14.00, 46, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:38:51', '2026-04-20 13:38:51', '2026-04-20 13:48:51', 'openweathermap', 0, NULL),
(1298, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 67, 1012.00, 11.60, 46, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:49:45', '2026-04-20 13:49:45', '2026-04-20 13:59:45', 'openweathermap', 0, NULL),
(1299, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 70, 1012.00, 11.00, 33, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:49:45', '2026-04-20 13:49:45', '2026-04-20 13:59:45', 'openweathermap', 0, NULL),
(1300, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 70, 1013.00, 8.60, 52, 10000, 'Clouds', 'broken clouds', '04n', 71, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:49:45', '2026-04-20 13:49:45', '2026-04-20 13:59:45', 'openweathermap', 0, NULL),
(1301, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 70, 1013.00, 7.80, 57, 10000, 'Clouds', 'broken clouds', '04n', 69, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:49:45', '2026-04-20 13:49:45', '2026-04-20 13:59:45', 'openweathermap', 0, NULL),
(1302, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 80, 1013.00, 14.00, 46, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 13:49:45', '2026-04-20 13:49:45', '2026-04-20 13:59:45', 'openweathermap', 0, NULL),
(1303, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 24.00, 24.00, 76, 1031.00, 2.00, 238, 9554, 'Thunderstorm', 'thunderstorm with rain', '11d', 28, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:00:52', '2026-04-20 14:00:52', '2026-04-20 14:10:52', 'openweathermap', 0, NULL),
(1304, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 70, 1012.00, 11.00, 33, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:00:56', '2026-04-20 14:00:56', '2026-04-20 14:10:56', 'openweathermap', 0, NULL),
(1305, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 70, 1013.00, 8.60, 52, 10000, 'Clouds', 'broken clouds', '04n', 71, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:00:58', '2026-04-20 14:00:58', '2026-04-20 14:10:58', 'openweathermap', 0, NULL),
(1306, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 70, 1013.00, 7.80, 57, 10000, 'Clouds', 'broken clouds', '04n', 69, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:00:58', '2026-04-20 14:00:58', '2026-04-20 14:10:58', 'openweathermap', 0, NULL),
(1307, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 80, 1013.00, 14.00, 46, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:00:59', '2026-04-20 14:00:59', '2026-04-20 14:10:59', 'openweathermap', 0, NULL),
(1308, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 70, 1012.00, 11.70, 42, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:34:14', '2026-04-20 14:34:14', '2026-04-20 14:44:14', 'openweathermap', 0, NULL),
(1309, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1012.00, 8.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:34:14', '2026-04-20 14:34:14', '2026-04-20 14:44:14', 'openweathermap', 0, NULL),
(1310, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 74, 1013.00, 8.20, 48, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:34:14', '2026-04-20 14:34:14', '2026-04-20 14:44:14', 'openweathermap', 0, NULL),
(1311, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 72, 1012.00, 7.30, 59, 10000, 'Clouds', 'broken clouds', '04n', 52, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:34:15', '2026-04-20 14:34:15', '2026-04-20 14:44:15', 'openweathermap', 0, NULL),
(1312, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 80, 1013.00, 11.70, 43, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-04-20 14:34:15', '2026-04-20 14:34:15', '2026-04-20 14:44:15', 'openweathermap', 0, NULL),
(1313, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 70, 1012.00, 11.70, 42, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:03:25', '2026-04-20 15:03:25', '2026-04-20 15:13:25', 'openweathermap', 0, NULL),
(1314, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1012.00, 8.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:03:25', '2026-04-20 15:03:25', '2026-04-20 15:13:25', 'openweathermap', 0, NULL),
(1315, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 74, 1013.00, 8.20, 48, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:03:26', '2026-04-20 15:03:26', '2026-04-20 15:13:26', 'openweathermap', 0, NULL),
(1316, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 72, 1012.00, 7.30, 59, 10000, 'Clouds', 'broken clouds', '04n', 52, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:03:26', '2026-04-20 15:03:26', '2026-04-20 15:13:26', 'openweathermap', 0, NULL),
(1317, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 79, 1013.00, 11.70, 43, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:03:26', '2026-04-20 15:03:26', '2026-04-20 15:13:26', 'openweathermap', 0, NULL),
(1318, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 70, 1012.00, 11.70, 42, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:15:35', '2026-04-20 15:15:35', '2026-04-20 15:25:35', 'openweathermap', 0, NULL),
(1319, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1012.00, 8.10, 41, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:15:36', '2026-04-20 15:15:36', '2026-04-20 15:25:36', 'openweathermap', 0, NULL),
(1320, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 74, 1013.00, 8.20, 48, 10000, 'Clouds', 'broken clouds', '04n', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:15:36', '2026-04-20 15:15:36', '2026-04-20 15:25:36', 'openweathermap', 0, NULL),
(1321, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 72, 1012.00, 7.30, 59, 10000, 'Clouds', 'broken clouds', '04n', 52, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:15:36', '2026-04-20 15:15:36', '2026-04-20 15:25:36', 'openweathermap', 0, NULL),
(1322, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 79, 1013.00, 11.70, 43, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:15:36', '2026-04-20 15:15:36', '2026-04-20 15:25:36', 'openweathermap', 0, NULL),
(1323, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 27.00, 70, 1012.00, 11.70, 42, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 15:25:35', '2026-04-20 15:25:35', '2026-04-20 15:35:35', 'openweathermap', 0, NULL),
(1324, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1011.00, 13.40, 59, 10000, 'Clouds', 'broken clouds', '04n', 62, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:04:33', '2026-04-20 17:04:33', '2026-04-20 17:14:33', 'openweathermap', 0, NULL),
(1325, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1011.00, 8.80, 73, 10000, 'Clouds', 'scattered clouds', '03n', 37, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:04:34', '2026-04-20 17:04:34', '2026-04-20 17:14:34', 'openweathermap', 0, NULL),
(1326, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 79, 1011.00, 8.90, 55, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:04:34', '2026-04-20 17:04:34', '2026-04-20 17:14:34', 'openweathermap', 0, NULL),
(1327, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 75, 1011.00, 7.20, 64, 10000, 'Clouds', 'scattered clouds', '03n', 39, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:04:35', '2026-04-20 17:04:35', '2026-04-20 17:14:35', 'openweathermap', 0, NULL),
(1328, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 8.30, 53, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:04:36', '2026-04-20 17:04:36', '2026-04-20 17:14:36', 'openweathermap', 0, NULL),
(1329, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 73, 1011.00, 13.40, 59, 10000, 'Clouds', 'broken clouds', '04n', 62, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:19:32', '2026-04-20 17:19:32', '2026-04-20 17:29:32', 'openweathermap', 0, NULL),
(1330, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 68, 1011.00, 8.80, 73, 10000, 'Clouds', 'scattered clouds', '03n', 37, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:19:32', '2026-04-20 17:19:32', '2026-04-20 17:29:32', 'openweathermap', 0, NULL),
(1331, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 79, 1011.00, 8.90, 55, 10000, 'Clouds', 'broken clouds', '04n', 54, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:19:32', '2026-04-20 17:19:32', '2026-04-20 17:29:32', 'openweathermap', 0, NULL),
(1332, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 75, 1011.00, 7.20, 64, 10000, 'Clouds', 'scattered clouds', '03n', 39, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:19:32', '2026-04-20 17:19:32', '2026-04-20 17:29:32', 'openweathermap', 0, NULL),
(1333, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 8.30, 53, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:19:32', '2026-04-20 17:19:32', '2026-04-20 17:29:32', 'openweathermap', 0, NULL),
(1334, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1010.00, 17.20, 60, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:34:32', '2026-04-20 17:34:32', '2026-04-20 17:44:32', 'openweathermap', 0, NULL),
(1335, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1010.00, 12.70, 65, 10000, 'Clouds', 'scattered clouds', '03n', 37, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:34:32', '2026-04-20 17:34:32', '2026-04-20 17:44:32', 'openweathermap', 0, NULL),
(1336, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 81, 1011.00, 10.10, 57, 10000, 'Clouds', 'broken clouds', '04n', 63, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:34:32', '2026-04-20 17:34:32', '2026-04-20 17:44:32', 'openweathermap', 0, NULL),
(1337, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 77, 1011.00, 7.80, 61, 10000, 'Clouds', 'scattered clouds', '03n', 46, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:34:32', '2026-04-20 17:34:32', '2026-04-20 17:44:32', 'openweathermap', 0, NULL),
(1338, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 7.10, 55, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:34:32', '2026-04-20 17:34:32', '2026-04-20 17:44:32', 'openweathermap', 0, NULL),
(1339, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1010.00, 20.80, 59, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:44:41', '2026-04-20 17:44:41', '2026-04-20 17:54:41', 'openweathermap', 0, NULL),
(1340, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1010.00, 18.30, 67, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:44:41', '2026-04-20 17:44:41', '2026-04-20 17:54:41', 'openweathermap', 0, NULL),
(1341, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 81, 1011.00, 11.50, 58, 10000, 'Clouds', 'broken clouds', '04n', 77, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:44:41', '2026-04-20 17:44:41', '2026-04-20 17:54:41', 'openweathermap', 0, NULL),
(1342, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 77, 1011.00, 9.70, 62, 10000, 'Clouds', 'broken clouds', '04n', 67, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:44:41', '2026-04-20 17:44:41', '2026-04-20 17:54:41', 'openweathermap', 0, NULL),
(1343, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 1.80, 36, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:44:41', '2026-04-20 17:44:41', '2026-04-20 17:54:41', 'openweathermap', 0, NULL),
(1344, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1010.00, 20.80, 59, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:59:41', '2026-04-20 17:59:41', '2026-04-20 18:09:41', 'openweathermap', 0, NULL),
(1345, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1010.00, 18.30, 67, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:59:41', '2026-04-20 17:59:41', '2026-04-20 18:09:41', 'openweathermap', 0, NULL),
(1346, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 81, 1011.00, 11.50, 58, 10000, 'Clouds', 'broken clouds', '04n', 77, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:59:41', '2026-04-20 17:59:41', '2026-04-20 18:09:41', 'openweathermap', 0, NULL),
(1347, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 77, 1011.00, 9.70, 62, 10000, 'Clouds', 'broken clouds', '04n', 67, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:59:41', '2026-04-20 17:59:41', '2026-04-20 18:09:41', 'openweathermap', 0, NULL),
(1348, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 1.80, 36, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 17:59:42', '2026-04-20 17:59:42', '2026-04-20 18:09:42', 'openweathermap', 0, NULL),
(1349, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 74, 1010.00, 20.80, 59, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:14:40', '2026-04-20 18:14:40', '2026-04-20 18:24:40', 'openweathermap', 0, NULL),
(1350, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 69, 1010.00, 18.30, 67, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:14:40', '2026-04-20 18:14:40', '2026-04-20 18:24:40', 'openweathermap', 0, NULL),
(1351, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 81, 1011.00, 11.50, 58, 10000, 'Clouds', 'broken clouds', '04n', 77, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:14:40', '2026-04-20 18:14:40', '2026-04-20 18:24:40', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(1352, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 77, 1011.00, 9.70, 62, 10000, 'Clouds', 'broken clouds', '04n', 67, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:14:40', '2026-04-20 18:14:40', '2026-04-20 18:24:40', 'openweathermap', 0, NULL),
(1353, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 1.80, 36, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:14:41', '2026-04-20 18:14:41', '2026-04-20 18:24:41', 'openweathermap', 0, NULL),
(1354, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 76, 1010.00, 20.80, 59, 10000, 'Clouds', 'broken clouds', '04n', 74, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:29:40', '2026-04-20 18:29:40', '2026-04-20 18:39:40', 'openweathermap', 0, NULL),
(1355, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 73, 1010.00, 18.30, 67, 10000, 'Clouds', 'broken clouds', '04n', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:29:40', '2026-04-20 18:29:40', '2026-04-20 18:39:40', 'openweathermap', 0, NULL),
(1356, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 83, 1011.00, 11.50, 58, 10000, 'Clouds', 'broken clouds', '04n', 77, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:29:40', '2026-04-20 18:29:40', '2026-04-20 18:39:40', 'openweathermap', 0, NULL),
(1357, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 80, 1011.00, 9.70, 62, 10000, 'Clouds', 'broken clouds', '04n', 67, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:29:40', '2026-04-20 18:29:40', '2026-04-20 18:39:40', 'openweathermap', 0, NULL),
(1358, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 79, 1011.00, 1.80, 36, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:29:41', '2026-04-20 18:29:41', '2026-04-20 18:39:41', 'openweathermap', 0, NULL),
(1359, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1010.00, 20.90, 53, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:44:40', '2026-04-20 18:44:40', '2026-04-20 18:54:40', 'openweathermap', 0, NULL),
(1360, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1010.00, 18.20, 65, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:44:40', '2026-04-20 18:44:40', '2026-04-20 18:54:40', 'openweathermap', 0, NULL),
(1361, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 84, 1011.00, 11.70, 53, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:44:40', '2026-04-20 18:44:40', '2026-04-20 18:54:40', 'openweathermap', 0, NULL),
(1362, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 10.10, 59, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:44:40', '2026-04-20 18:44:40', '2026-04-20 18:54:40', 'openweathermap', 0, NULL),
(1363, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 2.70, 41, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:44:40', '2026-04-20 18:44:40', '2026-04-20 18:54:40', 'openweathermap', 0, NULL),
(1364, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1010.00, 20.90, 53, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:59:40', '2026-04-20 18:59:40', '2026-04-20 19:09:40', 'openweathermap', 0, NULL),
(1365, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1010.00, 18.20, 65, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:59:40', '2026-04-20 18:59:40', '2026-04-20 19:09:40', 'openweathermap', 0, NULL),
(1366, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 84, 1011.00, 11.70, 53, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:59:41', '2026-04-20 18:59:41', '2026-04-20 19:09:41', 'openweathermap', 0, NULL),
(1367, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 10.10, 59, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:59:41', '2026-04-20 18:59:41', '2026-04-20 19:09:41', 'openweathermap', 0, NULL),
(1368, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 2.70, 41, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 18:59:41', '2026-04-20 18:59:41', '2026-04-20 19:09:41', 'openweathermap', 0, NULL),
(1369, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1010.00, 20.90, 53, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:14:41', '2026-04-20 19:14:41', '2026-04-20 19:24:41', 'openweathermap', 0, NULL),
(1370, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1010.00, 18.20, 65, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:14:41', '2026-04-20 19:14:41', '2026-04-20 19:24:41', 'openweathermap', 0, NULL),
(1371, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 84, 1011.00, 11.70, 53, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:14:41', '2026-04-20 19:14:41', '2026-04-20 19:24:41', 'openweathermap', 0, NULL),
(1372, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 10.10, 59, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:14:41', '2026-04-20 19:14:41', '2026-04-20 19:24:41', 'openweathermap', 0, NULL),
(1373, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 2.70, 41, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:14:41', '2026-04-20 19:14:41', '2026-04-20 19:24:41', 'openweathermap', 0, NULL),
(1374, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1010.00, 20.90, 53, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:29:39', '2026-04-20 19:29:39', '2026-04-20 19:39:39', 'openweathermap', 0, NULL),
(1375, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 75, 1010.00, 18.20, 65, 10000, 'Clear', 'clear sky', '01n', 5, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:29:40', '2026-04-20 19:29:40', '2026-04-20 19:39:40', 'openweathermap', 0, NULL),
(1376, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 84, 1011.00, 11.70, 53, 10000, 'Clouds', 'broken clouds', '04n', 58, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:29:40', '2026-04-20 19:29:40', '2026-04-20 19:39:40', 'openweathermap', 0, NULL),
(1377, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 10.10, 59, 10000, 'Clouds', 'scattered clouds', '03n', 25, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:29:40', '2026-04-20 19:29:40', '2026-04-20 19:39:40', 'openweathermap', 0, NULL),
(1378, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 79, 1011.00, 2.70, 41, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:29:40', '2026-04-20 19:29:40', '2026-04-20 19:39:40', 'openweathermap', 0, NULL),
(1379, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 22.00, 50, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:40:24', '2026-04-20 19:40:24', '2026-04-20 19:50:24', 'openweathermap', 0, NULL),
(1380, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1010.00, 18.60, 59, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:40:24', '2026-04-20 19:40:24', '2026-04-20 19:50:24', 'openweathermap', 0, NULL),
(1381, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 84, 1011.00, 11.70, 51, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:40:24', '2026-04-20 19:40:24', '2026-04-20 19:50:24', 'openweathermap', 0, NULL),
(1382, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 10.20, 54, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:40:24', '2026-04-20 19:40:24', '2026-04-20 19:50:24', 'openweathermap', 0, NULL),
(1383, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 76, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:40:25', '2026-04-20 19:40:25', '2026-04-20 19:50:25', 'openweathermap', 0, NULL),
(1384, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 22.00, 50, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:50:46', '2026-04-20 19:50:46', '2026-04-20 20:00:46', 'openweathermap', 0, NULL),
(1385, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1010.00, 18.60, 59, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:50:46', '2026-04-20 19:50:46', '2026-04-20 20:00:46', 'openweathermap', 0, NULL),
(1386, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 84, 1011.00, 11.70, 51, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:50:46', '2026-04-20 19:50:46', '2026-04-20 20:00:46', 'openweathermap', 0, NULL),
(1387, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 82, 1011.00, 10.20, 54, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 19:50:46', '2026-04-20 19:50:46', '2026-04-20 20:00:46', 'openweathermap', 0, NULL),
(1388, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 76, 10000, 'Rain', 'light rain', '10n', 100, NULL, 0.13, 0.00, 0.00, '2026-04-20 19:50:47', '2026-04-20 19:50:47', '2026-04-20 20:00:47', 'openweathermap', 0, NULL),
(1389, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 22.00, 50, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:05:46', '2026-04-20 20:05:46', '2026-04-20 20:15:46', 'openweathermap', 0, NULL),
(1390, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1010.00, 18.60, 59, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:05:47', '2026-04-20 20:05:47', '2026-04-20 20:15:47', 'openweathermap', 0, NULL),
(1391, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 84, 1011.00, 11.70, 51, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:05:47', '2026-04-20 20:05:47', '2026-04-20 20:15:47', 'openweathermap', 0, NULL),
(1392, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 82, 1011.00, 10.20, 54, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:05:47', '2026-04-20 20:05:47', '2026-04-20 20:15:47', 'openweathermap', 0, NULL),
(1393, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 79, 1011.00, 4.10, 76, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:05:48', '2026-04-20 20:05:48', '2026-04-20 20:15:48', 'openweathermap', 0, NULL),
(1394, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1010.00, 22.00, 50, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:16:41', '2026-04-20 20:16:41', '2026-04-20 20:26:41', 'openweathermap', 0, NULL),
(1395, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1010.00, 18.60, 59, 10000, 'Clear', 'clear sky', '01n', 7, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:16:41', '2026-04-20 20:16:41', '2026-04-20 20:26:41', 'openweathermap', 0, NULL),
(1396, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 84, 1011.00, 11.70, 51, 10000, 'Clouds', 'broken clouds', '04n', 66, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:16:41', '2026-04-20 20:16:41', '2026-04-20 20:26:41', 'openweathermap', 0, NULL),
(1397, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 82, 1011.00, 10.20, 54, 10000, 'Clouds', 'scattered clouds', '03n', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:16:41', '2026-04-20 20:16:41', '2026-04-20 20:26:41', 'openweathermap', 0, NULL),
(1398, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 76, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:16:41', '2026-04-20 20:16:41', '2026-04-20 20:26:41', 'openweathermap', 0, NULL),
(1399, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1011.00, 22.00, 54, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:31:43', '2026-04-20 20:31:43', '2026-04-20 20:41:43', 'openweathermap', 0, NULL),
(1400, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1011.00, 18.50, 64, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:31:43', '2026-04-20 20:31:43', '2026-04-20 20:41:43', 'openweathermap', 0, NULL),
(1401, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1011.00, 11.80, 55, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:31:43', '2026-04-20 20:31:43', '2026-04-20 20:41:43', 'openweathermap', 0, NULL),
(1402, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 84, 1011.00, 10.20, 60, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:31:43', '2026-04-20 20:31:43', '2026-04-20 20:41:43', 'openweathermap', 0, NULL),
(1403, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 126, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:31:44', '2026-04-20 20:31:44', '2026-04-20 20:41:44', 'openweathermap', 0, NULL),
(1404, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1011.00, 22.00, 54, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:46:40', '2026-04-20 20:46:40', '2026-04-20 20:56:40', 'openweathermap', 0, NULL),
(1405, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1011.00, 18.50, 64, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:46:40', '2026-04-20 20:46:40', '2026-04-20 20:56:40', 'openweathermap', 0, NULL),
(1406, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1011.00, 11.80, 55, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:46:41', '2026-04-20 20:46:41', '2026-04-20 20:56:41', 'openweathermap', 0, NULL),
(1407, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 84, 1011.00, 10.20, 60, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:46:41', '2026-04-20 20:46:41', '2026-04-20 20:56:41', 'openweathermap', 0, NULL),
(1408, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 126, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 20:46:41', '2026-04-20 20:46:41', '2026-04-20 20:56:41', 'openweathermap', 0, NULL),
(1409, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1011.00, 22.00, 54, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:01:40', '2026-04-20 21:01:40', '2026-04-20 21:11:40', 'openweathermap', 0, NULL),
(1410, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1011.00, 18.50, 64, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:01:40', '2026-04-20 21:01:40', '2026-04-20 21:11:40', 'openweathermap', 0, NULL),
(1411, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 86, 1011.00, 11.80, 55, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:01:40', '2026-04-20 21:01:40', '2026-04-20 21:11:40', 'openweathermap', 0, NULL),
(1412, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 84, 1011.00, 10.20, 60, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:01:40', '2026-04-20 21:01:40', '2026-04-20 21:11:40', 'openweathermap', 0, NULL),
(1413, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 126, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:01:41', '2026-04-20 21:01:41', '2026-04-20 21:11:41', 'openweathermap', 0, NULL),
(1414, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 78, 1011.00, 22.00, 54, 10000, 'Clouds', 'few clouds', '02n', 23, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:16:42', '2026-04-20 21:16:42', '2026-04-20 21:26:42', 'openweathermap', 0, NULL),
(1415, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 75, 1011.00, 18.50, 64, 10000, 'Clear', 'clear sky', '01n', 10, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:16:43', '2026-04-20 21:16:43', '2026-04-20 21:26:43', 'openweathermap', 0, NULL),
(1416, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 86, 1011.00, 11.80, 55, 10000, 'Clouds', 'broken clouds', '04n', 75, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:16:43', '2026-04-20 21:16:43', '2026-04-20 21:26:43', 'openweathermap', 0, NULL),
(1417, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 84, 1011.00, 10.20, 60, 10000, 'Clouds', 'broken clouds', '04n', 64, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:16:43', '2026-04-20 21:16:43', '2026-04-20 21:26:43', 'openweathermap', 0, NULL),
(1418, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1011.00, 4.10, 126, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:16:44', '2026-04-20 21:16:44', '2026-04-20 21:26:44', 'openweathermap', 0, NULL),
(1419, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1011.00, 23.10, 66, 10000, 'Clouds', 'scattered clouds', '03n', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:31:40', '2026-04-20 21:31:40', '2026-04-20 21:41:40', 'openweathermap', 0, NULL),
(1420, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1011.00, 22.80, 72, 10000, 'Clouds', 'few clouds', '02n', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:31:40', '2026-04-20 21:31:40', '2026-04-20 21:41:40', 'openweathermap', 0, NULL),
(1421, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1012.00, 12.30, 63, 10000, 'Clouds', 'broken clouds', '04n', 61, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:31:40', '2026-04-20 21:31:40', '2026-04-20 21:41:40', 'openweathermap', 0, NULL),
(1422, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 84, 1012.00, 10.90, 72, 10000, 'Clouds', 'broken clouds', '04n', 51, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:31:40', '2026-04-20 21:31:40', '2026-04-20 21:41:40', 'openweathermap', 0, NULL),
(1423, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1012.00, 4.80, 155, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:31:41', '2026-04-20 21:31:41', '2026-04-20 21:41:41', 'openweathermap', 0, NULL),
(1424, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1011.00, 23.10, 66, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:43:51', '2026-04-20 21:43:51', '2026-04-20 21:53:51', 'openweathermap', 0, NULL),
(1425, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1011.00, 22.80, 72, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:43:51', '2026-04-20 21:43:51', '2026-04-20 21:53:51', 'openweathermap', 0, NULL),
(1426, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1012.00, 12.30, 63, 10000, 'Clouds', 'broken clouds', '04d', 61, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:43:52', '2026-04-20 21:43:52', '2026-04-20 21:53:52', 'openweathermap', 0, NULL),
(1427, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 84, 1012.00, 10.90, 72, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:43:52', '2026-04-20 21:43:52', '2026-04-20 21:53:52', 'openweathermap', 0, NULL),
(1428, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1012.00, 4.80, 155, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:43:53', '2026-04-20 21:43:53', '2026-04-20 21:53:53', 'openweathermap', 0, NULL),
(1429, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1011.00, 22.80, 72, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:53:51', '2026-04-20 21:53:51', '2026-04-20 22:03:51', 'openweathermap', 0, NULL),
(1430, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1012.00, 12.30, 63, 10000, 'Clouds', 'broken clouds', '04d', 61, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:53:52', '2026-04-20 21:53:52', '2026-04-20 22:03:52', 'openweathermap', 0, NULL),
(1431, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 84, 1012.00, 10.90, 72, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:53:52', '2026-04-20 21:53:52', '2026-04-20 22:03:52', 'openweathermap', 0, NULL),
(1432, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1011.00, 23.10, 66, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:58:51', '2026-04-20 21:58:51', '2026-04-20 22:08:51', 'openweathermap', 0, NULL),
(1433, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1012.00, 4.80, 155, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 21:58:52', '2026-04-20 21:58:52', '2026-04-20 22:08:52', 'openweathermap', 0, NULL),
(1434, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1011.00, 22.80, 72, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:03:52', '2026-04-20 22:03:52', '2026-04-20 22:13:52', 'openweathermap', 0, NULL),
(1435, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1012.00, 12.30, 63, 10000, 'Clouds', 'broken clouds', '04d', 61, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:03:53', '2026-04-20 22:03:53', '2026-04-20 22:13:53', 'openweathermap', 0, NULL),
(1436, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 84, 1012.00, 10.90, 72, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:03:53', '2026-04-20 22:03:53', '2026-04-20 22:13:53', 'openweathermap', 0, NULL),
(1437, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1011.00, 23.10, 66, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:08:51', '2026-04-20 22:08:51', '2026-04-20 22:18:51', 'openweathermap', 0, NULL),
(1438, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1012.00, 4.80, 155, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:08:52', '2026-04-20 22:08:52', '2026-04-20 22:18:52', 'openweathermap', 0, NULL),
(1439, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1011.00, 22.80, 72, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:16:02', '2026-04-20 22:16:02', '2026-04-20 22:26:02', 'openweathermap', 0, NULL),
(1440, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 23.00, 87, 1012.00, 12.30, 63, 10000, 'Clouds', 'broken clouds', '04d', 61, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:16:02', '2026-04-20 22:16:02', '2026-04-20 22:26:02', 'openweathermap', 0, NULL),
(1441, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 25.00, 84, 1012.00, 10.90, 72, 10000, 'Clouds', 'broken clouds', '04d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:16:02', '2026-04-20 22:16:02', '2026-04-20 22:26:02', 'openweathermap', 0, NULL),
(1442, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 26.00, 26.00, 77, 1011.00, 23.10, 66, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:21:02', '2026-04-20 22:21:02', '2026-04-20 22:31:02', 'openweathermap', 0, NULL),
(1443, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1012.00, 4.80, 155, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:21:03', '2026-04-20 22:21:03', '2026-04-20 22:31:03', 'openweathermap', 0, NULL),
(1444, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1012.00, 27.50, 76, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:31:01', '2026-04-20 22:31:01', '2026-04-20 22:41:01', 'openweathermap', 0, NULL),
(1445, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 72, 1012.00, 15.70, 64, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:31:02', '2026-04-20 22:31:02', '2026-04-20 22:41:02', 'openweathermap', 0, NULL),
(1446, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 69, 1012.00, 14.10, 76, 10000, 'Clouds', 'scattered clouds', '03d', 47, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:31:03', '2026-04-20 22:31:03', '2026-04-20 22:41:03', 'openweathermap', 0, NULL),
(1447, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 26.00, 26.00, 80, 1012.00, 4.80, 155, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:31:04', '2026-04-20 22:31:04', '2026-04-20 22:41:04', 'openweathermap', 0, NULL),
(1448, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 73, 1012.00, 24.40, 65, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:36:02', '2026-04-20 22:36:02', '2026-04-20 22:46:02', 'openweathermap', 0, NULL),
(1449, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1012.00, 27.50, 76, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:41:33', '2026-04-20 22:41:33', '2026-04-20 22:51:33', 'openweathermap', 0, NULL),
(1450, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 72, 1012.00, 15.70, 64, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:41:34', '2026-04-20 22:41:34', '2026-04-20 22:51:34', 'openweathermap', 0, NULL),
(1451, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 69, 1012.00, 14.10, 76, 10000, 'Clouds', 'scattered clouds', '03d', 47, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:41:34', '2026-04-20 22:41:34', '2026-04-20 22:51:34', 'openweathermap', 0, NULL),
(1452, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 76, 1012.00, 8.60, 162, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:41:35', '2026-04-20 22:41:35', '2026-04-20 22:51:35', 'openweathermap', 0, NULL),
(1453, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 73, 1012.00, 24.40, 65, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:46:33', '2026-04-20 22:46:33', '2026-04-20 22:56:33', 'openweathermap', 0, NULL),
(1454, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1012.00, 27.50, 76, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:56:34', '2026-04-20 22:56:34', '2026-04-20 23:06:34', 'openweathermap', 0, NULL),
(1455, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 72, 1012.00, 15.70, 64, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:56:35', '2026-04-20 22:56:35', '2026-04-20 23:06:35', 'openweathermap', 0, NULL),
(1456, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 69, 1012.00, 14.10, 76, 10000, 'Clouds', 'scattered clouds', '03d', 47, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:56:35', '2026-04-20 22:56:35', '2026-04-20 23:06:35', 'openweathermap', 0, NULL),
(1457, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 76, 1012.00, 8.60, 162, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-20 22:56:36', '2026-04-20 22:56:36', '2026-04-20 23:06:36', 'openweathermap', 0, NULL),
(1458, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 73, 1012.00, 24.40, 65, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:01:32', '2026-04-20 23:01:32', '2026-04-20 23:11:32', 'openweathermap', 0, NULL),
(1459, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1012.00, 27.50, 76, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:09:35', '2026-04-20 23:09:35', '2026-04-20 23:19:35', 'openweathermap', 0, NULL),
(1460, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 72, 1012.00, 15.70, 64, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:09:35', '2026-04-20 23:09:35', '2026-04-20 23:19:35', 'openweathermap', 0, NULL),
(1461, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 28.00, 69, 1012.00, 14.10, 76, 10000, 'Clouds', 'scattered clouds', '03d', 47, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:09:36', '2026-04-20 23:09:36', '2026-04-20 23:19:36', 'openweathermap', 0, NULL),
(1462, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 76, 1012.00, 8.60, 162, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:09:36', '2026-04-20 23:09:36', '2026-04-20 23:19:36', 'openweathermap', 0, NULL),
(1463, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 29.00, 73, 1012.00, 24.40, 65, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:15:22', '2026-04-20 23:15:22', '2026-04-20 23:25:22', 'openweathermap', 0, NULL),
(1464, 2, 12.23800000, 121.06900000, 'Arangin Falls', 26.00, 26.00, 74, 1012.00, 27.50, 76, 10000, 'Clouds', 'few clouds', '02d', 13, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:20:16', '2026-04-20 23:20:16', '2026-04-20 23:30:16', 'openweathermap', 0, NULL),
(1465, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 72, 1012.00, 15.70, 64, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:20:17', '2026-04-20 23:20:17', '2026-04-20 23:30:17', 'openweathermap', 0, NULL),
(1466, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 29.00, 69, 1012.00, 14.10, 76, 10000, 'Clouds', 'scattered clouds', '03d', 47, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:20:17', '2026-04-20 23:20:17', '2026-04-20 23:30:17', 'openweathermap', 0, NULL),
(1467, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 30.00, 76, 1012.00, 8.60, 162, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:20:18', '2026-04-20 23:20:18', '2026-04-20 23:30:18', 'openweathermap', 0, NULL),
(1468, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1013.00, 27.50, 72, 10000, 'Clouds', 'scattered clouds', '03d', 38, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:30:22', '2026-04-20 23:30:22', '2026-04-20 23:40:22', 'openweathermap', 0, NULL),
(1469, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 69, 1012.00, 29.20, 78, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:30:22', '2026-04-20 23:30:22', '2026-04-20 23:40:22', 'openweathermap', 0, NULL),
(1470, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 28.00, 62, 1013.00, 22.10, 69, 10000, 'Clouds', 'broken clouds', '04d', 59, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:30:23', '2026-04-20 23:30:23', '2026-04-20 23:40:23', 'openweathermap', 0, NULL),
(1471, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 31.00, 58, 1013.00, 21.40, 76, 10000, 'Clouds', 'scattered clouds', '03d', 50, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:30:23', '2026-04-20 23:30:23', '2026-04-20 23:40:23', 'openweathermap', 0, NULL),
(1472, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 71, 1013.00, 13.10, 148, 10000, 'Clouds', 'broken clouds', '04d', 80, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:30:24', '2026-04-20 23:30:24', '2026-04-20 23:40:24', 'openweathermap', 0, NULL),
(1473, 2, 12.23800000, 121.06900000, 'Arangin Falls', 25.00, 26.00, 46, 1038.00, 14.00, 303, 12709, 'Clouds', 'scattered clouds', '03d', 19, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:40:27', '2026-04-20 23:40:27', '2026-04-20 23:50:27', 'openweathermap', 0, NULL),
(1474, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 31.00, 54, 1017.00, 12.00, 134, 12477, 'Clear', 'clear sky', '01d', 90, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:40:32', '2026-04-20 23:40:32', '2026-04-20 23:50:32', 'openweathermap', 0, NULL),
(1475, 4, 12.44130000, 121.15300000, 'Naujan Lake', 20.00, 23.00, 51, 1033.00, 8.00, 195, 13895, 'Clear', 'clear sky', '01d', 72, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:40:37', '2026-04-20 23:40:37', '2026-04-20 23:50:37', 'openweathermap', 0, NULL),
(1476, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 30.00, 56, 1013.00, 5.00, 180, 5831, 'Clear', 'clear sky', '01d', 77, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:40:43', '2026-04-20 23:40:43', '2026-04-20 23:50:43', 'openweathermap', 0, NULL),
(1477, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1013.00, 28.30, 72, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:45:22', '2026-04-20 23:45:22', '2026-04-20 23:55:22', 'openweathermap', 0, NULL),
(1478, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 69, 1012.00, 30.30, 79, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:55:21', '2026-04-20 23:55:21', '2026-04-21 00:05:21', 'openweathermap', 0, NULL),
(1479, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 28.00, 62, 1013.00, 20.60, 69, 10000, 'Clouds', 'broken clouds', '04d', 71, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:55:22', '2026-04-20 23:55:22', '2026-04-21 00:05:22', 'openweathermap', 0, NULL),
(1480, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 31.00, 58, 1013.00, 20.00, 75, 10000, 'Clouds', 'broken clouds', '04d', 60, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:55:22', '2026-04-20 23:55:22', '2026-04-21 00:05:22', 'openweathermap', 0, NULL),
(1481, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 71, 1013.00, 12.20, 152, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-20 23:55:23', '2026-04-20 23:55:23', '2026-04-21 00:05:23', 'openweathermap', 0, NULL),
(1482, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1013.00, 28.30, 72, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:00:31', '2026-04-21 00:00:31', '2026-04-21 00:10:31', 'openweathermap', 0, NULL),
(1483, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 69, 1012.00, 30.30, 79, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:05:40', '2026-04-21 00:05:40', '2026-04-21 00:15:40', 'openweathermap', 0, NULL),
(1484, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 28.00, 62, 1013.00, 20.60, 69, 10000, 'Clouds', 'broken clouds', '04d', 71, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:05:41', '2026-04-21 00:05:41', '2026-04-21 00:15:41', 'openweathermap', 0, NULL),
(1485, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 31.00, 58, 1013.00, 20.00, 75, 10000, 'Clouds', 'broken clouds', '04d', 60, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:05:41', '2026-04-21 00:05:41', '2026-04-21 00:15:41', 'openweathermap', 0, NULL),
(1486, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 71, 1013.00, 12.20, 152, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:05:41', '2026-04-21 00:05:41', '2026-04-21 00:15:41', 'openweathermap', 0, NULL),
(1487, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1013.00, 28.30, 72, 10000, 'Clouds', 'scattered clouds', '03d', 37, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:10:40', '2026-04-21 00:10:40', '2026-04-21 00:20:40', 'openweathermap', 0, NULL),
(1488, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 69, 1012.00, 30.30, 79, 10000, 'Clouds', 'few clouds', '02d', 22, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:20:37', '2026-04-21 00:20:37', '2026-04-21 00:30:37', 'openweathermap', 0, NULL),
(1489, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 28.00, 62, 1013.00, 20.60, 69, 10000, 'Clouds', 'broken clouds', '04d', 71, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:20:38', '2026-04-21 00:20:38', '2026-04-21 00:30:38', 'openweathermap', 0, NULL),
(1490, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 31.00, 58, 1013.00, 20.00, 75, 10000, 'Clouds', 'broken clouds', '04d', 60, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:20:38', '2026-04-21 00:20:38', '2026-04-21 00:30:38', 'openweathermap', 0, NULL),
(1491, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 71, 1013.00, 12.20, 152, 10000, 'Clouds', 'overcast clouds', '04d', 86, NULL, 0.00, 0.00, 0.00, '2026-04-21 00:20:39', '2026-04-21 00:20:39', '2026-04-21 00:30:39', 'openweathermap', 0, NULL),
(1492, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 31.00, 38.00, 77, 1013.00, 18.80, 118, 10000, 'Clouds', 'scattered clouds', '03d', 42, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:08:29', '2026-04-21 02:08:29', '2026-04-21 02:18:29', 'openweathermap', 0, NULL),
(1493, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1012.00, 31.50, 86, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:08:35', '2026-04-21 02:08:35', '2026-04-21 02:18:35', 'openweathermap', 0, NULL),
(1494, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 70, 1012.00, 35.40, 96, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:08:35', '2026-04-21 02:08:35', '2026-04-21 02:18:35', 'openweathermap', 0, NULL),
(1495, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 50, 1013.00, 25.70, 77, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:08:35', '2026-04-21 02:08:35', '2026-04-21 02:18:35', 'openweathermap', 0, NULL),
(1496, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 45, 1012.00, 26.20, 82, 10000, 'Clouds', 'scattered clouds', '03d', 36, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:08:36', '2026-04-21 02:08:36', '2026-04-21 02:18:36', 'openweathermap', 0, NULL),
(1497, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 80, 1013.00, 19.60, 122, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:08:36', '2026-04-21 02:08:36', '2026-04-21 02:18:36', 'openweathermap', 0, NULL),
(1498, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1012.00, 31.50, 86, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:18:36', '2026-04-21 02:18:36', '2026-04-21 02:28:36', 'openweathermap', 0, NULL),
(1499, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 70, 1012.00, 35.40, 96, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:18:36', '2026-04-21 02:18:36', '2026-04-21 02:28:36', 'openweathermap', 0, NULL),
(1500, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 50, 1013.00, 25.70, 77, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:18:37', '2026-04-21 02:18:37', '2026-04-21 02:28:37', 'openweathermap', 0, NULL),
(1501, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 45, 1012.00, 26.20, 82, 10000, 'Clouds', 'scattered clouds', '03d', 36, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:18:37', '2026-04-21 02:18:37', '2026-04-21 02:28:37', 'openweathermap', 0, NULL),
(1502, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 80, 1013.00, 19.60, 122, 10000, 'Clouds', 'scattered clouds', '03d', 40, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:18:38', '2026-04-21 02:18:38', '2026-04-21 02:28:38', 'openweathermap', 0, NULL),
(1503, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 67, 1012.00, 31.50, 86, 10000, 'Clouds', 'few clouds', '02d', 18, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:28:36', '2026-04-21 02:28:36', '2026-04-21 02:38:36', 'openweathermap', 0, NULL),
(1504, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 70, 1012.00, 35.40, 96, 10000, 'Clouds', 'few clouds', '02d', 12, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:28:36', '2026-04-21 02:28:36', '2026-04-21 02:38:36', 'openweathermap', 0, NULL),
(1505, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 50, 1013.00, 25.70, 77, 10000, 'Clouds', 'scattered clouds', '03d', 34, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:28:37', '2026-04-21 02:28:37', '2026-04-21 02:38:37', 'openweathermap', 0, NULL),
(1506, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 34.00, 45, 1012.00, 26.20, 82, 10000, 'Clouds', 'scattered clouds', '03d', 36, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:28:37', '2026-04-21 02:28:37', '2026-04-21 02:38:37', 'openweathermap', 0, NULL),
(1507, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 75, 1013.00, 21.00, 115, 10000, 'Clouds', 'broken clouds', '04d', 53, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:33:37', '2026-04-21 02:33:37', '2026-04-21 02:43:37', 'openweathermap', 0, NULL),
(1508, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 72, 1012.00, 36.50, 105, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:38:36', '2026-04-21 02:38:36', '2026-04-21 02:48:36', 'openweathermap', 0, NULL),
(1509, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 34.00, 40, 1011.00, 27.10, 89, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:38:37', '2026-04-21 02:38:37', '2026-04-21 02:48:37', 'openweathermap', 0, NULL),
(1510, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1012.00, 31.10, 93, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:43:40', '2026-04-21 02:43:40', '2026-04-21 02:53:40', 'openweathermap', 0, NULL),
(1511, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 45, 1012.00, 25.30, 81, 10000, 'Clouds', 'scattered clouds', '03d', 27, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:43:41', '2026-04-21 02:43:41', '2026-04-21 02:53:41', 'openweathermap', 0, NULL),
(1512, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 75, 1013.00, 21.00, 115, 10000, 'Clouds', 'broken clouds', '04d', 53, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:43:41', '2026-04-21 02:43:41', '2026-04-21 02:53:41', 'openweathermap', 0, NULL),
(1513, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 72, 1012.00, 36.50, 105, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:48:40', '2026-04-21 02:48:40', '2026-04-21 02:58:40', 'openweathermap', 0, NULL),
(1514, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 34.00, 39, 1011.00, 27.10, 89, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:48:41', '2026-04-21 02:48:41', '2026-04-21 02:58:41', 'openweathermap', 0, NULL),
(1515, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 64, 1013.00, 21.00, 115, 10000, 'Clouds', 'broken clouds', '04d', 53, NULL, 0.00, 0.00, 0.00, '2026-04-21 02:53:42', '2026-04-21 02:53:42', '2026-04-21 03:03:42', 'openweathermap', 0, NULL),
(1516, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1012.00, 31.10, 93, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-21 03:19:47', '2026-04-21 03:19:47', '2026-04-21 03:29:47', 'openweathermap', 0, NULL),
(1517, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 72, 1012.00, 36.50, 105, 10000, 'Clouds', 'few clouds', '02d', 14, NULL, 0.00, 0.00, 0.00, '2026-04-21 03:19:47', '2026-04-21 03:19:47', '2026-04-21 03:29:47', 'openweathermap', 0, NULL),
(1518, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 31.00, 45, 1012.00, 25.30, 81, 10000, 'Clouds', 'scattered clouds', '03d', 27, NULL, 0.00, 0.00, 0.00, '2026-04-21 03:19:47', '2026-04-21 03:19:47', '2026-04-21 03:29:47', 'openweathermap', 0, NULL),
(1519, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 34.00, 39, 1011.00, 27.10, 89, 10000, 'Clouds', 'scattered clouds', '03d', 30, NULL, 0.00, 0.00, 0.00, '2026-04-21 03:19:48', '2026-04-21 03:19:48', '2026-04-21 03:29:48', 'openweathermap', 0, NULL),
(1520, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 64, 1013.00, 21.00, 115, 10000, 'Clouds', 'broken clouds', '04d', 53, NULL, 0.00, 0.00, 0.00, '2026-04-21 03:19:48', '2026-04-21 03:19:48', '2026-04-21 03:29:48', 'openweathermap', 0, NULL),
(1521, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 32.00, 66, 1012.00, 31.10, 93, 10000, 'Clouds', 'few clouds', '02d', 17, NULL, 0.00, 0.00, 0.00, '2026-04-21 03:32:56', '2026-04-21 03:32:56', '2026-04-21 03:42:56', 'openweathermap', 0, NULL),
(1522, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 62, 1009.00, 13.70, 50, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:15:38', '2026-04-22 12:15:38', '2026-04-22 12:25:38', 'openweathermap', 0, NULL),
(1523, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 28.00, 70, 1009.00, 11.20, 50, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:15:38', '2026-04-22 12:15:38', '2026-04-22 12:25:38', 'openweathermap', 0, NULL),
(1524, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 56, 1010.00, 9.30, 45, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:15:39', '2026-04-22 12:15:39', '2026-04-22 12:25:39', 'openweathermap', 0, NULL),
(1525, 4, 12.44130000, 121.15300000, 'Naujan Lake', 25.00, 25.00, 57, 1010.00, 8.70, 56, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:15:40', '2026-04-22 12:15:40', '2026-04-22 12:25:40', 'openweathermap', 0, NULL),
(1526, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 30.00, 67, 1009.00, 8.40, 103, 10000, 'Clear', 'clear sky', '01n', 3, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:15:41', '2026-04-22 12:15:41', '2026-04-22 12:25:41', 'openweathermap', 0, NULL),
(1527, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 62, 1009.00, 13.70, 50, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:25:50', '2026-04-22 12:25:50', '2026-04-22 12:35:50', 'openweathermap', 0, NULL),
(1528, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 58, 1010.00, 12.00, 35, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:35:55', '2026-04-22 12:35:55', '2026-04-22 12:45:55', 'openweathermap', 0, NULL),
(1529, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 68, 1010.00, 8.00, 37, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:39:40', '2026-04-22 12:39:40', '2026-04-22 12:49:40', 'openweathermap', 0, NULL),
(1530, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 54, 1010.00, 9.40, 42, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:39:41', '2026-04-22 12:39:41', '2026-04-22 12:49:41', 'openweathermap', 0, NULL),
(1531, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 53, 1010.00, 9.00, 61, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:39:41', '2026-04-22 12:39:41', '2026-04-22 12:49:41', 'openweathermap', 0, NULL),
(1532, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 68, 1010.00, 7.10, 78, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 12:39:42', '2026-04-22 12:39:42', '2026-04-22 12:49:42', 'openweathermap', 0, NULL),
(1533, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 58, 1010.00, 12.00, 35, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:01:54', '2026-04-22 13:01:54', '2026-04-22 13:11:54', 'openweathermap', 0, NULL),
(1534, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 56, 1010.00, 11.00, 35, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:35:26', '2026-04-22 13:35:26', '2026-04-22 13:45:26', 'openweathermap', 0, NULL),
(1535, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 27.00, 61, 1010.00, 6.90, 44, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:35:27', '2026-04-22 13:35:27', '2026-04-22 13:45:27', 'openweathermap', 0, NULL),
(1536, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 23.00, 23.00, 54, 1011.00, 9.50, 41, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:35:27', '2026-04-22 13:35:27', '2026-04-22 13:45:27', 'openweathermap', 0, NULL),
(1537, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 24.00, 53, 1011.00, 8.40, 55, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:35:27', '2026-04-22 13:35:27', '2026-04-22 13:45:27', 'openweathermap', 0, NULL),
(1538, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 27.00, 29.00, 69, 1011.00, 6.70, 55, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:35:28', '2026-04-22 13:35:28', '2026-04-22 13:45:28', 'openweathermap', 0, NULL),
(1539, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 56, 1010.00, 11.00, 35, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 13:56:06', '2026-04-22 13:56:06', '2026-04-22 14:06:06', 'openweathermap', 0, NULL),
(1540, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 56, 1010.00, 11.00, 35, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 14:09:37', '2026-04-22 14:09:37', '2026-04-22 14:19:37', 'openweathermap', 0, NULL),
(1541, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 28.00, 56, 1010.00, 11.00, 35, 10000, 'Clear', 'clear sky', '01n', 0, NULL, 0.00, 0.00, 0.00, '2026-04-22 14:23:20', '2026-04-22 14:23:20', '2026-04-22 14:33:20', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(1542, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 34.00, 70, 1011.00, 30.60, 79, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-04-28 00:43:18', '2026-04-28 00:43:18', '2026-04-28 00:53:18', 'openweathermap', 0, NULL),
(1543, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 74, 1011.00, 32.40, 88, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-28 00:43:21', '2026-04-28 00:43:21', '2026-04-28 00:53:21', 'openweathermap', 0, NULL),
(1544, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 29.00, 31.00, 63, 1012.00, 21.80, 75, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-04-28 00:43:23', '2026-04-28 00:43:23', '2026-04-28 00:53:23', 'openweathermap', 0, NULL),
(1545, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 57, 1011.00, 23.80, 84, 10000, 'Clouds', 'overcast clouds', '04d', 92, NULL, 0.00, 0.00, 0.00, '2026-04-28 00:43:27', '2026-04-28 00:43:27', '2026-04-28 00:53:27', 'openweathermap', 0, NULL),
(1546, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 25.00, 23.00, 45, 1030.00, 10.00, 172, 13851, 'Rain', 'light rain', '10d', 88, NULL, 1.71, 0.00, 0.00, '2026-04-28 00:43:32', '2026-04-28 00:43:32', '2026-04-28 00:53:32', 'openweathermap', 0, NULL),
(1547, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 30.00, 59, 1004.00, 15.00, 59, 6225, 'Thunderstorm', 'thunderstorm with rain', '11d', 6, NULL, 0.00, 0.00, 0.00, '2026-04-28 02:09:42', '2026-04-28 02:09:42', '2026-04-28 02:19:42', 'openweathermap', 0, NULL),
(1548, 2, 12.23800000, 121.06900000, 'Arangin Falls', 34.00, 36.00, 59, 1047.00, 1.00, 235, 5617, 'Clouds', 'scattered clouds', '03d', 49, NULL, 0.00, 0.00, 0.00, '2026-04-28 02:10:23', '2026-04-28 02:10:23', '2026-04-28 02:20:23', 'openweathermap', 0, NULL),
(1549, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 22.00, 35.00, 53, 1031.00, 10.00, 203, 14857, 'Clouds', 'scattered clouds', '03d', 29, NULL, 0.00, 0.00, 0.00, '2026-04-28 02:10:23', '2026-04-28 02:10:23', '2026-04-28 02:20:23', 'openweathermap', 0, NULL),
(1550, 4, 12.44130000, 121.15300000, 'Naujan Lake', 20.00, 26.00, 67, 1027.00, 4.00, 355, 14817, 'Thunderstorm', 'thunderstorm with rain', '11d', 51, NULL, 0.00, 0.00, 0.00, '2026-04-28 02:10:23', '2026-04-28 02:10:23', '2026-04-28 02:20:23', 'openweathermap', 0, NULL),
(1551, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 22.00, 28.00, 76, 1039.00, 8.00, 353, 8582, 'Rain', 'light rain', '10d', 14, NULL, 3.35, 0.00, 0.00, '2026-04-28 02:10:24', '2026-04-28 02:10:24', '2026-04-28 02:20:24', 'openweathermap', 0, NULL),
(1552, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 68, 1010.00, 17.70, 57, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-04-28 14:59:25', '2026-04-28 14:59:25', '2026-04-28 15:09:25', 'openweathermap', 0, NULL),
(1553, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 30.00, 69, 1010.00, 12.20, 75, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-04-28 14:59:26', '2026-04-28 14:59:26', '2026-04-28 15:09:26', 'openweathermap', 0, NULL),
(1554, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 65, 1011.00, 12.30, 59, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-04-28 14:59:26', '2026-04-28 14:59:26', '2026-04-28 15:09:26', 'openweathermap', 0, NULL),
(1555, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 65, 1011.00, 10.10, 74, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-04-28 14:59:27', '2026-04-28 14:59:27', '2026-04-28 15:09:27', 'openweathermap', 0, NULL),
(1556, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 31.00, 77, 1011.00, 13.00, 37, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-04-28 14:59:28', '2026-04-28 14:59:28', '2026-04-28 15:09:28', 'openweathermap', 0, NULL),
(1557, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 34.00, 71, 1011.00, 31.60, 96, 10000, 'Clouds', 'few clouds', '02d', 24, NULL, 0.00, 0.00, 0.00, '2026-04-29 03:12:39', '2026-04-29 03:12:39', '2026-04-29 03:22:39', 'openweathermap', 0, NULL),
(1558, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1010.00, 37.60, 112, 10000, 'Clouds', 'scattered clouds', '03d', 31, NULL, 0.00, 0.00, 0.00, '2026-04-29 03:12:39', '2026-04-29 03:12:39', '2026-04-29 03:22:39', 'openweathermap', 0, NULL),
(1559, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 33.00, 55, 1011.00, 20.80, 85, 10000, 'Clouds', 'broken clouds', '04d', 55, NULL, 0.00, 0.00, 0.00, '2026-04-29 03:12:40', '2026-04-29 03:12:40', '2026-04-29 03:22:40', 'openweathermap', 0, NULL),
(1560, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 37.00, 50, 1010.00, 14.00, 94, 10000, 'Clouds', 'broken clouds', '04d', 52, NULL, 0.00, 0.00, 0.00, '2026-04-29 03:12:41', '2026-04-29 03:12:41', '2026-04-29 03:22:41', 'openweathermap', 0, NULL),
(1561, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 38.00, 80, 1011.00, 17.30, 98, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-04-29 03:12:42', '2026-04-29 03:12:42', '2026-04-29 03:22:42', 'openweathermap', 0, NULL),
(1562, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 72, 1011.00, 9.60, 357, 10000, 'Clouds', 'broken clouds', '04n', 73, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:05:00', '2026-04-30 13:05:00', '2026-04-30 13:15:00', 'openweathermap', 0, NULL),
(1563, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 77, 1011.00, 15.90, 339, 10000, 'Clouds', 'scattered clouds', '03n', 27, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:05:02', '2026-04-30 13:05:02', '2026-04-30 13:15:02', 'openweathermap', 0, NULL),
(1564, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 74, 1012.00, 6.20, 31, 10000, 'Clouds', 'overcast clouds', '04n', 95, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:05:03', '2026-04-30 13:05:03', '2026-04-30 13:15:03', 'openweathermap', 0, NULL),
(1565, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 75, 1011.00, 5.50, 25, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:05:04', '2026-04-30 13:05:04', '2026-04-30 13:15:04', 'openweathermap', 0, NULL),
(1566, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 77, 1012.00, 16.60, 40, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:05:05', '2026-04-30 13:05:05', '2026-04-30 13:15:05', 'openweathermap', 0, NULL),
(1567, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 72, 1011.00, 9.60, 357, 10000, 'Clouds', 'broken clouds', '04n', 73, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:15:03', '2026-04-30 13:15:03', '2026-04-30 13:25:03', 'openweathermap', 0, NULL),
(1568, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 77, 1011.00, 15.90, 339, 10000, 'Clouds', 'scattered clouds', '03n', 27, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:15:03', '2026-04-30 13:15:03', '2026-04-30 13:25:03', 'openweathermap', 0, NULL),
(1569, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 74, 1012.00, 6.20, 31, 10000, 'Clouds', 'overcast clouds', '04n', 95, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:15:04', '2026-04-30 13:15:04', '2026-04-30 13:25:04', 'openweathermap', 0, NULL),
(1570, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 75, 1011.00, 5.50, 25, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:15:04', '2026-04-30 13:15:04', '2026-04-30 13:25:04', 'openweathermap', 0, NULL),
(1571, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 77, 1012.00, 16.60, 40, 10000, 'Clouds', 'few clouds', '02n', 18, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:20:04', '2026-04-30 13:20:04', '2026-04-30 13:30:04', 'openweathermap', 0, NULL),
(1572, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 31.00, 72, 1011.00, 9.60, 357, 10000, 'Clouds', 'broken clouds', '04n', 73, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:25:03', '2026-04-30 13:25:03', '2026-04-30 13:35:03', 'openweathermap', 0, NULL),
(1573, 2, 12.23800000, 121.06900000, 'Arangin Falls', 27.00, 30.00, 77, 1011.00, 15.90, 339, 10000, 'Clouds', 'scattered clouds', '03n', 27, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:25:03', '2026-04-30 13:25:03', '2026-04-30 13:35:03', 'openweathermap', 0, NULL),
(1574, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 74, 1012.00, 6.20, 31, 10000, 'Clouds', 'overcast clouds', '04n', 95, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:25:04', '2026-04-30 13:25:04', '2026-04-30 13:35:04', 'openweathermap', 0, NULL),
(1575, 4, 12.44130000, 121.15300000, 'Naujan Lake', 26.00, 26.00, 75, 1011.00, 5.50, 25, 10000, 'Clouds', 'broken clouds', '04n', 70, NULL, 0.00, 0.00, 0.00, '2026-04-30 13:25:04', '2026-04-30 13:25:04', '2026-04-30 13:35:04', 'openweathermap', 0, NULL),
(1576, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 27.00, 23.00, 70, 1037.00, 15.00, 60, 8414, 'Thunderstorm', 'thunderstorm with rain', '11d', 67, NULL, 0.00, 0.00, 0.00, '2026-05-01 08:21:19', '2026-05-01 08:21:19', '2026-05-01 08:31:19', 'openweathermap', 0, NULL),
(1577, 2, 12.23800000, 121.06900000, 'Arangin Falls', 32.00, 28.00, 41, 1048.00, 3.00, 198, 10163, 'Thunderstorm', 'thunderstorm with rain', '11d', 12, NULL, 0.00, 0.00, 0.00, '2026-05-01 08:21:19', '2026-05-01 08:21:19', '2026-05-01 08:31:19', 'openweathermap', 0, NULL),
(1578, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 27.00, 25.00, 67, 1021.00, 5.00, 269, 11427, 'Clear', 'clear sky', '01d', 87, NULL, 0.00, 0.00, 0.00, '2026-05-01 08:21:20', '2026-05-01 08:21:20', '2026-05-01 08:31:20', 'openweathermap', 0, NULL),
(1579, 4, 12.44130000, 121.15300000, 'Naujan Lake', 24.00, 31.00, 76, 1015.00, 13.00, 124, 6198, 'Clouds', 'scattered clouds', '03d', 83, NULL, 0.00, 0.00, 0.00, '2026-05-01 08:21:20', '2026-05-01 08:21:20', '2026-05-01 08:31:20', 'openweathermap', 0, NULL),
(1580, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 23.00, 28.00, 68, 1040.00, 15.00, 177, 7775, 'Thunderstorm', 'thunderstorm with rain', '11d', 60, NULL, 0.00, 0.00, 0.00, '2026-05-01 08:21:21', '2026-05-01 08:21:21', '2026-05-01 08:31:21', 'openweathermap', 0, NULL),
(1581, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 65, 1008.00, 38.20, 80, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 04:32:30', '2026-05-02 04:32:30', '2026-05-02 04:42:30', 'openweathermap', 0, NULL),
(1582, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 69, 1007.00, 40.20, 94, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 04:32:31', '2026-05-02 04:32:31', '2026-05-02 04:42:31', 'openweathermap', 0, NULL),
(1583, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 32.00, 34.00, 46, 1008.00, 24.90, 75, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 04:32:32', '2026-05-02 04:32:32', '2026-05-02 04:42:32', 'openweathermap', 0, NULL),
(1584, 4, 12.44130000, 121.15300000, 'Naujan Lake', 34.00, 37.00, 46, 1008.00, 10.80, 67, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 04:32:33', '2026-05-02 04:32:33', '2026-05-02 04:42:33', 'openweathermap', 0, NULL),
(1585, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 37.00, 63, 1009.00, 6.20, 60, 10000, 'Clouds', 'overcast clouds', '04d', 87, NULL, 0.00, 0.00, 0.00, '2026-05-02 04:32:33', '2026-05-02 04:32:33', '2026-05-02 04:42:33', 'openweathermap', 0, NULL),
(1586, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 65, 1007.00, 35.00, 71, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:28:57', '2026-05-02 06:28:57', '2026-05-02 06:38:57', 'openweathermap', 0, NULL),
(1587, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 68, 1007.00, 24.70, 71, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:28:57', '2026-05-02 06:28:57', '2026-05-02 06:38:57', 'openweathermap', 0, NULL),
(1588, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 33.00, 48, 1008.00, 23.30, 72, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:28:58', '2026-05-02 06:28:58', '2026-05-02 06:38:58', 'openweathermap', 0, NULL),
(1589, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 48, 1007.00, 9.50, 61, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:28:58', '2026-05-02 06:28:58', '2026-05-02 06:38:58', 'openweathermap', 0, NULL),
(1590, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 38.00, 64, 1008.00, 13.50, 66, 10000, 'Clouds', 'overcast clouds', '04d', 90, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:28:58', '2026-05-02 06:28:58', '2026-05-02 06:38:58', 'openweathermap', 0, NULL),
(1591, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 31.00, 35.00, 64, 1007.00, 33.50, 70, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:39:17', '2026-05-02 06:39:17', '2026-05-02 06:49:17', 'openweathermap', 0, NULL),
(1592, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 68, 1007.00, 21.00, 75, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:39:18', '2026-05-02 06:39:18', '2026-05-02 06:49:18', 'openweathermap', 0, NULL),
(1593, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 33.00, 49, 1007.00, 22.20, 68, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:39:18', '2026-05-02 06:39:18', '2026-05-02 06:49:18', 'openweathermap', 0, NULL),
(1594, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 47, 1007.00, 8.40, 51, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:39:18', '2026-05-02 06:39:18', '2026-05-02 06:49:18', 'openweathermap', 0, NULL),
(1595, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 37.00, 66, 1008.00, 15.20, 71, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 06:39:19', '2026-05-02 06:39:19', '2026-05-02 06:49:19', 'openweathermap', 0, NULL),
(1596, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 65, 1007.00, 33.50, 70, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:04:41', '2026-05-02 07:04:41', '2026-05-02 07:14:41', 'openweathermap', 0, NULL),
(1597, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 69, 1007.00, 21.00, 75, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:04:41', '2026-05-02 07:04:41', '2026-05-02 07:14:41', 'openweathermap', 0, NULL),
(1598, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 33.00, 48, 1007.00, 22.20, 68, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:04:42', '2026-05-02 07:04:42', '2026-05-02 07:14:42', 'openweathermap', 0, NULL),
(1599, 4, 12.44130000, 121.15300000, 'Naujan Lake', 33.00, 36.00, 48, 1007.00, 8.40, 51, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:04:42', '2026-05-02 07:04:42', '2026-05-02 07:14:42', 'openweathermap', 0, NULL),
(1600, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 39.00, 66, 1008.00, 15.20, 71, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:04:43', '2026-05-02 07:04:43', '2026-05-02 07:14:43', 'openweathermap', 0, NULL),
(1601, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 31.00, 35.00, 65, 1007.00, 29.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:30:34', '2026-05-02 07:30:34', '2026-05-02 07:40:34', 'openweathermap', 0, NULL),
(1602, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 70, 1007.00, 14.00, 50, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:30:34', '2026-05-02 07:30:34', '2026-05-02 07:40:34', 'openweathermap', 0, NULL),
(1603, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 32.00, 52, 1007.00, 18.00, 61, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:30:35', '2026-05-02 07:30:35', '2026-05-02 07:40:35', 'openweathermap', 0, NULL),
(1604, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 54, 1007.00, 7.60, 32, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:30:35', '2026-05-02 07:30:35', '2026-05-02 07:40:35', 'openweathermap', 0, NULL),
(1605, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 39.00, 68, 1008.00, 15.80, 67, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:30:36', '2026-05-02 07:30:36', '2026-05-02 07:40:36', 'openweathermap', 0, NULL),
(1606, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 31.00, 35.00, 65, 1007.00, 29.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:42:22', '2026-05-02 07:42:22', '2026-05-02 07:52:22', 'openweathermap', 0, NULL),
(1607, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 70, 1007.00, 14.00, 50, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:42:22', '2026-05-02 07:42:22', '2026-05-02 07:52:22', 'openweathermap', 0, NULL),
(1608, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 32.00, 52, 1007.00, 18.00, 61, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:42:22', '2026-05-02 07:42:22', '2026-05-02 07:52:22', 'openweathermap', 0, NULL),
(1609, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 54, 1007.00, 7.60, 32, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:42:22', '2026-05-02 07:42:22', '2026-05-02 07:52:22', 'openweathermap', 0, NULL),
(1610, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 39.00, 68, 1008.00, 15.80, 67, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:42:23', '2026-05-02 07:42:23', '2026-05-02 07:52:23', 'openweathermap', 0, NULL),
(1611, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 31.00, 35.00, 65, 1007.00, 29.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:55:17', '2026-05-02 07:55:17', '2026-05-02 08:05:17', 'openweathermap', 0, NULL),
(1612, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 70, 1007.00, 14.00, 50, 10000, 'Rain', 'light rain', '10d', 100, NULL, 0.17, 0.00, 0.00, '2026-05-02 07:55:17', '2026-05-02 07:55:17', '2026-05-02 08:05:17', 'openweathermap', 0, NULL),
(1613, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 33.00, 52, 1007.00, 18.00, 61, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:55:18', '2026-05-02 07:55:18', '2026-05-02 08:05:18', 'openweathermap', 0, NULL),
(1614, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 54, 1007.00, 7.60, 32, 10000, 'Rain', 'light rain', '10d', 98, NULL, 0.14, 0.00, 0.00, '2026-05-02 07:55:18', '2026-05-02 07:55:18', '2026-05-02 08:05:18', 'openweathermap', 0, NULL),
(1615, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 39.00, 68, 1008.00, 15.80, 67, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:55:18', '2026-05-02 07:55:18', '2026-05-02 08:05:18', 'openweathermap', 0, NULL),
(1616, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', 32.00, 38.00, 65, 1008.00, 13.70, 68, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 07:57:55', '2026-05-02 07:57:55', '2026-05-02 08:07:55', 'openweathermap', 0, NULL),
(1617, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 31.00, 35.00, 65, 1007.00, 29.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:20:21', '2026-05-02 08:20:21', '2026-05-02 08:30:21', 'openweathermap', 0, NULL),
(1618, 2, 12.23800000, 121.06900000, 'Arangin Falls', 29.00, 33.00, 70, 1007.00, 14.00, 50, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:20:34', '2026-05-02 08:20:34', '2026-05-02 08:30:34', 'openweathermap', 0, NULL),
(1619, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 31.00, 32.00, 52, 1007.00, 18.00, 61, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:20:34', '2026-05-02 08:20:34', '2026-05-02 08:30:34', 'openweathermap', 0, NULL),
(1620, 4, 12.44130000, 121.15300000, 'Naujan Lake', 32.00, 35.00, 54, 1007.00, 7.60, 32, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:20:34', '2026-05-02 08:20:34', '2026-05-02 08:30:34', 'openweathermap', 0, NULL),
(1621, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 32.00, 37.00, 60, 1008.00, 15.80, 67, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:20:35', '2026-05-02 08:20:35', '2026-05-02 08:30:35', 'openweathermap', 0, NULL),
(1622, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 67, 1007.00, 26.20, 57, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:30:35', '2026-05-02 08:30:35', '2026-05-02 08:40:35', 'openweathermap', 0, NULL),
(1623, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 73, 1007.00, 11.50, 24, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:30:35', '2026-05-02 08:30:35', '2026-05-02 08:40:35', 'openweathermap', 0, NULL),
(1624, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 56, 1007.00, 16.80, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:30:35', '2026-05-02 08:30:35', '2026-05-02 08:40:35', 'openweathermap', 0, NULL),
(1625, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 58, 1007.00, 7.50, 38, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:30:35', '2026-05-02 08:30:35', '2026-05-02 08:40:35', 'openweathermap', 0, NULL),
(1626, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 65, 1008.00, 16.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:30:36', '2026-05-02 08:30:36', '2026-05-02 08:40:36', 'openweathermap', 0, NULL),
(1627, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 56, 1007.00, 16.80, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:40:35', '2026-05-02 08:40:35', '2026-05-02 08:50:35', 'openweathermap', 0, NULL),
(1628, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 58, 1007.00, 7.50, 38, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:40:35', '2026-05-02 08:40:35', '2026-05-02 08:50:35', 'openweathermap', 0, NULL),
(1629, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 65, 1008.00, 16.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:40:36', '2026-05-02 08:40:36', '2026-05-02 08:50:36', 'openweathermap', 0, NULL),
(1630, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 67, 1007.00, 26.20, 57, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:45:35', '2026-05-02 08:45:35', '2026-05-02 08:55:35', 'openweathermap', 0, NULL),
(1631, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 73, 1007.00, 11.50, 24, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:45:35', '2026-05-02 08:45:35', '2026-05-02 08:55:35', 'openweathermap', 0, NULL),
(1632, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 56, 1007.00, 16.80, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:50:35', '2026-05-02 08:50:35', '2026-05-02 09:00:35', 'openweathermap', 0, NULL),
(1633, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 58, 1007.00, 7.50, 38, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:50:35', '2026-05-02 08:50:35', '2026-05-02 09:00:35', 'openweathermap', 0, NULL),
(1634, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 65, 1008.00, 16.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:50:36', '2026-05-02 08:50:36', '2026-05-02 09:00:36', 'openweathermap', 0, NULL),
(1635, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 67, 1007.00, 26.20, 57, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:55:53', '2026-05-02 08:55:53', '2026-05-02 09:05:53', 'openweathermap', 0, NULL),
(1636, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 73, 1007.00, 11.50, 24, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 08:55:53', '2026-05-02 08:55:53', '2026-05-02 09:05:53', 'openweathermap', 0, NULL),
(1637, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 56, 1007.00, 16.80, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:00:53', '2026-05-02 09:00:53', '2026-05-02 09:10:53', 'openweathermap', 0, NULL),
(1638, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 58, 1007.00, 7.50, 38, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:00:53', '2026-05-02 09:00:53', '2026-05-02 09:10:53', 'openweathermap', 0, NULL),
(1639, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 65, 1008.00, 16.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:00:54', '2026-05-02 09:00:54', '2026-05-02 09:10:54', 'openweathermap', 0, NULL),
(1640, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 35.00, 67, 1007.00, 26.20, 57, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:10:34', '2026-05-02 09:10:34', '2026-05-02 09:20:34', 'openweathermap', 0, NULL),
(1641, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 73, 1007.00, 11.50, 24, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:10:34', '2026-05-02 09:10:34', '2026-05-02 09:20:34', 'openweathermap', 0, NULL),
(1642, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 32.00, 56, 1007.00, 16.80, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:13:59', '2026-05-02 09:13:59', '2026-05-02 09:23:59', 'openweathermap', 0, NULL),
(1643, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 58, 1007.00, 7.50, 38, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:13:59', '2026-05-02 09:13:59', '2026-05-02 09:23:59', 'openweathermap', 0, NULL),
(1644, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 36.00, 63, 1008.00, 16.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:14:00', '2026-05-02 09:14:00', '2026-05-02 09:24:00', 'openweathermap', 0, NULL),
(1645, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 30.00, 34.00, 67, 1007.00, 26.20, 57, 10000, 'Clouds', 'overcast clouds', '04d', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:28:22', '2026-05-02 09:28:22', '2026-05-02 09:38:22', 'openweathermap', 0, NULL),
(1646, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 73, 1007.00, 11.50, 24, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:28:23', '2026-05-02 09:28:23', '2026-05-02 09:38:23', 'openweathermap', 0, NULL),
(1647, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 30.00, 31.00, 56, 1007.00, 16.80, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:28:23', '2026-05-02 09:28:23', '2026-05-02 09:38:23', 'openweathermap', 0, NULL),
(1648, 4, 12.44130000, 121.15300000, 'Naujan Lake', 31.00, 34.00, 58, 1007.00, 7.50, 38, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:28:24', '2026-05-02 09:28:24', '2026-05-02 09:38:24', 'openweathermap', 0, NULL),
(1649, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 31.00, 37.00, 70, 1008.00, 16.40, 62, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:28:24', '2026-05-02 09:28:24', '2026-05-02 09:38:24', 'openweathermap', 0, NULL),
(1650, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 34.00, 71, 1007.00, 20.40, 56, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:43:11', '2026-05-02 09:43:11', '2026-05-02 09:53:11', 'openweathermap', 0, NULL),
(1651, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 75, 1007.00, 9.40, 9, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:43:11', '2026-05-02 09:43:11', '2026-05-02 09:53:11', 'openweathermap', 0, NULL),
(1652, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 30.00, 66, 1008.00, 11.10, 64, 10000, 'Clouds', 'overcast clouds', '04d', 90, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:43:12', '2026-05-02 09:43:12', '2026-05-02 09:53:12', 'openweathermap', 0, NULL),
(1653, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 33.00, 67, 1008.00, 4.10, 32, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:43:13', '2026-05-02 09:43:13', '2026-05-02 09:53:13', 'openweathermap', 0, NULL),
(1654, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 75, 1008.00, 15.60, 51, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:43:13', '2026-05-02 09:43:13', '2026-05-02 09:53:13', 'openweathermap', 0, NULL),
(1655, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 75, 1007.00, 9.40, 9, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:53:11', '2026-05-02 09:53:11', '2026-05-02 10:03:11', 'openweathermap', 0, NULL),
(1656, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 30.00, 66, 1008.00, 11.10, 64, 10000, 'Clouds', 'overcast clouds', '04d', 90, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:53:12', '2026-05-02 09:53:12', '2026-05-02 10:03:12', 'openweathermap', 0, NULL),
(1657, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 33.00, 67, 1008.00, 4.10, 32, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:53:13', '2026-05-02 09:53:13', '2026-05-02 10:03:13', 'openweathermap', 0, NULL),
(1658, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 75, 1008.00, 15.60, 51, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:53:13', '2026-05-02 09:53:13', '2026-05-02 10:03:13', 'openweathermap', 0, NULL),
(1659, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 34.00, 71, 1007.00, 20.40, 56, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 09:58:11', '2026-05-02 09:58:11', '2026-05-02 10:08:11', 'openweathermap', 0, NULL),
(1660, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 76, 1007.00, 9.40, 9, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:03:11', '2026-05-02 10:03:11', '2026-05-02 10:13:11', 'openweathermap', 0, NULL),
(1661, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 30.00, 66, 1008.00, 11.10, 64, 10000, 'Clouds', 'overcast clouds', '04d', 90, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:03:12', '2026-05-02 10:03:12', '2026-05-02 10:13:12', 'openweathermap', 0, NULL),
(1662, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 33.00, 67, 1008.00, 4.10, 32, 10000, 'Clouds', 'overcast clouds', '04d', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:03:13', '2026-05-02 10:03:13', '2026-05-02 10:13:13', 'openweathermap', 0, NULL),
(1663, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 75, 1008.00, 15.60, 51, 10000, 'Clouds', 'overcast clouds', '04d', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:03:13', '2026-05-02 10:03:13', '2026-05-02 10:13:13', 'openweathermap', 0, NULL),
(1664, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 34.00, 71, 1007.00, 20.40, 56, 10000, 'Clouds', 'overcast clouds', '04d', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:08:53', '2026-05-02 10:08:53', '2026-05-02 10:18:53', 'openweathermap', 0, NULL),
(1665, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 76, 1007.00, 9.40, 9, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:13:53', '2026-05-02 10:13:53', '2026-05-02 10:23:53', 'openweathermap', 0, NULL),
(1666, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 30.00, 66, 1008.00, 11.10, 64, 10000, 'Clouds', 'overcast clouds', '04n', 90, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:13:54', '2026-05-02 10:13:54', '2026-05-02 10:23:54', 'openweathermap', 0, NULL),
(1667, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 33.00, 67, 1008.00, 4.10, 32, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:13:54', '2026-05-02 10:13:54', '2026-05-02 10:23:54', 'openweathermap', 0, NULL),
(1668, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 36.00, 74, 1008.00, 15.60, 51, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:13:55', '2026-05-02 10:13:55', '2026-05-02 10:23:55', 'openweathermap', 0, NULL),
(1669, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 34.00, 71, 1007.00, 20.40, 56, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:23:53', '2026-05-02 10:23:53', '2026-05-02 10:33:53', 'openweathermap', 0, NULL),
(1670, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 76, 1007.00, 9.40, 9, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:23:53', '2026-05-02 10:23:53', '2026-05-02 10:33:53', 'openweathermap', 0, NULL),
(1671, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 28.00, 30.00, 66, 1008.00, 11.10, 64, 10000, 'Clouds', 'overcast clouds', '04n', 90, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:23:54', '2026-05-02 10:23:54', '2026-05-02 10:33:54', 'openweathermap', 0, NULL),
(1672, 4, 12.44130000, 121.15300000, 'Naujan Lake', 29.00, 33.00, 67, 1008.00, 4.10, 32, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:23:55', '2026-05-02 10:23:55', '2026-05-02 10:33:55', 'openweathermap', 0, NULL),
(1673, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 30.00, 35.00, 74, 1008.00, 15.60, 51, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:23:55', '2026-05-02 10:23:55', '2026-05-02 10:33:55', 'openweathermap', 0, NULL),
(1674, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 76, 1008.00, 20.80, 62, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:38:53', '2026-05-02 10:38:53', '2026-05-02 10:48:53', 'openweathermap', 0, NULL),
(1675, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 78, 1008.00, 9.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:38:53', '2026-05-02 10:38:53', '2026-05-02 10:48:53', 'openweathermap', 0, NULL),
(1676, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1009.00, 11.40, 69, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:38:54', '2026-05-02 10:38:54', '2026-05-02 10:48:54', 'openweathermap', 0, NULL),
(1677, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 76, 1009.00, 6.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:38:55', '2026-05-02 10:38:55', '2026-05-02 10:48:55', 'openweathermap', 0, NULL),
(1678, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 35.00, 81, 1009.00, 16.70, 46, 6899, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:38:55', '2026-05-02 10:38:55', '2026-05-02 10:48:55', 'openweathermap', 0, NULL),
(1679, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 78, 1008.00, 9.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:48:53', '2026-05-02 10:48:53', '2026-05-02 10:58:53', 'openweathermap', 0, NULL),
(1680, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1009.00, 11.40, 69, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:48:54', '2026-05-02 10:48:54', '2026-05-02 10:58:54', 'openweathermap', 0, NULL),
(1681, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 76, 1009.00, 6.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:48:55', '2026-05-02 10:48:55', '2026-05-02 10:58:55', 'openweathermap', 0, NULL),
(1682, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 34.00, 81, 1009.00, 16.70, 46, 6899, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:48:55', '2026-05-02 10:48:55', '2026-05-02 10:58:55', 'openweathermap', 0, NULL),
(1683, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 76, 1008.00, 20.80, 62, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:53:53', '2026-05-02 10:53:53', '2026-05-02 11:03:53', 'openweathermap', 0, NULL),
(1684, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 78, 1008.00, 9.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:58:53', '2026-05-02 10:58:53', '2026-05-02 11:08:53', 'openweathermap', 0, NULL),
(1685, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1009.00, 11.40, 69, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:58:54', '2026-05-02 10:58:54', '2026-05-02 11:08:54', 'openweathermap', 0, NULL),
(1686, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 76, 1009.00, 6.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:58:55', '2026-05-02 10:58:55', '2026-05-02 11:08:55', 'openweathermap', 0, NULL),
(1687, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 34.00, 81, 1009.00, 16.70, 46, 6899, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 10:58:55', '2026-05-02 10:58:55', '2026-05-02 11:08:55', 'openweathermap', 0, NULL),
(1688, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 76, 1008.00, 20.80, 62, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:08:53', '2026-05-02 11:08:53', '2026-05-02 11:18:53', 'openweathermap', 0, NULL),
(1689, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 78, 1008.00, 9.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:08:53', '2026-05-02 11:08:53', '2026-05-02 11:18:53', 'openweathermap', 0, NULL),
(1690, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1009.00, 11.40, 69, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:08:54', '2026-05-02 11:08:54', '2026-05-02 11:18:54', 'openweathermap', 0, NULL),
(1691, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 76, 1009.00, 6.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:08:55', '2026-05-02 11:08:55', '2026-05-02 11:18:55', 'openweathermap', 0, NULL),
(1692, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 35.00, 81, 1009.00, 16.70, 46, 6899, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:08:55', '2026-05-02 11:08:55', '2026-05-02 11:18:55', 'openweathermap', 0, NULL),
(1693, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 78, 1008.00, 9.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:18:53', '2026-05-02 11:18:53', '2026-05-02 11:28:53', 'openweathermap', 0, NULL),
(1694, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1009.00, 11.40, 69, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:18:54', '2026-05-02 11:18:54', '2026-05-02 11:28:54', 'openweathermap', 0, NULL),
(1695, 4, 12.44130000, 121.15300000, 'Naujan Lake', 28.00, 31.00, 76, 1009.00, 6.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 93, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:18:55', '2026-05-02 11:18:55', '2026-05-02 11:28:55', 'openweathermap', 0, NULL),
(1696, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 34.00, 81, 1009.00, 16.70, 46, 6899, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:18:55', '2026-05-02 11:18:55', '2026-05-02 11:28:55', 'openweathermap', 0, NULL),
(1697, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 29.00, 33.00, 76, 1008.00, 20.80, 62, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:23:53', '2026-05-02 11:23:53', '2026-05-02 11:33:53', 'openweathermap', 0, NULL),
(1698, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 32.00, 78, 1008.00, 9.10, 44, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:28:53', '2026-05-02 11:28:53', '2026-05-02 11:38:53', 'openweathermap', 0, NULL),
(1699, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 26.00, 26.00, 76, 1009.00, 11.40, 69, 10000, 'Clouds', 'overcast clouds', '04n', 91, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:28:54', '2026-05-02 11:28:54', '2026-05-02 11:38:54', 'openweathermap', 0, NULL),
(1700, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 29.00, 34.00, 81, 1009.00, 16.70, 46, 6899, 'Rain', 'light rain', '10n', 100, NULL, 0.27, 0.00, 0.00, '2026-05-02 11:28:55', '2026-05-02 11:28:55', '2026-05-02 11:38:55', 'openweathermap', 0, NULL),
(1701, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 30.00, 79, 1009.00, 8.20, 68, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:33:54', '2026-05-02 11:33:54', '2026-05-02 11:43:54', 'openweathermap', 0, NULL),
(1702, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 33.00, 78, 1009.00, 20.60, 58, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:38:53', '2026-05-02 11:38:53', '2026-05-02 11:48:53', 'openweathermap', 0, NULL),
(1703, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 11.30, 60, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:38:53', '2026-05-02 11:38:53', '2026-05-02 11:48:53', 'openweathermap', 0, NULL),
(1704, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 81, 1010.00, 11.90, 60, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:38:54', '2026-05-02 11:38:54', '2026-05-02 11:48:54', 'openweathermap', 0, NULL),
(1705, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 17.60, 51, 530, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:38:55', '2026-05-02 11:38:55', '2026-05-02 11:48:55', 'openweathermap', 0, NULL),
(1706, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 30.00, 79, 1009.00, 8.20, 68, 10000, 'Clouds', 'overcast clouds', '04n', 94, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:43:54', '2026-05-02 11:43:54', '2026-05-02 11:53:54', 'openweathermap', 0, NULL),
(1707, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 11.30, 60, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:48:53', '2026-05-02 11:48:53', '2026-05-02 11:58:53', 'openweathermap', 0, NULL),
(1708, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 81, 1010.00, 11.90, 60, 10000, 'Clouds', 'overcast clouds', '04n', 92, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:48:54', '2026-05-02 11:48:54', '2026-05-02 11:58:54', 'openweathermap', 0, NULL),
(1709, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 17.60, 51, 530, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:48:55', '2026-05-02 11:48:55', '2026-05-02 11:58:55', 'openweathermap', 0, NULL),
(1710, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 33.00, 78, 1009.00, 17.60, 61, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:53:53', '2026-05-02 11:53:53', '2026-05-02 12:03:53', 'openweathermap', 0, NULL),
(1711, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 30.00, 79, 1009.00, 7.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:53:55', '2026-05-02 11:53:55', '2026-05-02 12:03:55', 'openweathermap', 0, NULL),
(1712, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 10.40, 64, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:58:53', '2026-05-02 11:58:53', '2026-05-02 12:08:53', 'openweathermap', 0, NULL),
(1713, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 81, 1010.00, 10.30, 60, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:58:54', '2026-05-02 11:58:54', '2026-05-02 12:08:54', 'openweathermap', 0, NULL),
(1714, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 17.60, 51, 530, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 11:58:55', '2026-05-02 11:58:55', '2026-05-02 12:08:55', 'openweathermap', 0, NULL),
(1715, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 33.00, 78, 1009.00, 17.60, 61, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:04:57', '2026-05-02 12:04:57', '2026-05-02 12:14:57', 'openweathermap', 0, NULL),
(1716, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 30.00, 79, 1009.00, 7.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:04:59', '2026-05-02 12:04:59', '2026-05-02 12:14:59', 'openweathermap', 0, NULL),
(1717, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 10.40, 64, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:09:57', '2026-05-02 12:09:57', '2026-05-02 12:19:57', 'openweathermap', 0, NULL),
(1718, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 81, 1010.00, 10.30, 60, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:09:58', '2026-05-02 12:09:58', '2026-05-02 12:19:58', 'openweathermap', 0, NULL),
(1719, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 14.50, 52, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:10:00', '2026-05-02 12:10:00', '2026-05-02 12:20:00', 'openweathermap', 0, NULL),
(1720, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 33.00, 78, 1009.00, 17.60, 61, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:14:57', '2026-05-02 12:14:57', '2026-05-02 12:24:57', 'openweathermap', 0, NULL),
(1721, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 30.00, 79, 1009.00, 7.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:14:59', '2026-05-02 12:14:59', '2026-05-02 12:24:59', 'openweathermap', 0, NULL),
(1722, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 10.40, 64, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:19:57', '2026-05-02 12:19:57', '2026-05-02 12:29:57', 'openweathermap', 0, NULL),
(1723, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 81, 1010.00, 10.30, 60, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:19:58', '2026-05-02 12:19:58', '2026-05-02 12:29:58', 'openweathermap', 0, NULL),
(1724, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 33.00, 78, 1009.00, 17.60, 61, 10000, 'Clouds', 'overcast clouds', '04n', 99, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:24:57', '2026-05-02 12:24:57', '2026-05-02 12:34:57', 'openweathermap', 0, NULL),
(1725, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 30.00, 79, 1009.00, 7.00, 66, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:24:59', '2026-05-02 12:24:59', '2026-05-02 12:34:59', 'openweathermap', 0, NULL),
(1726, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 14.50, 52, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:24:59', '2026-05-02 12:24:59', '2026-05-02 12:34:59', 'openweathermap', 0, NULL),
(1727, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 10.40, 64, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:29:57', '2026-05-02 12:29:57', '2026-05-02 12:39:57', 'openweathermap', 0, NULL),
(1728, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 81, 1010.00, 10.30, 60, 10000, 'Clouds', 'overcast clouds', '04n', 96, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:29:58', '2026-05-02 12:29:58', '2026-05-02 12:39:58', 'openweathermap', 0, NULL),
(1729, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 78, 1010.00, 16.70, 55, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:34:57', '2026-05-02 12:34:57', '2026-05-02 12:44:57', 'openweathermap', 0, NULL);
INSERT INTO `weather_data` (`weather_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `temperature`, `feels_like`, `humidity`, `pressure`, `wind_speed`, `wind_direction`, `visibility`, `weather_condition`, `description`, `icon_code`, `cloudiness`, `uv_index`, `rainfall_1h`, `rainfall_3h`, `snowfall_1h`, `recorded_at`, `data_timestamp`, `expires_at`, `api_source`, `is_forecast`, `forecast_hours`) VALUES
(1730, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 27.00, 80, 1010.00, 6.90, 65, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:34:59', '2026-05-02 12:34:59', '2026-05-02 12:44:59', 'openweathermap', 0, NULL),
(1731, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 12.90, 46, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:34:59', '2026-05-02 12:34:59', '2026-05-02 12:44:59', 'openweathermap', 0, NULL),
(1732, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 9.40, 55, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:39:58', '2026-05-02 12:39:58', '2026-05-02 12:49:58', 'openweathermap', 0, NULL),
(1733, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 82, 1010.00, 9.80, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:39:58', '2026-05-02 12:39:58', '2026-05-02 12:49:58', 'openweathermap', 0, NULL),
(1734, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 78, 1010.00, 16.70, 55, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:44:57', '2026-05-02 12:44:57', '2026-05-02 12:54:57', 'openweathermap', 0, NULL),
(1735, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 12.90, 46, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:44:59', '2026-05-02 12:44:59', '2026-05-02 12:54:59', 'openweathermap', 0, NULL),
(1736, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 27.00, 80, 1010.00, 6.90, 65, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:49:31', '2026-05-02 12:49:31', '2026-05-02 12:59:31', 'openweathermap', 0, NULL),
(1737, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 9.40, 55, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:52:05', '2026-05-02 12:52:05', '2026-05-02 13:02:05', 'openweathermap', 0, NULL),
(1738, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 82, 1010.00, 9.80, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:52:06', '2026-05-02 12:52:06', '2026-05-02 13:02:06', 'openweathermap', 0, NULL),
(1739, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 78, 1010.00, 16.70, 55, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:55:09', '2026-05-02 12:55:09', '2026-05-02 13:05:09', 'openweathermap', 0, NULL),
(1740, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 12.90, 46, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 12:55:12', '2026-05-02 12:55:12', '2026-05-02 13:05:12', 'openweathermap', 0, NULL),
(1741, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 27.00, 80, 1010.00, 6.90, 65, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:00:10', '2026-05-02 13:00:10', '2026-05-02 13:10:10', 'openweathermap', 0, NULL),
(1742, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 78, 1010.00, 16.70, 55, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:05:10', '2026-05-02 13:05:10', '2026-05-02 13:15:10', 'openweathermap', 0, NULL),
(1743, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1009.00, 9.40, 55, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:05:10', '2026-05-02 13:05:10', '2026-05-02 13:15:10', 'openweathermap', 0, NULL),
(1744, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 25.00, 82, 1010.00, 9.80, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:05:11', '2026-05-02 13:05:11', '2026-05-02 13:15:11', 'openweathermap', 0, NULL),
(1745, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 84, 1010.00, 12.90, 46, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:05:12', '2026-05-02 13:05:12', '2026-05-02 13:15:12', 'openweathermap', 0, NULL),
(1746, 4, 12.44130000, 121.15300000, 'Naujan Lake', 27.00, 29.00, 77, 1010.00, 6.90, 65, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:13:57', '2026-05-02 13:13:57', '2026-05-02 13:23:57', 'openweathermap', 0, NULL),
(1747, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 77, 1010.00, 16.70, 55, 10000, 'Clouds', 'overcast clouds', '04n', 98, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:15:42', '2026-05-02 13:15:42', '2026-05-02 13:25:42', 'openweathermap', 0, NULL),
(1748, 2, 12.23800000, 121.06900000, 'Arangin Falls', 28.00, 31.00, 77, 1010.00, 9.40, 55, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:15:42', '2026-05-02 13:15:42', '2026-05-02 13:25:42', 'openweathermap', 0, NULL),
(1749, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', 25.00, 26.00, 79, 1010.00, 9.80, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:15:43', '2026-05-02 13:15:43', '2026-05-02 13:25:43', 'openweathermap', 0, NULL),
(1750, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 33.00, 82, 1011.00, 12.90, 46, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 13:15:44', '2026-05-02 13:15:44', '2026-05-02 13:25:44', 'openweathermap', 0, NULL),
(1751, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', 27.00, 31.00, 86, 1011.00, 3.90, 58, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 15:18:53', '2026-05-02 15:18:53', '2026-05-02 15:28:53', 'openweathermap', 0, NULL),
(1752, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', 28.00, 32.00, 83, 1011.00, 11.40, 59, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-02 15:20:39', '2026-05-02 15:20:39', '2026-05-02 15:30:39', 'openweathermap', 0, NULL),
(1753, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', 28.00, 32.00, 79, 1011.00, 16.20, 49, 10000, 'Clouds', 'overcast clouds', '04n', 100, NULL, 0.00, 0.00, 0.00, '2026-05-03 14:29:54', '2026-05-03 14:29:54', '2026-05-03 14:39:54', 'openweathermap', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `weather_forecasts`
--

CREATE TABLE `weather_forecasts` (
  `forecast_id` int(11) NOT NULL,
  `attraction_id` int(11) DEFAULT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `location_name` varchar(255) DEFAULT NULL,
  `forecast_date` date NOT NULL,
  `forecast_hour` int(11) NOT NULL DEFAULT 0,
  `temperature` decimal(5,2) NOT NULL,
  `humidity` int(11) NOT NULL,
  `wind_speed` decimal(5,2) DEFAULT NULL,
  `weather_condition` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `rainfall_probability` int(11) DEFAULT 0,
  `rainfall_amount` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `api_source` varchar(50) DEFAULT 'openweathermap'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `weather_forecasts`
--

INSERT INTO `weather_forecasts` (`forecast_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `forecast_date`, `forecast_hour`, `temperature`, `humidity`, `wind_speed`, `weather_condition`, `description`, `rainfall_probability`, `rainfall_amount`, `created_at`, `api_source`) VALUES
(1, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-15', 23, 24.00, 70, 37.20, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(2, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-15', 2, 23.00, 70, 34.30, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(3, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-15', 5, 23.00, 70, 32.90, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(4, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 8, 24.00, 70, 36.60, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(5, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 11, 27.00, 70, 37.60, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(6, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 14, 27.00, 70, 35.20, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(7, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 17, 27.00, 70, 30.50, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(8, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 20, 24.00, 70, 19.20, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(9, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 23, 24.00, 70, 21.20, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(10, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 2, 23.00, 70, 18.10, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(11, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-16', 5, 23.00, 70, 15.00, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(12, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 8, 25.00, 70, 19.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(13, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 11, 27.00, 70, 30.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(14, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 14, 27.00, 70, 34.90, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(15, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 17, 27.00, 70, 17.50, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(16, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 20, 25.00, 70, 7.70, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(17, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 23, 24.00, 70, 7.50, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(18, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 2, 24.00, 70, 10.60, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(19, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-17', 5, 24.00, 70, 13.20, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(20, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 8, 26.00, 70, 16.30, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(21, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 11, 28.00, 70, 30.80, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(22, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 14, 27.00, 70, 30.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(23, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 17, 27.00, 70, 18.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(24, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 20, 26.00, 70, 15.00, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(25, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 23, 25.00, 70, 12.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(26, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 2, 25.00, 70, 18.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(27, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-18', 5, 24.00, 70, 22.00, 'Clouds', 'overcast clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(28, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 8, 26.00, 70, 24.40, 'Clouds', 'broken clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(29, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 11, 28.00, 70, 33.80, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(30, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 14, 28.00, 70, 34.50, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(31, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 17, 28.00, 70, 19.50, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(32, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 20, 26.00, 70, 11.70, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(33, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 23, 25.00, 70, 14.10, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(34, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 2, 24.00, 70, 21.70, 'Clear', 'clear sky', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(35, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-19', 5, 23.00, 70, 17.70, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(36, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-20', 8, 26.00, 70, 17.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(37, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-20', 11, 29.00, 70, 27.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(38, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-20', 14, 28.00, 70, 31.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(39, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-20', 17, 28.00, 70, 19.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(40, 1, 12.27100000, 121.19400000, '333 Steps', '2026-03-20', 20, 26.00, 70, 7.30, 'Clouds', 'few clouds', 0, 0.00, '2026-03-15 13:58:33', 'openweathermap'),
(41, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-01', 14, 29.00, 70, 34.20, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(42, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-01', 17, 29.00, 70, 22.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(43, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-01', 20, 27.00, 70, 8.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(44, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-01', 23, 25.00, 70, 9.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(45, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-01', 2, 25.00, 70, 10.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(46, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-01', 5, 25.00, 70, 13.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(47, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 8, 27.00, 70, 24.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(48, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 11, 28.00, 70, 32.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(49, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 14, 29.00, 70, 39.30, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(50, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 17, 29.00, 70, 23.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(51, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 20, 26.00, 70, 11.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(52, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 23, 26.00, 70, 17.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(53, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 2, 25.00, 70, 22.10, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(54, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-02', 5, 25.00, 70, 21.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(55, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 8, 27.00, 70, 26.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(56, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 11, 29.00, 70, 32.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(57, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 14, 29.00, 70, 35.20, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(58, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 17, 29.00, 70, 21.50, 'Clouds', 'few clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(59, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 20, 27.00, 70, 11.00, 'Clouds', 'few clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(60, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 23, 26.00, 70, 13.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(61, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 2, 26.00, 70, 11.50, 'Clouds', 'few clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(62, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-03', 5, 25.00, 70, 14.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(63, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 8, 27.00, 70, 16.90, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(64, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 11, 28.00, 70, 25.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(65, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 14, 28.00, 70, 23.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(66, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 17, 28.00, 70, 20.40, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(67, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 20, 27.00, 70, 12.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(68, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 23, 26.00, 70, 8.10, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(69, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 2, 26.00, 70, 9.50, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(70, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-04', 5, 25.00, 70, 9.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(71, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 8, 27.00, 70, 14.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(72, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 11, 29.00, 70, 32.00, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(73, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 14, 29.00, 70, 34.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(74, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 17, 29.00, 70, 27.60, 'Clouds', 'few clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(75, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 20, 27.00, 70, 16.30, 'Clouds', 'few clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(76, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 23, 26.00, 70, 15.70, 'Clouds', 'few clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(77, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 2, 26.00, 70, 15.60, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(78, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-05', 5, 26.00, 70, 15.30, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(79, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-06', 8, 28.00, 70, 20.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(80, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-06', 11, 29.00, 70, 33.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-01 04:17:27', 'openweathermap'),
(81, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-18', 14, 32.00, 70, 13.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(82, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-18', 17, 32.00, 70, 10.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(83, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-18', 20, 28.00, 70, 3.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(84, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-18', 23, 25.00, 70, 2.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(85, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-18', 2, 25.00, 70, 1.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(86, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-18', 5, 23.00, 70, 0.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(87, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 8, 27.00, 70, 5.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(88, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 11, 30.00, 70, 13.20, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(89, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 14, 31.00, 70, 13.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(90, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 17, 29.00, 70, 9.80, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(91, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 20, 25.00, 70, 2.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(92, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 23, 24.00, 70, 3.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(93, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 2, 24.00, 70, 2.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(94, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-19', 5, 23.00, 70, 1.20, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(95, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 8, 27.00, 70, 6.90, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(96, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 11, 29.00, 70, 11.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(97, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 14, 31.00, 70, 12.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(98, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 17, 29.00, 70, 11.60, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(99, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 20, 26.00, 70, 9.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(100, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 23, 25.00, 70, 7.30, 'Clouds', 'few clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(101, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 2, 26.00, 70, 8.50, 'Rain', 'light rain', 0, 0.14, '2026-04-18 05:06:10', 'openweathermap'),
(102, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-20', 5, 25.00, 70, 7.40, 'Rain', 'light rain', 0, 0.73, '2026-04-18 05:06:10', 'openweathermap'),
(103, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 8, 27.00, 70, 9.00, 'Rain', 'light rain', 0, 0.83, '2026-04-18 05:06:10', 'openweathermap'),
(104, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 11, 30.00, 70, 11.50, 'Rain', 'light rain', 0, 0.16, '2026-04-18 05:06:10', 'openweathermap'),
(105, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 14, 31.00, 70, 12.50, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(106, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 17, 29.00, 70, 13.30, 'Rain', 'light rain', 0, 0.17, '2026-04-18 05:06:10', 'openweathermap'),
(107, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 20, 26.00, 70, 9.60, 'Rain', 'light rain', 0, 1.75, '2026-04-18 05:06:10', 'openweathermap'),
(108, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 23, 25.00, 70, 2.20, 'Rain', 'light rain', 0, 1.34, '2026-04-18 05:06:10', 'openweathermap'),
(109, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 2, 25.00, 70, 7.30, 'Rain', 'light rain', 0, 1.54, '2026-04-18 05:06:10', 'openweathermap'),
(110, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-21', 5, 24.00, 70, 2.70, 'Rain', 'moderate rain', 0, 3.21, '2026-04-18 05:06:10', 'openweathermap'),
(111, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 8, 27.00, 70, 3.00, 'Rain', 'light rain', 0, 1.70, '2026-04-18 05:06:10', 'openweathermap'),
(112, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 11, 30.00, 70, 17.20, 'Rain', 'light rain', 0, 0.28, '2026-04-18 05:06:10', 'openweathermap'),
(113, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 14, 30.00, 70, 15.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(114, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 17, 29.00, 70, 12.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(115, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 20, 26.00, 70, 6.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(116, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 23, 25.00, 70, 4.10, 'Rain', 'light rain', 0, 0.34, '2026-04-18 05:06:10', 'openweathermap'),
(117, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 2, 25.00, 70, 1.30, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(118, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-22', 5, 24.00, 70, 3.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-18 05:06:10', 'openweathermap'),
(119, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-23', 8, 28.00, 70, 7.50, 'Rain', 'light rain', 0, 0.12, '2026-04-18 05:06:10', 'openweathermap'),
(120, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-04-23', 11, 30.00, 70, 13.80, 'Rain', 'light rain', 0, 0.12, '2026-04-18 05:06:10', 'openweathermap'),
(121, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-19', 14, 32.00, 70, 15.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(122, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-19', 17, 32.00, 70, 10.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(123, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-19', 20, 29.00, 70, 1.20, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(124, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-19', 23, 26.00, 70, 4.10, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(125, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-19', 2, 25.00, 70, 3.70, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(126, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-19', 5, 24.00, 70, 2.70, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(127, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 8, 28.00, 70, 5.10, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(128, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 11, 30.00, 70, 10.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(129, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 14, 31.00, 70, 12.60, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(130, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 17, 29.00, 70, 11.90, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(131, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 20, 26.00, 70, 9.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(132, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 23, 25.00, 70, 5.50, 'Rain', 'light rain', 0, 0.61, '2026-04-19 05:53:03', 'openweathermap'),
(133, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 2, 25.00, 70, 5.10, 'Rain', 'light rain', 0, 0.17, '2026-04-19 05:53:03', 'openweathermap'),
(134, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-20', 5, 24.00, 70, 1.90, 'Rain', 'light rain', 0, 0.91, '2026-04-19 05:53:03', 'openweathermap'),
(135, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 8, 27.00, 70, 4.50, 'Rain', 'light rain', 0, 0.99, '2026-04-19 05:53:03', 'openweathermap'),
(136, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 11, 30.00, 70, 9.00, 'Rain', 'light rain', 0, 1.78, '2026-04-19 05:53:03', 'openweathermap'),
(137, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 14, 31.00, 70, 14.80, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(138, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 17, 29.00, 70, 13.40, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(139, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 20, 26.00, 70, 7.30, 'Rain', 'light rain', 0, 0.24, '2026-04-19 05:53:03', 'openweathermap'),
(140, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 23, 25.00, 70, 3.10, 'Rain', 'light rain', 0, 0.61, '2026-04-19 05:53:03', 'openweathermap'),
(141, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 2, 25.00, 70, 5.60, 'Rain', 'light rain', 0, 0.13, '2026-04-19 05:53:03', 'openweathermap'),
(142, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-21', 5, 24.00, 70, 4.20, 'Rain', 'light rain', 0, 1.47, '2026-04-19 05:53:03', 'openweathermap'),
(143, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 8, 27.00, 70, 2.60, 'Rain', 'light rain', 0, 0.56, '2026-04-19 05:53:03', 'openweathermap'),
(144, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 11, 29.00, 70, 12.00, 'Rain', 'light rain', 0, 0.34, '2026-04-19 05:53:03', 'openweathermap'),
(145, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 14, 31.00, 70, 15.00, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(146, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 17, 30.00, 70, 11.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(147, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 20, 26.00, 70, 6.10, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(148, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 23, 25.00, 70, 4.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(149, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 2, 25.00, 70, 5.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(150, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-22', 5, 25.00, 70, 1.00, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(151, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 8, 28.00, 70, 1.90, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(152, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 11, 30.00, 70, 17.30, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(153, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 14, 31.00, 70, 18.10, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(154, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 17, 30.00, 70, 12.80, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(155, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 20, 26.00, 70, 4.90, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(156, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 23, 25.00, 70, 1.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(157, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 2, 24.00, 70, 1.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(158, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-23', 5, 24.00, 70, 2.10, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(159, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-24', 8, 28.00, 70, 4.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(160, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-04-24', 11, 31.00, 70, 13.20, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:03', 'openweathermap'),
(161, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-19', 14, 32.00, 70, 6.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(162, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-19', 17, 30.00, 70, 5.20, 'Rain', 'light rain', 0, 0.16, '2026-04-19 05:53:16', 'openweathermap'),
(163, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-19', 20, 26.00, 70, 6.90, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(164, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-19', 23, 22.00, 70, 6.70, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(165, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-19', 2, 22.00, 70, 6.10, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(166, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-19', 5, 21.00, 70, 6.60, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(167, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 8, 27.00, 70, 6.60, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(168, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 11, 32.00, 70, 15.40, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(169, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 14, 32.00, 70, 2.40, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(170, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 17, 29.00, 70, 6.40, 'Rain', 'light rain', 0, 0.19, '2026-04-19 05:53:16', 'openweathermap'),
(171, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 20, 23.00, 70, 5.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(172, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 23, 23.00, 70, 7.60, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(173, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 2, 22.00, 70, 7.50, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(174, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-20', 5, 22.00, 70, 10.00, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(175, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 8, 27.00, 70, 16.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(176, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 11, 31.00, 70, 24.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(177, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 14, 32.00, 70, 23.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(178, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 17, 29.00, 70, 21.10, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(179, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 20, 24.00, 70, 13.60, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(180, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 23, 23.00, 70, 11.80, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(181, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 2, 22.00, 70, 11.20, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(182, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-21', 5, 21.00, 70, 12.50, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(183, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 8, 27.00, 70, 21.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(184, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 11, 31.00, 70, 26.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(185, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 14, 31.00, 70, 24.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(186, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 17, 29.00, 70, 20.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(187, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 20, 24.00, 70, 10.80, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(188, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 23, 24.00, 70, 10.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(189, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 2, 23.00, 70, 9.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(190, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-22', 5, 22.00, 70, 10.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(191, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 8, 27.00, 70, 14.20, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(192, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 11, 31.00, 70, 19.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(193, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 14, 33.00, 70, 14.40, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(194, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 17, 28.00, 70, 6.20, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(195, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 20, 24.00, 70, 6.90, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(196, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 23, 23.00, 70, 7.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(197, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 2, 23.00, 70, 6.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(198, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-23', 5, 22.00, 70, 7.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(199, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-24', 8, 28.00, 70, 7.90, 'Clouds', 'few clouds', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(200, 3, 12.43990000, 121.25100000, 'Liwasang Bonifacio', '2026-04-24', 11, 33.00, 70, 13.80, 'Clear', 'clear sky', 0, 0.00, '2026-04-19 05:53:16', 'openweathermap'),
(201, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-20', 23, 27.00, 70, 11.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(202, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-20', 2, 27.00, 70, 17.20, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(203, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-20', 5, 26.00, 70, 21.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(204, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 8, 28.00, 70, 28.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(205, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 11, 29.00, 70, 30.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(206, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 14, 29.00, 70, 34.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(207, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 17, 29.00, 70, 28.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(208, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 20, 27.00, 70, 20.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(209, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 23, 27.00, 70, 20.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(210, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 2, 26.00, 70, 21.80, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(211, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-21', 5, 26.00, 70, 27.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(212, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 8, 28.00, 70, 31.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(213, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 11, 29.00, 70, 32.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(214, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 14, 29.00, 70, 34.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(215, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 17, 29.00, 70, 28.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(216, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 20, 27.00, 70, 14.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(217, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 23, 27.00, 70, 12.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(218, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 2, 26.00, 70, 15.70, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(219, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-22', 5, 26.00, 70, 18.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(220, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 8, 27.00, 70, 20.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(221, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 11, 29.00, 70, 31.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(222, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 14, 29.00, 70, 32.80, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(223, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 17, 29.00, 70, 27.00, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(224, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 20, 27.00, 70, 15.10, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(225, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 23, 27.00, 70, 9.20, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(226, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 2, 26.00, 70, 9.30, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(227, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-23', 5, 26.00, 70, 8.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(228, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 8, 28.00, 70, 8.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(229, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 11, 29.00, 70, 23.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(230, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 14, 29.00, 70, 27.00, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(231, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 17, 29.00, 70, 25.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(232, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 20, 28.00, 70, 12.30, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(233, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 23, 27.00, 70, 7.80, 'Rain', 'light rain', 0, 0.10, '2026-04-20 12:29:51', 'openweathermap'),
(234, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 2, 27.00, 70, 11.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(235, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-24', 5, 27.00, 70, 12.00, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(236, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-25', 8, 29.00, 70, 12.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(237, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-25', 11, 30.00, 70, 31.60, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(238, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-25', 14, 29.00, 70, 34.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(239, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-25', 17, 29.00, 70, 26.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(240, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-25', 20, 28.00, 70, 12.70, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:29:51', 'openweathermap'),
(241, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-20', 23, 25.00, 70, 7.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(242, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-20', 2, 24.00, 70, 7.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(243, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-20', 5, 24.00, 70, 9.80, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(244, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 8, 29.00, 70, 17.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(245, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 11, 34.00, 70, 25.00, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(246, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 14, 34.00, 70, 24.00, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(247, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 17, 31.00, 70, 21.50, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(248, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 20, 25.00, 70, 10.90, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(249, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 23, 24.00, 70, 10.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(250, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 2, 23.00, 70, 9.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(251, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-21', 5, 23.00, 70, 12.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(252, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 8, 29.00, 70, 18.90, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(253, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 11, 34.00, 70, 23.70, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(254, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 14, 34.00, 70, 18.30, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(255, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 17, 31.00, 70, 14.50, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(256, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 20, 24.00, 70, 10.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(257, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 23, 24.00, 70, 9.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(258, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 2, 23.00, 70, 8.00, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(259, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-22', 5, 22.00, 70, 8.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(260, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 8, 28.00, 70, 9.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(261, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 11, 33.00, 70, 9.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(262, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 14, 34.00, 70, 5.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(263, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 17, 31.00, 70, 3.00, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(264, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 20, 25.00, 70, 9.50, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(265, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 23, 24.00, 70, 6.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(266, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 2, 24.00, 70, 6.10, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(267, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-23', 5, 23.00, 70, 6.20, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(268, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 8, 30.00, 70, 3.60, 'Clear', 'clear sky', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(269, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 11, 34.00, 70, 9.10, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(270, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 14, 34.00, 70, 9.40, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(271, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 17, 31.00, 70, 1.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(272, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 20, 26.00, 70, 8.80, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(273, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 23, 26.00, 70, 6.70, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(274, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 2, 25.00, 70, 6.20, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(275, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-24', 5, 24.00, 70, 5.90, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(276, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-25', 8, 30.00, 70, 5.50, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(277, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-25', 11, 34.00, 70, 14.40, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(278, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-25', 14, 35.00, 70, 14.10, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(279, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-25', 17, 31.00, 70, 10.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(280, 4, 12.44130000, 121.15300000, 'Naujan Lake', '2026-04-25', 20, 27.00, 70, 6.80, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-20 12:30:02', 'openweathermap'),
(285, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-26', 11, 30.00, 70, 28.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-22 13:35:51', 'openweathermap'),
(286, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-27', 11, 30.00, 70, 35.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-22 13:35:51', 'openweathermap'),
(365, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-28', 20, 30.00, 70, 7.00, 'Thunderstorm', 'thunderstorm with rain', 0, 0.00, '2026-04-28 00:44:44', 'openweathermap'),
(366, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-29', 20, 24.00, 70, 4.00, 'Rain', 'light rain', 0, 5.88, '2026-04-28 00:44:44', 'openweathermap'),
(367, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-30', 20, 22.00, 70, 1.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-28 00:44:44', 'openweathermap'),
(368, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-01', 20, 25.00, 70, 13.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-28 00:44:44', 'openweathermap'),
(369, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-02', 20, 31.00, 70, 8.00, 'Thunderstorm', 'thunderstorm with rain', 0, 0.00, '2026-04-28 00:44:44', 'openweathermap'),
(370, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-03', 20, 31.00, 70, 4.00, 'Rain', 'light rain', 0, 3.03, '2026-04-28 00:44:44', 'openweathermap'),
(371, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-04', 20, 29.00, 70, 10.00, 'Clear', 'clear sky', 0, 0.00, '2026-04-28 00:44:44', 'openweathermap'),
(379, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-29', 14, 29.00, 70, 34.40, 'Clouds', 'scattered clouds', 0, 0.00, '2026-04-29 03:17:28', 'openweathermap'),
(380, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-04-30', 11, 30.00, 70, 37.00, 'Clouds', 'broken clouds', 0, 0.00, '2026-04-29 03:17:29', 'openweathermap'),
(381, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-01', 11, 30.00, 70, 35.40, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-29 03:17:29', 'openweathermap'),
(382, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-02', 11, 31.00, 70, 35.80, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-29 03:17:29', 'openweathermap'),
(383, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-03', 11, 30.00, 70, 32.80, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-29 03:17:29', 'openweathermap'),
(384, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-04', 11, 30.00, 70, 33.60, 'Clouds', 'overcast clouds', 0, 0.00, '2026-04-29 03:17:29', 'openweathermap'),
(385, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-05-02', 17, 31.00, 70, 13.30, 'Rain', 'light rain', 0, 0.75, '2026-05-02 07:57:56', 'openweathermap');
INSERT INTO `weather_forecasts` (`forecast_id`, `attraction_id`, `latitude`, `longitude`, `location_name`, `forecast_date`, `forecast_hour`, `temperature`, `humidity`, `wind_speed`, `weather_condition`, `description`, `rainfall_probability`, `rainfall_amount`, `created_at`, `api_source`) VALUES
(386, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-05-03', 11, 30.00, 70, 11.40, 'Rain', 'light rain', 0, 1.03, '2026-05-02 07:57:56', 'openweathermap'),
(387, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-05-04', 11, 31.00, 70, 11.70, 'Rain', 'light rain', 0, 0.85, '2026-05-02 07:57:56', 'openweathermap'),
(388, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-05-05', 11, 30.00, 70, 10.70, 'Rain', 'light rain', 0, 0.65, '2026-05-02 07:57:56', 'openweathermap'),
(389, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-05-06', 11, 31.00, 70, 12.80, 'Clouds', 'few clouds', 0, 0.00, '2026-05-02 07:57:56', 'openweathermap'),
(390, 19, 13.31670000, 121.28300000, 'Naujan Lake National Park', '2026-05-07', 11, 30.00, 70, 11.50, 'Clouds', 'few clouds', 0, 0.00, '2026-05-02 07:57:56', 'openweathermap'),
(391, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-02', 17, 30.00, 70, 26.20, 'Rain', 'light rain', 0, 0.19, '2026-05-02 08:20:21', 'openweathermap'),
(394, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-05', 11, 29.00, 70, 35.60, 'Clear', 'clear sky', 0, 0.00, '2026-05-02 08:20:21', 'openweathermap'),
(395, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-06', 11, 30.00, 70, 31.20, 'Clouds', 'scattered clouds', 0, 0.00, '2026-05-02 08:20:21', 'openweathermap'),
(396, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-07', 11, 29.00, 70, 34.20, 'Clouds', 'scattered clouds', 0, 0.00, '2026-05-02 08:20:21', 'openweathermap'),
(397, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-02', 5, 27.00, 70, 18.80, 'Clouds', 'overcast clouds', 0, 0.00, '2026-05-02 09:17:35', 'openweathermap'),
(403, 2, 12.23800000, 121.06900000, 'Arangin Falls', '2026-05-02', 5, 26.00, 70, 9.70, 'Clouds', 'broken clouds', 0, 0.00, '2026-05-02 13:18:10', 'openweathermap'),
(404, 2, 12.23800000, 121.06900000, 'Arangin Falls', '2026-05-03', 11, 29.00, 70, 34.70, 'Rain', 'light rain', 0, 0.12, '2026-05-02 13:18:10', 'openweathermap'),
(405, 2, 12.23800000, 121.06900000, 'Arangin Falls', '2026-05-04', 11, 28.00, 70, 40.40, 'Clouds', 'broken clouds', 0, 0.00, '2026-05-02 13:18:10', 'openweathermap'),
(406, 2, 12.23800000, 121.06900000, 'Arangin Falls', '2026-05-05', 11, 28.00, 70, 39.10, 'Clear', 'clear sky', 0, 0.00, '2026-05-02 13:18:10', 'openweathermap'),
(407, 2, 12.23800000, 121.06900000, 'Arangin Falls', '2026-05-06', 11, 28.00, 70, 36.00, 'Rain', 'light rain', 0, 0.10, '2026-05-02 13:18:10', 'openweathermap'),
(408, 2, 12.23800000, 121.06900000, 'Arangin Falls', '2026-05-07', 11, 27.00, 70, 29.70, 'Clear', 'clear sky', 0, 0.00, '2026-05-02 13:18:10', 'openweathermap'),
(409, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-05-02', 5, 26.00, 70, 7.60, 'Rain', 'light rain', 0, 2.07, '2026-05-02 15:18:53', 'openweathermap'),
(410, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-05-03', 11, 31.00, 70, 11.30, 'Rain', 'light rain', 0, 1.58, '2026-05-02 15:18:53', 'openweathermap'),
(411, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-05-04', 11, 31.00, 70, 9.60, 'Rain', 'light rain', 0, 0.61, '2026-05-02 15:18:53', 'openweathermap'),
(412, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-05-05', 11, 30.00, 70, 9.50, 'Rain', 'light rain', 0, 0.93, '2026-05-02 15:18:53', 'openweathermap'),
(413, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-05-06', 11, 31.00, 70, 11.60, 'Clouds', 'broken clouds', 0, 0.00, '2026-05-02 15:18:53', 'openweathermap'),
(414, 21, 13.28330000, 121.31700000, 'Malaking Ilog Beach', '2026-05-07', 11, 31.00, 70, 9.40, 'Clear', 'clear sky', 0, 0.00, '2026-05-02 15:18:53', 'openweathermap'),
(415, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', '2026-05-02', 5, 27.00, 70, 13.20, 'Rain', 'light rain', 0, 1.75, '2026-05-02 15:20:39', 'openweathermap'),
(416, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', '2026-05-03', 11, 31.00, 70, 14.00, 'Rain', 'light rain', 0, 1.94, '2026-05-02 15:20:39', 'openweathermap'),
(417, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', '2026-05-04', 11, 30.00, 70, 10.50, 'Rain', 'light rain', 0, 0.91, '2026-05-02 15:20:39', 'openweathermap'),
(418, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', '2026-05-05', 11, 29.00, 70, 12.20, 'Rain', 'light rain', 0, 0.78, '2026-05-02 15:20:39', 'openweathermap'),
(419, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', '2026-05-06', 11, 30.00, 70, 12.30, 'Clouds', 'broken clouds', 0, 0.00, '2026-05-02 15:20:39', 'openweathermap'),
(420, 5, 13.33330000, 121.30000000, 'Simbahang Bato (Bancuro Ruins)', '2026-05-07', 11, 29.00, 70, 9.10, 'Clear', 'clear sky', 0, 0.00, '2026-05-02 15:20:39', 'openweathermap'),
(421, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-03', 5, 27.00, 70, 24.40, 'Clouds', 'broken clouds', 0, 0.00, '2026-05-03 14:29:54', 'openweathermap'),
(426, 1, 12.27100000, 121.19400000, '333 Steps (Melgar A)', '2026-05-08', 11, 30.00, 70, 33.60, 'Clear', 'clear sky', 0, 0.00, '2026-05-03 14:29:54', 'openweathermap');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `about_editable_sections`
--
ALTER TABLE `about_editable_sections`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `section_key` (`section_key`),
  ADD KEY `idx_section_key` (`section_key`);

--
-- Indexes for table `about_media`
--
ALTER TABLE `about_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_display_order` (`display_order`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_about_media_section_order` (`section_id`,`display_order`);

--
-- Indexes for table `about_settings`
--
ALTER TABLE `about_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_settings` (`id`),
  ADD KEY `idx_about_settings_id` (`id`),
  ADD KEY `idx_about_settings_updated` (`updated_at`);

--
-- Indexes for table `attractions`
--
ALTER TABLE `attractions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `poi_id` (`poi_id`),
  ADD KEY `idx_attractions_archived` (`archived`),
  ADD KEY `idx_attractions_category` (`category`),
  ADD KEY `idx_attractions_coordinates` (`latitude`,`longitude`);

--
-- Indexes for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_auth_tokens_hash` (`token_hash`),
  ADD KEY `idx_auth_tokens_user_type` (`user_id`,`token_type`),
  ADD KEY `idx_auth_tokens_expires_at` (`expires_at`);

--
-- Indexes for table `booking_receipts`
--
ALTER TABLE `booking_receipts`
  ADD PRIMARY KEY (`receipt_id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `idx_booking` (`booking_id`);

--
-- Indexes for table `business_profiles`
--
ALTER TABLE `business_profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `owner_id` (`owner_id`),
  ADD KEY `idx_owner_id` (`owner_id`),
  ADD KEY `idx_verification_status` (`verification_status`),
  ADD KEY `idx_business_profiles_verified` (`verification_status`,`created_at`);

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
-- Indexes for table `hotels`
--
ALTER TABLE `hotels`
  ADD PRIMARY KEY (`hotel_id`),
  ADD KEY `idx_hotels_archived` (`archived`);

--
-- Indexes for table `hotel_availability`
--
ALTER TABLE `hotel_availability`
  ADD PRIMARY KEY (`availability_id`),
  ADD UNIQUE KEY `uniq_hotel_date` (`hotel_id`,`availability_date`),
  ADD KEY `idx_hotel_date` (`hotel_id`,`availability_date`);

--
-- Indexes for table `hotel_bookings`
--
ALTER TABLE `hotel_bookings`
  ADD PRIMARY KEY (`booking_id`),
  ADD UNIQUE KEY `uniq_receipt_number` (`receipt_number`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_hotel_id` (`hotel_id`),
  ADD KEY `idx_booking_reference` (`booking_reference`),
  ADD KEY `idx_hotel_dates_status` (`hotel_id`,`check_in`,`check_out`,`status`),
  ADD KEY `idx_bookings_archived` (`archived`),
  ADD KEY `idx_bookings_by_room_date` (`room_id`,`check_in`,`check_out`);

--
-- Indexes for table `hotel_owners`
--
ALTER TABLE `hotel_owners`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_owner_hotel` (`user_id`,`hotel_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_hotel_id` (`hotel_id`);

--
-- Indexes for table `hotel_payments`
--
ALTER TABLE `hotel_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_booking_id` (`booking_id`),
  ADD KEY `idx_method` (`method`),
  ADD KEY `idx_provider` (`provider`),
  ADD KEY `idx_payments_archived` (`archived`);

--
-- Indexes for table `itineraries`
--
ALTER TABLE `itineraries`
  ADD PRIMARY KEY (`itinerary_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_itineraries_archived` (`archived`);

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
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_receiver` (`receiver_id`),
  ADD KEY `idx_sender` (`sender_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_read` (`is_read`);

--
-- Indexes for table `restaurants`
--
ALTER TABLE `restaurants`
  ADD PRIMARY KEY (`restaurant_id`),
  ADD KEY `idx_featured` (`featured`),
  ADD KEY `idx_municipality` (`municipality`),
  ADD KEY `idx_rating` (`rating`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`review_id`),
  ADD KEY `idx_review_poi` (`poi_id`),
  ADD KEY `idx_review_user` (`user_id`),
  ADD KEY `idx_review_hotel` (`hotel_id`),
  ADD KEY `fk_reviews_room` (`room_id`),
  ADD KEY `fk_reviews_attraction_id` (`attraction_id`),
  ADD KEY `idx_reviews_booking_id` (`booking_id`);

--
-- Indexes for table `role_changes`
--
ALTER TABLE `role_changes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_changed_by` (`changed_by`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`),
  ADD KEY `hotel_id` (`hotel_id`),
  ADD KEY `idx_hotel_active` (`hotel_id`,`is_active`),
  ADD KEY `idx_rooms_by_hotel` (`hotel_id`,`is_active`);

--
-- Indexes for table `room_inventory`
--
ALTER TABLE `room_inventory`
  ADD PRIMARY KEY (`inventory_id`),
  ADD UNIQUE KEY `unique_room_date` (`room_id`,`availability_date`),
  ADD KEY `room_id` (`room_id`),
  ADD KEY `availability_date` (`availability_date`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `translations`
--
ALTER TABLE `translations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_translation` (`original_table`,`original_id`,`field_name`,`language_id`),
  ADD KEY `lookup_index` (`original_table`,`original_id`),
  ADD KEY `language_index` (`language_id`),
  ADD KEY `approval_index` (`is_approved`);
ALTER TABLE `translations` ADD FULLTEXT KEY `search_index` (`translated_value`);

--
-- Indexes for table `translation_cache`
--
ALTER TABLE `translation_cache`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cache_key` (`cache_key`),
  ADD KEY `cache_key_index` (`cache_key`),
  ADD KEY `expiry_index` (`expires_at`);

--
-- Indexes for table `translation_fields`
--
ALTER TABLE `translation_fields`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_field` (`table_name`,`field_name`),
  ADD KEY `is_translatable_index` (`is_translatable`);

--
-- Indexes for table `translation_languages`
--
ALTER TABLE `translation_languages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `code_index` (`code`),
  ADD KEY `is_active_index` (`is_active`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_users_archived` (`archived`),
  ADD KEY `idx_users_gender` (`gender`),
  ADD KEY `idx_users_user_type` (`user_type`),
  ADD KEY `idx_users_visit_count` (`visit_count`);

--
-- Indexes for table `user_last_conversation`
--
ALTER TABLE `user_last_conversation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id_unique` (`user_id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `idx_user_last_conversation` (`user_id`,`last_updated_at`);

--
-- Indexes for table `user_weather_preferences`
--
ALTER TABLE `user_weather_preferences`
  ADD PRIMARY KEY (`preference_id`),
  ADD UNIQUE KEY `idx_user_id` (`user_id`);

--
-- Indexes for table `weather_alerts`
--
ALTER TABLE `weather_alerts`
  ADD PRIMARY KEY (`alert_id`),
  ADD KEY `idx_weather_id` (`weather_id`),
  ADD KEY `idx_severity` (`severity_level`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_expires` (`expires_at`),
  ADD KEY `idx_alerts_active` (`is_active`,`severity_level`,`expires_at`);

--
-- Indexes for table `weather_alternatives`
--
ALTER TABLE `weather_alternatives`
  ADD PRIMARY KEY (`alternative_id`),
  ADD KEY `idx_original_attraction` (`original_attraction_id`),
  ADD KEY `idx_alternative_attraction` (`alternative_attraction_id`),
  ADD KEY `idx_suitability` (`suitability_score`);

--
-- Indexes for table `weather_data`
--
ALTER TABLE `weather_data`
  ADD PRIMARY KEY (`weather_id`),
  ADD KEY `idx_attraction_id` (`attraction_id`),
  ADD KEY `idx_location` (`latitude`,`longitude`),
  ADD KEY `idx_recorded_at` (`recorded_at`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_weather_data_composite` (`attraction_id`,`recorded_at`,`weather_condition`);

--
-- Indexes for table `weather_forecasts`
--
ALTER TABLE `weather_forecasts`
  ADD PRIMARY KEY (`forecast_id`),
  ADD UNIQUE KEY `idx_forecast_unique` (`attraction_id`,`forecast_date`,`forecast_hour`),
  ADD KEY `idx_forecast_date` (`forecast_date`),
  ADD KEY `idx_location_forecast` (`latitude`,`longitude`,`forecast_date`),
  ADD KEY `idx_forecasts_composite` (`attraction_id`,`forecast_date`,`weather_condition`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `about_editable_sections`
--
ALTER TABLE `about_editable_sections`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `about_media`
--
ALTER TABLE `about_media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `about_settings`
--
ALTER TABLE `about_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `attractions`
--
ALTER TABLE `attractions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `booking_receipts`
--
ALTER TABLE `booking_receipts`
  MODIFY `receipt_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `business_profiles`
--
ALTER TABLE `business_profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chatbot_conversations`
--
ALTER TABLE `chatbot_conversations`
  MODIFY `conversation_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `chatbot_messages`
--
ALTER TABLE `chatbot_messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=254;

--
-- AUTO_INCREMENT for table `hotels`
--
ALTER TABLE `hotels`
  MODIFY `hotel_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `hotel_availability`
--
ALTER TABLE `hotel_availability`
  MODIFY `availability_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `hotel_bookings`
--
ALTER TABLE `hotel_bookings`
  MODIFY `booking_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `hotel_owners`
--
ALTER TABLE `hotel_owners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `hotel_payments`
--
ALTER TABLE `hotel_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=96;

--
-- AUTO_INCREMENT for table `itineraries`
--
ALTER TABLE `itineraries`
  MODIFY `itinerary_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `itinerary_attractions`
--
ALTER TABLE `itinerary_attractions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `map_routes`
--
ALTER TABLE `map_routes`
  MODIFY `route_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `restaurants`
--
ALTER TABLE `restaurants`
  MODIFY `restaurant_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `review_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `role_changes`
--
ALTER TABLE `role_changes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `room_inventory`
--
ALTER TABLE `room_inventory`
  MODIFY `inventory_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `translations`
--
ALTER TABLE `translations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=523;

--
-- AUTO_INCREMENT for table `translation_cache`
--
ALTER TABLE `translation_cache`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `translation_fields`
--
ALTER TABLE `translation_fields`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `translation_languages`
--
ALTER TABLE `translation_languages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `user_last_conversation`
--
ALTER TABLE `user_last_conversation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=187;

--
-- AUTO_INCREMENT for table `user_weather_preferences`
--
ALTER TABLE `user_weather_preferences`
  MODIFY `preference_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `weather_alerts`
--
ALTER TABLE `weather_alerts`
  MODIFY `alert_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT for table `weather_alternatives`
--
ALTER TABLE `weather_alternatives`
  MODIFY `alternative_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `weather_data`
--
ALTER TABLE `weather_data`
  MODIFY `weather_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1754;

--
-- AUTO_INCREMENT for table `weather_forecasts`
--
ALTER TABLE `weather_forecasts`
  MODIFY `forecast_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=427;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `auth_tokens`
--
ALTER TABLE `auth_tokens`
  ADD CONSTRAINT `fk_auth_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `business_profiles`
--
ALTER TABLE `business_profiles`
  ADD CONSTRAINT `business_profiles_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `hotel_bookings`
--
ALTER TABLE `hotel_bookings`
  ADD CONSTRAINT `fk_hotel_bookings_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE SET NULL;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_attraction_id` FOREIGN KEY (`attraction_id`) REFERENCES `attractions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reviews_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `hotel_bookings` (`booking_id`) ON DELETE SET NULL;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `rooms_ibfk_1` FOREIGN KEY (`hotel_id`) REFERENCES `hotels` (`hotel_id`) ON DELETE CASCADE;

--
-- Constraints for table `room_inventory`
--
ALTER TABLE `room_inventory`
  ADD CONSTRAINT `room_inventory_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`) ON DELETE CASCADE;

--
-- Constraints for table `translations`
--
ALTER TABLE `translations`
  ADD CONSTRAINT `fk_language` FOREIGN KEY (`language_id`) REFERENCES `translation_languages` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
