// Core domain types for the AI Oncology Patient Intelligence Platform.
// These mirror the data contracts the backend (once built) is expected to expose.

export type UserRole = 'patient' | 'oncologist'

export interface User {
  id: string
  role: UserRole
  name: string
  email: string
  mobile?: string
  avatarColor: string
}

export interface Oncologist extends User {
  role: 'oncologist'
  specialization: string
  qualification: string
  hospital: string
  patientIds: string[]
}

export type TreatmentStatus = 'active-treatment' | 'in-remission' | 'follow-up' | 'newly-diagnosed' | 'palliative-care'

export interface PatientRecord extends User {
  role: 'patient'
  patientCode: string
  dob: string
  gender: 'Male' | 'Female' | 'Other'
  bloodGroup: string
  heightCm: number
  weightKg: number
  treatingOncologistId: string
  primaryCancer: string
  primarySite: string
  stage: string
  diagnosisDate: string
  treatmentStatus: TreatmentStatus
  currentTreatment: string
  allergies: string[]
  currentMedications: string[]
  previousTreatments: string[]
  pastSurgeries: string[]
  familyHistory: string
  smokingHistory: string
  alcoholHistory: string
  comorbidities: string[]
}

export type ReportType =
  | 'Pathology'
  | 'CT Scan'
  | 'MRI'
  | 'PET Scan'
  | 'Blood Test'
  | 'Biopsy'
  | 'Histopathology'
  | 'Surgery Report'
  | 'Discharge Summary'
  | 'Prescription'
  | 'Follow-up Report'
  | 'Other'

export type ProcessingStatus = 'uploaded' | 'processing' | 'processed' | 'failed'

export interface EvidenceRef {
  reportId: string
  reportName: string
  reportDate: string
  finding: string
}

export interface Report {
  id: string
  patientId: string
  name: string
  type: ReportType
  hospital: string
  uploadDate: string
  reportDate: string
  status: ProcessingStatus
  fileSizeKb: number
  fileKind: 'pdf' | 'image'
  aiSummary?: string
  aiConfidence?: number
  keyFindings?: string[]
  relatedTaskId?: string
}

export type TimelineEventType =
  | 'diagnosis'
  | 'report'
  | 'treatment'
  | 'surgery'
  | 'follow-up'
  | 'task'
  | 'note'
  | 'upload'
  | 'other'

export interface TimelineEvent {
  id: string
  patientId: string
  date: string
  type: TimelineEventType
  title: string
  description: string
  relatedReportId?: string
  relatedNoteId?: string
  relatedTaskId?: string
  visibility: 'patient' | 'oncologist' | 'both'
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface PatientTask {
  id: string
  patientId: string
  title: string
  description: string
  instructions: string
  assignedDate: string
  dueDate?: string
  priority: TaskPriority
  status: TaskStatus
  assignedBy: string
  requiresUpload: boolean
  uploadedReportIds: string[]
  completedDate?: string
}

export type NoteType = 'patient' | 'private'

export interface Note {
  id: string
  patientId: string
  type: NoteType
  title: string
  message: string
  createdBy: string
  createdDate: string
  updatedDate?: string
}

export type NotificationCategory =
  | 'task-assigned'
  | 'task-completed'
  | 'report-uploaded'
  | 'note-added'
  | 'ai-processed'
  | 'system'

export interface AppNotification {
  id: string
  userId: string
  category: NotificationCategory
  title: string
  message: string
  date: string
  read: boolean
  link?: string
}

// ---- Digital Twin ----

export type OrganId =
  | 'brain'
  | 'thyroid'
  | 'left-lung'
  | 'right-lung'
  | 'heart'
  | 'liver'
  | 'stomach'
  | 'pancreas'
  | 'spleen'
  | 'left-kidney'
  | 'right-kidney'
  | 'colon'
  | 'bladder'
  | 'prostate'
  | 'left-breast'
  | 'right-breast'
  | 'lymph-nodes'
  | 'bones'

export interface OrganStatus {
  organId: OrganId
  /** 0 = no involvement, 1-5 = severity shade (light -> dark red) */
  severity: 0 | 1 | 2 | 3 | 4 | 5
  note?: string
  evidence?: EvidenceRef
}

export interface DigitalTwinSnapshot {
  id: string
  patientId: string
  date: string
  label: string
  organStatuses: OrganStatus[]
  overallAssessment: string
}

// ---- Patient Intelligence ----

export interface PatientIntelligence {
  patientId: string
  generatedDate: string
  clinicalSummary: string
  currentDiseaseStatus: string
  affectedOrgans: string[]
  diseaseSeverity: 'Mild' | 'Moderate' | 'Severe' | 'Critical'
  recentChanges: { label: string; type: 'progression' | 'regression' | 'stable'; description: string }[]
  treatmentOverview: {
    current: string
    previous: string[]
    recentChange: string
  }
  supportingEvidence: EvidenceRef[]
  confidence: number
}
