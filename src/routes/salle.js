const express = require('express');
const router = express.Router();
const salleController = require('../controllers/salleController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/create', authMiddleware, salleController.creerSalle);

router.get('/my-rooms', authMiddleware, salleController.mesSalles);

router.post('/fermer', authMiddleware, salleController.fermerSalle);

module.exports = router;