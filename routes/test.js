const express = require('express');
const { pool } = require('../server');

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Image Router Working' });
});

module.exports = router;
