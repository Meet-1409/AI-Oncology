import { useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createQueryClient } from '@/data/query-client'
import { useTheme } from '@/design/use-theme'

/**
 * Composition root for cross-cutting providers.
 *
 * The query client is created once per application instance and held in state so
 * it survives re-renders. Its cache is part of state continuity — the environment
 * is never rebuilt from scratch during navigation [02 §2].
 *
 * The theme is applied here rather than inside the shell, because Depth 0 sits
 * outside the shell and must be lit the same way. One environment, one theme
 * [04 §27].
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)
  useTheme()

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
