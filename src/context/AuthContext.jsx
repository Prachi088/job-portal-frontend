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

    // FIX #1 (CRITICAL): Only use claims that look like a numeric user ID.
    // Spring Boot JWT typically puts the username/email in `sub`, NOT a
    // numeric database ID. If we fall through to `sub`, we'd store the email
    // as user.id, and every recruiter-specific API call (/jobs/recruiter/email)
    // would fail with a 400/404 — causing both the Recruiter Dashboard and the
    // Events page to silently show an empty state.
    //
    // Priority: explicit `id` or `userId` claim → numeric-looking `sub` →
    // null (let the caller surface the error rather than using the wrong value).
    const explicitId = payload.id ?? payload.userId ?? null;
    if (explicitId !== null && explicitId !== undefined) {
      return String(explicitId);
    }

    // Only accept `sub` if it looks like a numeric ID (digits only).
    const sub = payload.sub ?? null;
    if (sub !== null && /^\d+$/.test(String(sub))) {
      return String(sub);
    }

    // `sub` is an email or username — DO NOT use it as the user ID.
    if (sub !== null) {
      console.warn(
        "[AuthContext] JWT `sub` claim looks like a username/email, not a numeric ID.",
        "Your Spring Boot backend must add an explicit `id` or `userId` claim to the JWT.",
        "Current sub:", sub
      );
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeRole(role) {
  return role ? String(role).toUpperCase().replace(/^ROLE_/, "") : role;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    const name  = localStorage.getItem("name");
    const role  = normalizeRole(localStorage.getItem("role"));

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      role: normalizeRole(data.role),
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