const express = require('express');
const { pool } = require('../server');

const router = express.Router();

function plisReader(plis) {
    const prodID = Number(plis["start"].split("_")[0]);

    const start = Number(plis["start"].split("_")[1]);
    const end = Number(plis["end"].split("_")[1]);

    return { prodID, start, end };
}

function plisWriter(prodID, start, end) {
    return JSON.stringify({ "start": `${prodID}_${start}`, "end": `${prodID}_${end}` });
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
    const { rfid, fwid, twid, plis, loc, prfid } = req.body; // Assuming you're sending data in the body
    console.log(req.body);
    console.log(plis);
    const jPlis = JSON.parse(plis.replaceAll(`'`, `"`));

    pool.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: 'Database connection failed', error: err });
        }

        if (Number(fwid) > 1000 && Number(fwid) < 9000) {
            const query = 'SELECT EID, PPID, PLIS, CNT FROM inventory WHERE WID = ?;';
            connection.query(query, [fwid], async (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                }

                if (result.length !== 0) {
                    const { prodID: iProdID, start: iStart, end: iEnd } = plisReader(result[0]["PLIS"]);
                    const { prodID, start, end } = plisReader(jPlis);

                    const rfidQuery = 'INSERT INTO rfid_logs (RFID, WID, PLIS, TSTMP, LOC, PARENT) VALUES (?, ?, ?, NOW(), ?, ?);';
                    const transferQuery = 'INSERT INTO inventory (WID, PPID, PLIS, CNT) VALUES (?, ?, ?, ?);';

                    const prfidQuery = "SELECT RLID FROM rfid_logs ORDER BY RLID DESC LIMIT 1;"
                    let qrfid = "";
                    if (!prfid) {
                        await connection.query(prfidQuery, (err, reses) => {
                            if (err) {
                                return res.status(500).json({ message: 'Failed to insert data', error: err });
                            }

                            qrfid = reses[0]["RLID"];
                        });
                    } else {
                        qrfid = prfid;
                    }

                    if (prodID === iProdID && (start === iStart && end <= iEnd)) {
                        const rWritePlis = plisWriter(prodID, start, end);
                        const rWriteCnt = end - start + 1;
                        if (end !== iEnd) {
                            const writePlis = plisWriter(prodID, end + 1, iEnd);
                            const writeCnt = iEnd - end;

                            const updateQuery = 'UPDATE inventory SET PLIS = ?, CNT = ?;';
                            connection.query(updateQuery, [writePlis, writeCnt], (err, reses) => {
                                if (err) {
                                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                                }
                                connection.query(rfidQuery, [rfid, twid, rWritePlis, loc, qrfid], (err, reses1) => {
                                    if (err) {
                                        return res.status(500).json({ message: 'Failed to insert data', error: err });
                                    }
                                    connection.query(transferQuery, [twid, iProdID, rWritePlis, rWriteCnt], (err, reses2) => {
                                        connection.close();
                                        if (err) {
                                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                                        }

                                        res.status(200).json({ message: "Part of the inventory has been transferred successfully" });
                                    });
                                });
                            });
                        } else {
                            const deleteQuery = 'DELETE FROM inventory WHERE EID = ?;';
                            connection.query(deleteQuery, [result[0]["EID"]], (err, reses) => {
                                if (err) {
                                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                                }
                                connection.query(rfidQuery, [rfid, twid, rWritePlis, loc, qrfid], (err, reses1) => {
                                    if (err) {
                                        return res.status(500).json({ message: 'Failed to insert data', error: err });
                                    }
                                    connection.query(transferQuery, [twid, iProdID, rWritePlis, rWriteCnt], (err, reses2) => {
                                        connection.close();
                                        if (err) {
                                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                                        }

                                        res.status(200).json({ message: "All products transferred successfully" });
                                    });
                                });
                            });
                        }
                    } else {
                        res.status(200).json({ message: "Product Range Out of Index" });
                    }
                } else {
                    res.status(200).json({ message: "Inventory Empty" });
                }
            });
        } else {
            const query = 'SELECT EID, PPID, PLIS, CNT FROM inventory WHERE WID = 1000;';
            connection.query(query, (err, result) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                }

                if (result.length !== 0) {
                    const { prodID: iProdID, start: iStart, end: iEnd } = plisReader(result[0]["PLIS"]);
                    const { prodID, start, end } = plisReader(jPlis);

                    const rfidQuery = 'INSERT INTO rfid_logs (RFID, WID, PLIS, TSTMP, LOC) VALUES (?, ?, ?, NOW(), ?);';
                    const transferQuery = 'INSERT INTO inventory (WID, PPID, PLIS, CNT) VALUES (?, ?, ?, ?);';

                    if (prodID === iProdID && (start === iStart && end <= iEnd)) {
                        const rWritePlis = plisWriter(prodID, start, end);
                        const rWriteCnt = end - start + 1;
                        if (end !== iEnd) {
                            const writePlis = plisWriter(prodID, end + 1, iEnd);
                            const writeCnt = iEnd - end;

                            const updateQuery = 'UPDATE inventory SET PLIS = ?, CNT = ?;';
                            connection.query(updateQuery, [writePlis, writeCnt], (err, reses) => {
                                if (err) {
                                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                                }
                                connection.query(rfidQuery, [rfid, twid, rWritePlis, loc], (err, reses1) => {
                                    if (err) {
                                        return res.status(500).json({ message: 'Failed to insert data', error: err });
                                    }
                                    connection.query(transferQuery, [twid, iProdID, rWritePlis, rWriteCnt], (err, reses2) => {
                                        connection.close();
                                        if (err) {
                                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                                        }

                                        res.status(200).json({ message: "Part of the inventory has been transferred successfully" });
                                    });
                                });
                            });
                        } else {
                            const deleteQuery = 'DELETE FROM inventory WHERE EID = ?;';
                            connection.query(deleteQuery, [result[0]["EID"]], (err, reses) => {
                                if (err) {
                                    return res.status(500).json({ message: 'Failed to insert data', error: err });
                                }
                                connection.query(rfidQuery, [rfid, twid, rWritePlis, loc], (err, reses1) => {
                                    if (err) {
                                        return res.status(500).json({ message: 'Failed to insert data', error: err });
                                    }
                                    connection.query(transferQuery, [twid, iProdID, rWritePlis, rWriteCnt], (err, reses2) => {
                                        connection.close();
                                        if (err) {
                                            return res.status(500).json({ message: 'Failed to insert data', error: err });
                                        }

                                        res.status(200).json({ message: "All products transferred successfully" });
                                    });
                                });
                            });
                        }
                    } else {
                        res.status(200).json({ message: "Product Range Out of Index" });
                    }
                } else {
                    res.status(200).json({ message: "Inventory Empty" });
                }
            });
        }

    });
});

module.exports = router;