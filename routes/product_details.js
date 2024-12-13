const express = require('express');
const { pool } = require('../server');

const router = express.Router();

router.get('/', (req, res) => {
    const { rfid } = req.query;

    if (!rfid) {
        return res.status(400).json({ error: 'Missing RFID parameter' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'SELECT * FROM manufactured_products WHERE JSON_CONTAINS(RFID, ?);';
        connection.query(query, (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to retrieve data', error: err });
            }

            res.status(200).json({ message: 'Data successfully retrieved', result });
        });
    });
});

module.exports = router;