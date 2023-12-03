"use strict";
// CommonJS Modules
const crypto = require('crypto');
const express = require("express");
require('dotenv').config();
const multer = require("multer");
const fs = require("fs").promises;
const mysql = require("mysql2/promise");
const cookieParser = require('cookie-parser');
const app = express();

// Middlewares
app.use(cookieParser());
app.use(express.urlencoded( { extended: true }));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(multer().none());
app.use(express.static(__dirname + '/public'));
app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).send("Sever-side error!");
});

let conn = null;
(async function (){
    conn = await mysql.createConnection({
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DATABASE,
        host: process.env.HOST,
        port: process.env.PORT,
    })
}) ();

/* Handle requests */
/* AUTHORIZATION 
 * > Register Email Account with password encrypted 
 * > Login to Email System using Cookie to remember session 
 * */
// Home Page
// TODO Redirect to the login page if there is no cookie sent from client
app.get("/", async (req, res, next) =>{
    if (!req.cookies.auth) {
        return res.redirect('/login');
    }
    console.log("User login: ");
    console.log(JSON.stringify(req.cookies.auth, null, 2));
    res.render("index", req.cookies.auth);
});

app.post("/", async (req, res, next) =>{
    if (!req.cookies.auth) {
        res.redirect('/login');
    }
    console.log("User logout: ");
    console.log(JSON.stringify(req.cookies.auth, null, 2));
    res.clearCookie("auth");

    // destroy session data
    req.session = null;
    res.redirect('/login');
});

// Log-in page
app.get("/login", async (req, res) => {
    if (req.cookies.auth) {
        return res.redirect('/');
    } else {
        res.render('login');
    } 
});
app.post("/login", async (req, res) => {
    const tb = "users";
    const userEmail = req.body.email;
    // Use hash to encrypt the password with a random salt number
    const userPassword = req.body.passwd;
    let respondData = {
        "userEmail": userEmail,
        "emailError": "",
        "passwordError": "",
    };

    let userInfo = {};
    if (userEmail === undefined || userEmail === "") {
        respondData["emailError"] = "Email cannot be emptied";
        return res.render('login', respondData);
    } else {
        const sql = "SELECT * FROM ?? WHERE ?? = ?";
        try {
            const rows = (await conn.query(sql, [tb, "userEmail", userEmail]))[0];
            if (!(rows.length > 0)) {
                respondData["emailError"] = "Email Account is not existed";
                return res.render('login', respondData);
            }
            userInfo = rows[0];
        } catch (err) {
            console.log(err);
            return res.status(500).send("User cannot login");
            
        }
    }

    if (userPassword === undefined || userPassword === "") {
        respondData["passwordError"] = "You must enter the password";
        return res.render('login', respondData);
    }

    try {
        // console.log(userInfo["userEmail"]);
        // console.log(JSON.stringify(userInfo));
        const hashedPassword = crypto.pbkdf2Sync(userPassword, userInfo.salt, 20, 64
            , 'sha256').toString('hex');
        if (hashedPassword === userInfo.userPassword) {
            res.cookie("auth", {userEmail, hashedPassword}, {
                maxAge: 5000000,
            });
            return res.redirect('/');
        } else {
            respondData["passwordError"] = "Password does not match with account in Mail Man";
            return res.render('login', respondData);
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send("User cannot login");
    }
});

// Sign-up page
app.get("/register", async (req, res, next) =>{
    if (req.cookies.auth) {
        return res.redirect('/');
    }
    res.render('register');
});

app.post("/register", async (req, res, next) =>{
    if (req.cookies.auth) {
        return res.redirect('/');
    }
    const tb = "users";
    const userEmail = req.body.email;
    const userFullName = req.body.fullname;
    // Use hash to encrypt the password with a random salt number
    const userPassword = req.body.passwd;
    const userRePassword = req.body.repasswd;
    const salt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = crypto.pbkdf2Sync(userPassword, salt, 20, 64
        , 'sha256').toString('hex');

    // Register Information
    let userInfo = {
        "userEmail": userEmail,
        "userPassword": hashedPassword,
        "userFullName": userFullName,
        "salt": salt,
        "emailError": "",
        "passwordError": "",
        "passwordReEnterError": "",
    };
    let valid = true;
    if (userEmail === undefined || userEmail === "") {
        valid = false;
        userInfo["emailError"] = "Email cannot be emptied";
    } else {
        const sql = "SELECT * FROM ?? WHERE ?? = ?";
        let [rows] = await conn.query(sql, [tb, "userEmail", userEmail]);
        if (rows.length > 0) {
            valid = false;
            userInfo["emailError"] = "Email account existed";
        }
    }
    if (userPassword === undefined || userPassword === "") {
        valid = false;
        userInfo["passwordError"] = "Password cannot be emptied";
    }
    if (userPassword != userRePassword) {
        valid = false;
        userInfo["passwordReEnterError"] = "You must re-enter the same password";
    }

    if (valid) {
        try {
            const sql = "INSERT INTO ?? VALUES(?, ?, ?, ?)";
            const rs = await conn.query(sql, [tb, userEmail, hashedPassword, userFullName, salt]);
            let row = rs[0][0];

            console.log("User Registered:");
            console.log(JSON.stringify(userInfo, null, 2));
        } catch (err) {
            if (err.errno === 1062) {
                console.log("Duplicate entry");
                res.status(400).send("Account exists: " + userEmail);
                return;
            }
            console.log(err);
            res.status(500).send("User cannot registration");
            return;
        }
        // res.send("Register successfully");
        ("Register successfully");
        res.render('redirect');
    } else {
        res.render('register', userInfo);
    }
});

// Inbox page
app.get("/inbox", async (req, res) =>{
    res.send("Register successfully");
});

app.get("/compose", async (req, res) =>{
    res.send("Register successfully");
});

app.get("/outbox", async (req, res) =>{
    res.send("Register successfully");
});

app.get("/info", async (req, res) =>{
    try {
        let contents = await fs.readFile("./src/solaris.json", 'utf8');
        contents = JSON.parse(contents);
        res.json(contents);
    } catch (err){
        console.error(err);
        res.status(500).send("Sever-side error!");
    }
});

app.get("/input", (req, res) => {
    // let name = req.query.name;
    // let password = req.query.password;
    // if (! (name && password)) {
    //     res.status(400).send("Error: Missing required: name and password");
    // } else {
    //     res.type("text");
    //     res.send("Login with username: " + name + "\n" + 
    //         "password: " + password); 
    // }
});

// app.post("/input", (req, res) => {
//     let name = req.body.name;
//     let password = req.body.password;
//     if (! (name && password)) {
//         res.status(400).send("Error: Missing required: name and password");
//     } else {
//         res.type("text");
//         res.send("Login with username: " + name + "\n" + 
//             "password: " + password); 
//     }
// });


app.use(express.static('public'));
let appServer = app.listen(8000);

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
});
