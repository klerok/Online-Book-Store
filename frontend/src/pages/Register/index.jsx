import { Link, useNavigate } from "react-router-dom";
import styles from "./styles/index.module.css";
import { useState } from "react";
import { PasswordIconView } from "../../components/PasswordIconView";
import { PasswordIconHide } from "../../components/PasswordIconHide";
import { AuthForm } from "../../modules/AuthForm";
import { register } from "../../api/auth";

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register(username, email, password, passwordConfirmation);
      alert("Registration successful! You can now login.");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed", error);
      alert("Registration failed. Please try again.");
    }
  }

  return (
    <div className={styles.root}>
      <AuthForm title="Регистрация" subtitle="Создайте новый аккаунт">
        <form className={styles.form} noValidate onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="register-username" className={styles.label}>
              Имя пользователя
            </label>
            <input
              id="register-username"
              type="text"
              name="username"
              className={styles.input}
              placeholder="username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="register-email" className={styles.label}>
              Email
            </label>
            <input
              id="register-email"
              type="email"
              name="email"
              className={styles.input}
              placeholder="example@mail.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="register-password" className={styles.label}>
              Пароль
            </label>
            <div className={styles.inputWrap}>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                className={styles.input}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <PasswordIconView /> : <PasswordIconHide />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label
              htmlFor="register-password-confirmation"
              className={styles.label}
            >
              Подтверждение пароля
            </label>
            <div className={styles.inputWrap}>
              <input
                id="register-password-confirmation"
                type={showPasswordConfirmation ? "text" : "password"}
                name="password_confirmation"
                className={styles.input}
                autoComplete="new-password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
              <button
                type="button"
                className={styles.toggle}
                onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                aria-label={showPasswordConfirmation ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPasswordConfirmation ? <PasswordIconView /> : <PasswordIconHide />}
              </button>
            </div>
          </div>
          <button type="submit" className={styles.submit}>
            Зарегистрироваться
          </button>
        </form>
        <p className={styles.footer}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </AuthForm>
    </div>
  );
}
