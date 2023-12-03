const mysql = require("mysql2/promise");
const fs = require("fs").promises;
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

  let content = await fs.readFile("./setup.sql", { encoding: "utf8" });
  let lines = [];
  if (process.platform === "win32") {
    // Split line in Windows
    lines = content.split("\r\n");
  } else {
    // Split line in Linux
    lines = content.split("\n");
  }
  console.log(
    "NOTICE: If this script do not works on Windows, please copy the content of the setup.sql\nand paste it on a Windows text editor then save it and re-run this script.",
  );

  let tmp = "";
  for (let line of lines) {
    line = line.trim();
    tmp += line + "\r\n";
    if (line.endsWith(";")) {
      await conn.execute(tmp);
      tmp = "";
    }
  }
  conn.end();
})();
