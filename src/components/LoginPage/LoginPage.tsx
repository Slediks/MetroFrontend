import { useState, type FormEvent } from "react";
import styles from "./LoginPage.module.css";

interface LoginPageProps {
  loading: boolean;
  error: string;
  onSubmit: (username: string, password: string) => Promise<void>;
}

export const LoginPage = ({ loading, error, onSubmit }: LoginPageProps): JSX.Element => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const normalizedUsername = username.trim();
    if (!normalizedUsername || !password.trim()) {
      setLocalError("Введите логин и пароль.");
      return;
    }

    setLocalError("");
    await onSubmit(normalizedUsername, password);
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Вход в систему</h1>
        <p className={styles.subtitle}>Авторизуйтесь для работы с метрологическими документами.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="login-username">
            Логин
          </label>
          <input
            id="login-username"
            className={styles.input}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />

          <label className={styles.label} htmlFor="login-password">
            Пароль
          </label>
          <input
            id="login-password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {localError ? <p className={styles.error}>{localError}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </section>
    </main>
  );
};
