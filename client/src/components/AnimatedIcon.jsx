import React, { useState, useRef, useCallback } from 'react'

// Wraps an icon so it plays the given animation when the parent .anim-* class fires.
export function AnimatedIcon({ children }) {
  return <span className="anim-icon">{children}</span>
}

// Self-contained animated button — owns its own animation state.
// variant: 'pop' | 'strike' | 'slideUp' | 'shake' | 'slash' | 'spin'
export function AnimBtn({ children, variant = 'pop', onClick, disabled, className, style }) {
  const [anim, setAnim] = useState('')
  const timer = useRef(null)
  const handleClick = useCallback((e) => {
    if (disabled) return
    clearTimeout(timer.current)
    setAnim(`anim-${variant}`)
    timer.current = setTimeout(() => setAnim(''), 480)
    onClick?.(e)
  }, [disabled, variant, onClick])

  return (
    <button
      className={[anim, className].filter(Boolean).join(' ')}
      style={style}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
