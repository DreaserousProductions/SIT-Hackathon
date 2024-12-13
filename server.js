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
const path = require('path');
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
// Attach the static directory
app.use(express.static(path.join(__dirname, 'public')));
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        #logs { max-height: 80vh; overflow-y: scroll; border: 1px solid #ccc; padding: 10px; }
        .log { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; background: #f9f9f9; }
        #main { width: 100%; height:85vh; border: 1px solid black; display: flex; flex-direction:column; align-items:center; justify-content:center;}
        #main .man-img {max-width:8%;transition: box-shadow 1s; animation: pulse infinite 1s alternate;}
        .top {width: 650px; height: 40px; margin-bottom:20px;background: rgba(100, 100, 100, 0.25);border-radius: 5px; border: 1px dashed gray;font-size:12px;overflow:hidden;display: flex; align-items:center; justify-content:center;font-family: monospace;}
        .bottom {margin-top:10px;}
        .api {
            height:100px;
            width: 100px;

            position: absolute;

            display: flex;
            align-items: center;
            justify-content: center;

            background: rgba(100, 100, 100, 0.25);
            border-radius: 5px;
            border: 1px dashed gray
        }

        .api img {
            width: 80px;
        }

        .warehouse {
            top: 100px;
            left: 100px;
        }

        .manufacturer {
            top: 100px;
            right: 100px;
        }

        .rfid {
            bottom: 100px;
            left: 100px;
        }

        .details {
            bottom: 100px;
            right: 100px;
        }

        .line {
            border: 2px dashed black;
            position: absolute;
        }

        #ware-ver {
            transform: translateX(-490px) translateY(-80px);
            height: 120px;
        }

        #ware-hor {
            transform: translateX(-270px) translateY(-20px);
            width: 425px;
        }

        #rfid-ver {
            transform: translateX(-490px) translateY(90px);
            height: 80px;
        }

        #rfid-hor {
            transform: translateX(-270px) translateY(50px);
            width: 425px;
        }

        #manu-ver {
            transform: translateX(490px) translateY(-80px);
            height: 120px;
        }

        #manu-hor {
            transform: translateX(270px) translateY(-20px);
            width: 425px;
        }

        #det-ver {
            transform: translateX(490px) translateY(90px);
            height: 80px;
        }

        #det-hor {
            transform: translateX(270px) translateY(50px);
            width: 425px;
        }

        @keyframes pulse {
            0% {
                box-shadow: 0 0 5px 2px green;
            }
            100% {
                box-shadow: 0 0 10px 5px green;
            }
        }
    </style>
</head>
<body>
    <h1>API Dashboard</h1>
    <div id=main>
        <div class="line" id="ware-ver"></div>
        <div class="line" id="ware-hor"></div>
        <div class="line" id="rfid-ver"></div>
        <div class="line" id="rfid-hor"></div>
        <div class="line" id="manu-ver"></div>
        <div class="line" id="manu-hor"></div>
        <div class="line" id="det-ver"></div>
        <div class="line" id="det-hor"></div>
        <div class="top"></div>
        <img class="man-img" src="./server.png">
        <div class="bottom">Server</div>
        <div class="api warehouse">
            <img src="./warehouse.png">
        </div>
        <div class="api manufacturer">
            <img src="./factory.png">
        </div>
        <div class="api rfid">
            <img src="./rfid.png">
        </div>
        <div class="api details">
            <img src="./details.png">
        </div>
    </div>
    <div id="logs"></div>
    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();

        const appendLog = (log) => {
            const temp = log.toString();
            console.log(temp, temp.includes("warehouse"));
            console.log(log.toString().includes("warehouse"));
            if(log.toString().includes("rfid")) {
                const elem = document.querySelector(".rfid");
                const border1 = document.querySelector("#rfid-ver");
                const border2 = document.querySelector("#rfid-hor");

                elem.style.animation = "animation: pulse infinite 1s alternate";
                border1.style.border = "2px dashed lightgreen";
                border2.style.border = "2px dashed lightgreen";

                setTimeout(() => {
                    elem.style.animation = "animation: none";
                    border1.style.border = "2px dashed black";
                    border2.style.border = "2px dashed black";
                }, 1000);
            } else if(log.toString().includes("warehouse")) {
                const elem = document.querySelector(".warehouse");
                const border1 = document.querySelector("#ware-ver");
                const border2 = document.querySelector("#ware-hor");

                elem.style.animation = "animation: pulse infinite 1s alternate";
                border1.style.border = "2px dashed lightgreen";
                border2.style.border = "2px dashed lightgreen";

                setTimeout(() => {
                    elem.style.animation = "animation: none";
                    border1.style.border = "2px dashed black";
                    border2.style.border = "2px dashed black";
                }, 10000);
            } else if(log.toString().includes("details")) {
                const elem = document.querySelector(".details");
                const border1 = document.querySelector("#det-ver");
                const border2 = document.querySelector("#det-hor");

                elem.style.animation = "animation: pulse infinite 1s alternate";
                border1.style.border = "2px dashed lightgreen";
                border2.style.border = "2px dashed lightgreen";

                setTimeout(() => {
                    elem.style.animation = "animation: none";
                    border1.style.border = "2px dashed black";
                    border2.style.border = "2px dashed black";
                }, 1000);
            } else if(log.toString().includes("manufacturer")) {
                const elem = document.querySelector(".manufacturer");
                const border1 = document.querySelector("#manu-ver");
                const border2 = document.querySelector("#manu-hor");

                elem.style.animation = "animation: pulse infinite 1s alternate";
                border1.style.border = "2px dashed lightgreen";
                border2.style.border = "2px dashed lightgreen";

                setTimeout(() => {
                    elem.style.animation = "animation: none";
                    border1.style.border = "2px dashed black";
                    border2.style.border = "2px dashed black";
                }, 1000);
            }

            const logsDiv = document.querySelector('.top');
            logsDiv.innerText = \`[\${log.timestamp}] \${log.method} \${log.endpoint} - Body: \${JSON.stringify(log.body)}\`;
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
