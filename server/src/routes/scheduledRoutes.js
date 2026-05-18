const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getScheduledPayments,
  createScheduledPayment,
  updateScheduledPayment,
  deleteScheduledPayment,
} = require('../controllers/scheduledController');

router.use(protect);

router.get('/', getScheduledPayments);
router.post('/', createScheduledPayment);
router.put('/:id', updateScheduledPayment);
router.delete('/:id', deleteScheduledPayment);

module.exports = router;