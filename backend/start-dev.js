process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('ts-node').register({ transpileOnly: true });
require('dotenv').config({ override: true });
const { createServer } = require('node:http');
const { prisma } = require('./src/lib/prisma');
const { initSocketIO } = require('./src/socket');

const app = require('./src/app').default || require('./src/app');
const server = createServer(app);
initSocketIO(server);

Promise.race([
  prisma.$connect(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 10000))
]).then(() => {
  console.log('[startup] DB connected, listening on 5000');
  server.listen(5000, '0.0.0.0');
}).catch(e => {
  console.log('[startup] Starting without DB:', e.message);
  server.listen(5000, '0.0.0.0');
});
