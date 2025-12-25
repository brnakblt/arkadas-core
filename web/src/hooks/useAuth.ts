import { useState } from "react";
import { authService, LoginResponse, RegisterData } from "../services/authService";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const login = async (identifier: string, password: string, tenantId?: number): Promise<LoginResponse | null> => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await authService.login(identifier, password, tenantId);
      // Removed localStorage logic as we now use HttpOnly cookies
      setSuccessMessage("Giriş başarılı! Yönlendiriliyorsunuz...");
      return response;
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage = err instanceof Error ? err.message : "Giriş yapılamadı.";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<LoginResponse | null> => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await authService.register(data);
      setSuccessMessage("Kayıt başarılı! Giriş yapabilirsiniz.");
      return response;
    } catch (err: unknown) {
      console.error("Register error:", err);
      const errorMessage = err instanceof Error ? err.message : "Kayıt olunamadı.";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await authService.forgotPassword(email);
      setSuccessMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
      return true;
    } catch (err: unknown) {
      console.error("Forgot password error:", err);
      const errorMessage = err instanceof Error ? err.message : "Şifre sıfırlama e-postası gönderilemedi.";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };

  return {
    isLoading,
    error,
    successMessage,
    login,
    logout,
    register,
    forgotPassword,
    clearMessages,
    setError,
    setSuccessMessage
  };
};
