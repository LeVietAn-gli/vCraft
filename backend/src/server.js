import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
const server = app.listen(env.port, () => {
  console.log(`vCraft API running on http://localhost:${env.port}`);
});
async function stop() {
  server.close();
  await prisma.$disconnect();
}
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
