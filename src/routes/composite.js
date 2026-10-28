const { Router } = require('express');
const { getProduct } = require('../services/productClient');
const { getInventory } = require('../services/inventoryClient');
const { getExchangeRate } = require('../services/exchangeClient');
const { buildSummary } = require('../composite/buildSummary');

const router = Router();

// Composite API: GET /api/v1/product-summary/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  // Las 3 peticiones se lanzan en paralelo (una sola espera de red).
  const [product, inventory, exchange] = await Promise.all([
    getProduct(id),
    getInventory(id),
    getExchangeRate(),
  ]);

  res.json(buildSummary(product, inventory, exchange));
});

module.exports = router;
