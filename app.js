"use strict";
// CommonJS Modules
const crypto = require("crypto");
const express = require("express");
require("dotenv").config();
const multer = require("multer");
const mysql = require("mysql2/promise");
const cookieParser = require("cookie-parser");
const system = require("./src/controllers/system");
const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.json());
app.use(multer().none());
app.use(express.static(__dirname + "/public"));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Sever-side error!");
});

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

/* Handle requests */
/* AUTHORIZATION
 * > Register Email Account with password encrypted
 * > Login to Email System using Cookie to remember session
 * */
// Home Page
app.get("/", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  return res.redirect("inbox");
});

app.post("/", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  console.log("User logout: ");
  console.log(JSON.stringify(req.cookies.auth, null, 2));
  res.clearCookie("auth");

  // destroy session data
  req.session = null;
  return res.redirect("/login");
});

// Log-in page
app.get("/login", async (req, res) => {
  if (req.cookies.auth) {
    return res.redirect("/inbox");
  } else {
    return res.render("login");
  }
});
app.post("/login", async (req, res) => {
  const tb = "users";
  const userEmail = req.body.email;
  // Use hash to encrypt the password with a random salt number
  const userPassword = req.body.passwd;
  let respondData = {
    userEmail: userEmail,
    emailError: "",
    passwordError: "",
  };

  let userInfo = {};
  if (userEmail === undefined || userEmail === "") {
    respondData["emailError"] = "Email cannot be emptied";
    return res.render("login", respondData);
  } else {
    const user = await system.get_user(userEmail);
    if (!(user.length > 0)) {
        respondData["emailError"] = "Email Account is not existed";
        return res.render("login", respondData);
    } else if (user === -1) {
        return res.status(500).send("Server fault.");
    } else {
      userInfo = user[0];
    }
  }

  if (userPassword === undefined || userPassword === "") {
    respondData["passwordError"] = "You must enter the password";
    return res.render("login", respondData);
  }

  try {
    const hashedPassword = crypto
      .pbkdf2Sync(userPassword, userInfo.userSalt, 20, 64, "sha256")
      .toString("hex");
    if (hashedPassword === userInfo.userPassword) {
      res.cookie(
        "auth",
        { userEmail, hashedPassword },
        {
          maxAge: 5000000,
        },
      );
      return res.redirect("/");
    } else {
      respondData["passwordError"] =
        "Password does not match with account in Mail Man";
      return res.render("login", respondData);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send("User cannot login");
  }
});

// Sign-up page
app.get("/register", async (req, res) => {
  if (req.cookies.auth) {
    return res.redirect("/");
  }
  res.render("register");
});

app.post("/register", async (req, res) => {
  if (req.cookies.auth) {
    return res.redirect("/");
  }
  const tb = "users";
  const userEmail = req.body.email;
  const userFullName = req.body.fullname;
  // Use hash to encrypt the password with a random salt number
  const userPassword = req.body.passwd;
  const userRePassword = req.body.repasswd;
  const userSalt = crypto.randomBytes(16).toString("hex");
  const hashedPassword = crypto
    .pbkdf2Sync(userPassword, userSalt, 20, 64, "sha256")
    .toString("hex");

  // Register Information
  let userInfo = {
    userEmail: userEmail,
    userPassword: hashedPassword,
    userFullName: userFullName,
    userSalt: userSalt,
    emailError: "",
    passwordError: "",
    passwordReEnterError: "",
  };
  let valid = true;
  if (userEmail === undefined || userEmail === "") {
    valid = false;
    userInfo["emailError"] = "Email cannot be emptied";
    return res.render('register', userInfo);
  } else {
    let user = await system.get_user(userEmail);
    if (user["userEmail"] === userEmail) {
      console.log('user')
      valid = false;
      userInfo["emailError"] = "Email account existed";
      return res.render('register', userInfo);
    }
  }

  if (userPassword === undefined || userPassword === "") {
    valid = false;
    userInfo["passwordError"] = "Password cannot be emptied";
    return res.render('register', userInfo);
  } else if (userPassword.length < 6) {
    valid = false;
    userInfo["passwordError"] = "Password is too short (must be equal or greater than 6 characters)";
  } else if (userPassword != userRePassword) {
    valid = false;
    userInfo["passwordReEnterError"] = "You must re-enter the same password";
  }

  if (valid) {
    const user = await system.insert_user(userInfo);
    if (user === -1) {
      res.status(500).send("User cannot register");
    }
    return res.render("redirect");
  } else {
    return res.render("register", userInfo);
  }
});

// Inbox page
app.get("/inbox", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  return res.redirect("/inbox/1");
});

app.get("/inbox/:page", async (req,res) =>{
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  const limit = 5;
  const page = parseInt(req.params.page) || 1;
  const offset = (page - 1) * limit;
  const pagination = {limit: limit, offset: offset}
  let messages = await system.get_email_list(req.cookies.auth.userEmail, 1, pagination);
  let total_messages_number = await system.get_total_messages(req.cookies.auth.userEmail, 1)
  let totalPages = Math.ceil(total_messages_number / limit);
  if (total_messages_number < 5) {
    totalPages = 1;
  }
  return res.render("inbox", {"userEmail" : req.cookies.auth.userEmail,
                              "messages": messages,
                              "currentPage": page,
                              "totalPages": totalPages});
});

async function delete_messages_from_user(messageID, placeholderID) {
  const sql = `DELETE FROM ?? 
    WHERE ?? = ? 
    AND ?? = ?`;
  const tb = "user_has_messages";
  let deleted = [];
  try {
    [deleted] = await conn.query(sql,
    [tb, "messageID", messageID, "placeholderID", placeholderID]);
  } catch (err) {
    console.log(err);
    return -1;
  }
  return deleted[0];

}

