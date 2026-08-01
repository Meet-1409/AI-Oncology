import { Download, FileText, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Control, Icon, Surface, Text } from '@/components/primitives'
import {
  Confidence,
  FocusLayer,
  PriorityIndicator,
  ProcessingStatusIndicator,
  TaskStatusIndicator,
} from '@/components/patterns'
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
        {/* The original document. */}
        <Surface
          elevation="sunken"
          radius="lg"
          inset="lg"
          className="border border-dashed border-[var(--border-default)] text-center"
        >
          <Icon
            icon={report.fileKind === 'image' ? ImageIcon : FileText}
            size="lg"
            className="mx-auto text-[var(--text-subtle)]"
          />
          <Text level="secondary" tone="muted" className="mt-3">
            Original document preview
          </Text>
          <Text level="caption" tone="subtle" className="mt-1">
            {report.fileSizeKb.toLocaleString()} KB · {report.fileKind.toUpperCase()}
          </Text>
        </Surface>

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
