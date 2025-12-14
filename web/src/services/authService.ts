const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://127.0.0.1:1337";

export interface LoginResponse {
  jwt: string;
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
  };
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  userType?: 'parent' | 'teacher';
  [key: string]: any;
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      let errorMessage = errorData.error?.message || "Giriş yapılamadı";

      if (errorMessage === "Invalid identifier or password") {
        errorMessage = "Kullanıcı adı veya şifre hatalı";
      } else if (errorMessage.includes("Too many attempts")) {
        errorMessage = "Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.";
      }

      throw new Error(errorMessage);
    }

    return response.json();
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

  async getMe(token: string) {
    const response = await fetch(`${STRAPI_URL}/api/users/me?populate=*`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
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
