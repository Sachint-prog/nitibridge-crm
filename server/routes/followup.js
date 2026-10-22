const express = require('express');
const router = express.Router();
const followUpController = require('../controllers/followUpController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Both Admin and Employee can view follow ups
router.get('/', roleMiddleware(['admin', 'employee']), followUpController.getFollowUps);

// Employee polling endpoint for Toast
router.get('/upcoming', roleMiddleware(['employee']), followUpController.getUpcoming);

// Only Employee to schedule
router.post('/', roleMiddleware(['employee']), followUpController.addFollowUp);
router.post('/toggle-status/:id', roleMiddleware(['employee']), followUpController.toggleStatus);

module.exports = router;
