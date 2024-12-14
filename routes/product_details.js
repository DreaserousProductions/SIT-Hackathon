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
        const rfidQuery = `WITH RECURSIVE ParentTree AS (     SELECT RLID, RFID,WID, PLIS, TSTMP, LOC, PARENT     FROM rfid_logs     WHERE RLID = ?     UNION ALL     SELECT r.RLID, r.RFID,r.WID, r.PLIS, r.TSTMP, r.LOC, r.PARENT     FROM rfid_logs r     JOIN ParentTree pt ON r.RLID = pt.PARENT ) SELECT * FROM ParentTree;`;
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
                            if (err) {
                                connection.release(); // Always release the connection
                                return res.status(500).json({ message: 'Failed to retrieve data', error: err });
                            }

                            console.log(results);
                            const warehouseConditionsPromises = results.map(location => {
                                return new Promise((resolve, reject) => {
                                    const warehouseQuery = 'SELECT * FROM ware_conditions WHERE WID = ? ORDER BY CID DESC LIMIT 1;';
                                    connection.query(warehouseQuery, [location["WID"]], (err, warehouseResult) => {
                                        if (err) {
                                            return reject(err);
                                        }
                                        console.log(warehouseResult);
                                        resolve({
                                            location,
                                            warehouse: warehouseResult[0] || { TEMP: 'N/A', HUMIDITY: 'N/A' }
                                        });
                                    });
                                });
                            });

                            Promise.all(warehouseConditionsPromises)
                                .then(data => {
                                    connection.release(); // Always release the connection
                                    // Generate combined HTML response
                                    const htmlResponse = `
                                        <!DOCTYPE html>
                                        <html lang="en">
                                        <head>
                                            <meta charset="UTF-8">
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                            <title>Product and Warehouse Details</title>
                                            <style>
                                                body {
                                                    font-family: Arial, sans-serif;
                                                    line-height: 1.6;
                                                    margin: 20px;
                                                }
                                                .location-list {
                                                    list-style-type: none;
                                                    padding: 0;
                                                }
                                                .location-item {
                                                    background: #f9f9f9;
                                                    margin: 10px 0;
                                                    padding: 15px;
                                                    border: 1px solid #ddd;
                                                    border-radius: 5px;
                                                }
                                                .timestamp {
                                                    font-size: 0.9em;
                                                    color: #555;
                                                }
                                            </style>
                                        </head>
                                        <body>
                                            <h1>Product Location History</h1>
                                            <ul class="location-list">
                                                ${data.map(({ location, warehouse }) => `
                                                    <li class="location-item">
                                                        <strong>Location:</strong> ${location.LOC}<br>
                                                        <span class="timestamp">Timestamp: ${new Date(location.TSTMP).toLocaleString()}</span><br>
                                                        <strong>Temperature:</strong> ${warehouse}<br>
                                                        <strong>Humidity:</strong> ${warehouse.HUMIDITY}<br>
                                                    </li>
                                                `).join('')}
                                            </ul>
                                        </body>
                                        </html>
                                    `;

                                    return res.status(200).send(htmlResponse);
                                })
                                .catch(error => {
                                    connection.release(); // Always release the connection
                                    return res.status(500).json({ message: 'Failed to retrieve warehouse data', error });
                                });
                        });
                        break;
                    }
                }
            }
        });
    });
});

module.exports = router;

// const express = require('express');
// const { pool } = require('../server');

// const router = express.Router();

// function plisReader(plis) {
//     const prodID = Number(plis["start"].split("_")[0]);

//     const start = Number(plis["start"].split("_")[1]);
//     const end = Number(plis["end"].split("_")[1]);

//     return { prodID, start, end };
// }

// router.get('/', (req, res) => {
//     const { ppid } = req.query;

//     if (!ppid) {
//         return res.status(400).json({ error: 'Missing RFID parameter' });
//     }

//     pool.getConnection((err, connection) => {
//         if (err) {
//             return res.status(500).json({ message: 'Database connection failed', error: err });
//         }

