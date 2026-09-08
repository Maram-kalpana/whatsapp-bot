import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen bg-[#fbfcfd]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
      <Header collapsed={collapsed} onMobileMenu={() => setMobileOpen(true)}/>
      <main className={`min-h-screen pt-16 transition-all duration-300 ${collapsed ? 'md:pl-[84px]' : 'md:pl-[292px]'}`}>
        {children}
      </main>
    </div>
  )
}
