import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nkcs-sports-flow-heritage-secret-key-2026-super-secure"
);

export interface AuthSession {
  userId: string;
  username: string;
  role: "ADMIN" | "COACH" | "PLAYER";
  nameEn: string;
  nameZh: string;
}

export async function signSessionToken(session: AuthSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      role: payload.role as "ADMIN" | "COACH" | "PLAYER",
      nameEn: payload.nameEn as string,
      nameZh: payload.nameZh as string,
    };
  } catch {
    return null;
  }
}
