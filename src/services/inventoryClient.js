const config = require('../config');
const { fetchJson } = require('./httpClient');

// Cliente HTTP del Microservicio 2 (Inventario y Almacén).
function getInventory(productId) {
  return fetchJson(
    'Inventario',
    `${config.servicesBaseUrl}/microservices/inventory/${encodeURIComponent(productId)}`
  );
}

module.exports = { getInventory };
