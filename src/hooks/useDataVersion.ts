import { useEffect, useState } from 'react'

export function useDataVersion(): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const onChange = () => setVersion((value) => value + 1)
    window.addEventListener('tawasol:changed', onChange)
    return () => window.removeEventListener('tawasol:changed', onChange)
  }, [])
  return version
}
