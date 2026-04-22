import app from "./app";
import { env } from "./config/env";
import { connectRedis } from "./config/redis";

const PORT = env.PORT;

async function main() {
  await connectRedis();
  app.listen(PORT, () => {
    console.warn(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
