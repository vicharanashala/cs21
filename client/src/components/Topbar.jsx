import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search } from 'lucide-react'
import { useState } from 'react'

export default function Topbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchVal, setSearchVal] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchVal.trim()) {
      navigate(`/faqs?search=${encodeURIComponent(searchVal.trim())}`)
      setSearchVal('')
    }
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div />
        <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 w-72">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            placeholder="Quick search..."  
            className="bg-transparent outline-none text-sm text-gray-700 dark:text-gray-200 w-full placeholder-gray-400"
          />
        </form>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">
            {user?.name}
          </span>
        </div>
      </div>
    </header>
  )
}