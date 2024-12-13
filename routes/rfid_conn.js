const express = require('express');
const { pool } = require('../server');

const router = express.Router();

function plisReader(plis) {
    const prodID = Number(plis["start"].split("_")[0]);

    const start = Number(plis["start"].split("_")[1]);
    const end = Number(plis["end"].split("_")[1]);

    return { prodID, start, end };
}

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
    const { rfid, wid, plis, loc } = req.body; // Assuming you're sending data in the body
    const jPlis = JSON.stringify(plis);

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        // const parentQuery = 'SELECT RLID FROM rfid_logs WHERE RFID = ? ORDER BY RLID DESC;'
        // const prevQuery = 'INSERT INTO rfid_logs (RFID, PLIS, TSTMP, LOC, PARENT, TERM) VALUES (?, ?, NOW(), ?, ?, ?);';
        // const newQuery = 'INSERT INTO rfid_logs (RFID, PLIS, TSTMP, LOC, TERM) VALUES (?, ?, NOW(), ?, ?);';
        if (Number(wid) > 1000 && Number(wid) < 9000) {
            connection.query(parentQuery, [rfid], (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                }

                if (result.length != 0) {
                    connection.query(prevQuery, [rfid, jPlis.replaceAll(`'`, `"`), loc, result[0]["RLID"], Number(term)], (err, result) => {
                        connection.release();
                        if (err) {
                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                        }

                        res.status(200).json({ message: 'Products successfully scanned by supplier', result });
                    });
                } else {
                    res.status(200).json({ message: 'Failed to insert data' });
                }
            });
        } else {
            const query = 'SELECT PPID, PLIS, CNT FROM inventory WHERE WID = 1000;';
            const updateQuery = 'UPDATE inventory PLIS = ?, CNT = ?;';
            connection.query(query, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                }
                const { iProdID, iStart, iEnd } = plisReader(result[0]["PLIS"]);
                console.log(iProdID, iStart, iEnd);
                console.log(result[0]['CNT']);

                res.status(200).json({ message: "Testing Successful" });
                // connection.query(newQuery, [rfid, jPlis.replaceAll(`'`, `"`), loc, Number(term)], (err, result) => {
                //     connection.release();
                //     if (err) {
                //         return res.status(500).json({ message: 'Failed to insert data', error: err });
                //     }

                //     res.status(200).json({ message: 'Products successfully dispatched from manufacturer', result });
                // });
            });
        }

    });
});

module.exports = router;