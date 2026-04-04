import { useEffect, useMemo, useState } from "react";
import styles from "./styles/index.module.css";
import { mapDocToBook, searchBooks } from "../../../../../../api/openLibrary";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

function BookCover({ src, title }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={styles.cover_placeholder} role="img" aria-label={title}>
        <span className={styles.cover_placeholder_text}>No cover</span>
      </div>
    );
  }

  return (
    <img
      className={styles.cover_image}
      src={src}
      alt=""
      width={200}
      height={283}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

const MAX_BOOK = 60;
const DISPLAYED_BOOKS = 4;

function chunkBooks(books, size) {
  const chunks = [];
  for (let i = 0; i < books.length; i += size) {
    chunks.push(books.slice(i, i + size));
  }
  return chunks;
}

export function ListBestBooks() {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    let canceled = false;
    async function load() {
      setStatus("loading");
      try {
        const books = await searchBooks("best books", MAX_BOOK);
        if (canceled) return;
        if (!books?.length) {
          setStatus("error");
          return;
        }

        const mappedBooks = books.map((book) => mapDocToBook(book));
        const shuffledBooks = [...mappedBooks].sort(() => Math.random() - 0.5);
        const four = shuffledBooks.slice(0, 12);
        setBooks(four);
        setStatus("success");
      } catch {
        if (!canceled) setStatus("error");
      }
    }
    load();
    return () => {
      canceled = true;
    };
  }, []);

  const pages = useMemo(() => chunkBooks(books, DISPLAYED_BOOKS), [books]);

  if (status === "loading") return <p>Loading...</p>;

  if (status === "error") return <p>Error loading books</p>;

  return (
    <div className={styles.swiper_container}>
      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1}
        loop={pages.length > 1}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
      >
        {pages.map((pageBooks, pageIndex) => (
          <SwiperSlide key={pageIndex}>
            <ul className={styles.list_best_books}>
              {pageBooks.map((book) => (
                <li key={book.id} className={styles.card}>
                  {book.coverSrc ? (
                    <BookCover src={book.coverSrc} title={book.title} />
                  ) : null}
                  <div className={styles.book_title} title={book.title}>
                    {book.title}
                  </div>
                  <div className={styles.book_author}>{book.author}</div>
                </li>
              ))}
            </ul>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
