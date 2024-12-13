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
    const { rfid, plis, dop, doe } = req.body;

    console.log(JSON.parse(rfid.replaceAll(`'`, `"`))["rfid1"]);

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'INSERT INTO manufactured_products (RFID, PLIS, DOP, DOE) VALUES (?, ?, ?, ?);';
        connection.query(query, [rfid.replaceAll(`'`, `"`), plis.replaceAll(`'`, `"`), dop, doe], async (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            // res.status(200).json({ message: 'Data inserted successfully', result });
            // try {
            //     // Generate QR code as a buffer
            //     const qrBuffer = await QRCode.toBuffer(, {
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
