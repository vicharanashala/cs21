import { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return

    const socket = io('http://localhost:5001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    window._socketIo = { io: (url, opts) => io(url, { ...opts, auth: { token } }) }

    socket.on('connect', () => console.log('🔌 Socket connected'))
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'))
    socket.on('activity', (data) => {
      window.dispatchEvent(new CustomEvent('socket-activity', { detail: data }))
    })
    socket.on('notification', (data) => {
      window.dispatchEvent(new CustomEvent('socket-notification', { detail: data }))
    })

    return () => { socket.disconnect(); window._socketIo = null }
  }, [])

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)