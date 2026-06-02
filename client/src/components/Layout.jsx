import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Layout() {
  const location = useLocation()
  // Only pad left on pages where the Sidebar renders its hamburger
  const padLeft = location.pathname !== '/faqs' ? 64 : 0

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}
    >
      {/* Sidebar — hidden by default, slides in as overlay */}
      <Sidebar />

      {/* Main content — full width since sidebar is an overlay */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingLeft: padLeft,
        }}
      >
        {/* Sticky top bar */}
        <Topbar />

        {/* Scrollable page content */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}