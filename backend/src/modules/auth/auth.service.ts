import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client";
import { redis } from "../../config/redis";
import { env } from "../../config/env";

export async function login(email: string, password: string) {
  // 1. Trouver le compte
  const compte = await prisma.compte.findUnique({ where: { email } });
  if (!compte || compte.statut !== "ACTIF") {
    throw new Error("Identifiants invalides");
  }

  // 2. Vérifier le mot de passe
  const valid = await bcrypt.compare(password, compte.motDePasse);
  if (!valid) {
    throw new Error("Identifiants invalides");
  }

  // 3. Générer les tokens
  const accessToken = jwt.sign(
    { id: compte.id, role: compte.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { id: compte.id },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN } as jwt.SignOptions
  );

  // 4. Stocker le refresh token dans Redis (7 jours = 604800 secondes)
  await redis.setEx(`refresh:${compte.id}`, 604800, refreshToken);

  return { accessToken, refreshToken, role: compte.role };
}

export async function refreshAccessToken(token: string) {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as jwt.JwtPayload;
  } catch {
    throw new Error("Refresh token invalide");
  }

  const stored = await redis.get(`refresh:${payload.id}`);
  if (!stored || stored !== token) {
    throw new Error("Refresh token révoqué");
  }

  const compte = await prisma.compte.findUnique({ where: { id: payload.id } });
  if (!compte || compte.statut !== "ACTIF") {
    throw new Error("Compte inactif");
  }

  const accessToken = jwt.sign(
    { id: compte.id, role: compte.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  return { accessToken };
}

export async function logout(compteId: string) {
  await redis.del(`refresh:${compteId}`);
}
