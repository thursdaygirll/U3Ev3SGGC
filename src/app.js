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

  // Manejador global de errores inesperados.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ status: 'ERROR', message: 'Error interno del servidor' });
  });

  return app;
}

module.exports = { createApp };
