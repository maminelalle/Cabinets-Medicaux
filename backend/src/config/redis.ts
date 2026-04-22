import { createClient } from "redis";
import { env } from "./env";

export const redis = createClient({ url: env.REDIS_URL });
export let isRedisAvailable = false;

// On garde le listener pour les erreurs d'exécution, 
// mais on va arrêter la reconnexion automatique au démarrage
redis.on("error", (err) => console.error("Redis error:", err));

export async function connectRedis() {
  return;
  try {
    // Tentative de connexion avec un délai court
    await redis.connect();

    // Si on arrive ici, c'est bon
    isRedisAvailable = true;
    console.log("Redis connecté");

  } catch (error) {
    // Si Redis n'est pas là, on arrête le client pour qu'il cesse d'essayer
    console.warn("Redis indisponible. Activation du mode fallback (mémoire).");
    isRedisAvailable = false;

    // Cette commande arrête la boucle de reconnexion infinie
    redis.disconnect();
  }
}