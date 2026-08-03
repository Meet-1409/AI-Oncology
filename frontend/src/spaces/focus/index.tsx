import { ArrowRight, Download, FileText, GitCompare, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Control, Icon, Surface, Text } from '@/components/primitives'
import {
  ChangeIndicator,
  Confidence,
  DocumentPreview,
  EmptyState,
  ErrorState,
  EvidenceList,
  FocusLayer,
  LoadingSurface,
  PlainExplanation,
  PriorityIndicator,
  ProcessingStatusIndicator,
  TaskStatusIndicator,
} from '@/components/patterns'
import { useReportComparison } from '@/data/queries'
import { formatDate, formatDateTime } from '@/lib/format'
import type { PatientTask, Report, TimelineEvent } from '@/types'

/**
 * Focus contents — Depth 3.
 *
 * Each opens above the space the user is already in, which stays mounted and
 * visible behind it [04 §4].
 */

/** A single report. The original document is always the source of truth [09.4 §10]. */
export function ReportFocus({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <FocusLayer
      open
      onOpenChange={(next) => !next && onClose()}
      title={report.name}
      description={`${report.type} · ${report.hospital}`}
      eyebrow={<ProcessingStatusIndicator status={report.status} />}
      footer={
        <Control intent="secondary">
          <Icon icon={Download} size="xs" />
          Download original
        </Control>
      }
    >
      <div className="space-y-6">
        {/* The original document — zoomable, paginated and full-screenable
            without downloading [09.4 §16]. */}
        <DocumentPreview report={report} />

        {/* AI summary, with evidence and confidence attached [00 §5.9], [00 §5.10]. */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Icon icon={Sparkles} size="sm" className="text-[var(--accent)]" />
              <Text as="h3" level="subheading" tone="primary">
                Summary
              </Text>
            </span>
            {report.aiConfidence !== undefined && <Confidence value={report.aiConfidence} />}
          </div>

          {report.status === 'processing' ? (
            <Text level="secondary" tone="muted" className="mt-3">
              This report is still being analysed. Findings will appear here shortly. The
              original document above is available now.
            </Text>
          ) : report.status === 'failed' ? (
            <Text level="secondary" tone="danger" className="mt-3">
              Analysis could not be completed for this report. The original document remains
              available above and is unaffected.
            </Text>
          ) : (
            <>
              <Text level="body" tone="body" measure="comfortable" className="mt-3">
                {report.aiSummary}
              </Text>
              {report.keyFindings && report.keyFindings.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {report.keyFindings.map((finding) => (
                    <li key={finding} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-2 size-1 shrink-0 rounded-full bg-[var(--accent)]"
                      />
                      <Text as="span" level="secondary" tone="body">
                        {finding}
                      </Text>
                    </li>
                  ))}
                </ul>
              )}
              <Text level="caption" tone="subtle" className="mt-4">
                This summary supports review. The original report remains the source of truth.
              </Text>
            </>
          )}
        </section>

        <section>
          <Text as="h3" level="subheading" tone="primary">
            Report details
          </Text>
          <dl className="mt-3 space-y-2">
            {[
              ['Report date', formatDate(report.reportDate)],
              ['Uploaded', formatDateTime(report.uploadDate)],
              ['Hospital or laboratory', report.hospital],
              ['File', `${report.fileKind.toUpperCase()} · ${report.fileSizeKb.toLocaleString()} KB`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2 last:border-0"
              >
                <dt>
                  <Text as="span" level="caption" tone="muted">
                    {label}
                  </Text>
                </dt>
                <dd>
                  <Text as="span" level="secondary" tone="primary">
                    {value}
                  </Text>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </FocusLayer>
  )
}

/** One side of a comparison [09.4 §14]. */
function ReportSummaryCard({ label, report }: { label: string; report: Report }) {
  return (
    <Surface elevation="raised" radius="lg" border="subtle" inset="md">
      <Text level="caption" tone="subtle">
        {label}
      </Text>
      <div className="mt-1.5 flex items-start gap-2.5">
        <Icon
          icon={report.fileKind === 'image' ? ImageIcon : FileText}
          size="sm"
          className="mt-0.5 shrink-0 text-[var(--text-subtle)]"
        />
        <span className="min-w-0">
          <Text level="secondary" tone="primary" weight="medium">
            {report.name}
          </Text>
          <Text level="caption" tone="muted" className="mt-0.5">
            {report.type} · {formatDate(report.reportDate)}
          </Text>
        </span>
      </div>
    </Surface>
  )
}

/**
 * Two reports, compared [09.4 §14].
 *
 * Always ordered chronologically regardless of selection order, so "detected
 * changes" reads as a direction of travel rather than an arbitrary diff.
 * Original reports remain reachable throughout — comparison summarizes them,
 * it never replaces them [09.4 §14].
 */
export function ComparisonFocus({
  patientId,
  fromReport,
  toReport,
  onClose,
  reportHref,
}: {
  patientId: string
  fromReport: Report
  toReport: Report
  onClose: () => void
  reportHref?: ((reportId: string) => string) | undefined
}) {
  const [earlier, later] =
    fromReport.reportDate <= toReport.reportDate ? [fromReport, toReport] : [toReport, fromReport]
  const { data, isLoading, isError, refetch } = useReportComparison(patientId, earlier.id, later.id)

  return (
    <FocusLayer
      open
      onOpenChange={(next) => !next && onClose()}
      title="Comparing reports"
      description="The original reports remain the source of truth for both."
      eyebrow={
        <Icon icon={GitCompare} size="sm" className="text-[var(--accent)]" />
      }
      className="sm:w-[min(56rem,94vw)]"
    >
      <div className="space-y-6">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <ReportSummaryCard label="Earlier report" report={earlier} />
          <Icon
            icon={ArrowRight}
            size="sm"
            className="mx-auto hidden text-[var(--text-subtle)] sm:block"
          />
          <ReportSummaryCard label="Later report" report={later} />
        </div>

        {isLoading && <LoadingSurface lines={3} label="Comparing reports" />}

        {isError && (
          <ErrorState
            title="Comparison could not be completed"
            description="Both original reports remain available above for direct review."
            onRetry={() => void refetch()}
          />
        )}

        {data && data.detectedChanges.length === 0 && data.otherFindings.length === 0 && (
          <EmptyState
            icon={GitCompare}
            title="Not enough structured information to compare automatically"
            description="Both original reports remain available above for direct review."
          />
        )}

        {data && (data.detectedChanges.length > 0 || data.otherFindings.length > 0) && (
          <>
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Text as="h3" level="subheading" tone="primary">
                  Detected changes
                </Text>
                <Confidence value={data.confidence} />
              </div>

              <ul className="mt-3 space-y-3">
                {data.detectedChanges.map((change) => (
                  <li key={change.label} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">
                      <ChangeIndicator direction={change.type} />
                    </span>
                    <Text level="secondary" tone="body" className="min-w-0">
                      {change.description}
                    </Text>
                  </li>
                ))}
              </ul>

              <PlainExplanation summary="What does the confidence figure mean?" className="mt-3">
                It describes how much of the later report's findings could be matched
                to explicit wording in this comparison — not how likely the changes are
                to be clinically correct. It is never a substitute for reading both
                reports, and it is never a second opinion.
              </PlainExplanation>
            </section>

            {data.otherFindings.length > 0 && (
              <section>
                <Text as="h3" level="subheading" tone="primary">
                  Also noted in the later report
                </Text>
                <Text level="caption" tone="muted" className="mt-1">
                  New findings the comparison could not confidently direct. No direction
                  is claimed for these — review the original report above.
                </Text>
                <ul className="mt-3 space-y-1.5">
                  {data.otherFindings.map((finding) => (
                    <li key={finding} className="flex items-start gap-2">
                      <span
                        aria-hidden
                        className="mt-2 size-1 shrink-0 rounded-full bg-[var(--text-subtle)]"
                      />
                      <Text as="span" level="secondary" tone="body">
                        {finding}
                      </Text>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <Text as="h3" level="subheading" tone="primary">
                Supporting evidence
              </Text>
              <div className="mt-3">
                <EvidenceList items={data.supportingEvidence} hrefFor={reportHref} />
              </div>
            </section>
          </>
        )}
      </div>
    </FocusLayer>
  )
}

/** A single Journey event [09.5 §7]. */
export function EventFocus({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  return (
    <FocusLayer
      open
      onOpenChange={(next) => !next && onClose()}
      title={event.title}
      description={event.description}
      eyebrow={
        <Text as="span" level="caption" tone="subtle">
          {formatDate(event.date)}
        </Text>
      }
    >
      <Text level="secondary" tone="muted">
        This event is part of the patient's permanent history and cannot be edited or removed.
      </Text>
    </FocusLayer>
  )
}

/** A single task, with its uploaded files and completion history [09.8 §11]. */
export function TaskFocus({ task, onClose }: { task: PatientTask; onClose: () => void }) {
  return (
    <FocusLayer
      open
      onOpenChange={(next) => !next && onClose()}
      title={task.title}
      description={task.instructions}
      eyebrow={
        <>
          <TaskStatusIndicator status={task.status} />
          <PriorityIndicator priority={task.priority} />
        </>
      }
    >
      <dl className="space-y-2">
        {[
          ['Assigned by', task.assignedBy],
          ['Assigned', formatDate(task.assignedDate)],
          ...(task.dueDate ? [['Due', formatDate(task.dueDate)]] : []),
          ...(task.completedDate ? [['Completed', formatDate(task.completedDate)]] : []),
          ['Files submitted', String(task.uploadedReportIds.length)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2 last:border-0"
          >
            <dt>
              <Text as="span" level="caption" tone="muted">
                {label}
              </Text>
            </dt>
            <dd>
              <Text as="span" level="secondary" tone="primary">
                {value}
              </Text>
            </dd>
          </div>
        ))}
      </dl>
    </FocusLayer>
  )
}
