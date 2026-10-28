// Simulador local de Frankfurter, SOLO para pruebas sin internet.
// Uso:  node scripts/mock-frankfurter.js
//       EXCHANGE_API_URL=http://localhost:4000 npm start
const http = require('node:http');

http
  .createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ amount: 1, base: 'USD', date: '2026-10-28', rates: { MXN: 17 } }));
  })
  .listen(4000, () => console.log('Mock de Frankfurter en http://localhost:4000'));
