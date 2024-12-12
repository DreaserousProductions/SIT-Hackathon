require('dotenv').config();
const https = require('https');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 7898;

const corsOptions = {
    origin: '*',
    methods: 'GET,POST',
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Configure middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: process.env.DATABASE_PASSWORD,
    database: 'sentinels',
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 0
});

// Import routes
const testRouter = require('./routes/test');
// const liveRouter = require('./routes/live');

app.use('/', testRouter);
// app.use('/live-stream', liveRouter);

// Start HTTPS server
https.createServer(options, app).listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
});

module.exports.pool = pool;