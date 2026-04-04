import styles from "./styles/index.module.css";
import { Hero } from "./components/Hero";
import { Recommendations } from "./components/Recommendations";
export function HomePage() {
  return (
    <>
      <Hero />
      <Recommendations />
    </>
  );
}
