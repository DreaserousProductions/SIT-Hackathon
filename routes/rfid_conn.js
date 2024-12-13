const express = require('express');
const { pool } = require('../server');

const router = express.Router();

router.get('/', (req, res) => {
    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'SELECT * FROM rfid_logs;';
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
    const { rfid, plis, loc, term } = req.body; // Assuming you're sending data in the body

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const parentQuery = 'SELECT RLID FROM rfid_logs WHERE RFID = ? ORDER BY RLID DESC;'
        const prevQuery = 'INSERT INTO rfid_logs (RFID, PLIS, TSTMP, LOC, PARENT, TERM) VALUES (?, ?, NOW(), ?, ?, ?);';
        const newQuery = 'INSERT INTO rfid_logs (RFID, PLIS, TSTMP, LOC, TERM) VALUES (?, ?, NOW(), ?, ?);';
        if (Number(term) === 1 || Number(term) === 2) {
            connection.query(parentQuery, [rfid], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                }

                if (result.length != 0) {
                    connection.query(prevQuery, [rfid, String(plis).replaceAll(`'`, `"`), loc, result[0]["RLID"], term], (err, result) => {
                        connection.release();
                        if (err) {
                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                        }

                        res.status(200).json({ message: 'Products successfully scanned by supplier', result });
                    });
                }

                res.status(200).json({ message: 'Data inserted successfully', result });
            });
        } else {
            connection.query(newQuery, [rfid, String(plis).replaceAll(`'`, `"`), loc, term], (err, result) => {
                connection.release();
                if (err) {
                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                }

                res.status(200).json({ message: 'Products successfully dispatched from manufacturer', result });
            });
        }

    });
});

module.exports = router;