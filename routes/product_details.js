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
    const { ppid } = req.query;

    if (!ppid) {
        return res.status(400).json({ error: 'Missing RFID parameter' });
    }

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        const query = 'SELECT * FROM rfid_logs ORDER BY RLID DESC;';
        connection.query(query, (err, result) => {
            connection.release(); // Always release the connection
            if (err) {
                return res.status(500).json({ message: 'Failed to retrieve data', error: err });
            }

            const prodNid = ppid.split("_");
            const pid = Number(prodNid[0]);
            const id = Number(prodNid[1]);

            result.forEach(res1 => {
                const { prodID, start, end } = plisReader(res1["PLIS"])

                if (prodID === pid) {
                    if (id >= start && id <= end) { }
                    return res.status(200).json({ message: 'Data successfully retrieved', res1 });
                }
            });
        });
    });
});

module.exports = router;