const mysql = require("mysql2/promise");

let conn = null;
(async function () {
  conn = await mysql.createConnection({
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE,
    host: process.env.HOST,
    port: process.env.PORT,
  });
})();

exports.get_user = async (userEmail) => {
  const tb = "users";
  const sql = "SELECT * FROM ?? WHERE ?? = ?";
  try {
    const [user] = (await conn.query(sql, [tb, "userEmail", userEmail]));
    return user;
  } catch (err) {
    console.log(err);
    return -1
  }
}

exports.insert_user = async (userInfo) => {
  try {
    const tb = "users";
    const sql = "INSERT INTO ?? VALUES(?, ?, ?, ?)";
    const [user] = await conn.query(sql, [
      tb,
      userInfo["userEmail"],
      userInfo["userPassword"],
      userInfo["userFullName"],
      userInfo["userSalt"],
    ]);
    console.log("User Registered:");
    console.log(JSON.stringify(userInfo, null, 2));
    return user;
  } catch (err) {
    console.log(err);
    // res.status(500).send("User cannot register");
    return -1;
  }
};
exports.change_read_status = async (userEmail, messageID) => {
  const tb = "user_has_messages";
  const sql = `UPDATE ??
  SET ?? = ?
  WHERE ?? = ?
  AND ?? = ?
    `;
  let updated = [];
  try {
    [updated] = await conn.query(sql,
    [tb, "isRead", true, "messageID", messageID, "userEmail", userEmail]);
  } catch (err) {
    console.log(err);
    return -1;
  }
}

exports.get_email_detail = async (messageID, placeholderID) => {
  const sql = `SELECT messages.messageID, messageSubject, messageBody, 
messageDate, messageAuthorEmail, user_has_messages.userEmail as messageRecipient 
FROM ??
INNER JOIN ??
ON ?? = user_has_messages.messageID
WHERE ?? = ? AND ?? = ?`;
  const tb1 = "messages";
  const tb2 = "user_has_messages";
  let message = [];
  try {
    [message] = await conn.query(sql, 
      [tb1, tb2,  "messages.messageID",
        "placeholderID", placeholderID,
        "user_has_messages.messageID", messageID]);
  } catch (err) {
    console.log(err);
    return -1
  }
    return message 
}

exports.insert_email = async (messageInfo) => {
  const sql1 = `INSERT INTO ?? 
  VALUES(?, ?, ?, ?, ?)`;
  const sql2 = `INSERT INTO ?? 
  VALUES(?, ?, ?, ?)`;
  const tb1 = "messages";
  const tb2 = "user_has_messages";

  try {
    const [message] = await conn.query(sql1, 
      [tb1, messageInfo["messageID"],
            messageInfo["messageSubject"],
            messageInfo["messageBody"],
            messageInfo["messageDate"],
            messageInfo["messageAuthorEmail"]]);

    // Sender insert
    const [sender] = await conn.query(sql2, 
      [tb2, messageInfo["messageID"],
            messageInfo["messageAuthorEmail"],
            "2",
            true]);
    // Receiver insert
    const [receiver] = await conn.query(sql2, 
      [tb2, messageInfo["messageID"],
            messageInfo["messageRecipient"],
            "1",
            false]);
    console.log("New message created")
    console.log(JSON.stringify(message[0], null, 2));
  } catch (err) {
    console.log(err);
    return -1;
  }
    return;
} 

exports.get_full_name = async (userEmail) => {
  const tb = 'users';
  const sql = `SELECT userFullName FROM ?? WHERE ?? = ?`;
  let fullname = [];
  try {
    [fullname] = await conn.query(sql, 
      [tb, "userEmail", userEmail]);
  } catch (err) {
    console.log(err);
    return -1
  }
    return fullname;
}

exports.get_total_messages = async (userEmail, placeholderID) => {
  const sql = `SELECT COUNT(*) FROM ??
WHERE ?? = ? AND ?? = ?`;
  const tb = "user_has_messages";
  let count = []
  try {
    [count] = await conn.query(sql,
    [tb, "userEmail", userEmail, "placeholderID", placeholderID]);
  } catch (err) {
    console.log(err);
    return -1;
  }
  return count[0]['COUNT(*)'];
}

exports.get_email_list = async (userEmail, placeholderID, pagination) => {
  const sql = `SELECT messages.messageID, messages.messageSubject, 
messages.messageDate, messages.messageAuthorEmail, users.userFullName as messageAuthorFullName, user_has_messages.isRead as isRead,
user_has_messages.placeholderID 
FROM ??
INNER JOIN user_has_messages 
ON user_has_messages.messageID  = messages.messageID 
INNER JOIN users 
ON messages.messageAuthorEmail = users.userEmail
WHERE ?? = ? AND ?? = ?
LIMIT ? OFFSET ?`;
  const tb = "messages";
  let messages = [];
  try {
    [messages] = await conn.query(sql, 
      [tb, "user_has_messages.placeholderID", placeholderID, "user_has_messages.userEmail", userEmail, pagination["limit"], pagination["offset"]]);

  } catch (err) {
    console.log(err);
    return -1
  }
    return messages
}
