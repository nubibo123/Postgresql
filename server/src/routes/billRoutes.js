const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getBillPayments,
  getBillById,
  payBill,
} = require('../controllers/billController');

router.use(protect);

router.get('/', getBillPayments);
router.post('/', payBill);
router.get('/:id', getBillById);

module.exports = router;