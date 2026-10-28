const { Router } = require('express');
const products = require('../data/products');

const router = Router();

// Microservicio 1 - Catálogo: GET /microservices/products/:id
router.get('/:id', (req, res) => {
  const product = products[req.params.id];
  if (!product) {
    return res
      .status(404)
      .json({ status: 'ERROR', message: `Producto ${req.params.id} no encontrado` });
  }
  res.json(product);
});

module.exports = router;
