// Última tasa de cambio conocida. Sirve como respaldo si la API externa falla.
let lastKnown = null;

module.exports = {
  save(exchange) {
    lastKnown = { ...exchange, cachedAt: new Date().toISOString() };
  },
  get() {
    return lastKnown;
  },
  clear() {
    lastKnown = null;
  },
};
