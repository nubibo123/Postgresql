const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
  getCards,
  getCardById,
  createCard,
  updateCardStatus,
  deleteCard,
} = require('../controllers/cardController');

router.use(protect);

router.get('/', getCards);
router.post('/', createCard);
router.get('/:id', getCardById);
router.put('/:id/status', updateCardStatus);
router.delete('/:id', deleteCard);

module.exports = router;