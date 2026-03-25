import { useContext } from 'react'
import { RuntimeConfigContext } from '../context/runtimeConfigContext.js'

export function useRuntimeConfig() {
  const v = useContext(RuntimeConfigContext)
  if (!v) {
    throw new Error('useRuntimeConfig must be used inside RuntimeConfigProvider')
  }
  return v
}
