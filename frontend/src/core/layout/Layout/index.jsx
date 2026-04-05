import { Outlet } from 'react-router-dom'
import { Header } from '../Header'
import styles from './styles/index.module.css'
import { Footer } from '../Footer'

export function Layout() {
  return (
    <div className={styles.root}>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer/>
    </div>
  )
}
