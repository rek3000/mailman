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

  let content = await fs.readFile("./setup.sql", { encoding: "utf8" });
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

  let tb = "users";
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
    } catch (err){
      continue;
    }
  } 

  const messages = [
    {messageID: crypto.randomUUID(), messageSubject: "Long time no see!",
      messageBody: `Hi Ash,

I hope this email finds you well!

I know it's been a while since we've talked, but I wanted to reach out and see how you're doing. I've been thinking about you a lot lately, and I miss our chats and hangouts.

I've been keeping busy with semester. I've also been trying to learn coding.

I'd love to hear what you've been up to as well. What are you working on these days? Have you taken any fun trips or learned any new skills?

I'm free this Sunday if you'd like to grab coffee or catch up for dinner. Let me know what works for you!

In the meantime, I hope you have a great week.

Talk to you soon,
Beta`,
      messageDate: new Date(),
      messageAuthorEmail: "b@b.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Quick question",
      messageBody: `Hi Ash,

I hope this email finds you well.

I just had a quick question for you. I'm working on a Software Project, and I was wondering if you had any experience with Linux system.

If you do, I'd really appreciate your insights. Any advice or suggestions you have would be helpful.

Thanks in advance for your help!

Best,
Creatine`,
      messageDate: new Date(),
      messageAuthorEmail: "c@c.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Just a thought",
      messageBody: `Hi Creatine,

I hope this email finds you well.

I was just thinking about Linux Kernel Development the other day, and I remembered something you said about it a while back. It got me thinking about it from a different perspective, and I wanted to share my thoughts with you.
~~ some thought text ~~

I'm curious to hear your thoughts on this as well. Let me know what you think!

Talk to you soon,
Ash`,
      messageDate: new Date(),
      messageAuthorEmail: "a@a.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Checking in",
      messageBody: `Hi Beta,

I hope this email finds you well.

I know we've both been busy lately, so I just wanted to check in and see how you're doing. I've been thinking about you, and I hope you're doing well.

Let me know if there's anything I can do to help. I'm always here for you.

Talk to you soon,
Ash`,
      messageDate: new Date(),
      messageAuthorEmail: "a@a.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Congratulations!",
      messageBody: `Hi Beta,

I just heard the great news about your Award on Computer Science, and I wanted to congratulate you!

I'm so proud of you for all your hard work and dedication. You deserve all the success in the world.

I'm so excited to see what you do next!

Best regards,
Creatine`,
      messageDate: new Date(),
      messageAuthorEmail: "c@c.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Need a favor",
      messageBody: `Hi Ash,

I hope this email finds you well.

I'm writing to you today because I could really use your help with solving some problem in CS102 class. I know you're really good at Assembly, and I was hoping you could lend me your expertise.

If you're able to help, I would be incredibly grateful. Please let me know if you're interested.

Thanks for your time and consideration.

Best,
Creatine`,
      messageDate: new Date(),
      messageAuthorEmail: "c@c.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Thoughtful gesture",
      messageBody: `Hi Beta,
I just wanted to take a moment to express my gratitude for your recent gesture of kindness. Thank you for helping me out on my broken car!

Your thoughtfulness really made my day, and it means the world to me to have a friend like you.

Thank you again for being such a wonderful friend.

Sincerely,
Creatine`,
      messageDate: new Date(),
      messageAuthorEmail: "c@c.com"
    },
    {messageID: crypto.randomUUID(), messageSubject: "Reminder of SAD Deadline",
      messageBody: `Hi Creatine,

I hope this email finds you well.

I'm writing to you today to remind you about incomming SAD Deadline on 22/12/2023. I know you've been busy lately, so I wanted to make sure you didn't forget.

Please let me know if you have any questions.

Best regards,
Beta`,
      messageDate: new Date(),
      messageAuthorEmail: "b@b.com"
    },
  ];

  // placeholderID 1 = inbox && 2 = outbox
  const user_has_messages = [
    {messageID: messages[0]["messageID"], userEmail: "a@a.com", placeholderID: "1", isRead: false},
    {messageID: messages[0]["messageID"], userEmail: "b@b.com", placeholderID: "2", isRead: true},

    {messageID: messages[1]["messageID"], userEmail: "a@a.com", placeholderID: "1", isRead: false},
    {messageID: messages[1]["messageID"], userEmail: "c@c.com", placeholderID: "2", isRead: true},

    {messageID: messages[2]["messageID"], userEmail: "c@c.com", placeholderID: "1", isRead: false},
    {messageID: messages[2]["messageID"], userEmail: "a@a.com", placeholderID: "2", isRead: true},

    {messageID: messages[3]["messageID"], userEmail: "b@b.com", placeholderID: "1", isRead: false},
    {messageID: messages[3]["messageID"], userEmail: "a@a.com", placeholderID: "2", isRead: true},

    {messageID: messages[3]["messageID"], userEmail: "b@b.com", placeholderID: "1", isRead: false},
    {messageID: messages[3]["messageID"], userEmail: "a@a.com", placeholderID: "2", isRead: true},

    {messageID: messages[4]["messageID"], userEmail: "b@b.com", placeholderID: "1", isRead: false},
    {messageID: messages[4]["messageID"], userEmail: "c@c.com", placeholderID: "2", isRead: true},

    {messageID: messages[4]["messageID"], userEmail: "b@b.com", placeholderID: "1", isRead: false},
    {messageID: messages[4]["messageID"], userEmail: "c@c.com", placeholderID: "2", isRead: true},

    {messageID: messages[5]["messageID"], userEmail: "a@a.com", placeholderID: "1", isRead: false},
    {messageID: messages[5]["messageID"], userEmail: "c@c.com", placeholderID: "2", isRead: true},

    {messageID: messages[6]["messageID"], userEmail: "b@b.com", placeholderID: "1", isRead: false},
    {messageID: messages[6]["messageID"], userEmail: "c@c.com", placeholderID: "2", isRead: true},

    {messageID: messages[7]["messageID"], userEmail: "c@c.com", placeholderID: "1", isRead: false},
    {messageID: messages[7]["messageID"], userEmail: "b@b.com", placeholderID: "2", isRead: true},
  ];

  // console.log(JSON.stringify(messages, null, 2));
  // console.log(JSON.stringify(user_has_messages, null, 2));
  tb = "messages";
  for (let i = 0; i < messages.length; i++) {
    try {
      const sql = "INSERT INTO ?? VALUES(?, ?, ?, ?, ?)";
      const rs = await conn.query(sql, [
        tb,
        messages[i]["messageID"],
        messages[i]["messageSubject"],
        messages[i]["messageBody"],
        messages[i]["messageDate"],
        messages[i]["messageAuthorEmail"],
      ]);
    } catch (err){
      console.log(err);
      continue;
    }
  }
  tb = "user_has_messages";
  for (let i = 0; i < user_has_messages.length; i++) {
    try {
      const sql = "INSERT INTO ?? VALUES(?, ?, ?, ?)";
      const rs = await conn.query(sql, [
        tb,
        user_has_messages[i]["messageID"],
        user_has_messages[i]["userEmail"],
        user_has_messages[i]["placeholderID"],
        user_has_messages[i]["isRead"],
      ]);
    } catch (err){
      console.log(err);
      continue;
    }
  }
  console.log("CREATE tables and INSERT data successfully");
  console.log("Here is the users information:");
  console.log(JSON.stringify(users, null ,2));
  conn.end();
})();
return;
