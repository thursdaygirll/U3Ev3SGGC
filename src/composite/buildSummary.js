/**
 * Consolida las respuestas de los 3 servicios en el contrato JSON final.
 * Recibe los resultados de Promise.allSettled y decide qué responder:
 *
 *  - Catálogo caído / producto inexistente -> sin producto no hay respuesta útil
 *    (404 si no existe, 502 si el servicio falló).
 *  - Inventario caído -> respuesta PARTIAL con stock_status "UNKNOWN".
 *  - Divisas caído   -> respuesta PARTIAL usando la última tasa conocida
 *                       (si existe) o price_mxn = null.
 */
const rateCache = require('./rateCache');

function stockStatus(units) {
  if (units > 5) return 'IN_STOCK';
  if (units > 0) return 'LOW_STOCK';
  return 'OUT_OF_STOCK';
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function buildSummary(productId, [productRes, inventoryRes, exchangeRes]) {
  const warnings = [];

  // 1) Catálogo: obligatorio.
  if (productRes.status === 'rejected') {
    const err = productRes.reason;
    if (err && err.status === 404) {
      return {
        httpStatus: 404,
        body: { product_id: productId, status: 'NOT_FOUND', message: 'Producto no encontrado' },
      };
    }
    return {
      httpStatus: 502,
      body: {
        product_id: productId,
        status: 'ERROR',
        message: 'El servicio de catálogo no está disponible',
        warnings: [err.message],
      },
    };
  }
  const product = productRes.value;

  // 2) Inventario: opcional.
  let availableUnits = null;
  let stock = 'UNKNOWN';
  if (inventoryRes.status === 'fulfilled') {
    availableUnits = inventoryRes.value.available_units;
    stock = stockStatus(availableUnits);
  } else {
    warnings.push(inventoryRes.reason.message);
  }

  // 3) Divisas: opcional, con respaldo en la última tasa conocida.
  let priceMxn = null;
  let source = null;
  if (exchangeRes.status === 'fulfilled') {
    rateCache.save(exchangeRes.value);
    priceMxn = round2(product.price_usd * exchangeRes.value.rate);
    source = exchangeRes.value.source;
  } else {
    warnings.push(exchangeRes.reason.message);
    const cached = rateCache.get();
    if (cached) {
      priceMxn = round2(product.price_usd * cached.rate);
      source = `${cached.source} (tasa en caché del ${cached.cachedAt})`;
      warnings.push('Se usó la última tasa de cambio conocida');
    }
  }

  const body = {
    product_id: product.product_id,
    title: product.name,
    price_usd: product.price_usd,
    price_mxn: priceMxn,
    stock_status: stock,
    available_units: availableUnits,
    currency_conversion_source: source,
    status: warnings.length === 0 ? 'SUCCESS' : 'PARTIAL',
  };
  if (warnings.length > 0) body.warnings = warnings;

  return { httpStatus: 200, body };
}

module.exports = { buildSummary, stockStatus };
