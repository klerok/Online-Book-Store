import { Link } from "react-router-dom";
import styles from "./styles/index.module.css";
import { useAuth } from "../../hooks/useAuth";
export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>Добро пожаловать</h1>
      <p className={styles.text}>
        {isAuthenticated
          ? "Вы вошли в систему"
          : "Это главная страница приложения. Здесь будет контент после подключения логики."}
      </p>
      <div
        className={styles.actions}
        style={{ display: isAuthenticated ? "none" : "flex" }}
      >
        <Link to="/login" className={styles.link}>
          Войти
        </Link>
        <Link to="/register" className={`${styles.link} ${styles.linkPrimary}`}>
          Зарегистрироваться
        </Link>
      </div>
    </div>
  );
}
