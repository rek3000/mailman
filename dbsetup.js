const mysql = require("mysql2/promise");
const fs = require("fs").promises;

let conn = null;
(async function (){
    conn = await mysql.createConnection({
        user: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DATABASE,
        host: process.env.HOST,
        port: process.env.PORT,
    })
    let content = await fs.readFile('./setup.sql', { encoding: 'utf8' });
    let lines = content.split('\r\n');
    let tmp = '';
    for (let line of lines) {
        line = line.trim();
        tmp += line + '\r\n';
        if (line.endsWith(';')) {
            await conn.execute(tmp);
            tmp = '';
        }
    }
    conn.end();
}) ();
