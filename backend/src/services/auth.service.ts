import { hashPass, verifyPass } from "@utils/hashPass";
import AuthRepository from "repositories/auth.repository";
import jwt from "jsonwebtoken";
import authConfig from "@config/auth.config";

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

interface RegisterResult {
  id: number;
  username: string;
  email: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface LoginResult {
  user: { id: number; username: string; email: string };
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
    const accessToken = jwt.sign({ userId: user.id }, authConfig.secret, {
      expiresIn: authConfig.secret_expires_in as any,
    });
    const refreshToken = jwt.sign(
      { userId: user.id },
      authConfig.refresh_secret,
      { expiresIn: authConfig.refresh_secret_expires_in as any }
    );
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }
}
