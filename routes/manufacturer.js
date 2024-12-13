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
    const { rfid, plis, dop, doe } = req.body; // Assuming you're sending data in the body
    console.log(rfid);
    console.log(JSON.parse(rfid));
    console.log(JSON.parse(plis));
    console.log(dop);
    console.log(doe);

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'INSERT INTO manufactured_products (RFID, PLIS, DOP, DOE) VALUES (?, ?, ?, ?);';
        connection.query(query, [JSON.parse(rfid), JSON.parse(plis), dop, doe], (err, result) => {
            connection.release(); // Always release the connection

            if (err) {
                return res.status(500).json({ message: 'Failed to insert data', error: err });
            }

            res.status(200).json({ message: 'Data inserted successfully', result });
        });
    });
});


module.exports = router;
