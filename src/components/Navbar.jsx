import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/jobs")}
        >
          <div className="bg-blue-500 text-white px-3 py-1 rounded font-bold">
            J
          </div>
          <h1 className="font-semibold text-lg">JobPortal</h1>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">

          <Link to="/jobs" className="hover:text-blue-500">
            Jobs
          </Link>

          <Link to="/my-applications" className="hover:text-blue-500">
            My Applications
          </Link>

          {/* ✅ Chat Button */}
          <button
            onClick={() => navigate("/chat")}
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
          >
            💬 Chat
          </button>

          {/* User Section */}
          <div className="flex items-center gap-2">
            <div className="bg-gray-200 w-8 h-8 flex items-center justify-center rounded-full">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-sm">{user?.name || "User"}</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-red-500 hover:underline"
          >
            Logout
          </button>

        </div>
      </div>
    </nav>
  );
}