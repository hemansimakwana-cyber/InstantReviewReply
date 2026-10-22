import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "rm_session";
const secret = () => process.env.SESSION_SECRET ?? "";

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

export function setSession(userId: string): void {
  if (!secret()) throw new Error("SESSION_SECRET is not set in .env.local.");
  cookies().set(COOKIE, `${userId}.${sign(userId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function getSessionUserId(): string | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw || !secret()) return null;
  const [id, sig] = raw.split(".");
  if (!id || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(id));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

export function clearSession(): void {
  cookies().delete(COOKIE);
}