const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes here are admin only
router.use(authMiddleware, roleMiddleware(['admin']));

router.get('/data-management', dataController.getDataManagementPage);
router.get('/data/export/:type', dataController.exportData);
router.post('/data/import/:type', upload.single('file'), dataController.importData);
router.get('/data/template/:type', dataController.downloadTemplate);

module.exports = router;
