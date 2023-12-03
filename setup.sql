CREATE TABLE IF NOT EXISTS users (
    userEmail VARCHAR(256) PRIMARY KEY,
    userPassword VARCHAR(128) NOT NULL,
    userFullName VARCHAR(256) NOT NULL,
    userSalt VARCHAR(32) NOT NULL);

CREATE TABLE IF NOT EXISTS messages (
   	messageID VARCHAR(36) PRIMARY KEY, 
    messageSubject VARCHAR(256),
    messageBody TEXT NOT NULL,
    messageDate DATETIME NOT NULL,
    messageAuthorEmail VARCHAR(256) NOT NULL);

CREATE TABLE IF NOT EXISTS placeholders (
    placeholderID INT PRIMARY KEY,
    placeholderName VARCHAR(100) );

INSERT INTO placeholders  (placeholderID, placeholderName)
VALUES
(1, "inbox"),
(2, "outbox");


CREATE TABLE IF NOT EXISTS user_has_messages (
   	messageID VARCHAR(36), 
    userEmail VARCHAR(256),
    placeholderID INT,
    isRead Bool NOT NULL DEFAULT FALSE,
    FOREIGN KEY (messageID) REFERENCES messages(messageID),
    FOREIGN KEY (userEmail) REFERENCES users(userEmail),
    FOREIGN KEY (placeholderID) REFERENCES placeholders(placeholderID) );
