import { useEffect, useRef, useCallback } from 'react'

/**
 * usePolling — runs fetchFn immediately, then on a regular interval.
 * Adding `refreshKey` to the deps forces a refetch on any explicit invalidate.
 *
 * @param {() => Promise<void>} fetchFn  — async function that fetches + updates state
 * @param {number} interval              — polling interval in ms (default 30s)
 * @param {number} refreshKey            — bump this to trigger an immediate refetch
 * @param {boolean} enabled              — pause/resume polling
 */
export function usePolling(fetchFn, { interval = 30_000, refreshKey = 0, enabled = true } = {}) {
  const timerRef = useRef(null)
  const fetchRef = useRef(fetchFn)
  fetchRef.current = fetchFn

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const tick = async () => {
      if (!cancelled) await fetchRef.current()
    }

    // Run immediately
    tick()

    timerRef.current = setInterval(tick, interval)
    return () => {
      cancelled = true
      clearInterval(timerRef.current)
    }
  }, [interval, enabled, refreshKey])
}

/**
 * useDataRefresh — combines initial fetch + polling into one call.
 *
 * @param {string} url           — API endpoint
 * @param {Function} setData     — state setter
 * @param {object} options       — { interval, refreshKey, enabled, transform }
 */
export function useDataRefresh(url, setData, {
  interval = 30_000,
  refreshKey = 0,
  enabled = true,
  transform = x => x,
} = {}) {
  const fetchRef = useRef(null)

  const fetchFn = useCallback(() => {
    return fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json())
      .then(d => setData(transform(d)))
      .catch(() => {})
  }, [url, transform]) // eslint-disable-line react-hooks/exhaustive-deps

  usePolling(fetchFn, { interval, refreshKey, enabled })
}