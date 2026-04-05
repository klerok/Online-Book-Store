import styles from "./styles/index.module.css";
import { Hero } from "./components/Hero";
import { Recommendations } from "./components/Recommendations";
import { Explore } from "./components/Explore";
export function HomePage() {
  return (
    <>
      <Hero />
      <Recommendations />
      <Explore />
    </>
  );
}
