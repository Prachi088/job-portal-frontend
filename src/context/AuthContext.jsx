import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

/**
 * FIX: Parse the user ID directly out of the JWT payload.
 *
 * Spring Boot / jjwt typically stores the username / subject in `sub`.
 * Some setups also include a custom `id` or `userId` claim.
 * We try all three so this works regardless of the backend's claim name.
 *
 * We ONLY decode the payload (base64) — we never trust it for auth
 * decisions (the server verifies the signature on every request).
 * This is safe and widely used to extract non-sensitive display data.
 */
function parseIdFromJwt(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // base64url → base64 → JSON
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    // Return whichever claim is a non-empty, non-object value
    const id = payload.id ?? payload.userId ?? payload.sub ?? null;
    return id !== null && id !== undefined ? String(id) : null;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const name  = localStorage.getItem("name");
    const role  = localStorage.getItem("role");

    // FIX: Previously, if the backend login response didn't include `id`,
    // localStorage stored the literal string "undefined", and the profile
    // page couldn't load (it hit /api/users/null or /api/users/undefined).
    // Now we fall back to parsing the JWT payload, which always contains
    // the subject / user ID that the backend embedded when it signed the token.
    const storedId = localStorage.getItem("id");
    const id =
      storedId && storedId !== "null" && storedId !== "undefined"
        ? storedId
        : parseIdFromJwt(token);

    // Keep localStorage in sync so subsequent cold-starts don't repeat the parse.
    if (id) localStorage.setItem("id", id);

    return { token, name, role, id };
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = (data) => {
    const token = data.token;

    // FIX: Fall back to JWT parsing if the backend didn't return an explicit id.
    const rawId = data.id ?? null;
    const id =
      rawId !== null && String(rawId) !== "null" && String(rawId) !== "undefined"
        ? String(rawId)
        : parseIdFromJwt(token);

    const userData = {
      token,
      name: data.name,
      role: data.role,
      id,
    };

    localStorage.setItem("token", token);
    localStorage.setItem("name", userData.name);
    localStorage.setItem("role", userData.role);
    if (id) localStorage.setItem("id", id);

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("id");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);