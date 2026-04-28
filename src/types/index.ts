export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: "STUDENT" | "SUPERVISOR";
  trackId: number;
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: "STUDENT" | "SUPERVISOR";
  trackId: number;
}
