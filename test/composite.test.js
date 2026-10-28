const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const config = require('../src/config');
const rateCache = require('../src/composite/rateCache');
const { createApp } = require('../src/app');

// --- Doble de prueba de la API externa (imita la forma de Frankfurter) ---
let exchangeServer;
let exchangeMode = 'ok'; // ok | error | slow | invalid

function startExchangeMock() {
  return new Promise((resolve) => {
    exchangeServer = http.createServer((req, res) => {
      if (exchangeMode === 'error') {
        res.writeHead(500).end();
      } else if (exchangeMode === 'slow') {
        setTimeout(() => res.writeHead(200).end('{}'), 1500);
      } else if (exchangeMode === 'invalid') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ base: 'USD', rates: {} }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-28', rates: { MXN: 17 } }));
      }
    });
    exchangeServer.listen(0, () => resolve(exchangeServer.address().port));
  });
}

let appServer;
let base;
const realFetch = global.fetch;

before(async () => {
  const exchangePort = await startExchangeMock();
  config.exchangeApiUrl = `http://localhost:${exchangePort}`;
  config.requestTimeoutMs = 300;

  await new Promise((resolve) => {
    appServer = createApp().listen(0, () => resolve());
  });
  const port = appServer.address().port;
  config.servicesBaseUrl = `http://localhost:${port}`;
  base = `http://localhost:${port}`;
});

after(() => {
  appServer.close();
  exchangeServer.close();
});

beforeEach(() => {
  exchangeMode = 'ok';
  rateCache.clear();
  global.fetch = realFetch;
});

const getSummary = async (id) => {
  const res = await fetch(`${base}/api/v1/product-summary/${id}`);
  return { status: res.status, body: await res.json() };
};

test('microservicio de catálogo responde el producto', async () => {
  const res = await fetch(`${base}/microservices/products/P-101`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).name, 'Laptop Gamer XYZ');
});

test('microservicio de inventario responde el stock', async () => {
  const res = await fetch(`${base}/microservices/inventory/P-101`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).available_units, 15);
});

test('composite: caso exitoso consolida los 3 servicios', async () => {
  const { status, body } = await getSummary('P-101');
  assert.equal(status, 200);
  assert.deepEqual(body, {
    product_id: 'P-101',
    title: 'Laptop Gamer XYZ',
    price_usd: 1200,
    price_mxn: 20400,
    stock_status: 'IN_STOCK',
    available_units: 15,
    currency_conversion_source: 'Frankfurter External API',
    status: 'SUCCESS',
  });
});

test('composite: producto sin stock -> OUT_OF_STOCK', async () => {
  const { body } = await getSummary('P-102');
  assert.equal(body.stock_status, 'OUT_OF_STOCK');
  assert.equal(body.available_units, 0);
});

test('composite: producto inexistente -> 404', async () => {
  const { status, body } = await getSummary('NOPE');
  assert.equal(status, 404);
  assert.equal(body.status, 'NOT_FOUND');
});

test('composite: API de divisas caída -> PARTIAL con price_mxn null', async () => {
  exchangeMode = 'error';
  const { status, body } = await getSummary('P-101');
  assert.equal(status, 200);
  assert.equal(body.status, 'PARTIAL');
  assert.equal(body.price_mxn, null);
  assert.equal(body.available_units, 15);
  assert.ok(body.warnings.length >= 1);
});

test('composite: API de divisas lenta -> timeout y PARTIAL', async () => {
  exchangeMode = 'slow';
  const t0 = Date.now();
  const { body } = await getSummary('P-101');
  assert.equal(body.status, 'PARTIAL');
  assert.ok(Date.now() - t0 < 1200, 'debe cortar por timeout y no esperar 1.5 s');
  assert.match(body.warnings[0], /timeout/);
});

test('composite: respuesta externa inválida -> PARTIAL', async () => {
  exchangeMode = 'invalid';
  const { body } = await getSummary('P-101');
  assert.equal(body.status, 'PARTIAL');
  assert.equal(body.price_mxn, null);
});

test('composite: si falla divisas usa la última tasa conocida', async () => {
  await getSummary('P-101'); // éxito: llena el caché
  exchangeMode = 'error';
  const { body } = await getSummary('P-101');
  assert.equal(body.status, 'PARTIAL');
  assert.equal(body.price_mxn, 20400);
  assert.match(body.currency_conversion_source, /caché/);
});

test('composite: inventario caído -> PARTIAL con stock UNKNOWN', async () => {
  global.fetch = (url, opts) =>
    String(url).includes('/microservices/inventory/')
      ? Promise.reject(new Error('ECONNREFUSED'))
      : realFetch(url, opts);

  const { status, body } = await getSummary('P-101');
  assert.equal(status, 200);
  assert.equal(body.status, 'PARTIAL');
  assert.equal(body.stock_status, 'UNKNOWN');
  assert.equal(body.available_units, null);
  assert.equal(body.price_mxn, 20400);
});

test('composite: catálogo caído -> 502', async () => {
  global.fetch = (url, opts) =>
    String(url).includes('/microservices/products/')
      ? Promise.reject(new Error('ECONNREFUSED'))
      : realFetch(url, opts);

  const { status, body } = await getSummary('P-101');
  assert.equal(status, 502);
  assert.equal(body.status, 'ERROR');
});
