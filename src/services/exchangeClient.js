const config = require('../config');
const { fetchJson, UpstreamError } = require('./httpClient');

const SERVICE = 'Divisas (Frankfurter)';

/**
 * Microservicio 3 - API externa de terceros.
 * Consulta el tipo de cambio USD -> MXN en Frankfurter:
 *   GET https://api.frankfurter.dev/v1/latest?from=USD&to=MXN
 *   -> { "amount": 1, "base": "USD", "date": "2026-10-28", "rates": { "MXN": 18.5 } }
 *
 * Devuelve un objeto ya transformado: { rate, date, source }.
 */
async function getExchangeRate() {
  const { baseCurrency, targetCurrency, exchangeApiUrl, exchangeSourceName } = config;
  const url = `${exchangeApiUrl}/latest?from=${baseCurrency}&to=${targetCurrency}`;

  const data = await fetchJson(SERVICE, url);

  // Mapeo/validación de la respuesta externa hacia nuestro contrato interno.
  const rate = data && data.rates ? data.rates[targetCurrency] : undefined;
  if (typeof rate !== 'number' || !(rate > 0)) {
    throw new UpstreamError(SERVICE, `no incluyó una tasa válida para ${targetCurrency}`);
  }

  return { rate, date: data.date || null, source: exchangeSourceName };
}

module.exports = { getExchangeRate };
