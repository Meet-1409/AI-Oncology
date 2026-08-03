import { useQuery } from '@tanstack/react-query'
import { getAdapter } from '@/data/adapters'
import { reportComparisonSchema } from '@/data/contract/domain'
import { queryKeys } from '@/data/query-client'

/**
 * Compares two reports [09.4 §14].
 *
 * Fetched on demand rather than as part of the aggregated Patient Space read
 * [02 §9] — a comparison is not needed until the oncologist selects two
 * reports, and which two is chosen at runtime.
 */
export function useReportComparison(
  patientId: string | undefined,
  fromId: string | undefined,
  toId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.evidence.comparison(patientId ?? '', fromId ?? '', toId ?? ''),
    enabled: Boolean(patientId && fromId && toId),
    queryFn: () =>
      getAdapter().read(`/patients/${patientId}/reports/compare`, reportComparisonSchema, {
        params: { from: fromId, to: toId },
      }),
  })
}
