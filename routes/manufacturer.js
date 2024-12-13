const express = require('express');
const { pool } = require('../server');

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

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'INSERT INTO manufactured_products (RFID, PLIS, DOP, DOE) VALUES (?, ?, ?, ?);';
        connection.query(query, [JSON.parse(rfid.replaceAll(`'`, `"`)), JSON.parse(plis.replaceAll(`'`, `"`)), dop, doe], (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            res.status(200).json({ message: 'Data inserted successfully', result });
        });
    });
});


module.exports = router;