//         const query = 'SELECT * FROM rfid_logs ORDER BY RLID DESC;';
//         const rfidQuery = `WITH RECURSIVE ParentTree AS (     SELECT RLID, RFID,WID, PLIS, TSTMP, LOC, PARENT     FROM rfid_logs     WHERE RLID = ?     UNION ALL     SELECT r.RLID, r.RFID,r.WID, r.PLIS, r.TSTMP, r.LOC, r.PARENT     FROM rfid_logs r     JOIN ParentTree pt ON r.RLID = pt.PARENT ) SELECT * FROM ParentTree;`;
//         connection.query(query, (err, result) => {
//             if (err) {
//                 return res.status(500).json({ message: 'Failed to retrieve data', error: err });
//             }

//             const prodNid = ppid.split("_");
//             const pid = Number(prodNid[0]);
//             const id = Number(prodNid[1]);

//             console.log(pid, id);

//             for (const res1 of result) {
//                 const { prodID, start, end } = plisReader(res1["PLIS"]);

//                 if (prodID === pid) {
//                     if (id >= start && id <= end) {
//                         connection.query(rfidQuery, [res1["RLID"]], (err, results) => {
//                             connection.release(); // Always release the connection
//                             if (err) {
//                                 return res.status(500).json({ message: 'Failed to retrieve data', error: err });
//                             }

//                             // Generate HTML response
//                             const htmlResponse = `
//                                 <!DOCTYPE html>
//                                 <html lang="en">
//                                 <head>
//                                     <meta charset="UTF-8">
//                                     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                                     <title>Product Location History</title>
//                                     <style>
//                                         body {
//                                             font-family: Arial, sans-serif;
//                                             line-height: 1.6;
//                                             margin: 20px;
//                                         }
//                                         .location-list {
//                                             list-style-type: none;
//                                             padding: 0;
//                                         }
//                                         .location-item {
//                                             background: #f9f9f9;
//                                             margin: 10px 0;
//                                             padding: 15px;
//                                             border: 1px solid #ddd;
//                                             border-radius: 5px;
//                                         }
//                                         .timestamp {
//                                             font-size: 0.9em;
//                                             color: #555;
//                                         }
//                                     </style>
//                                 </head>
//                                 <body>
//                                     <h1>Product Location History</h1>
//                                     <ul class="location-list">
//                                         ${results.map(r => `
//                                             <li class="location-item">
//                                                 <strong>Location:</strong> ${r.LOC}<br>
//                                                 <span class="timestamp">Timestamp: ${new Date(r.TSTMP).toLocaleString()}</span>
//                                             </li>
//                                         `).join('')}
//                                     </ul>
//                                 </body>
//                                 </html>
//                             `;

//                             return res.status(200).send(htmlResponse);
//                         });
//                         break;
//                     }
//                 }
//             }
//         });
//     });
// });

// module.exports = router;

// // const express = require('express');
// // const { pool } = require('../server');

// // const router = express.Router();

// // function plisReader(plis) {
// //     const prodID = Number(plis["start"].split("_")[0]);

// //     const start = Number(plis["start"].split("_")[1]);
// //     const end = Number(plis["end"].split("_")[1]);

// //     return { prodID, start, end };
// // }

// // router.get('/', (req, res) => {
// //     const { ppid } = req.query;

// //     if (!ppid) {
// //         return res.status(400).json({ error: 'Missing RFID parameter' });
// //     }

// //     pool.getConnection((err, connection) => {
// //         if (err) {
// //             return res.status(500).json({ message: 'Database connection failed', error: err });
// //         }

// //         const query = 'SELECT * FROM rfid_logs ORDER BY RLID DESC;';
// //         const rfidQuery = `WITH RECURSIVE ParentTree AS (     SELECT RLID, RFID,WID, PLIS, TSTMP, LOC, PARENT     FROM rfid_logs     WHERE RLID = ?     UNION ALL     SELECT r.RLID, r.RFID,r.WID, r.PLIS, r.TSTMP, r.LOC, r.PARENT     FROM rfid_logs r     JOIN ParentTree pt ON r.RLID = pt.PARENT ) SELECT * FROM ParentTree;`;
// //         connection.query(query, (err, result) => {
// //             if (err) {
// //                 return res.status(500).json({ message: 'Failed to retrieve data', error: err });
// //             }

