import { Outlet } from 'react-router-dom'
import { Header } from '../Header'
import styles from './styles/index.module.css'

export function Layout() {
  return (
    <div className={styles.root}>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
