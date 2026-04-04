import styles from "./styles/index.module.css";
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
