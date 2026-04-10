import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function DashboardLayout({ children, activeTab, setActiveTab }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
