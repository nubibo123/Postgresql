const express = require('express');
const router = express.Router();
const { getAccounts, getTransactions, transferMoney, depositMoney, withdrawMoney } = require('../controllers/accountController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect); // All account routes are protected

router.get('/', getAccounts);
router.post('/transfer', transferMoney);
router.post('/deposit', depositMoney);
router.post('/withdraw', withdrawMoney);
router.get('/:accountId/transactions', getTransactions);

module.exports = router;
