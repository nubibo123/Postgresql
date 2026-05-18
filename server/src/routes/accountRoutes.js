const express = require('express');
const router = express.Router();
const { getAccounts, getTransactions, transferMoney, depositMoney, withdrawMoney, getRecentTransactions, getSummary } = require('../controllers/accountController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All account routes are protected

router.get('/', getAccounts);
router.get('/recent-transactions', getRecentTransactions);
router.get('/summary', getSummary);
router.post('/transfer', transferMoney);
router.post('/deposit', depositMoney);
router.post('/withdraw', withdrawMoney);
router.get('/:accountId/transactions', getTransactions);

module.exports = router;
