import type { Course } from '../types'

export type CourseColorKey = 'orange' | 'teal' | 'pink' | 'yellow' | 'coral' | 'blue' | 'lavender' | 'mint'

const CYCLE: CourseColorKey[] = ['orange', 'teal', 'pink', 'yellow', 'coral', 'blue', 'lavender', 'mint']

export interface CourseColor {
  key: CourseColorKey
  /** solid background for featured cards */
  bg: string
  /** readable text/foreground on `bg` */
  fg: string
  /** small dot / accent usage */
  dot: string
  /** pill background for "on white" contexts */
  pill: string
  pillText: string
  /** light tint background for list rows — pairs with ink text/border */
  tint: string
}

const PALETTE: Record<CourseColorKey, CourseColor> = {
  orange: { key: 'orange', bg: '#FF8243', fg: '#1E2B2B', dot: '#FF8243', pill: '#FF8243', pillText: '#1E2B2B', tint: '#FFE9DD' },
  teal: { key: 'teal', bg: '#069494', fg: '#FFF7EF', dot: '#069494', pill: '#069494', pillText: '#FFF7EF', tint: '#DDF2F0' },
  pink: { key: 'pink', bg: '#FFC0CB', fg: '#1E2B2B', dot: '#FFC0CB', pill: '#FFC0CB', pillText: '#1E2B2B', tint: '#FFEDF0' },
  yellow: { key: 'yellow', bg: '#FCE883', fg: '#1E2B2B', dot: '#FCE883', pill: '#FCE883', pillText: '#1E2B2B', tint: '#FDF6D8' },
  coral: { key: 'coral', bg: '#FF6F5E', fg: '#1E2B2B', dot: '#FF6F5E', pill: '#FF6F5E', pillText: '#1E2B2B', tint: '#FFE4DF' },
  blue: { key: 'blue', bg: '#4FB3D9', fg: '#FFF7EF', dot: '#4FB3D9', pill: '#4FB3D9', pillText: '#FFF7EF', tint: '#E1F3F9' },
  lavender: { key: 'lavender', bg: '#C9B8FF', fg: '#1E2B2B', dot: '#C9B8FF', pill: '#C9B8FF', pillText: '#1E2B2B', tint: '#F1ECFF' },
  mint: { key: 'mint', bg: '#A8E6B0', fg: '#1E2B2B', dot: '#A8E6B0', pill: '#A8E6B0', pillText: '#1E2B2B', tint: '#E7F8E9' },
}

/** Stable color per course, cycling by its position in the (name-sorted) course list. */
export function courseColorByIndex(index: number): CourseColor {
  return PALETTE[CYCLE[index % CYCLE.length]]
}

export function courseColorFor(courses: Course[], courseId: string | null | undefined): CourseColor {
  const index = courses.findIndex((c) => c.id === courseId)
  return courseColorByIndex(index === -1 ? 0 : index)
}

/** Short label for tight spaces (pills, chips) — falls back to the full name. */
export function courseLabel(course: Pick<Course, 'name' | 'short_name'>): string {
  return course.short_name?.trim() || course.name
}
