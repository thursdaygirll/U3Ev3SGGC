const { createApp } = require('./app');
const config = require('./config');

createApp().listen(config.port, () => {
  console.log(`E-Commerce Gateway escuchando en http://localhost:${config.port}`);
});
