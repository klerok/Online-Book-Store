import type { UserRole } from "generated/prisma";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResult {
  userId: number;
  username: string;
  email: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  user: {
    userId: number;
    username: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}
