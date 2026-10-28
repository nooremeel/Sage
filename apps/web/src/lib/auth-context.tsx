'use client';

import * as React from 'react';
import type { AuthUserDto, LoginInput, SignupInput } from '@sage/shared';
import { apiClient } from './api';

interface AuthContextType {
  user: AuthUserDto | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUserDto | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const refreshUser = React.useCallback(async () => {
    try {
      const response = await apiClient<{ user: AuthUserDto }>('/auth/me');
      setUser(response.user);
    } catch {
      // Try refresh token if access token expired
      try {
        const refreshResponse = await apiClient<{ user: AuthUserDto }>('/auth/refresh', {
          method: 'POST',
        });
        setUser(refreshResponse.user);
      } catch {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient<{ user: AuthUserDto }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient<{ user: AuthUserDto }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

