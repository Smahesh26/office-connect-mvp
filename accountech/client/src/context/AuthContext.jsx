import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '../api/endpoints';
import client, { setAccessToken, setOnLogout } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (e) { /* ignore */ }
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setOnLogout(() => { setUser(null); setAccessToken(null); });
    // Try silent refresh on load (httpOnly cookie may still be valid)
    (async () => {
      try {
        const { data } = await client.post('/auth/refresh');
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch (e) {
        // not logged in
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await authApi.login(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const ssoLogin = async (token) => {
    const { data } = await authApi.ssoLogin(token);
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  };

  const can = (permission) => !!(user?.permissions && user.permissions[permission]);

  return (
    <AuthContext.Provider value={{ user, loading, login, ssoLogin, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
