import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DEVICE_ID_KEY = 'unihm:device-id'

function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    // localStorage unavailable — fall back to a session-only id so the
    // screen still works, it just won't remember follows on reload.
    return crypto.randomUUID()
  }
}

/**
 * Tracks which courses this device "follows" for the day-before reminder.
 * This only stores the opt-in (device id <-> course) — sending the actual
 * Web Push notification is Fase 3 backend work (VAPID + Edge Function) and
 * isn't wired up yet.
 */
export function useNotificationFollows() {
  const [deviceId] = useState(getDeviceId)
  const [followedCourseIds, setFollowedCourseIds] = useState<Set<string>>(new Set())
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('push_subscription_courses')
        .select('course_id')
        .eq('subscription_id', deviceId)
      if (error) setError(error.message)
      else setFollowedCourseIds(new Set((data ?? []).map((r) => r.course_id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar.')
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return
    const result = await Notification.requestPermission()
    setPermission(result)
  }, [])

  const follow = useCallback(
    async (courseId: string) => {
      await supabase.from('push_subscriptions').upsert({ id: deviceId, subscription_data: {} })
      await supabase.from('push_subscription_courses').insert({ subscription_id: deviceId, course_id: courseId })
      setFollowedCourseIds((prev) => new Set(prev).add(courseId))
    },
    [deviceId],
  )

  const unfollow = useCallback(
    async (courseId: string) => {
      await supabase
        .from('push_subscription_courses')
        .delete()
        .eq('subscription_id', deviceId)
        .eq('course_id', courseId)
      setFollowedCourseIds((prev) => {
        const next = new Set(prev)
        next.delete(courseId)
        return next
      })
    },
    [deviceId],
  )

  const toggle = useCallback(
    (courseId: string) => (followedCourseIds.has(courseId) ? unfollow(courseId) : follow(courseId)),
    [followedCourseIds, follow, unfollow],
  )

  return { permission, requestPermission, followedCourseIds, toggle, loading, error }
}
