export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  trackId: number | string; // String from form body, service normalises to int
  // NOTE: role is NOT included — public registration is STUDENT only.
  // Supervisors are created by admins via POST /api/v1/admin/supervisors.
}

export interface JWTPayload {
  userId: number;
  username: string;
  role: "STUDENT" | "SUPERVISOR" | "ADMIN";
  trackId: number | null; // Null for admin users
}
