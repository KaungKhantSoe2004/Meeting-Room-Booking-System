Meeting Room Booking System

Backend for  meeting room booking application featuring role-based access control, overlap validation, and a seamless user experience.

Live Demo

Frontend (Vercel): https://fend-meeting-room-booking-system.vercel.app/

Tech Stack

Node.js and Express

TypeScript

MySQL (using mysql2 driver)

Role-Based Authorization Middleware

Features

Multi-Role System: Supports User, Admin, and Owner roles.

Role-Based Routing: Access to specific CRUD operations is restricted based on the user's role.

Booking Overlap Validation: Prevents double-booking of rooms, handled entirely on the backend.

User Selection: Persistence of user sessions using localStorage.

Database Schema

Users Table
CREATE TABLE users (
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(150) NOT NULL,
role ENUM('admin', 'owner', 'user') NOT NULL
);

Bookings Table
CREATE TABLE bookings (
id INT AUTO_INCREMENT PRIMARY KEY,
userId INT NOT NULL,
startTime DATETIME NOT NULL,
endTime DATETIME NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Installation and Setup

Backend Setup

Clone the repository:
git clone https://github.com/KaungKhantSoe2004/Meeting-Room-Booking-System

Install dependencies:
npm install

Configure your Environment Variables (.env file):
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
Run the development server:
npm run dev

