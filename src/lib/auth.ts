import crypto from "crypto";
import { cookies } from "next/headers";

const ITERATIONS = 310000;
const SESSION_COOKIE = "halloween_admin";

type AdminAccount = {
  username: string;
  salt: string;
  hash: string;
};

export const adminAccounts: AdminAccount[] = [
  {
    username: "Adminstrador1",
    salt: "36c779bb25c7ca1245241c3f26150619",
    hash: "894e0a10bd85b863cc8ba78b5b1a9f4aa74fdf06c942b52abe7a4490f4089f09"
  },
  {
    username: "Adminstrador2",
    salt: "2d5ae92e8f424a072bc4bacab4e6e894",
    hash: "e4dad0476acc699f71dd8aabda213f7df13fbefa4de4f63f2ab49da84ccd3700"
  },
  {
    username: "Adminstrador3",
    salt: "562e1777e92bb08a5daadaec473aa6e4",
    hash: "430ac7f1f84bf3d339601c3210b4fd0d58459f9bc5f54725d135e41e0f8ec2bd"
  }
];

function secret() {
  return process.env.AUTH_SECRET || "dev-only-halloween-alzare-secret";
}

function pbkdf2(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, Buffer.from(salt, "hex"), ITERATIONS, 32, "sha256").toString("hex");
}

function sign(username: string) {
  return crypto.createHmac("sha256", secret()).update(username).digest("hex");
}

export function verifyPassword(username: string, password: string) {
  const account = adminAccounts.find((admin) => admin.username === username);
  if (!account) return false;
  const hash = pbkdf2(password, account.salt);
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(account.hash, "hex"));
}

export async function createSession(username: string) {
  const token = `${username}.${sign(username)}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [username, signature] = token.split(".");
  if (!username || !signature) return null;
  return signature === sign(username) ? username : null;
}
