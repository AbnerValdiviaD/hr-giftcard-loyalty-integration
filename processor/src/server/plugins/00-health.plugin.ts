import { FastifyInstance } from 'fastify';

/**
 * Simple health check plugin
 * Provides a basic health endpoint that responds immediately
 */
export default async function (server: FastifyInstance) {
  // Log that this plugin is loading
  server.log.info('🚀🚀🚀 HEALTH CHECK PLUGIN LOADED - v0.1.4+ 🚀🚀🚀');
  server.log.info('Health check plugin registered - endpoints: /, /health, /ready, /live');

  // Root health check - responds immediately
  server.get('/', async (request, reply) => {
    server.log.info('ROOT HEALTH CHECK CALLED: /');
    return {
      status: 'OK',
      message: 'Harry Rosen Gift Card Connector is running - v0.1.4',
      timestamp: new Date().toISOString(),
    };
  });

  // Additional health endpoint
  server.get('/health', async (request, reply) => {
    server.log.info('HEALTH CHECK CALLED: /health');
    return {
      status: 'OK',
      service: 'processor',
      version: 'v0.1.4',
      timestamp: new Date().toISOString(),
    };
  });

  // Readiness probe
  server.get('/ready', async (request, reply) => {
    server.log.info('READINESS PROBE CALLED: /ready');
    return {
      ready: true,
      version: 'v0.1.4',
      timestamp: new Date().toISOString(),
    };
  });

  // Liveness probe
  server.get('/live', async (request, reply) => {
    server.log.info('LIVENESS PROBE CALLED: /live');
    return {
      alive: true,
      version: 'v0.1.4',
      timestamp: new Date().toISOString(),
    };
  });
}
