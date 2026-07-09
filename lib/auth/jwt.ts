import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = process.env.NEXTAUTH_SECRET || "microintern-development-jwt-secret-key-token-321";
const KEY = new TextEncoder().encode(SECRET_KEY);
const COOKIE_NAME = "microintern-token";

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(KEY);
}

export async function decrypt(input: string) {
  try {
    const { payload } = await jwtVerify(input, KEY, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await decrypt(token);
}

export async function setSessionCookie(payload: any) {
  const cookieStore = await cookies();
  const token = await encrypt(payload);
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
