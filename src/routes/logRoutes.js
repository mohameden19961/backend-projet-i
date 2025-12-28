const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const auth = require('../middlewares/authMiddleware');

router.get('/', auth, (req, res) => {
    Log.findAll((err, logs) => {
        if (err) {
            return res.status(500).json({ error: "Erreur lors de la récupération des logs" });
        }
        res.status(200).json(logs);
    });
});

module.exports = router;