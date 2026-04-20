import type { SignOptions } from "jsonwebtoken";

type AuthConfig = {
  secret: string;
  secret_expires_in: string;
  refresh_secret: string;
  refresh_secret_expires_in: SignOptions['expiresIn'];
};

const authConfig: AuthConfig = {
  secret: process.env.AUTH_SECRET as string,
  secret_expires_in: process.env.AUTH_SECRET_EXPIRES_IN as string,
  refresh_secret: process.env.AUTH_REFRESH_SECRET as string,
  refresh_secret_expires_in: process.env.AUTH_REFRESH_SECRET_EXPIRES_IN as SignOptions['expiresIn'],
};
export default authConfig;