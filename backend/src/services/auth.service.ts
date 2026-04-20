import { hashPass, hashRefreshToken, verifyPass } from "@utils/hashPass";
import AuthRepository from "repositories/auth.repository";
import jwt from "jsonwebtoken";
import authConfig from "@config/auth.config";
import type { UserRole } from "generated/prisma";

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface RegisterResult {
  userId: number;
  username: string;
  email: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResult {
  user: {
    userId: number;
    username: string;
    email: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  static async register(input: RegisterInput): Promise<RegisterResult> {
    const existingUser = await AuthRepository.findIdByEmail(input.email);
    if (existingUser) {
      throw new Error("Email already in use");
    }
    const hashedPass = await hashPass(input.password);
    const newUser = await AuthRepository.createUser({
      ...input,
      password: hashedPass,
    });
    return newUser;
  }

  static async login(input: LoginInput): Promise<LoginResult> {
    const user = await AuthRepository.findByEmail(input.email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isPasswordValid = await verifyPass(input.password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const accessToken = jwt.sign({ userId: user.userId }, authConfig.secret, {
      expiresIn: authConfig.secret_expires_in as any,
    });

    const refreshToken = jwt.sign(
      { userId: user.userId },
      authConfig.refresh_secret,
      { expiresIn: authConfig.refresh_secret_expires_in }
    );
    const hashedRefreshToken = await hashRefreshToken(refreshToken);
    const decodedRefresh = jwt.verify(refreshToken, authConfig.refresh_secret);
    if (typeof decodedRefresh === "string")
      throw new Error("Invalid refresh token");

    const exp = (decodedRefresh as jwt.JwtPayload).exp;
    if (!exp) throw new Error("Invalid refresh token");
    const expiresAt = new Date(exp * 1000);

    const session = await AuthRepository.createSession(
      user.userId,
      hashedRefreshToken,
      expiresAt
    );
    if (!session) throw new Error("Failed to create session");

    return {
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  static async getMe(userId: number) {
    return AuthRepository.findPublicById(userId);
  }

  static async logoutCurrent(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, authConfig.refresh_secret);
    if (typeof decoded === "string") throw new Error("Invalid refresh token");

    const userId = decoded.userId;
    if (typeof userId !== "number")
      throw new Error("Invalid refresh token userId");

    const refreshHash = await hashRefreshToken(refreshToken);
    const sessions = await AuthRepository.findActiveSessionByUserId(userId);
    if (!sessions || sessions.length === 0)
      throw new Error("No active sessions found");
    const matchedSession = sessions.filter(
      (s) => s.refreshHash === refreshHash
    );
    if (matchedSession.length === 0)
      throw new Error("No active session found for this token");
    await Promise.all(
      matchedSession.map((s) => AuthRepository.revokeSessionById(s.id))
    );
    return { message: "Logged out successfully" };
  }

  static async logoutAll(userId: number) {
    if (typeof userId !== "number") throw new Error("Invalid userId");

    await AuthRepository.revokeSessionsByUserId(userId);
    return { message: "Logged out from all devices" };
  }

  static async logoutAllFromRefresh(refreshToken: string) {
    const decoded = jwt.verify(refreshToken, authConfig.refresh_secret);
    if (typeof decoded === "string") throw new Error("Invalid refresh token");
    const userId = decoded.userId;
    if (typeof userId !== "number")
      throw new Error("Invalid refresh token userId");

    const refreshHash = await hashRefreshToken(refreshToken);

    const sessions = await AuthRepository.findActiveSessionByUserId(userId);
    if (!sessions || sessions.length === 0)
      throw new Error("No active sessions found");
    const matched = sessions.filter((s) => s.refreshHash === refreshHash);
    if (matched.length === 0)
      throw new Error("No active session found for this token");
    await AuthRepository.revokeSessionsByUserId(userId);
    return { message: "Logged out from all devices" };
  }
}

export default AuthService;
