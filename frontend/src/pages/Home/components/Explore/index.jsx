import styles from "./styles/index.module.css";
import exploreImg from "../../../../assets/bookshelf.png";

export function Explore() {
  return (
    <section className={styles.container}>
      <div className={styles.explore_content}>
        <div className={styles.explore_img}>
          <img src={exploreImg} alt="" />
        </div>
        <div className={styles.explore_info}>
          <div className={styles.explore_content_text}>
            <h2 className={styles.content_title}>
              Your favourite
              <span className={styles.title_accent}> Reads Are Here!</span>
            </h2>
            <p className={styles.content_subtitle}>
              Buy your favorite books online with ease! Enjoy exclusive offers
              and discounts on selected titles. Dive into our collection and
              find special deals that make reading more affordable. Shop now and
              unlock more savings with every purchase!
            </p>
          </div>
          <div className={styles.content_info}>
            <div className={styles.content_info_item}>
              <span className={styles.item_title}>800+</span>
              <span className={styles.item_subtitle}>Book Listing</span>
            </div>
            <div className={styles.content_info_item}>
              <span className={styles.item_title}>1K+</span>
              <span className={styles.item_subtitle}>Registered Members</span>
            </div>
            <div className={styles.content_info_item}>
              <span className={styles.item_title}>50+</span>
              <span className={styles.item_subtitle}>Branch Count</span>
            </div>
          </div>
          <button className={styles.explore_button}>Explore More</button>
        </div>
      </div>
    </section>
  );
}
