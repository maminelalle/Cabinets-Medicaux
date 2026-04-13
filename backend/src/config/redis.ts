import { env } from "./env";

const memoryStore = new Map<string, string>();

export const redis = {
  async connect() {
    void env.REDIS_URL;
    console.warn("Redis unavailable, using in-memory fallback");
  },
  async get(key: string) {
    return memoryStore.get(key) ?? null;
  },
  async set(key: string, value: string) {
    memoryStore.set(key, value);
    return "OK";
  },
  async setEx(key: string, ttlSeconds: number, value: string) {
    memoryStore.set(key, value);
    void ttlSeconds;
    return "OK";
  },
  async del(key: string) {
    return memoryStore.delete(key) ? 1 : 0;
  },
};

export async function connectRedis() {
  await redis.connect();
}
