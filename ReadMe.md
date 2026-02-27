Database Creation
Mysql
   CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'owner', 'user') NOT NULL
);