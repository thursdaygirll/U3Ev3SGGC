const { Router } = require('express');
const { getProduct } = require('../services/productClient');
const { getInventory } = require('../services/inventoryClient');
const { getExchangeRate } = require('../services/exchangeClient');
const { buildSummary } = require('../composite/buildSummary');

const router = Router();

// Composite API: GET /api/v1/product-summary/:id
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    // Las 3 peticiones se lanzan en paralelo. allSettled espera a todas y
    // NO falla si una se rechaza: cada resultado trae su estado.
    const results = await Promise.allSettled([
      getProduct(id),
      getInventory(id),
      getExchangeRate(),
    ]);

    const { httpStatus, body } = buildSummary(id, results);
    res.status(httpStatus).json(body);
  } catch (err) {
    next(err); // error inesperado -> manejador global
  }
});

module.exports = router;
