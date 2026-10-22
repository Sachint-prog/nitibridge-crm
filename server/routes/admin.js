const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/dashboard', adminController.getDashboard);
// Employee Management Section
router.get('/employees', adminController.getEmployees);
router.post('/employee', adminController.createEmployee);
router.post('/employee/edit/:id', adminController.editEmployee);
router.get('/employee/delete/:id', adminController.deleteEmployee);

// Target Assignment Section
router.get('/targets', adminController.getTargets);
router.post('/targets/:id', adminController.updateTarget);

// Client Categorization Section
router.get('/clients', adminController.getClients);
router.post('/client/edit/:id', adminController.updateClientType);

// Payment Management Section
router.get('/payments', adminController.getAllPayments);
router.put('/payment/:id', adminController.editPayment);
router.post('/change-password', adminController.changePassword);
router.post('/update-profile', adminController.updateProfile);
router.post('/update-settings', adminController.updateSettings);
router.get('/top-performers', adminController.getTopPerformers);

module.exports = router;
