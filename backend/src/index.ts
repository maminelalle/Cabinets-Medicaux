import app from "./app";
import { connectRedis } from "./config/redis";
import { env } from "./config/env";

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
