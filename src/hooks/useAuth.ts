import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types'

interface AuthState {
  session: Session | null
  profile: AppUser | null
  courseIds: string[]
  loading: boolean
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [courseIds, setCourseIds] = useState<string[]>([])
  // Starts true (not false): once `sessionChecked` flips true with a real
  // session, there's a render before the effect below has run at all —
  // `profileLoading` must already read as "loading" at that render, or the
  // guard below sees `loading: false` with `profile` still null for a frame
  // and bounces the user out before the profile fetch even started.
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Guard against this specific call resolving after the effect has
    // been cleaned up (React runs effects twice on mount in dev) — an
    // in-flight getSession() from a stale run can otherwise resolve
    // after the real one and clobber a valid session back to null.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setSessionChecked(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (cancelled) return
      setSession(s)
      setSessionChecked(true)
    })
    return () => {
      cancelled = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Wait for the initial getSession() to resolve — otherwise this runs
    // with session still at its `null` initial value and reports "loaded,
    // logged out" for a frame before the real session arrives, which trips
    // route guards into bouncing back before they see the real session.
    if (!sessionChecked) return

    let cancelled = false

    async function loadProfile() {
      if (!session) {
        setProfile(null)
        setCourseIds([])
        setProfileLoading(false)
        return
      }
      setProfileLoading(true)

      try {
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const { data: assignments } = await supabase
          .from('delegate_assignments')
          .select('course_id')
          .eq('user_id', session.user.id)

        if (!cancelled) {
          setProfile((userRow as AppUser) ?? null)
          setCourseIds((assignments ?? []).map((a) => a.course_id))
        }
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [session, sessionChecked])

  return { session, profile, courseIds, loading: !sessionChecked || profileLoading }
}
