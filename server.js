require('dotenv').config();
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

// Export the pool to be used in other modules
module.exports.pool = pool;

// Import routes
const warehouseRouter = require('./routes/warehouse');
// const liveRouter = require('./routes/live');

app.use('/warehouse', warehouseRouter);
// app.use('/live-stream', liveRouter);

// Start HTTP server
app.listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
});