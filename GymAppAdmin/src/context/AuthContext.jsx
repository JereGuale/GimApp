import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || null);

  const login = (userData, userToken) => {
    localStorage.setItem('admin_user', JSON.stringify(userData));
    localStorage.setItem('admin_token', userToken);
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('admin_user');
    localStorage.removeItem('admin_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
