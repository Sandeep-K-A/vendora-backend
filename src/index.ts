import "dotenv/config";
import { app } from "./server";
import { env } from "./lib/env";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM recieved, shutting down...");
  server.close();
  await prisma.$disconnect();
});
