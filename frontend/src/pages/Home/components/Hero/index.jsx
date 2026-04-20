import styles from "./styles/index.module.css";
import heroImg from "../../../../assets/bg-hero.png";

export function Hero() {
  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <section className={styles.container}>
      <img
        src={heroImg}
        alt="background"
        aria-hidden="true"
        className={styles.hero_bg}
      />
      <div className={styles.hero_content}>
        <div className={styles.hero_content_text}>
          <h1 className={styles.hero_title}>
            The Book Lover's Dreamland Awaits!
          </h1>
          <p className={styles.hero_description}>
            Welcome to the ultimate book lover's paradise! Join our community
            and contribute to the ever-evolving library of stories, where every
            book has a chance to inspire someone new.
          </p>
        </div>
        <form role="search" className={styles.search} onSubmit={handleSubmit}>
          <input
            type="search"
            className={styles.search_input}
            placeholder="Search a book"
            autoComplete="off"
          />
          <button type="submit" className={styles.search_button}>
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
