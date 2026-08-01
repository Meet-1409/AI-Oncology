import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdapter } from '@/data/adapters'
import {
  patientListSchema,
  patientSpaceSchema,
  reportSchema,
  taskSchema,
  noteSchema,
} from '@/data/contract/domain'
import type { PatientSpaceData } from '@/data/contract/domain'
import { queryKeys } from '@/data/query-client'
import { useSessionStore } from '@/state/session-store'
import type { Note, PatientTask } from '@/types'

/**
 * Patient data.
 *
 * Entering Patient Space is ONE aggregated request [02 §9], not six. This is what
 * makes arrival feel like entering a place rather than assembling a page, and it
 * is why the Body, Journey, Evidence and Understanding are all present the moment
 * the space appears.
 */

export function usePatients() {
  return useQuery({
    queryKey: queryKeys.patients.list(),
    queryFn: () => getAdapter().read('/patients', patientListSchema),
  })
}

export function usePatientSpace(patientId: string | undefined) {
  const role = useSessionStore((s) => s.role)

  return useQuery<PatientSpaceData>({
    queryKey: queryKeys.patients.space(patientId ?? ''),
    enabled: Boolean(patientId) && role !== null,
    queryFn: () =>
      getAdapter().read(`/patients/${patientId}`, patientSpaceSchema, {
        params: { role: role ?? 'oncologist' },
      }),
    select: (data) => {
      // Defence in depth. The backend already filters by role [02 §7]; this is a
      // second lock so a UI mistake can never surface private observations, AI
      // confidence or internal clinical detail to a patient [09.5 §19].
      if (role !== 'patient') return data
      return {
        ...data,
        notes: data.notes.filter((n) => n.type === 'patient'),
        timeline: data.timeline.filter((e) => e.visibility !== 'oncologist'),
        understanding: null,
      }
    },
  })
}

/** Invalidates everything belonging to one patient after a mutation. */
function useInvalidatePatient() {
  const queryClient = useQueryClient()
  return (patientId: string) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.patients.space(patientId) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.signals.all })
  }
}

export interface UploadInput {
  patientId: string
  file: File
  name: string
  type: string
  hospital: string
  reportDate?: string
  taskId?: string
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

export function useUploadReport() {
  const invalidate = useInvalidatePatient()

  return useMutation({
    mutationFn: ({ patientId, file, onProgress, signal, ...fields }: UploadInput) =>
      getAdapter().upload(
        '/mutations/upload-report',
        reportSchema,
        file,
        { patientId, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, String(v ?? '')])) },
        { onProgress, signal },
      ),
    onSuccess: (_report, variables) => invalidate(variables.patientId),
  })
}

export function useCreateTask() {
  const invalidate = useInvalidatePatient()

  return useMutation({
    mutationFn: (input: Omit<PatientTask, 'id' | 'status' | 'uploadedReportIds'>) =>
      getAdapter().write('/mutations/create-task', taskSchema, input),
    onSuccess: (task) => invalidate(task.patientId),
  })
}

export function useCancelTask() {
  const invalidate = useInvalidatePatient()

  return useMutation({
    mutationFn: (input: { taskId: string; patientId: string }) =>
      getAdapter().write('/mutations/cancel-task', taskSchema, input),
    onSuccess: (task) => invalidate(task.patientId),
  })
}

export function useCompleteTask() {
  const invalidate = useInvalidatePatient()

  return useMutation({
    mutationFn: (input: { taskId: string; patientId: string }) =>
      getAdapter().write('/mutations/complete-task', taskSchema, input),
    onSuccess: (task) => invalidate(task.patientId),
  })
}

export function useCreateNote() {
  const invalidate = useInvalidatePatient()

  return useMutation({
    mutationFn: (input: Omit<Note, 'id' | 'createdDate'>) =>
      getAdapter().write('/mutations/create-note', noteSchema, input),
    onSuccess: (note) => invalidate(note.patientId),
  })
}
