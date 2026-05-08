import { prisma } from "../config/prisma";
import { User, Prisma } from "@prisma/client";

export class UserRepository {
  async findByUsernameOrEmail(username: string, email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() },
        ],
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data });
  }
}
