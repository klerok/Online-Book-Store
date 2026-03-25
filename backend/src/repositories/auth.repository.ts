import prisma from "db";

class AuthRepository {
  static async createUser(data: {
    username: string;
    email: string;
    password: string;
  }) {
    return prisma.user.create({
      data,
      select: { userId: true, username: true, email: true },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { userId: true, username: true, email: true, password: true },
    });
  }

  static async findIdByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { userId: true },
    });
  }

  static async findPublicById(userId: number) {
    return prisma.user.findUnique({
      where: { userId },
      select: { userId: true, username: true, email: true },
    });
  }

  static async updatePassword(userId: number, password: string) {
    return prisma.user.update({
      where: { userId },
      data: { password },
      select: { userId: true, username: true, email: true },
    });
  }

  static async createSession(
    userId: number,
    hashedRefreshToken: string,
    expiresAt: Date
  ) {
    return prisma.session.create({
      data: {
        userId,
        refreshHash: hashedRefreshToken,
        expiresAt,
      },
      select: { id: true },
    });
  }

  static async findActiveSessionByUserId(userId: number) {
    return prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { id: true, refreshHash: true },
    });
  }

  static async revokeSessionById(sessionId: number) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  static async revokeSessionsByUserId(userId: number) {
    return prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export default AuthRepository;
