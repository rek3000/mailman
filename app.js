"use strict";
// Modules
const express = require("express");
const multer = require("multer");
const fs = require("fs").promises;
const mysql = require("mysql2/promise");
const app = express();

// Middlewares
app.use(express.urlencoded( { extended: true }));
app.use(express.json());
app.use(multer().none());
app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).send("Sever-side error!");
});

let conn = null;
(async function (){
    conn = await mysql.createConnection({
        user: 'rek',
        password: 'thuanlp123',
        database: 'themepark',
        host: '127.0.0.1',
    })
}) ();

// Handle requests
app.get("/", async (req, res) =>{
    let rows = []
    let tb = "THEMEPARK", col = "PARK_COUNTRY";
    try {
        let sql = "SELECT * FROM ?? WHERE ?? = ?";
        let rs = await conn.query(sql, [tb, col, "UK"]);
        rows = rs[0];
    } catch (err) {
        console.log(err);
        res.status(500).send("Cannot read data from database");
        return;
    }

    for (let row of rows) {
        console.log(row.PARK_CODE + ", " + row.PARK_NAME +
                    ", " + row.PARK_CITY);
    }
    res.send("connection success");
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
    let name = req.query.name;
    let password = req.query.password;
    if (! (name && password)) {
        res.status(400).send("Error: Missing required: name and password");
    } else {
        res.type("text");
        res.send("Login with username: " + name + "\n" + 
            "password: " + password); 
    }
});

app.post("/input", (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    if (! (name && password)) {
        res.status(400).send("Error: Missing required: name and password");
    } else {
        res.type("text");
        res.send("Login with username: " + name + "\n" + 
            "password: " + password); 
    }
});


app.use(express.static('public'));
let appServer = app.listen(8080);

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
