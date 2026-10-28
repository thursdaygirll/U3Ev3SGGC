# E-Commerce Gateway & Dashboard - Composite API

Práctica de la **Unidad 3** de *Desarrollo Web Integral* (UTCh, Ingeniería en Desarrollo y Gestión de Software).

Una API compuesta (Composite / Aggregator) que consulta **tres servicios independientes** en paralelo y entrega **un solo JSON** al cliente, evitando que el frontend haga múltiples peticiones (*Chatty I/O*).

```
Cliente ──► GET /api/v1/product-summary/{id}
                 │
                 ├──► GET /microservices/products/{id}     (propio - Catálogo)
                 ├──► GET /microservices/inventory/{id}    (propio - Inventario)
                 └──► GET https://api.frankfurter.dev/v1/latest?from=USD&to=MXN  (terceros - Divisas)
```

## Requisitos

- Node.js 18 o superior (usa `fetch` nativo)

## Ejecución

```bash
npm install
npm start          # http://localhost:3000
npm test           # 11 pruebas automatizadas
```

Variables de entorno opcionales: `PORT`, `SERVICES_BASE_URL`, `EXCHANGE_API_URL`, `REQUEST_TIMEOUT_MS` (por defecto 3000).

### Sin internet (simulador de Frankfurter)

```bash
node scripts/mock-frankfurter.js                      # terminal 1
EXCHANGE_API_URL=http://localhost:4000 npm start      # terminal 2
```

## Endpoints

| Servicio | Tipo | Endpoint |
|---|---|---|
| Catálogo | Propio | `GET /microservices/products/{id}` |
| Inventario | Propio | `GET /microservices/inventory/{productId}` |
| Divisas | Terceros (Frankfurter) | `GET https://api.frankfurter.dev/v1/latest?from=USD&to=MXN` |
| **Composite API** | Propio | `GET /api/v1/product-summary/{id}` |

Productos de ejemplo: `P-101` (con stock), `P-102` (sin stock), `P-103` (poco stock).

### Ejemplo de respuesta (`GET /api/v1/product-summary/P-101`)

```json
{
  "product_id": "P-101",
  "title": "Laptop Gamer XYZ",
  "price_usd": 1200,
  "price_mxn": 20400,
  "stock_status": "IN_STOCK",
  "available_units": 15,
  "currency_conversion_source": "Frankfurter External API",
  "status": "SUCCESS"
}
```
*(`price_mxn` depende de la tasa del día.)*

## Manejo de errores y resiliencia

| Situación | Respuesta |
|---|---|
| Todo funciona | `200`, `status: SUCCESS` |
| Producto no existe | `404`, `status: NOT_FOUND` |
| Catálogo caído | `502`, `status: ERROR` |
| Inventario caído | `200`, `status: PARTIAL`, `stock_status: UNKNOWN` |
| Divisas caída / lenta / inválida | `200`, `status: PARTIAL`; usa la última tasa conocida o `price_mxn: null` |

Cada llamada tiene *timeout* (`AbortController`) y las respuestas parciales incluyen un arreglo `warnings`.

## Estructura

```
src/
  app.js, server.js, config.js
  routes/        products.js · inventory.js · composite.js
  services/      httpClient.js · productClient.js · inventoryClient.js · exchangeClient.js
  composite/     buildSummary.js · rateCache.js
  data/          products.js · inventory.js
test/            composite.test.js
scripts/         mock-frankfurter.js
postman/         ecommerce-gateway.postman_collection.json
requests.http
```

## Flujo de ramas (Feature Branch / Gitflow)

- `main`: solo código estable; **no se hacen commits ni push directos**.
- `develop`: integración. Las ramas `feature/*` se fusionan aquí con `--no-ff`.
- Ramas: `feature/project-setup`, `catalog-service`, `inventory-service`, `exchange-client`, `composite-api`, `error-handling`, `tests-and-docs`.
- Al final, `develop` → `main` mediante Pull Request.
