const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const crypto = require("crypto");
require("dotenv").config();

let conn = null;
(async function () {
  conn = await mysql.createConnection({
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE,
    host: process.env.HOST,
    port: process.env.PORT,
  });

  let content = await fs.readFile("./tablesetup.sql", { encoding: "utf8" });
  let lines = [];
  if (process.platform === "win32") {
    // line seperators in Windows
    lines = content.split("\r\n");
  } else {
    // line seperators in Linux
    lines = content.split("\n");
  }
  console.log(
    "NOTICE: If this script does not works on Windows, please copy the content of the setup.sql\nand paste it on a Windows text editor then save it and re-run this script.");

  let tmp = "";
  for (let line of lines) {
    line = line.trim();
    tmp += line + "\r\n";
    if (line.endsWith(";")) {
      await conn.execute(tmp);
      tmp = "";
    }
  }

  // INSERT DEFAULT DATA
  let users = [
    {
      userEmail: "a@a.com",
      userPassword: "123456",
      userFullName: "Ash Apple",
      userSalt: "",
    },
    {
      userEmail: "b@b.com",
      userPassword: "abcxyz",
      userFullName: "Beta Bean",
      userSalt: "",
    },
    {
      userEmail: "c@c.com",
      userPassword: "forbidden@123",
      userFullName: "Creatine Crit",
      userSalt: "",
    },
  ];
  const tb = "users";
  //
  for (let i = 0; i < 3; i++) {
    const userEmail = users[i]["userEmail"];
    const userFullName = users[i]["userFullName"];
    // Use hash to encrypt the password with a random salt number
    const userPassword = users[i]["userPassword"];
    const userSalt = crypto.randomBytes(16).toString("hex");
    users[i]["userSalt"] = userSalt;
    const hashedPassword = crypto
      .pbkdf2Sync(userPassword, userSalt, 20, 64, "sha256")
      .toString("hex");

    try {
      const sql = "INSERT INTO ?? VALUES(?, ?, ?, ?)";
      const rs = await conn.query(sql, [
        tb,
        userEmail,
        hashedPassword,
        userFullName,
        userSalt,
      ]);
      // let row = rs[0][0];
      //
      // console.log("User Registered:");
      // console.log(JSON.stringify(row, null, 2));

      conn.end();
    } catch (err){
      continue;
    }
  } 
  console.log("CREATE tables and INSERT data successfully");
  console.log("Here is the users information:");
  console.log(JSON.stringify(users, null ,2));
})();
return;
