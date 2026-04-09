// --- API User types ---

export type User = {
  id: number;
  email: string;
  provider: string;
  socialId: string | null;
  firstName: string;
  lastName: string;
  photo: { id: string; path: string } | null;
  role: { id: number; name: string };
  status: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  filters?: string;
  sort?: string;
};

export type UsersResponse = {
  data: User[];
  hasNextPage: boolean;
};

export type CreateUserPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  photo?: { id: string };
  role?: { id: number };
  status?: { id: number };
};

export type UpdateUserPayload = {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  photo?: { id: string };
  role?: { id: number };
  status?: { id: number };
};
