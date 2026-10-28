/**
 * Consolida las respuestas de los 3 servicios en el contrato JSON final.
 */
function stockStatus(units) {
  if (units > 5) return 'IN_STOCK';
  if (units > 0) return 'LOW_STOCK';
  return 'OUT_OF_STOCK';
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function buildSummary(product, inventory, exchange) {
  return {
    product_id: product.product_id,
    title: product.name,
    price_usd: product.price_usd,
    price_mxn: round2(product.price_usd * exchange.rate),
    stock_status: stockStatus(inventory.available_units),
    available_units: inventory.available_units,
    currency_conversion_source: exchange.source,
    status: 'SUCCESS',
  };
}

module.exports = { buildSummary, stockStatus };
