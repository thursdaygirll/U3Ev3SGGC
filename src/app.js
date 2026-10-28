const express = require('express');
const productsRouter = require('./routes/products');
const inventoryRouter = require('./routes/inventory');
const compositeRouter = require('./routes/composite');

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'UP' }));

  app.use('/microservices/products', productsRouter);
  app.use('/microservices/inventory', inventoryRouter);
  app.use('/api/v1/product-summary', compositeRouter);

  app.use((req, res) => {
    res.status(404).json({ status: 'ERROR', message: 'Ruta no encontrada' });
  });

  return app;
}

module.exports = { createApp };
