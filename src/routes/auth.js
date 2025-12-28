const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const auth = require('../middlewares/authMiddleware'); 

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/login', authController.login);
router.post('/logout', auth, authController.logout);
router.get('/users', auth, authController.getAllUsers); 
router.put('/users/:id', auth, authController.updateUser);
router.delete('/users/:id', auth, authController.deleteUser);


module.exports = router;