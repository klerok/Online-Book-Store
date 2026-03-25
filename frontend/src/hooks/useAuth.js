import { useContext } from "react";
import { login, logout } from "../api/auth";
import { AuthContext } from "../contexts/authContext";

export const useAuth = () => {
  const { user, setUser } = useContext(AuthContext);

  const loginUser = async (email, password) => {
    const response = await login(email, password);
    const loggedUser = response?.user;
    if (!loggedUser) throw new Error("Invalid login response");
    setUser(loggedUser);
  };

  const logoutUser = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout", error);
    } finally {
      setUser(null);
    }
  };

  return { user, loginUser, logoutUser, isAuthenticated: !!user };
};
