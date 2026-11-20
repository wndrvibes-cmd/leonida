import { useEffect, useState } from 'react'

/** Point de rupture mobile unique pour toutes les primitives. */
export const MOBILE_QUERY = '(max-width: 767px)'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** `true` sous 768px : les dialogues deviennent des feuilles montantes. */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_QUERY)
}
