import prisma from "db";

class AuthRepository {
  static async createUser(data: {
    username: string;
    email: string;
    password: string;
  }) {
    return prisma.user.create({
      data,
      select: { id: true, username: true, email: true },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true, password: true },
    });
  }

  static async findIdByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  }

  static async updatePassword(id: number, password: string) {
    return prisma.user.update({
        where: {id},
        data: {password},
        select: {id: true, username: true, email: true}
    })
  }
}

export default AuthRepository;
