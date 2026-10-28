const config = require('../config');

/**
 * Error propio para fallos al consumir un servicio upstream.
 * Guarda el nombre del servicio y el código HTTP (si hubo respuesta).
 */
class UpstreamError extends Error {
  constructor(service, message, { status = null, cause = null } = {}) {
    super(`[${service}] ${message}`);
    this.name = 'UpstreamError';
    this.service = service;
    this.status = status;
    this.cause = cause;
  }
}

/**
 * GET JSON con timeout (AbortController). Lanza UpstreamError ante:
 *  - timeout, - error de red, - respuesta HTTP no exitosa, - JSON inválido.
 */
async function fetchJson(service, url, timeoutMs = config.requestTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UpstreamError(service, `respondió HTTP ${response.status}`, {
        status: response.status,
      });
    }

    try {
      return await response.json();
    } catch (err) {
      throw new UpstreamError(service, 'devolvió un JSON inválido', { cause: err });
    }
  } catch (err) {
    if (err instanceof UpstreamError) throw err;
    if (err.name === 'AbortError') {
      throw new UpstreamError(service, `timeout tras ${timeoutMs} ms`, { cause: err });
    }
    throw new UpstreamError(service, `no disponible (${err.message})`, { cause: err });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { fetchJson, UpstreamError };
