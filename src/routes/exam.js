const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const auth = require('../middlewares/authMiddleware');

router.post('/create', auth, examController.createExam);
router.get('/', auth, examController.getAllExams);

router.put('/:id', auth, examController.updateExam);

router.delete('/:id', auth, examController.deleteExam);

module.exports = router;