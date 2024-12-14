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
        const rfidQuery = `WITH RECURSIVE ParentTree AS (     SELECT RLID, RFID, PLIS, TSTMP, LOC, PARENT     FROM rfid_logs     WHERE RLID = ?     UNION ALL     SELECT r.RLID, r.RFID, r.PLIS, r.TSTMP, r.LOC, r.PARENT     FROM rfid_logs r     JOIN ParentTree pt ON r.RLID = pt.PARENT ) SELECT * FROM ParentTree;`;
        connection.query(query, (err, result) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to retrieve data', error: err });
            }

            const prodNid = ppid.split("_");
            const pid = Number(prodNid[0]);
            const id = Number(prodNid[1]);

            console.log(pid, id);

            for (const res1 of result) {
                const { prodID, start, end } = plisReader(res1["PLIS"]);

                if (prodID === pid) {
                    if (id >= start && id <= end) {
                        connection.query(rfidQuery, [res1["RLID"]], (err, results) => {
                            connection.release(); // Always release the connection
                            if (err) {
                                return res.status(500).json({ message: 'Failed to retrieve data', error: err });
                            }

                            return res.status(200).json({ message: 'Data successfully retrieved', results });
                        });
                        break;
                    }
                }
            }
        });
    });
});

module.exports = router;