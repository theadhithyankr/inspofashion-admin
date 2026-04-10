import { useState } from 'react'
import { Package, Menu as MenuIcon, X, Layers, Image as ImageIcon, Layout, Settings } from 'lucide-react'

export function Sidebar({ mobileOpen, setMobileOpen, activeTab = 'Products', setActiveTab = () => {} }) {
  const navigation = [
    { name: 'Products', icon: Package },
    { name: 'Collections', icon: Layers },
    { name: 'Hero Image', icon: ImageIcon },
    { name: 'Menu Bar', icon: Layout },
    { name: 'Footer', icon: Layout },
    { name: 'Value Props', icon: Layout },
    { name: 'Settings', icon: Settings },
  ]

  const handleNavClick = (name) => {
    setActiveTab(name)
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center space-x-2 px-4 py-6 border-b border-gray-100">
        <Package className="w-8 h-8 text-primary-600" />
        <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.25rem' }}>
          inspofashions
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isCurrent = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => handleNavClick(item.name)}
              className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className={`mr-3 h-5 w-5 ${isCurrent ? 'text-primary-700' : 'text-gray-400'}`} />
              {item.name}
            </button>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileOpen(false)} />
        <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-white transform transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between px-4 py-6 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.25rem' }}>
                inspofashions
              </span>
            </div>
            <button onClick={() => setMobileOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isCurrent = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${isCurrent ? 'text-primary-700' : 'text-gray-400'}`} />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
        <SidebarContent />
      </div>
    </>
  )
}
