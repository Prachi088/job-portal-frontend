import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("token");
    const name = localStorage.getItem("name");
    const role = localStorage.getItem("role");
    const id = localStorage.getItem("id");
    return token ? { token, name, role, id } : null;
  });
  const loading = false; // since user is initialized synchronously

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

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);