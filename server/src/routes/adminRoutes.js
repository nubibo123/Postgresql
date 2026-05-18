const express = require('express');
const router = express.Router();
const { getUsers, getAuditLogs, updateUserStatus, getLoans } = require('../controllers/adminController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.use(protect, admin); // All admin routes require admin privileges

router.get('/users', getUsers);
router.get('/audit-logs', getAuditLogs);
router.get('/loans', getLoans);
router.put('/users/:id/status', updateUserStatus);

module.exports = router;
