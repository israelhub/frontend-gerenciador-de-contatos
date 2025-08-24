export type User = {
  id: string;
  nome: string;
  email: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type Contact = {
  id: string;
  nome: string;
  telefone: string; // 11 dígitos sem máscara
  email?: string;
  categoria?: string;
  foto?: string; // url
  ownerId: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Pagination<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ApiErrorShape = {
  statusCode: number;
  message: string | string[] | "Erro de validação";
  fields?: Record<string, string[]>;
  error: string;
};

export type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
export type RegisterResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
export type RefreshResponse = { accessToken: string; refreshToken: string };
export type MessageResponse = { message: string };

export type CreateContactDto = {
  nome: string;
  telefone: string; // 11 dígitos
  email?: string;
  categoria?: string;
  foto?: string; // Base64 string
};

export type UpdateContactDto = Partial<CreateContactDto>;
