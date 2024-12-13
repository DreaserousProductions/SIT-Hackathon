const express = require('express');
const { pool } = require('../server');
const QRCode = require('qrcode');

const router = express.Router();

function formatDateToMySQL(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

router.get('/', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'SELECT * FROM manufactured_products;';
        connection.query(query, (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to retrieve data', error: err });
            }

            res.status(200).json({ message: 'Data successfully retrieved', result });
        });
    });
});

router.post('/', (req, res) => {
    const { ppid, date, count } = req.body;
    const dateType = new Date(date)

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'SELECT * FROM products WHERE ppid = ?;';
        const manQuery = 'INSERT INTO manufactured_products (PLIS, DOP, DOE) VALUES (?, ?, ?);';
        const updateQuery = 'UPDATE products SET CUR_PID = ? WHERE PPID = ?';
        connection.query(query, [ppid], (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            if (result.length !== 0) {
                const doe = new Date(dateType.getTime() + result[0]["EXP_TIME"] * 24 * 60 * 60 * 1000);
                connection.query(manQuery, [`{"start" : "${result[0]["PPID"]}_${result[0]["CUR_PID"]}", "end" : "${result[0]["PPID"]}_${Number(result[0]["CUR_PID"]) + Number(count) - 1}"}`, dateType, formatDateToMySQL(doe)], (err, results) => {
                    if (err) {
                        return res.status(500).json({ message: 'Failed to insert data', error: err });
                    }

                    connection.query(updateQuery, [Number(result[0]["CUR_PID"]) + Number(count) - 1, ppid], (err, reses) => {
                        connection.release();
                        if (err) {
                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                        }
                        res.status(200).json({ message: 'Data inserted successfully', result });
                    });
                });
            } else {
                return res.status(404).json({ message: 'Product ID not found' });
            }

            // try {
            //     // Generate QR code as a buffer
            //     const qrBuffer = await QRCode.toBuffer(`http://52.251.41.188:7898/details?rfid=${JSON.parse(rfid.replaceAll(`'`, `"`))["rfid1"]}`, {
            //         errorCorrectionLevel: 'H', // High error correction level
            //         type: 'png',               // Output as PNG
            //     });

            //     // Set the content type to PNG
            //     res.setHeader('Content-Type', 'image/png');
            //     res.send(qrBuffer); // Send the PNG buffer as the response
            // } catch (err) {
            //     console.error('Error generating QR code:', err);
            //     res.status(500).json({ error: 'Failed to generate QR code' });
            // }
        });
    });
});

module.exports = router;
