import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/index.module.css";
import { useAuth } from "../../../hooks/useAuth";
import { Navigation } from "./components/Navigation";

export function Header() {


  return (
    <header className={styles.root}>
      <div className={styles.inner}>
        <Navigation />
      </div>
    </header>
  );
}
