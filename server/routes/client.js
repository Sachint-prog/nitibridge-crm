const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(roleMiddleware(['client']));

router.get('/dashboard', clientController.getDashboard);

module.exports = router;
