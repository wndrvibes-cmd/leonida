import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Valeur retardee : utile pour une recherche qui ne doit pas interroger la
 * base a chaque frappe.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value)
      return
    }
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}

/**
 * Version « action » : la fonction renvoyee ne declenche le traitement qu'une
 * fois le calme revenu. Le minuteur est annule au demontage pour ne pas
 * toucher un composant disparu.
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay = 300,
): (...args: A) => void {
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(callback)

  useEffect(() => {
    latest.current = callback
  }, [callback])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return useCallback(
    (...args: A) => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => latest.current(...args), delay)
    },
    [delay],
  )
}
