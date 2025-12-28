const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const auth = require('../middlewares/authMiddleware');
const workController = require('../controllers/workController');

router.post('/submit', auth, upload.single('reponse'), workController.submitWork);
router.get('/all', auth, workController.getAllWorks);
router.get('/download/:filename', auth, workController.downloadWork);
module.exports = router;