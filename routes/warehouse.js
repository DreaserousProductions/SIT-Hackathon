const express = require('express');
const { pool } = require('../server');

const router = express.Router();

router.post('/', (req, res) => {
    const { wid, temp, humidity, moisture } = req.body; // Assuming you're sending data in the body

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'INSERT INTO warehouses (WID, TEMP, HUMIDITY, MOISTURE) VALUES (?, ?, ?, ?);';
        connection.query(query, [wid, temp, humidity, moisture], (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            res.status(200).json({ message: 'Data inserted successfully', result });
        });
    });
});


module.exports = router;
