import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 important

  useEffect(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
      const id    = localStorage.getItem("id");   // ← add this

    if (token) {
      setUser({ token, name, role });
    }

    setLoading(false); // ✅ done loading
  }, []);

 const login = (data) => {
  const userData = {
    token: data.token,
    name: data.name,
    role: data.role,
    id: data.id, 
  };

  localStorage.setItem("token", userData.token);
  localStorage.setItem("name", userData.name);
  localStorage.setItem("role", userData.role);
   localStorage.setItem("id", data.id);  // ← add this

  setUser(userData);
};
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);