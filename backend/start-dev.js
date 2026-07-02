process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('ts-node').register({ transpileOnly: true });
require('dotenv').config({ override: true });
console.log('[startup] 1. env loaded');

const { createServer } = require('node:http');
const { prisma } = require('./src/lib/prisma');
const { initSocketIO } = require('./src/socket');

console.log('[startup] 2. loading app...');
const app = require('./src/app').default || require('./src/app');
console.log('[startup] 3. app loaded');

const server = createServer(app);
initSocketIO(server);

console.log('[startup] 4. connecting DB...');
Promise.race([
  prisma.$connect(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 10000))
]).then(() => {
  console.log('[startup] 5. DB connected, listening on 5000');
  server.listen(5000, '0.0.0.0');
}).catch(e => {
  console.log('[startup] 5. Starting without DB:', e.message);
  server.listen(5000, '0.0.0.0');
});
