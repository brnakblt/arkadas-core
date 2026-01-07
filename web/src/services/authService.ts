const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export interface LoginResponse {
  jwt?: string;
  user: {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
    userType: 'parent' | 'teacher';
    tenant?: {
      id: number;
      name: string;
      domain: string;
    };
  };
}

export interface Tenant {
  id: number;
  name: string;
  domain: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  userType?: 'parent' | 'teacher';
  [key: string]: unknown;
}

export const authService = {
  async getTenants(): Promise<Tenant[]> {
    const response = await fetch("/api/tenants");
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    return data.tenants || [];
  },

  async login(identifier: string, password: string, tenantId?: number): Promise<LoginResponse> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
        tenantId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Giriş yapılamadı");
    }

    return response.json();
  },

  async logout(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${STRAPI_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Şifre sıfırlama e-postası gönderilemedi");
    }
  },

  async getMe() {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Kullanıcı bilgileri alınamadı");
    }

    return response.json();
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    const response = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Kayıt olunamadı");
    }

    return response.json();
  },
};
