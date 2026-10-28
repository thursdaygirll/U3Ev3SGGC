const { Router } = require('express');
const inventory = require('../data/inventory');

const router = Router();

// Microservicio 2 - Inventario: GET /microservices/inventory/:productId
router.get('/:productId', (req, res) => {
  const item = inventory[req.params.productId];
  if (!item) {
    return res.status(404).json({
      status: 'ERROR',
      message: `Sin registro de inventario para ${req.params.productId}`,
    });
  }
  res.json(item);
});

module.exports = router;
