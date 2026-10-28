// Configuración central. Todo se puede sobreescribir con variables de entorno.
const port = Number(process.env.PORT) || 3000;

module.exports = {
  port,
  // URL base donde viven los microservicios propios. Por defecto es esta misma
  // app, pero se consumen por HTTP real (no por llamadas a funciones) para que
  // se comporten como servicios independientes.
  servicesBaseUrl: process.env.SERVICES_BASE_URL || `http://localhost:${port}`,
  // API externa de tipo de cambio (Frankfurter). Configurable para pruebas.
  exchangeApiUrl: process.env.EXCHANGE_API_URL || 'https://api.frankfurter.app',
  exchangeSourceName: 'Frankfurter External API',
  baseCurrency: 'USD',
  targetCurrency: 'MXN',
  // Tiempo máximo de espera por cada servicio (ms).
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS) || 3000,
};
