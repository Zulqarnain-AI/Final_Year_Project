import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import Logo from "../dashboard/image/lung logo.png";

const API_BASE_URL = "http://localhost:5000";

function readCurrentUser() {
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
}

function getUserInitials(user) {
  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const initials = `${String(firstName).charAt(0)}${String(lastName).charAt(0)}`.trim();
  return initials || "U";
}

function getRole(user, pathname) {
  const roleFromUser = String(user?.role || "").toLowerCase();
  if (roleFromUser === "doctor" || roleFromUser === "patient") return roleFromUser;
  if (pathname.startsWith("/doctor")) return "doctor";
  return "patient";
}

function toAbsoluteImageUrl(imagePath) {
  if (!imagePath) return "";
  if (
    String(imagePath).startsWith("http://") ||
    String(imagePath).startsWith("https://") ||
    String(imagePath).startsWith("data:") ||
    String(imagePath).startsWith("blob:")
  ) {
    return imagePath;
  }
  return `${API_BASE_URL}${String(imagePath).startsWith("/") ? "" : "/"}${imagePath}`;
}

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(() => readCurrentUser());

  useEffect(() => {
    let mounted = true;

    const fetchLoggedInProfile = async () => {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) return;

      const role = getRole(user, location.pathname);
      const endpoint = role === "doctor" ? `${API_BASE_URL}/api/doctors/profile` : `${API_BASE_URL}/api/users/profile`;

      try {
        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const profile = await response.json();
        if (!mounted || !profile) return;

        setUser((prev) => {
          const merged = {
            ...(prev || {}),
            ...profile,
            role: profile.role || prev?.role || role,
          };
          localStorage.setItem("user", JSON.stringify(merged));
          return merged;
        });
      } catch {
        // Keep existing local data if profile fetch fails.
      }
    };

    fetchLoggedInProfile();

    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const role = getRole(user, location.pathname);
  const dashboardPath = role === "doctor" ? "/doctor/dashboard" : "/dashboard";
  const profilePath = role === "doctor" ? "/doctor/profile" : "/profile";
  const settingsPath = role === "doctor" ? "/doctor/profile/edit" : "/setting";
  const userImage = toAbsoluteImageUrl(user?.profileImage || user?.avatar || "");

  const fullName = useMemo(() => {
    if (user?.fullName) return user.fullName;
    const merged = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return merged || (role === "doctor" ? "Doctor" : "Patient");
  }, [user, role]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 mb-0 rounded-2xl border border-cyan-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link to={dashboardPath} className="flex items-center gap-3">
          <img className="h-8 w-8" src={Logo} alt="BreatheWell logo" />
          <div>
            <h1 className="text-lg font-bold text-[#059AA0] sm:text-xl">BreatheWell</h1>
            <p className="text-[11px] uppercase tracking-wide text-slate-500 sm:text-xs">{role} portal</p>
          </div>
        </Link>

        <div className="relative flex items-center gap-2">
          <Link
            to={settingsPath}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-cyan-100 text-[#059AA0] transition hover:bg-cyan-50"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Link>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full border border-cyan-100 px-2 py-1 transition hover:bg-cyan-50"
          >
            {userImage ? (
              <img className="h-8 w-8 rounded-full object-cover" src={userImage} alt={fullName} />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#059AA0] text-xs font-semibold text-white">
                {getUserInitials(user)}
              </span>
            )}
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{fullName}</span>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-xl border border-cyan-100 bg-white p-2 shadow-lg">
              <Link
                to={profilePath}
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-cyan-50"
                onClick={() => setIsMenuOpen(false)}
              >
                View Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
