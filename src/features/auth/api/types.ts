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
  /** Roles ticked on top of the main one (vande #071). */
  extraRoleIds?: number[];
  status: AuthStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  /**
   * The password was minted by an admin and emailed, so it has to be replaced
   * before the account is really theirs (#059).
   */
  mustChangePassword?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenExpires: number;
  user: AuthUser;
}

/** Two-step sign-in on: a code went by email, no session yet (vande-1411 #005). */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  challenge: string;
  sentTo: string;
  expiresInMinutes: number;
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
