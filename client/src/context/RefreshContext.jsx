import { createContext, useContext, useState, useCallback } from 'react'

const RefreshContext = createContext(null)

export function RefreshProvider({ children }) {
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <RefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  )
}

// Hook: access the current refreshKey and a function to bump it.
// Components that use this key as a useEffect dep will refetch immediately.
export function useRefresh() {
  const ctx = useContext(RefreshContext)
  if (!ctx) throw new Error('useRefresh must be used within <RefreshProvider>')
  return ctx
}