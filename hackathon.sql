-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Хост: localhost:8889
-- Время создания: Авг 06 2026 г., 21:03
-- Версия сервера: 8.0.44
-- Версия PHP: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `hackathon`
--

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password_hash` varchar(128) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password_hash`, `created_at`) VALUES
('U-mshz3d2b', 'n4msin@mail.ru', 'Yera', 'd7ae605d743441665f63d737c12ff1b1a83d8bc70b499b135b0334adf0737c58', '2026-08-06 20:33:03');

-- --------------------------------------------------------

--
-- Структура таблицы `vessels`
--

CREATE TABLE `vessels` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cargo_type` enum('Oil','Grain','Container') NOT NULL,
  `draft` decimal(6,2) NOT NULL,
  `eta_min` int NOT NULL,
  `cargo_tons` int NOT NULL,
  `lat` double NOT NULL,
  `lon` double NOT NULL,
  `preferred_berth` varchar(32) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Дамп данных таблицы `vessels`
--

INSERT INTO `vessels` (`id`, `user_id`, `name`, `cargo_type`, `draft`, `eta_min`, `cargo_tons`, `lat`, `lon`, `preferred_berth`, `created_at`) VALUES
('V-demo-mshz6gj2-0', 'U-mshz3d2b', 'MT Caspian Star', 'Oil', 6.80, 30, 4200, 43.6125, 51.195, 'B1', '2026-08-06 20:35:28'),
('V-demo-mshz6gj2-1', 'U-mshz3d2b', 'MV Aktau Grain', 'Grain', 6.10, 55, 3100, 43.618, 51.202, 'B3', '2026-08-06 20:35:28'),
('V-demo-mshz6gj2-2', 'U-mshz3d2b', 'MSC Mangystau', 'Container', 5.90, 80, 2800, 43.5905, 51.1985, 'B4', '2026-08-06 20:35:28'),
('V-demo-mshz6gj2-3', 'U-mshz3d2b', 'MT Tengiz Spirit', 'Oil', 6.90, 110, 5100, 43.622, 51.188, 'B2', '2026-08-06 20:35:28'),
('V-demo-mshz6gj2-4', 'U-mshz3d2b', 'MV Steppe Harvest', 'Grain', 5.40, 140, 2600, 43.585, 51.206, 'B5', '2026-08-06 20:35:28'),
('V-demo-mshz6gj2-5', 'U-mshz3d2b', 'Caspian Boxer', 'Container', 5.80, 165, 1900, 43.607, 51.184, 'B4', '2026-08-06 20:35:28');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `vessels`
--
ALTER TABLE `vessels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vessels_user` (`user_id`);

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `vessels`
--
ALTER TABLE `vessels`
  ADD CONSTRAINT `fk_vessels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
