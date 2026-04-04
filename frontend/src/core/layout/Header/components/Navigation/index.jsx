import { useAuth } from "../../../../../hooks/useAuth";
import { ListNavigation } from "./components/ListNavigation";
import { navLinks } from "./constants/navLinks";
import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/index.module.css";
import { NotificationIcon } from "./components/NotificationIcon";
import { LogoIcon } from "./components/LogoIcon";
export function Navigation() {
  const { isAuthenticated, logoutUser } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutUser();
    navigate("/");
  }

  function guestLinks() {
    return (
      <>
        <Link to="/login" className={`${styles.link} ${styles.link_accent}`}>
          Login
        </Link>
      </>
    );
  }

  function userLinks() {
    return (
      <>
        <Link to="/" className={styles.link}>
          Home
        </Link>
        <button type="button" className={styles.link} onClick={handleLogout}>
          Logout
        </button>
      </>
    );
  }

  return (
    <>
      <Link to="/" className={styles.logo_container}>
        <LogoIcon />
        NETH <br />
        BOOKPOINT
      </Link>
      <nav className={styles.nav}>
        <ListNavigation navLinks={navLinks} />
        <NotificationIcon />
        {isAuthenticated ? userLinks() : guestLinks()}
      </nav>
    </>
  );
}
