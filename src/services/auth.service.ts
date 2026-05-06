import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { RegisterRequest, LoginRequest, JWTPayload } from "../types";
import { AppError } from "../utils/AppError";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterRequest) {
    const { username, email, password, fullName, role, trackId } = data;

    if (!username || !email || !password || !fullName || !role || !trackId) {
      throw new AppError("All fields are required", 400);
    }

    const existingUser = await this.userRepository.findByUsernameOrEmail(username, email);
    if (existingUser) {
      throw new AppError("Username or email already exists", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      role,
      track: { connect: { id: parseInt(trackId.toString()) } },
      // Note: Assuming status is added to prisma schema later. For now, matching existing fields.
    });

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
  }

  async login(data: LoginRequest) {
    const { username, password } = data;

    if (!username || !password) {
      throw new AppError("Username and password are required", 400);
    }

    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError("Invalid credentials", 401);
    }

    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role as any,
      trackId: user.trackId,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        trackId: user.trackId,
      },
    };
  }
}
