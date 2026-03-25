import authConfig from "@config/auth.config";
import bcrypt from "bcrypt";
import crypto from "crypto";
export async function hashPass(pass: string): Promise<string> {
  return await bcrypt.hash(pass, 10);
}

export async function verifyPass(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

function getRefreshSecret(): string {
  const secret = authConfig.refresh_secret;
  if (!secret) throw new Error("Refresh secret is not set");
  return secret;
}

export async function hashRefreshToken(refreshToken: string): Promise<string> {
  const secret = getRefreshSecret();
  return await crypto
    .createHmac("sha256", secret)
    .update(refreshToken)
    .digest("hex");
}

export async function verifyRefreshToken(
  refreshToken: string,
  hashedRefreshToken: string
): Promise<boolean> {
  const computed = await hashRefreshToken(refreshToken);
  const a = Buffer.from(computed);
  const b = Buffer.from(hashedRefreshToken);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
