import styles from "./styles/index.module.css";
import footerImg from "../../../assets/footer-logo.png";
export function Footer() {
  return (
    <footer className={styles.root}>
      <div className={styles.container}>
        <div className={styles.footer_img}>
          <img src={footerImg} alt="" />
        </div>
        <div className={styles.footer_line}></div>
        <div className={styles.info}>
          <p>© 2024 | Neth BookPoint</p>
        </div>
      </div>
    </footer>
  );
}
