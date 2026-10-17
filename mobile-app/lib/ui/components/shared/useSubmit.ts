import { useCallback, useRef, useState } from 'react'

import { errorMessage } from '../../../api/client'

/**
 * Runs a save (or delete) action once at a time and keeps its error message for the screen.
 * `onSuccess` runs after the saving state is cleared (for example to close the screen).
 */
export function useSubmit(
  action: () => Promise<unknown>,
  onSuccess?: () => void,
) {
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // A ref, not state: two quick taps happen before a re-render could disable the button.
  const running = useRef(false)

  const submit = async () => {
    if (running.current) return
    running.current = true
    setIsSaving(true)
    setError(null)
    let saved = false
    try {
      await action()
      saved = true
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      running.current = false
      setIsSaving(false)
    }
    if (saved) onSuccess?.()
  }

  const clearError = useCallback(() => setError(null), [])

  return { submit, isSaving, error, clearError }
}
