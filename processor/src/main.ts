import * as dotenv from 'dotenv';
dotenv.config();

import { setupFastify } from './server/server';

(async () => {
  const server = await setupFastify();

  const HOST = '0.0.0.0';
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  try {
    await server.listen({
      port: PORT,
      host: HOST,
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
})();
