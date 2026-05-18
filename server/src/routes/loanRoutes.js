const express = require('express');
const router = express.Router();
const { getLoans, applyLoan, updateLoanStatus, deleteLoan } = require('../controllers/loanController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getLoans);
router.post('/', applyLoan);
router.patch('/:id', updateLoanStatus);
router.delete('/:id', deleteLoan);

module.exports = router;