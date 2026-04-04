import styles from "./styles/index.module.css";
import { NavLink } from "react-router-dom";

export function ListNavigation({ navLinks }) {
  return (
    <ul className={styles.nav_list}>
      {navLinks.map((item) => (
        <li key={item.id}>
          <NavLink
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? styles.link_accent : styles.link
            }
          >
            {item.label}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}
