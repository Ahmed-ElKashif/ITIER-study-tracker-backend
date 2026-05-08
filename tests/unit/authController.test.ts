import { Request, Response, NextFunction } from "express";
import { register, login } from "../../src/controllers/auth.controller";
import * as authService from "../../src/services/auth.service";

jest.mock("../../src/services/auth.service");

describe("Auth Controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    next = jest.fn() as unknown as NextFunction;
    req = {};
    res = {
      json: jsonMock,
      status: statusMock,
    };
    jest.clearAllMocks();
  });

  describe("register", () => {
    it("should register a user successfully", async () => {
      const mockResult = {
        userId: 1,
        username: "newuser",
        track: 1,
        status: "PENDING_APPROVAL",
      };
      (authService.registerUser as jest.Mock).mockResolvedValue(mockResult);

      req.body = {
        username: "newuser",
        email: "newuser@test.com",
        password: "password123",
        fullName: "New User",
        trackId: 1,
      };

      await register(req as Request, res as Response, next);

      expect(authService.registerUser).toHaveBeenCalledWith(req.body);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
      });
    });

    it("should handle registration errors", async () => {
      const error = new Error("Username already exists");
      (error as any).statusCode = 400;
      (authService.registerUser as jest.Mock).mockRejectedValue(error);

      req.body = {
        username: "existinguser",
        email: "test@test.com",
        password: "password123",
        fullName: "Test User",
        trackId: 1,
      };

      await register(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Username already exists" });
    });
  });

  describe("login", () => {
    it("should login a user successfully", async () => {
      const mockResult = {
        token: "fake-jwt-token",
        user: {
          id: 1,
          username: "testuser",
          role: "STUDENT",
          status: "ACTIVE",
          fullName: "Test User",
        },
      };
      (authService.loginUser as jest.Mock).mockResolvedValue(mockResult);

      req.body = {
        username: "testuser",
        password: "password123",
      };

      await login(req as Request, res as Response, next);

      expect(authService.loginUser).toHaveBeenCalledWith(req.body);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: mockResult });
    });

    it("should handle login errors (e.g. invalid credentials)", async () => {
      const error = new Error("Invalid username or password");
      (error as any).statusCode = 401;
      (authService.loginUser as jest.Mock).mockRejectedValue(error);

      req.body = {
        username: "testuser",
        password: "wrongpassword",
      };

      await login(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid username or password" });
    });

    it("should handle login errors for suspended users", async () => {
      const error = new Error("Your account has been suspended");
      (error as any).statusCode = 403;
      (error as any).data = { status: "SUSPENDED", errorCode: "SUSPENDED" };
      (authService.loginUser as jest.Mock).mockRejectedValue(error);

      req.body = {
        username: "suspendeduser",
        password: "password123",
      };

      await login(req as Request, res as Response, next);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Your account has been suspended",
        status: "SUSPENDED",
        errorCode: "SUSPENDED",
      });
    });
  });
});
