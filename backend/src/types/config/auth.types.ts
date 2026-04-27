import type { SignOptions } from "jsonwebtoken";

export type AuthConfig = {
  secret: string;
  secret_expires_in: string;
  refresh_secret: string;
  refresh_secret_expires_in: SignOptions["expiresIn"];
};
