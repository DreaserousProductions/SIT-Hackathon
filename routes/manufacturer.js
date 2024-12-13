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
    const { wid, temp, humidity } = req.body; // Assuming you're sending data in the body

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'INSERT INTO ware_conditions (WID, TEMP, HUMIDITY, TSTMP) VALUES (?, ?, ?, NOW());';
        connection.query(query, [Number(wid), Number(temp), Number(humidity)], (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            res.status(200).json({ message: 'Data inserted successfully', result });
        });
    });
});


module.exports = router;
