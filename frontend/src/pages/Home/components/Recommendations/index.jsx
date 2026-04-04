import { ListBestBooks } from "./components/ListBestBooks";
import styles from "./styles/index.module.css";

export function Recommendations() {
  return (
    <section className={styles.container}>
      <div className={styles.recommendations_content}>
        <h2 className={styles.recommendations_title}>
          Our Best Picks
        </h2>
        <ListBestBooks/>
      </div>
    </section>
  )
}