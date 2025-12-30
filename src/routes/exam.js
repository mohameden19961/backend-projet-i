const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const auth = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
// Dans src/routes/exam.js
router.post('/create', auth, upload.single('sujet'), examController.createExam);
router.get('/all', auth, examController.getAllExams);
router.put('/:id', auth, examController.updateExam);
router.delete('/:id', auth, examController.deleteExam);

module.exports = router;