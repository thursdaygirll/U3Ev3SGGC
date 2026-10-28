const express = require('express');
const productsRouter = require('./routes/products');

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'UP' }));

  app.use('/microservices/products', productsRouter);
  // Aquí se registran las demás rutas (inventario y API compuesta).

  app.use((req, res) => {
    res.status(404).json({ status: 'ERROR', message: 'Ruta no encontrada' });
  });

  return app;
}

module.exports = { createApp };