// Delete only email rows in table 'user_has_messages'
app.post("/delete", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  const messageIDs = req.body.messageIDs;
  const placeholder = req.body.placeholder;
  console.log(messageIDs);
  console.log(placeholder);

  if (placeholder === 'inbox') {
    for (const messageID of messageIDs) {
      delete_messages_from_user(messageID, 1);
    }
  } else if (placeholder === 'outbox') {
    for (const messageID of messageIDs) {
      delete_messages_from_user(messageID, 2);
    }
  }
  res.json({ message: 'Email deleted successfully' });
});

app.get("/inbox/:page/:id", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  const id = req.params.id;
  let detail = (await system.get_email_detail(id, 1))[0];
  const messageBodyLines = detail["messageBody"].split("\n")
  detail["messageBody"] = messageBodyLines;
  const messageAuthorFullName = await system.get_full_name(detail["messageAuthorEmail"]);
  const messageRecipientFullName = await system.get_full_name(req.cookies.auth.userEmail);
  detail["messageRecipientFullName"] = messageRecipientFullName[0]["userFullName"];
  detail["messageAuthorFullName"] = messageAuthorFullName[0]["userFullName"];
  console.log(JSON.stringify(detail, null, 2));
  await system.change_read_status(req.cookies.auth.userEmail, id)
  return res.render("detail", {"userEmail": req.cookies.auth.userEmail,
                               "detail": detail,
                               "currentPage": req.params.page});
});

app.get("/outbox", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/");
  }
  return res.redirect("outbox/1");
});

app.get("/outbox/:page", async (req, res) =>{
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  const limit = 5;
  const page = parseInt(req.params.page) || 1;
  const offset = (page - 1) * limit;
  const pagination = {limit: limit, offset: offset}
  let messages = await system.get_email_list(req.cookies.auth["userEmail"], 2, pagination);
  const userFullName = await system.get_full_name(req.cookies.auth.userEmail)["userFullName"];
  const total_messages_number = await system.get_total_messages(req.cookies.auth.userEmail, 2)
  let totalPages = Math.ceil(total_messages_number / limit);
  if (total_messages_number < 5) {
    totalPages = 1;
  }
  return res.render("outbox", {"userEmail" : req.cookies.auth.userEmail,
                              "userFullName": userFullName,
                              "messages": messages,
                              "currentPage": page,
                              "totalPages": totalPages});
});

app.get("/outbox/:page/:id", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/login");
  }
  const id = req.params.id;
  let detail = (await system.get_email_detail(id, 1))[0];
  const messageRecipientFullName = await system.get_full_name(detail["messageRecipient"]);
  const messageAuthorFullName = await system.get_full_name(req.cookies.auth.userEmail);
  detail["messageRecipientFullName"] = messageRecipientFullName[0]["userFullName"];
  detail["messageAuthorFullName"] = messageAuthorFullName[0]["userFullName"];
  let messageBodyLines = detail["messageBody"].split("\n");
  detail["messageBody"] = messageBodyLines;
  if (detail["messageSubject"] === "") {
    detail["messageSubject"] = "<no subject>";
  }
  console.log(JSON.stringify(detail, null ,2));
  return res.render("detail", {"userEmail": req.cookies.auth.userEmail,
                               "detail": detail,
                               "currentPage": req.params.page});
});

app.get("/compose", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/");
  }
  const tb = "users";
  let messageRecipients;
  try {
    const sql = `SELECT ?? FROM ?? WHERE ?? != ?`; 
    messageRecipients = (await conn.query(sql, ["userEmail", tb, "userEmail", req.cookies.auth.userEmail]))[0];
  } catch (err) {
    console.log(err);
  }
  console.log(messageRecipients)
  return res.render("compose", {"userEmail": req.cookies.auth.userEmail,
                                "messageRecipients": messageRecipients});
});


app.post("/compose", async (req, res) => {
  if (!req.cookies.auth) {
    return res.redirect("/");
  }
  let success = true;
  let messageInfo = {
    messageID: crypto.randomUUID(),
    messageRecipient: req.body.messageRecipient,
    messageSubject: req.body.messageSubject,
    messageBody: req.body.messageBody,
    messageDate: new Date(),
    messageAuthorEmail: req.cookies.auth.userEmail,
    messageRecipientError: ""
  };

  const tb = "users";
  let messageRecipients;
  try {
    const sql = `SELECT ?? FROM ??`; 
    messageRecipients = (await conn.query(sql, ["userEmail", tb]))[0];
  } catch (err) {
    console.log(err);
  }
  if (messageInfo["messageRecipient"] === undefined || messageInfo["messageRecipient"] === "" || messageInfo["messageRecipient"] === "select") {
    messageInfo["messageRecipientError"] = "An recipient must be selected.";
    success = false;
  }

  if (!success) {
    return res.render("compose", {"userEmail": req.cookies.auth.userEmail,
      "messageRecipientError": messageInfo["messageRecipientError"],
      "messageRecipients": messageRecipients
    });
  } else if (success) {
    console.log(JSON.stringify(messageInfo, null, 2));
    await system.insert_email(messageInfo);
    return res.render("compose", {"userEmail": req.cookies.auth.userEmail,
      "composeStatus": "Email sent successfully",
      "messageRecipients": messageRecipients});
  }
});


// END ROUTING 
app.use(express.static("public"));
let appServer = app.listen(8000);


// gratefully closing
process.on("SIGTERM", () => {
  console.log("SIGTERM singale received.");
  console.log("Closing DB Connection...");
  conn.end(function (err) {
    console.log("DB Connection has been closed.");
  });
  console.log("Closing HTTP server and stop receiving requests...");
  appServer.close();
  console.log("Goodbye!");
  process.exit(0);
})
