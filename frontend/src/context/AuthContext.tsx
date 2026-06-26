import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, role: string, dept: string, pass: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPass: string) => Promise<void>;
  api: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Set default baseURL matching our backend service
const apiInstance = axios.create({
  baseURL: 'http://localhost:8000',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  // Configure global authorization header
  useEffect(() => {
    if (token) {
      localStorage.setItem('nexus_token', token);
      apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      localStorage.removeItem('nexus_token');
      delete apiInstance.defaults.headers.common['Authorization'];
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await apiInstance.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const response = await apiInstance.post('/api/auth/login', {
        username_or_email: usernameOrEmail,
        password: password,
      });
      setToken(response.data.access_token);
      if (response.data.refresh_token) {
        localStorage.setItem('nexus_refresh_token', response.data.refresh_token);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Login failed");
    }
  };

  const register = async (username: string, email: string, role: string, dept: string, pass: string) => {
    try {
      await apiInstance.post('/api/auth/register', {
        username,
        email,
        password: pass,
        role,
        department: dept,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Registration failed");
    }
  };

  const resetPassword = async (email: string, newPass: string) => {
    try {
      await apiInstance.post('/api/auth/reset-password', {
        email,
        new_password: newPass,
      });
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || "Reset password failed");
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_refresh_token');
    setUser(null);
    setLoading(false);
  };

  // Add interceptor to auto-refresh token if needed
  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        const refreshToken = localStorage.getItem('nexus_refresh_token');
        if (refreshToken) {
          try {
            const res = await axios.post('http://localhost:8000/api/auth/refresh', null, {
              params: { refresh_token: refreshToken }
            });
            const newAccess = res.data.access_token;
            setToken(newAccess);
            originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
            return apiInstance(originalRequest);
          } catch (refreshErr) {
            logout();
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, resetPassword, api: apiInstance }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
