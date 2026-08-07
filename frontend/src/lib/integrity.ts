/**
 * State-level integrity notices — facts about the DATA, not about a screen.
 *
 * `CLAUDE.md` rule 5: synthetic findings must be shown on screen, not
 * footnoted. Rule 5 exists because a simulated measurement that looks like a
 * real one is indistinguishable from a real one, and the person reading it has
 * no way to know. A comment in the source does not discharge that.
 *
 * WHY THIS IS A PURE FUNCTION AND NOT A COMPONENT
 *
 * A notice that fails to appear is a safety defect, and safety defects have to
 * be testable without mounting React. `tools/safety-tests.ts` asserts this
 * directly — the same reason `filterTimelineForRole` and `filterNotesForRole`
 * were pulled out of `mock-store.ts`.
 */

export type IntegrityNoticeId = 'synthetic-findings' | 'not-clinically-validated'

export interface IntegrityNotice {
  id: IntegrityNoticeId
  /** The one-line form, shown permanently once the full text has been read. */
  summary: string
  /** The full form, shown on first arrival in a session. */
  detail: string
}

/**
 * What the notices say.
 *
 * Written to be understood by a patient reading their own record, not only by
 * a clinician. "Simulated" rather than "synthetic": one is a word people use,
 * the other sounds like a material.
 */
const NOTICES: Readonly<Record<IntegrityNoticeId, IntegrityNotice>> = {
  'synthetic-findings': {
    id: 'synthetic-findings',
    summary: 'Some findings shown here are simulated.',
    detail:
      'Some findings shown here were produced by a simulator, not by a real analysis of a real scan. They are here so the software can be demonstrated and tested. Nothing on this screen describes a real person, and none of it may be used for care.',
  },
  'not-clinically-validated': {
    id: 'not-clinically-validated',
    summary: 'This software has not been clinically validated.',
    detail:
      'This software has not been clinically validated and is not approved for clinical use. It assists an oncologist and never replaces their judgement. Every value it shows must be checked against the source it came from.',
  },
}

/**
 * Ordering. Most specific claim about THIS data first, standing facts after —
 * a warning about the record in front of you outranks a warning about the
 * product in general.
 */
const ORDER: readonly IntegrityNoticeId[] = [
  'synthetic-findings',
  'not-clinically-validated',
]

export interface IntegrityInput {
  /**
   * True when any finding on screen came from a stub or simulator.
   *
   * Sourced today from the demo-patient flag; under contract v2 this is
   * `patientState.containsSyntheticFindings`.
   */
  containsSyntheticFindings: boolean
  /**
   * Whether to state the standing pre-validation fact.
   *
   * Defined and deliberately not enabled — see the plan. Turning it on is a
   * product decision, not an implementation one.
   */
  clinicallyValidated?: boolean
}

/** Deduplicated and ordered. Never returns the same notice twice. */
export function integrityNoticesFor(input: IntegrityInput): IntegrityNotice[] {
  const raised = new Set<IntegrityNoticeId>()

  if (input.containsSyntheticFindings) raised.add('synthetic-findings')
  if (input.clinicallyValidated === false) raised.add('not-clinically-validated')

  return ORDER.filter((id) => raised.has(id)).map((id) => NOTICES[id])
}
