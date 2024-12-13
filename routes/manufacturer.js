const express = require('express');
const { pool } = require('../server');
const QRCode = require('qrcode');

const router = express.Router();

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
    const doe = new Date(dateType.getTime() + count * 24 * 60 * 60 * 1000);
    console.log(doe);

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'SELECT * FROM products WHERE ppid = ?;';
        const manQuery = 'INSERT INTO manufactuered_products (PLIS, DOP, DOE) VALUES (?, ?, ?);';
        connection.query(query, [ppid], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            if (result.length !== 0) {
                // connection.query(manQuery, [ppid], async (err, results) => { });
                res.status(200).json({ message: 'Data inserted successfully', result });
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
