import { useState, useEffect } from 'react'
import { Plus, Trash, GripVertical, Check, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { storeSettingsService } from '../../services/storeSettingsService'

export function FooterSettings() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)
  
  const [settings, setSettings] = useState({
    is_visible: true,
    social: {
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: ''
    },
    company_info: {
      email: 'help@inspofashions.com',
      newsletter_heading: 'Subscribe to our emails',
      social_heading: 'Follow the Flock'
    },
    sections: [
      {
        id: '1',
        title: 'Help',
        links: [
          { name: 'Live Chat', url: '#' },
          { name: 'FAQ/Contact Us', url: '/search?q=faq' },
          { name: 'Returns/Exchanges', url: '/search?q=returns' }
        ]
      },
      {
        id: '2',
        title: 'Shop',
        links: [
          { name: 'Men\'s Shoes', url: '/collections/Men\'s' },
          { name: 'Women\'s Shoes', url: '/collections/Women\'s' },
          { name: 'Gift Cards', url: '#' }
        ]
      },
      {
        id: '3',
        title: 'Company',
        links: [
          { name: 'Store Locator', url: '#' },
          { name: 'Our Story', url: '#' },
          { name: 'Careers', url: '#' }
        ]
      }
    ]
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await storeSettingsService.getSettings('footer_settings')
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data,
          social: { ...prev.social, ...(data.social || {}) },
          company_info: { ...prev.company_info, ...(data.company_info || {}) },
          sections: data.sections || prev.sections
        }))
      }
    } catch (error) {
      console.error('Failed to load footer settings:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      await storeSettingsService.updateSettings('footer_settings', settings)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSection = () => {
    if (settings.sections.length >= 4) {
      return alert('Maximum of 4 footer columns allowed.')
    }
    setSettings({
      ...settings,
      sections: [
        ...settings.sections,
        { id: Date.now().toString(), title: 'New Section', links: [] }
      ]
    })
  }

  const handleRemoveSection = (sectionId) => {
    setSettings({
      ...settings,
      sections: settings.sections.filter(s => s.id !== sectionId)
    })
  }

  const handleUpdateSectionTitle = (sectionId, title) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(s => 
        s.id === sectionId ? { ...s, title } : s
      )
    })
  }

  const handleAddLink = (sectionId) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(s => {
        if (s.id === sectionId) {
          return {
            ...s,
            links: [...s.links, { name: 'New Link', url: '#' }]
          }
        }
        return s
      })
    })
  }

  const handleUpdateLink = (sectionId, linkIndex, field, value) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(s => {
        if (s.id === sectionId) {
          const newLinks = [...s.links]
          newLinks[linkIndex] = { ...newLinks[linkIndex], [field]: value }
          return { ...s, links: newLinks }
        }
        return s
      })
    })
  }

  const handleRemoveLink = (sectionId, linkIndex) => {
    setSettings({
      ...settings,
      sections: settings.sections.map(s => {
        if (s.id === sectionId) {
          const newLinks = [...s.links]
          newLinks.splice(linkIndex, 1)
          return { ...s, links: newLinks }
        }
        return s
      })
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Footer Settings</h1>
          <p className="text-gray-600 mt-2">Manage the storefront footer links, social media, and visibility.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={loading}
        >
          {success ? <Check className="w-5 h-5 mr-2" /> : null}
          {success ? 'Saved!' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Visibility & General</h2>
        
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div>
            <h3 className="font-medium text-gray-900">Enable Footer</h3>
            <p className="text-sm text-gray-500">Toggle whether the entire footer is visible on the storefront.</p>
          </div>
          <button
            onClick={() => setSettings({...settings, is_visible: !settings.is_visible})}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              settings.is_visible ? 'bg-primary-600' : 'bg-gray-200'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.is_visible ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <Input 
            label="Support Email" 
            value={settings.company_info.email || ''}
            onChange={(e) => setSettings({
              ...settings, 
              company_info: { ...settings.company_info, email: e.target.value }
            })}
            placeholder="help@inspofashions.com"
          />
        </div>
      </div>

      {settings.is_visible && (
        <>
          {/* Social Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Instagram URL" 
                placeholder="https://instagram.com/..." 
                value={settings.social.instagram || ''}
                onChange={(e) => setSettings({...settings, social: {...settings.social, instagram: e.target.value}})}
              />
              <Input 
                label="Facebook URL" 
                placeholder="https://facebook.com/..." 
                value={settings.social.facebook || ''}
                onChange={(e) => setSettings({...settings, social: {...settings.social, facebook: e.target.value}})}
              />
              <Input 
                label="Twitter/X URL" 
                placeholder="https://twitter.com/..." 
                value={settings.social.twitter || ''}
                onChange={(e) => setSettings({...settings, social: {...settings.social, twitter: e.target.value}})}
              />
              <Input 
                label="YouTube URL" 
                placeholder="https://youtube.com/..." 
                value={settings.social.youtube || ''}
                onChange={(e) => setSettings({...settings, social: {...settings.social, youtube: e.target.value}})}
              />
            </div>
          </div>

          {/* Footer Columns (Sections) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Footer Columns</h2>
                <p className="text-sm text-gray-500">Add up to 4 columns containing links.</p>
              </div>
              <Button onClick={handleAddSection} variant="secondary" size="sm" disabled={settings.sections.length >= 4}>
                <Plus className="w-4 h-4 mr-2" />
                Add Column
              </Button>
            </div>

            <div className="space-y-6">
              {settings.sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 mr-4">
                      <Input 
                        placeholder="Column Title (e.g. Help)" 
                        value={section.title}
                        onChange={(e) => handleUpdateSectionTitle(section.id, e.target.value)}
                      />
                    </div>
                    <button 
                      onClick={() => handleRemoveSection(section.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-lg mt-5 transition-colors"
                      title="Remove column"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {section.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex gap-2 items-center bg-white p-2 rounded-lg border border-gray-200">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                        <div className="flex-1 flex flex-col md:flex-row gap-2">
                          <input 
                            type="text" 
                            className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500" 
                            placeholder="Link Name"
                            value={link.name}
                            onChange={(e) => handleUpdateLink(section.id, linkIndex, 'name', e.target.value)}
                          />
                          <input 
                            type="text" 
                            className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-500 font-mono" 
                            placeholder="URL Path (/collections/...)"
                            value={link.url}
                            onChange={(e) => handleUpdateLink(section.id, linkIndex, 'url', e.target.value)}
                          />
                        </div>
                        <button 
                          onClick={() => handleRemoveLink(section.id, linkIndex)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={() => handleAddLink(section.id)} 
                    variant="outline" 
                    size="sm" 
                    className="mt-3 text-sm bg-white"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Link to Column
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
