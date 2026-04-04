export interface AuthPhoto {
  id: string;
  path: string;
}

export interface AuthRole {
  id: number;
  name: string;
}

export interface AuthStatus {
  id: number;
  name: string;
}

export interface AuthUser {
  id: number;
  email: string;
  provider: string;
  socialId: string;
  firstName: string;
  lastName: string;
  photo: AuthPhoto | null;
  role: AuthRole;
  status: AuthStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
