const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authMiddleware);
router.use(roleMiddleware(['employee']));

router.get('/dashboard', employeeController.getDashboard);
router.post('/client', employeeController.createClient);
router.post('/payment', upload.single('paymentSS'), employeeController.addPayment);
router.get('/deals/:contactNumber', employeeController.getDeals);

module.exports = router;
