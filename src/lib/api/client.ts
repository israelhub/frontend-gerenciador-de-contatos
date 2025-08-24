import {
  ApiErrorShape,
  Contact,
  CreateContactDto,
  LoginResponse,
  MessageResponse,
  Pagination,
  RefreshResponse,
  RegisterResponse,
  UpdateContactDto,
  User,
} from "./types";

// URLs de desenvolvimento e produção
const LOCALHOST_URL = "http://localhost:8000/api";
const PRODUCTION_URL = "https://backend-gerenciador-de-contatos.onrender.com/api";

// Função para detectar a melhor BASE_URL considerando variáveis de ambiente e disponibilidade local
async function detectBaseUrl(): Promise<string> {
  // Se estiver no server-side, use a variável de ambiente ou localhost para desenvolvimento
  if (typeof window === "undefined") {
    // Em desenvolvimento, sempre tenta localhost primeiro
    if (process.env.NODE_ENV === "development") {
      return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || LOCALHOST_URL;
    }
    return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || PRODUCTION_URL;
  }

  // No client-side: se foi definida uma BASE_URL pública, honre-a primeiro
  const envBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (envBaseUrl) {
    console.log('🟢 Usando BASE_URL definida por env:', envBaseUrl);
    return envBaseUrl;
  }

  // Sem env explícita, tenta localhost primeiro
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos de timeout
    
    const response = await fetch(`${LOCALHOST_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('🟢 Usando servidor local:', LOCALHOST_URL);
      return LOCALHOST_URL;
    }
  } catch {
    console.log('🔴 Servidor local não disponível, usando produção:', PRODUCTION_URL);
  }
  
  return PRODUCTION_URL;
}

// Cache da BASE_URL para evitar múltiplas detecções
let cachedBaseUrl: string | null = null;

async function getBaseUrl(): Promise<string> {
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }
  
  cachedBaseUrl = await detectBaseUrl();
  return cachedBaseUrl;
}

// Persistência simples de tokens (apenas client-side)
const TOKEN_KEYS = {
  access: "gc.accessToken",
  refresh: "gc.refreshToken",
};

function getTokens() {
  if (typeof window === "undefined")
    return {
      accessToken: null as string | null,
      refreshToken: null as string | null,
    };
  return {
    accessToken: localStorage.getItem(TOKEN_KEYS.access),
    refreshToken: localStorage.getItem(TOKEN_KEYS.refresh),
  };
}

function setTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  
  const oldAccessToken = localStorage.getItem(TOKEN_KEYS.access);
  const oldRefreshToken = localStorage.getItem(TOKEN_KEYS.refresh);
  
  if (accessToken !== undefined) {
    if (accessToken) localStorage.setItem(TOKEN_KEYS.access, accessToken);
    else localStorage.removeItem(TOKEN_KEYS.access);
  }
  if (refreshToken !== undefined) {
    if (refreshToken) localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
    else localStorage.removeItem(TOKEN_KEYS.refresh);
  }
  
  // Dispara evento se os tokens mudaram
  const newAccessToken = localStorage.getItem(TOKEN_KEYS.access);
  const newRefreshToken = localStorage.getItem(TOKEN_KEYS.refresh);
  
  if (oldAccessToken !== newAccessToken || oldRefreshToken !== newRefreshToken) {
    window.dispatchEvent(new CustomEvent('authTokensChanged', {
      detail: { accessToken: newAccessToken, refreshToken: newRefreshToken }
    }));
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let err: ApiErrorShape | undefined;
    try {
      err = isJson ? await res.json() : undefined;
    } catch (jsonError) {
      console.warn("Failed to parse error response as JSON:", jsonError);
    }

    const errorMessage = err?.message
      ? Array.isArray(err.message)
        ? err.message.join(", ")
        : String(err.message)
      : `HTTP ${res.status}`;

    console.error("API Error:", errorMessage, err);
    return Promise.reject(errorMessage);
  }

  return isJson ? res.json() : (undefined as unknown as T);
}

async function fetchWithAuth<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  retry = true
): Promise<T> {
  const { accessToken } = getTokens();
  const headers = new Headers(init.headers as HeadersInit);

  // Só define Content-Type se não for FormData (que define automaticamente)
  const isFormData =
    init.body &&
    typeof FormData !== "undefined" &&
    init.body instanceof FormData;
  if (!headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status === 401 && retry) {
    const ok = await tryRefreshToken();
    if (ok) return fetchWithAuth<T>(input, init, false);
  }
  return handleResponse<T>(res);
}

async function tryRefreshToken(): Promise<boolean> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return false;
  try {
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await handleResponse<RefreshResponse>(res);
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    // Refresh falhou, limpar tokens e cache do usuário
    setTokens("", "");
    
    // Limpar cache do usuário quando refresh falha
    if (typeof window !== "undefined") {
      import('@/hooks/useMe').then(({ clearUserCache }) => {
        clearUserCache();
      }).catch(() => {
        // Silenciosamente ignora erro se não conseguir limpar cache
      });
    }
    
    return false;
  }
}

export const api = {
  // Auth
  async register(payload: {
    nome: string;
    email: string;
    senha: string;
  }): Promise<RegisterResponse> {
    const baseUrl = await getBaseUrl();
    const data = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse<RegisterResponse>(res));
    setTokens(data.accessToken, data.refreshToken);
    
    // Atualizar cache do usuário após registro
    if (typeof window !== "undefined" && data.user) {
      import('@/hooks/useMe').then(({ updateUserCache }) => {
        updateUserCache(data.user);
      }).catch(() => {
        // Silenciosamente ignora erro se não conseguir atualizar cache
      });
    }
    
    return data;
  },
  async login(payload: {
    email: string;
    senha: string;
  }): Promise<LoginResponse> {
    const baseUrl = await getBaseUrl();
    const data = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((res) => handleResponse<LoginResponse>(res));
    setTokens(data.accessToken, data.refreshToken);
    
    // Atualizar cache do usuário após login
    if (typeof window !== "undefined" && data.user) {
      import('@/hooks/useMe').then(({ updateUserCache }) => {
        updateUserCache(data.user);
      }).catch(() => {
        // Silenciosamente ignora erro se não conseguir atualizar cache
      });
    }
    
    return data;
  },
  async logout(): Promise<MessageResponse> {
    const { refreshToken } = getTokens();
    const baseUrl = await getBaseUrl();
    const data = await fetchWithAuth<MessageResponse>(
      `${baseUrl}/auth/logout`,
      {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      }
    );
    setTokens("", "");
    
    // Limpar cache do usuário no logout
    if (typeof window !== "undefined") {
      // Evitar dependência circular importando dinamicamente
      import('@/hooks/useMe').then(({ clearUserCache }) => {
        clearUserCache();
      }).catch(() => {
        // Silenciosamente ignora erro se não conseguir limpar cache
      });
    }
    
    return data;
  },
  // Users
  async me(): Promise<User> {
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<User>(`${baseUrl}/users/me`);
  },
  async updateMe(payload: { nome?: string; email?: string }): Promise<User> {
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<User>(`${baseUrl}/users/me`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async updatePassword(payload: {
    senhaAtual: string;
    novaSenha: string;
  }): Promise<MessageResponse> {
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<MessageResponse>(`${baseUrl}/users/me/password`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async deleteMe(): Promise<MessageResponse> {
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<MessageResponse>(`${baseUrl}/users/me`, {
      method: "DELETE",
    });
  },
  // Contacts
  async createContact(payload: CreateContactDto): Promise<Contact> {
    // Sempre usar JSON agora, pois o backend espera base64 string
    console.log("Sending JSON:", payload);
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<Contact>(`${baseUrl}/contacts`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async listContacts(params?: {
    page?: number;
    limit?: number;
    nome?: string;
    categoria?: string;
    email?: string;
  }): Promise<Pagination<Contact>> {
    const search = new URLSearchParams();
    for (const [k, v] of Object.entries(params || {})) {
      if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
    }
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/contacts${search.toString() ? `?${search}` : ""}`;
    return fetchWithAuth<Pagination<Contact>>(url);
  },
  async searchContacts(params: {
    q: string;
    page?: number;
    limit?: number;
  }): Promise<Pagination<Contact>> {
    const search = new URLSearchParams();
    search.set("q", params.q);
    if (params.page) search.set("page", String(params.page));
    if (params.limit) search.set("limit", String(params.limit));
    const baseUrl = await getBaseUrl();
    const url = `${baseUrl}/contacts/search?${search}`;
    return fetchWithAuth<Pagination<Contact>>(url);
  },
  async getContact(id: string): Promise<Contact> {
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<Contact>(`${baseUrl}/contacts/${id}`);
  },
  async updateContact(id: string, payload: UpdateContactDto): Promise<Contact> {
    // Sempre usar JSON agora, pois o backend espera base64 string
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<Contact>(`${baseUrl}/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  async deleteContact(id: string): Promise<MessageResponse> {
    const baseUrl = await getBaseUrl();
    return fetchWithAuth<MessageResponse>(`${baseUrl}/contacts/${id}`, {
      method: "DELETE",
    });
  },
  // Health
  async health(): Promise<{
    status: string;
    database: string;
    timestamp: string;
    uptime: number;
  }> {
    const baseUrl = await getBaseUrl();
    return fetch(`${baseUrl}/health`).then((res) => handleResponse(res));
  },
};

export const tokens = { getTokens, setTokens };

// Função para forçar redetecção da URL (útil para desenvolvimento)
export const resetUrlCache = () => {
  cachedBaseUrl = null;
  console.log('🔄 Cache de URL resetado, próxima requisição detectará novamente');
};

// Função para obter a URL atualmente em cache
export const getCurrentBaseUrl = () => cachedBaseUrl;