// //             const prodNid = ppid.split("_");
// //             const pid = Number(prodNid[0]);
// //             const id = Number(prodNid[1]);

// //             console.log(pid, id);

// //             for (const res1 of result) {
// //                 const { prodID, start, end } = plisReader(res1["PLIS"]);

// //                 if (prodID === pid) {
// //                     if (id >= start && id <= end) {
// //                         connection.query(rfidQuery, [res1["RLID"]], (err, results) => {
// //                             connection.release(); // Always release the connection
// //                             if (err) {
// //                                 return res.status(500).json({ message: 'Failed to retrieve data', error: err });
// //                             }

// //                             return res.status(200).json({ message: 'Data successfully retrieved', results });
// //                         });
// //                         break;
// //                     }
// //                 }
// //             }
// //         });
// //     });
// // });

// // module.exports = router;
// // const express = require('express');
// // const { pool } = require('../server');
// // const fs = require('fs');
// // const handlebars = require('handlebars');

// // const router = express.Router();

// // function plisReader(plis) {
// //     const prodID = Number(plis["start"].split("_")[0]);

// //     const start = Number(plis["start"].split("_")[1]);
// //     const end = Number(plis["end"].split("_")[1]);

// //     return { prodID, start, end };
// // }

// // router.get('/', (req, res) => {
// //     const { ppid } = req.query;

// //     if (!ppid) {
// //         return res.status(400).json({ error: 'Missing RFID parameter' });
// //     }

// //     pool.getConnection((err, connection) => {
// //         if (err) {
// //             return res.status(500).json({ message: 'Database connection failed', error: err });
// //         }

// //         const query = 'SELECT * FROM rfid_logs ORDER BY RLID DESC;';
// //         const prodQuery = 'SELECT * FROM products WHERE PPID = ;';
// //         const rfidQuery = `WITH RECURSIVE ParentTree AS (     SELECT RLID, RFID, WID, PLIS, TSTMP, LOC, PARENT     FROM rfid_logs     WHERE RLID = ?     UNION ALL     SELECT r.RLID, r.RFID, r.PLIS, r.TSTMP, r.LOC, r.PARENT     FROM rfid_logs r     JOIN ParentTree pt ON r.RLID = pt.PARENT ) SELECT * FROM ParentTree;`;
// //         connection.query(query, (err, result) => {
// //             if (err) {
// //                 return res.status(500).json({ message: 'Failed to retrieve data', error: err });
// //             }

// //             const prodNid = ppid.split("_");
// //             const pid = Number(prodNid[0]);
// //             const id = Number(prodNid[1]);

// //             console.log(pid, id);

// //             for (const res1 of result) {
// //                 const { prodID, start, end } = plisReader(res1["PLIS"]);

// //                 if (prodID === pid) {
// //                     if (id >= start && id <= end) {
// //                         connection.query(rfidQuery, [res1["RLID"]], (err, results) => {
// //                             connection.query(prodQuery, [ppid], (err, results1) => {
// //                                 connection.release(); // Always release the connection
// //                                 if (err) {
// //                                     return res.status(500).json({ message: 'Failed to retrieve data', error: err });
// //                                 }

// //                                 // Path to the HTML template
// //                                 const templatePath = './product_info.html';

// //                                 // Read the HTML template file
// //                                 fs.readFile(templatePath, 'utf-8', (err, templateSource) => {
// //                                     if (err) {
// //                                         res.status(500).send('Error loading template');
// //                                         return;
// //                                     }

// //                                     // Compile the Handlebars template
// //                                     const template = handlebars.compile(templateSource);

// //                                     // Data to populate in the template
// //                                     const productData = {
// //                                         productName: results1[0]["PNAME"],
// //                                         mfgDate: '2022-01-15',
// //                                         expDate: '2023-01-15',
// //                                     };

// //                                     // Render the HTML with the data
// //                                     const html = template(productData);

// //                                     // Send the rendered HTML as a response
// //                                     res.send(html);
// //                                 });
// //                             });
// //                         });
// //                         break;
// //                     }
// //                 }
// //             }
// //         });
// //     });
// // });

// // module.exports = router;