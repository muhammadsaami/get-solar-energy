import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on startup
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // Mock login call - matches production schemas
    if (email && password) {
      const mockToken = "mock_jwt_access_token_value_xyz";
      const mockRefreshToken = "mock_jwt_refresh_token_value_123";
      const mockUser = {
        id: 1,
        email: email,
        name: email.split('@')[0].toUpperCase(),
        role: "customer",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=GETSolar"
      };

      localStorage.setItem('access_token', mockToken);
      localStorage.setItem('refresh_token', mockRefreshToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      setToken(mockToken);
      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, error: "Invalid username or password" };
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
