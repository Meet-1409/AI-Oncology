/**
 * Addresses within the environment.
 *
 * Depth and the current Patient Case must always be identifiable [03 §23], and a
 * clinical view must be restorable and shareable. Routes therefore encode *place*,
 * while state that modifies a space in situ — time position, selected organ,
 * comparison — is held in query parameters, because moving through the Journey moves
 * the whole space through time rather than navigating [00 §15.5].
 */

export const DEPTH = {
  entry: 0,
  home: 1,
  patient: 2,
  focus: 3,
} as const

export type Depth = (typeof DEPTH)[keyof typeof DEPTH]

/** Space state carried in the URL rather than in component state. */
export const SPACE_PARAM = {
  /** ISO date — the clinical moment the whole Patient Space is showing. */
  time: 't',
  /** Selected organ on the Body. */
  organ: 'organ',
  /** ISO date being compared against the current time position. */
  compare: 'compare',
  /** Present while an in-place upload is open. */
  upload: 'upload',
} as const

export const paths = {
  entry: '/',
  enter: '/enter',
  recover: '/enter/recover',
  reset: '/enter/reset',

  /** Role-resolved: one address, two spaces [03 §4]. */
  home: '/home',
  account: '/account',
  signals: '/signals',

  patient: (patientId: string) => `/patient/${patientId}`,

  report: (patientId: string, reportId: string) => `/patient/${patientId}/report/${reportId}`,
  event: (patientId: string, eventId: string) => `/patient/${patientId}/event/${eventId}`,
  task: (patientId: string, taskId: string) => `/patient/${patientId}/task/${taskId}`,
  newTask: (patientId: string) => `/patient/${patientId}/task/new`,
  note: (patientId: string, noteId: string) => `/patient/${patientId}/note/${noteId}`,
  newNote: (patientId: string) => `/patient/${patientId}/note/new`,
} as const

/** Route patterns, kept beside the builders so the two cannot drift. */
export const routePattern = {
  entry: '/',
  enter: '/enter',
  recover: '/enter/recover',
  reset: '/enter/reset',
  home: '/home',
  account: '/account',
  signals: '/signals',
  patient: '/patient/:patientId',
  report: 'report/:reportId',
  event: 'event/:eventId',
  task: 'task/:taskId',
  note: 'note/:noteId',
} as const

/** Depth of a resolved pathname. Drives the shell's depth stack. */
export function depthOf(pathname: string): Depth {
  if (pathname.startsWith('/patient/')) {
    const segments = pathname.split('/').filter(Boolean)
    // /patient/:id            -> 2
    // /patient/:id/report/:id -> 3
    return segments.length > 2 ? DEPTH.focus : DEPTH.patient
  }
  if (pathname === paths.home || pathname === paths.account || pathname === paths.signals) {
    return DEPTH.home
  }
  return DEPTH.entry
}
