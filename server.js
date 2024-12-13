// require('dotenv').config();
// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const bodyParser = require('body-parser');

// const app = express();
// const port = 7898;

// const corsOptions = {
//     origin: '*',
//     methods: 'GET,POST',
//     allowedHeaders: ['Content-Type', 'Authorization'],
// };
// app.use(cors(corsOptions));

// // Configure middleware
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// // Create a MySQL connection pool
// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: process.env.DATABASE_PASSWORD,
//     database: 'sentinels',
//     waitForConnections: true,
//     connectionLimit: 30,
//     queueLimit: 0
// });

// // Export the pool to be used in other modules
// module.exports.pool = pool;

// // Import routes
// const warehouseRouter = require('./routes/warehouse');
// const manfacturerRouter = require('./routes/manufacturer');
// const detailsRouter = require('./routes/product_details');

// app.use('/warehouse', warehouseRouter);
// app.use('/manufacturer', manfacturerRouter);
// app.use('/details', detailsRouter);

// // Start HTTP server
// app.listen(port, () => {
//     console.log(`HTTP Server running on port ${port}`);
// });


require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = 7898;

// CORS Configuration
const corsOptions = {
    origin: '*',
    methods: 'GET,POST',
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Middleware Configuration
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

// Middleware to log API usage
app.use((req, res, next) => {
    const log = {
        endpoint: req.originalUrl,
        method: req.method,
        body: req.body,
        timestamp: new Date(),
    };
    logs.push(log); // Add log to memory
    io.emit('api_access', log); // Emit log to WebSocket clients
    next();
});

// HTTP and WebSocket Servers
const server = http.createServer(app);
const io = new Server(server);

// Store API logs in memory
const logs = [];

// Import Routes
const warehouseRouter = require('./routes/warehouse');
const manfacturerRouter = require('./routes/manufacturer');
const detailsRouter = require('./routes/product_details');
const rfidRouter = require('./routes/rfid_conn');

app.use('/warehouse', warehouseRouter);
app.use('/manufacturer', manfacturerRouter);
app.use('/details', detailsRouter);
app.use('/rfid', rfidRouter);

// Dashboard Route
app.get('/dashboard', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #logs { max-height: 80vh; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; }
        .log { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; background: #f9f9f9; }
    </style>
</head>
<body>
    <h1>API Dashboard</h1>
    <div id="logs"></div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();

        const appendLog = (log) => {
            const logsDiv = document.getElementById('logs');
            const logDiv = document.createElement('div');
            logDiv.className = 'log';
            logDiv.innerText = \`[\${log.timestamp}] \${log.method} \${log.endpoint} - Body: \${JSON.stringify(log.body)}\`;
            logsDiv.appendChild(logDiv);
        };

        // Handle real-time logs
        socket.on('api_access', (log) => appendLog(log));

        // Connect to WebSocket server
        socket.on('connect', () => {
            console.log('Connected to server');
        });
    </script>
    <script src="/socket.io/socket.io.js"></script>
</body>
</html>
    `);
});

// Start HTTP server
server.listen(port, () => {
    console.log(`HTTP Server running on port ${port}`);
});
