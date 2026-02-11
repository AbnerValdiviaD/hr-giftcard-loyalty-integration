import { FastifyInstance } from 'fastify';

/**
 * Simple health check plugin
 * Provides a basic health endpoint that responds immediately
 */
export default async function (server: FastifyInstance) {
  // Root health check - responds immediately
  server.get('/', async () => {
    return {
      status: 'OK',
      message: 'Harry Rosen Gift Card Connector is running',
      timestamp: new Date().toISOString(),
    };
  });

  // Additional health endpoint
  server.get('/health', async () => {
    return {
      status: 'OK',
      service: 'processor',
      timestamp: new Date().toISOString(),
    };
  });

  // Readiness probe
  server.get('/ready', async () => {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  });

  // Liveness probe
  server.get('/live', async () => {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  });
}
