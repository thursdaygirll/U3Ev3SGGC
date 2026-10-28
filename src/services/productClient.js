const config = require('../config');
const { fetchJson } = require('./httpClient');

// Cliente HTTP del Microservicio 1 (Catálogo).
function getProduct(id) {
  return fetchJson(
    'Catálogo',
    `${config.servicesBaseUrl}/microservices/products/${encodeURIComponent(id)}`
  );
}

module.exports = { getProduct };
