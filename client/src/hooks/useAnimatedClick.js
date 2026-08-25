import { useCallback, useRef, useState } from 'react'

// Returns [animClass, trigger(variant)]
// variant: 'pop' | 'strike' | 'slideUp' | 'shake' | 'slash' | 'spin'
export function useAnimatedClick() {
  const [state, setState] = useState({ variant: null, key: 0 })
  const timer = useRef(null)

  const trigger = useCallback((variant = 'pop') => {
    clearTimeout(timer.current)
    setState(s => ({ variant, key: s.key + 1 }))
    timer.current = setTimeout(() => setState(s => ({ ...s, variant: null })), 500)
  }, [])

  const animClass = state.variant ? `anim-${state.variant}` : ''
  return [animClass, trigger, state.key]
}
