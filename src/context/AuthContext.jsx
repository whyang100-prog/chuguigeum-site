import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../lib/api";

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let request = 0;
    async function refresh() {
      const version = ++request;
      try {
        const data = await api("/api/auth/me");
        if (active && version === request) {
          setUser(data.user);
          setError("");
        }
      } catch (err) {
        if (active && version === request) {
          setUser(null);
          setError(err.message);
        }
      } finally {
        if (active && version === request) setLoading(false);
      }
    }
    function expired() {
      request++;
      setUser(null);
      setLoading(false);
    }
    function visible() {
      if (document.visibilityState === "visible") refresh();
    }
    refresh();
    window.addEventListener("session-expired", expired);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      window.removeEventListener("session-expired", expired);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [retry]);
  async function signIn(mode, values) {
    const data = await api("/api/auth/" + mode, {
      method: "POST",
      body: values,
    });
    setUser(data.user);
    setError("");
  }
  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST", body: {} });
    } catch (err) {
      if (err.status !== 401) throw err;
    }
    setUser(null);
  }
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        logout,
        clearUser: () => setUser(null),
        retry: () => {
          setLoading(true);
          setRetry((n) => n + 1);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
