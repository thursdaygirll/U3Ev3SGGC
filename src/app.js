const express = require('express');

function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'UP' }));

  // Aquí se registran las rutas de cada microservicio y de la API compuesta.

  app.use((req, res) => {
    res.status(404).json({ status: 'ERROR', message: 'Ruta no encontrada' });
  });

  return app;
}

module.exports = { createApp };
