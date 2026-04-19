import { Outlet } from '@tanstack/react-router'
import Header from './Header'

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

