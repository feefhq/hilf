import { useCallback, useEffect, useState } from "react"

const STORAGE_KEY = "hilf-onboarding"

export interface OnboardingState {
  seenIntro?: boolean
}

const load = (): OnboardingState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as OnboardingState
  } catch {
    // fall through
  }
  return {}
}

const save = (data: OnboardingState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.warn("Failed to save onboarding state:", e)
  }
}

export const useOnboarding = () => {
  const [state, setState] = useState<OnboardingState>(load)

  useEffect(() => {
    save(state)
  }, [state])

  const markIntroSeen = useCallback(() => {
    setState((prev) => ({ ...prev, seenIntro: true }))
  }, [])

  return {
    seenIntro: state.seenIntro === true,
    markIntroSeen,
  }
}
