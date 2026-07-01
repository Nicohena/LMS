process.env.NODE_ENV = process.env.NODE_ENV || 'development';
require('ts-node').register({ transpileOnly: true });
require('dotenv').config({ override: true });
console.error('[startup] env loaded');

const express = require('express');
const { createServer } = require('node:http');
const { prisma } = require('./src/lib/prisma');

console.error('[startup] loading app...');
const app = require('./src/app').default || require('./src/app');
console.error('[startup] app loaded');

const server = createServer(app);
console.error('[startup] server created');

server.listen(5000, '0.0.0.0', () => {
  console.error('[startup] listening on 5000');
});

server.on('error', (e) => {
  console.error('[startup] server error:', e.message);
});

// Handle signals
process.on('SIGTERM', () => { server.close(); process.exit(0); });
process.on('SIGINT', () => { server.close(); process.exit(0); });
