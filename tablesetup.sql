CREATE TABLE IF NOT EXISTS users (
    userEmail VARCHAR(256) PRIMARY KEY,
    userPassword VARCHAR(256) NOT NULL,
    userFullName VARCHAR(256) NOT NULL,
    userSalt VARCHAR(128) NOT NULL);

CREATE TABLE IF NOT EXISTS messages (
    messageID INT PRIMARY KEY,
    messageSubject VARCHAR(256),
    messageBody TEXT NOT NULL,
    messageDate DATETIME NOT NULL,
    messageAuthorEmail INT NOT NULL);

CREATE TABLE IF NOT EXISTS placeholders (
    placeholderID INT PRIMARY KEY,
    placeholderName VARCHAR(100) );

CREATE TABLE IF NOT EXISTS user_has_messages (
    messageID INT,
    userEmail VARCHAR(256),
    placeholderID INT,
    isRead Bool NOT NULL DEFAULT FALSE,
    FOREIGN KEY (messageID) REFERENCES messages(messageID),
    FOREIGN KEY (userEmail) REFERENCES users(userEmail),
    FOREIGN KEY (placeholderID) REFERENCES placeholders(placeholderID) );
