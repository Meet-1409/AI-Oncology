import type {
  DigitalTwinSnapshot,
  PatientRecord,
  Report,
  TimelineEvent,
} from '@/types'

/**
 * THREE DEMONSTRATION PATIENTS.
 *
 * ⚠ EVERY VALUE IN THIS FILE IS INVENTED. No person, record, hospital or result
 * here is real, and none of it may ever be presented as though it were.
 *
 * This file exists at the product owner's explicit instruction (7 August 2026),
 * and it reverses the earlier "no invented clinical data" rule that emptied
 * `mock-data.ts`. That rule was not arbitrary — a demo record that reads as a
 * real one is how invented numbers end up quoted back as fact — so the
 * concession is deliberately bounded:
 *
 *   1. The names are obviously fictional and the hospital is `Demo General`.
 *   2. Patient codes are prefixed `AOP-DEMO-`, not the `AOP-` used by real
 *      synthesized records, so the two can never be confused in a list.
 *   3. Nothing here is loaded unless `VITE_DEMO_PATIENTS` is on (defaulting to
 *      on in development, off in a production build) — see `mock-store.ts`.
 *   4. IT SAYS SO ON SCREEN. Loading this file raises the `synthetic-findings`
 *      integrity notice, a band the shell carries above every space and that
 *      cannot be dismissed — `lib/integrity.ts`, `CLAUDE.md` rule 5. That is
 *      what makes the concession safe rather than merely documented, and it is
 *      guarded by a test in `tools/safety-tests.ts`.
 *   5. Every AI summary carries a confidence, because a summary without one is
 *      a claim without a caveat and the schema rightly rejects it [00 §5.10].
 *
 * The three are deliberately DIFFERENT, so the interface is exercised rather
 * than decorated: one newly diagnosed with a single finding, one mid-treatment
 * with several organs involved and a real history, one in remission whose
 * findings have resolved to zero. Between them they cover every severity step,
 * every treatment status the UI can show, both body forms, and a timeline long
 * enough that the Journey has something to draw.
 */

const HOSPITAL = 'Demo General Hospital'

/* ------------------------------------------------------------------ *
 * 1. Newly diagnosed — one finding, early, nothing resolved yet.
 * ------------------------------------------------------------------ */

const anita: PatientRecord = {
  id: 'demo-patient-1',
  role: 'patient',
  name: 'Anita Demo',
  email: 'anita@demo.invalid',
  avatarColor: '#5b6980',
  patientCode: 'AOP-DEMO-001',
  dob: '1979-03-14',
  gender: 'Female',
  bloodGroup: 'O+',
  heightCm: 163,
  weightKg: 61,
  treatingOncologistId: 'demo-oncologist',
  primaryCancer: 'Breast carcinoma',
  primarySite: 'Left breast',
  stage: 'Stage I',
  diagnosisDate: '2026-06-18',
  treatmentStatus: 'newly-diagnosed',
  currentTreatment: 'Awaiting surgical planning',
  allergies: ['Penicillin'],
  currentMedications: [],
  previousTreatments: [],
  pastSurgeries: [],
  familyHistory: 'Mother diagnosed with breast cancer at 58',
  smokingHistory: 'Never smoked',
  alcoholHistory: 'Occasional',
  comorbidities: [],
}

/* ------------------------------------------------------------------ *
 * 2. Mid-treatment — several organs involved, a real history behind it.
 * ------------------------------------------------------------------ */

const rahul: PatientRecord = {
  id: 'demo-patient-2',
  role: 'patient',
  name: 'Rahul Demo',
  email: 'rahul@demo.invalid',
  avatarColor: '#414d62',
  patientCode: 'AOP-DEMO-002',
  dob: '1962-11-02',
  gender: 'Male',
  bloodGroup: 'B+',
  heightCm: 174,
  weightKg: 70,
  treatingOncologistId: 'demo-oncologist',
  primaryCancer: 'Non-small cell lung carcinoma',
  primarySite: 'Right lung, upper lobe',
  stage: 'Stage IIIB',
  diagnosisDate: '2025-09-30',
  treatmentStatus: 'active-treatment',
  currentTreatment: 'Concurrent chemoradiotherapy, cycle 3 of 4',
  allergies: [],
  currentMedications: ['Cisplatin', 'Etoposide', 'Ondansetron'],
  previousTreatments: ['Induction chemotherapy (2 cycles)'],
  pastSurgeries: ['Mediastinoscopy, October 2025'],
  familyHistory: 'No known family history of cancer',
  smokingHistory: 'Former smoker, 30 pack-years, stopped 2025',
  alcoholHistory: 'None',
  comorbidities: ['Type 2 diabetes', 'Hypertension'],
}

/* ------------------------------------------------------------------ *
 * 3. In remission — findings resolved to zero. The calm end of the scale.
 * ------------------------------------------------------------------ */

const meera: PatientRecord = {
  id: 'demo-patient-3',
  role: 'patient',
  name: 'Meera Demo',
  email: 'meera@demo.invalid',
  avatarColor: '#2c3648',
  patientCode: 'AOP-DEMO-003',
  dob: '1991-07-25',
  gender: 'Female',
  bloodGroup: 'A-',
  heightCm: 158,
  weightKg: 54,
  treatingOncologistId: 'demo-oncologist',
  primaryCancer: 'Papillary thyroid carcinoma',
  primarySite: 'Thyroid, right lobe',
  stage: 'Stage I',
  diagnosisDate: '2024-02-11',
  treatmentStatus: 'in-remission',
  currentTreatment: 'Levothyroxine, six-monthly surveillance',
  allergies: ['Iodinated contrast'],
  currentMedications: ['Levothyroxine'],
  previousTreatments: ['Radioactive iodine ablation'],
  pastSurgeries: ['Total thyroidectomy, March 2024'],
  familyHistory: 'No known family history of cancer',
  smokingHistory: 'Never smoked',
  alcoholHistory: 'None',
  comorbidities: ['Hypothyroidism, post-surgical'],
}

export const demoPatients: readonly PatientRecord[] = [anita, rahul, meera]

/* ------------------------------------------------------------------ *
 * Reports. Every AI summary carries a confidence [00 §5.10].
 * ------------------------------------------------------------------ */

export const demoReports: readonly Report[] = [
  {
    id: 'demo-r1',
    patientId: anita.id,
    name: 'Core biopsy — left breast',
    type: 'Pathology',
    hospital: HOSPITAL,
    uploadDate: '2026-06-19',
    reportDate: '2026-06-18',
    status: 'processed',
    fileSizeKb: 412,
    fileKind: 'pdf',
    aiSummary:
      'Invasive ductal carcinoma identified in the left breast. No lymph node involvement reported in this specimen.',
    aiConfidence: 0.94,
    keyFindings: ['Invasive ductal carcinoma, left breast', 'Grade 2', 'No nodal involvement in specimen'],
  },
  {
    id: 'demo-r2',
    patientId: rahul.id,
    name: 'CT chest — staging',
    type: 'CT Scan',
    hospital: HOSPITAL,
    uploadDate: '2025-10-02',
    reportDate: '2025-09-30',
    status: 'processed',
    fileSizeKb: 1880,
    fileKind: 'pdf',
    aiSummary:
      'Mass in the right upper lobe with mediastinal lymph node involvement. No distant metastatic disease described.',
    aiConfidence: 0.89,
    keyFindings: ['Right upper lobe mass', 'Mediastinal nodal involvement', 'No distant metastasis described'],
  },
  {
    id: 'demo-r3',
    patientId: rahul.id,
    name: 'PET-CT — response assessment',
    type: 'PET Scan',
    hospital: HOSPITAL,
    uploadDate: '2026-05-14',
    reportDate: '2026-05-12',
    status: 'processed',
    fileSizeKb: 2240,
    fileKind: 'pdf',
    aiSummary:
      'Reduced metabolic activity in the right upper lobe lesion compared with the September study. Nodal uptake also reduced.',
    aiConfidence: 0.86,
    keyFindings: ['Reduced uptake, right upper lobe', 'Reduced nodal uptake', 'Partial response'],
  },
  {
    id: 'demo-r4',
    patientId: meera.id,
    name: 'Neck ultrasound — surveillance',
    type: 'Follow-up Report',
    hospital: HOSPITAL,
    uploadDate: '2026-04-08',
    reportDate: '2026-04-07',
    status: 'processed',
    fileSizeKb: 356,
    fileKind: 'pdf',
    aiSummary:
      'No abnormality identified in the thyroid bed. No suspicious cervical lymph nodes described.',
    aiConfidence: 0.92,
    keyFindings: ['No residual disease in thyroid bed', 'No suspicious cervical nodes'],
  },
]

/* ------------------------------------------------------------------ *
 * Timeline. Long enough that the Journey has something to draw.
 * ------------------------------------------------------------------ */

export const demoTimeline: readonly TimelineEvent[] = [
  {
    id: 'demo-t1',
    patientId: anita.id,
    date: '2026-06-18',
    type: 'diagnosis',
    title: 'Diagnosis recorded',
    description: 'Invasive ductal carcinoma of the left breast, Stage I.',
    relatedReportId: 'demo-r1',
    visibility: 'both',
  },
  {
    id: 'demo-t2',
    patientId: anita.id,
    date: '2026-06-19',
    type: 'report',
    title: 'Biopsy report added',
    description: 'Core biopsy of the left breast uploaded and read.',
    relatedReportId: 'demo-r1',
    visibility: 'both',
  },
  {
    id: 'demo-t3',
    patientId: rahul.id,
    date: '2025-09-30',
    type: 'diagnosis',
    title: 'Diagnosis recorded',
    description: 'Non-small cell lung carcinoma, right upper lobe, Stage IIIB.',
    relatedReportId: 'demo-r2',
    visibility: 'both',
  },
  {
    id: 'demo-t4',
    patientId: rahul.id,
    date: '2025-10-21',
    type: 'surgery',
    title: 'Mediastinoscopy',
    description: 'Diagnostic mediastinoscopy performed for nodal staging.',
    visibility: 'both',
  },
  {
    id: 'demo-t5',
    patientId: rahul.id,
    date: '2025-11-04',
    type: 'treatment',
    title: 'Induction chemotherapy started',
    description: 'Two cycles of induction chemotherapy commenced.',
    visibility: 'both',
  },
  {
    id: 'demo-t6',
    patientId: rahul.id,
    date: '2026-05-12',
    type: 'report',
    title: 'Response assessment',
    description: 'PET-CT shows reduced metabolic activity compared with September.',
    relatedReportId: 'demo-r3',
    visibility: 'both',
  },
  {
    id: 'demo-t7',
    patientId: meera.id,
    date: '2024-02-11',
    type: 'diagnosis',
    title: 'Diagnosis recorded',
    description: 'Papillary thyroid carcinoma, right lobe, Stage I.',
    visibility: 'both',
  },
  {
    id: 'demo-t8',
    patientId: meera.id,
    date: '2024-03-06',
    type: 'surgery',
    title: 'Total thyroidectomy',
    description: 'Total thyroidectomy performed without reported complication.',
    visibility: 'both',
  },
  {
    id: 'demo-t9',
    patientId: meera.id,
    date: '2024-05-20',
    type: 'treatment',
    title: 'Radioactive iodine ablation',
    description: 'Single ablation dose administered.',
    visibility: 'both',
  },
  {
    id: 'demo-t10',
    patientId: meera.id,
    date: '2026-04-07',
    type: 'follow-up',
    title: 'Surveillance ultrasound',
    description: 'No residual disease identified. Six-monthly surveillance continues.',
    relatedReportId: 'demo-r4',
    visibility: 'both',
  },
]

/* ------------------------------------------------------------------ *
 * Body snapshots — what the Digital Twin actually draws.
 *
 * These are the reason the demo is worth having: between the three patients
 * they cover the whole severity scale, and Rahul has two dated snapshots so
 * moving through time visibly changes the body rather than merely changing a
 * date label.
 * ------------------------------------------------------------------ */

export const demoSnapshots: readonly DigitalTwinSnapshot[] = [
  {
    id: 'demo-s1',
    patientId: anita.id,
    date: '2026-06-18',
    label: 'At diagnosis',
    organStatuses: [
      {
        organId: 'left-breast',
        severity: 2,
        note: 'Invasive ductal carcinoma identified on core biopsy.',
        evidence: { reportId: 'demo-r1', reportName: 'Core biopsy — left breast', reportDate: '2026-06-18', finding: 'Invasive ductal carcinoma, grade 2.' },
      },
    ],
    overallAssessment: 'Single site of disease recorded. No nodal involvement reported in the specimen.',
  },
  {
    id: 'demo-s2',
    patientId: rahul.id,
    date: '2025-09-30',
    label: 'At diagnosis',
    organStatuses: [
      {
        organId: 'right-lung',
        severity: 4,
        note: 'Mass in the right upper lobe.',
        evidence: { reportId: 'demo-r2', reportName: 'CT chest — staging', reportDate: '2025-09-30', finding: 'Right upper lobe mass with mediastinal nodal involvement.' },
      },
      {
        organId: 'lymph-nodes',
        severity: 3,
        note: 'Mediastinal lymph node involvement.',
        evidence: { reportId: 'demo-r2', reportName: 'CT chest — staging', reportDate: '2025-09-30', finding: 'Mediastinal nodal involvement.' },
      },
    ],
    overallAssessment: 'Disease recorded in the right lung and mediastinal nodes at diagnosis.',
  },
  {
    id: 'demo-s3',
    patientId: rahul.id,
    date: '2026-05-12',
    label: 'After three cycles',
    organStatuses: [
      {
        organId: 'right-lung',
        severity: 2,
        note: 'Reduced metabolic activity compared with the September study.',
        evidence: { reportId: 'demo-r3', reportName: 'PET-CT — response assessment', reportDate: '2026-05-12', finding: 'Reduced uptake in the right upper lobe lesion.' },
      },
      {
        organId: 'lymph-nodes',
        severity: 1,
        note: 'Reduced nodal uptake.',
        evidence: { reportId: 'demo-r3', reportName: 'PET-CT — response assessment', reportDate: '2026-05-12', finding: 'Nodal uptake also reduced.' },
      },
    ],
    overallAssessment: 'Both recorded sites show reduced activity compared with the previous study.',
  },
  {
    id: 'demo-s4',
    patientId: meera.id,
    date: '2026-04-07',
    label: 'Surveillance',
    organStatuses: [
      {
        organId: 'thyroid',
        severity: 0,
        note: 'No residual disease identified in the thyroid bed.',
        evidence: { reportId: 'demo-r4', reportName: 'Neck ultrasound — surveillance', reportDate: '2026-04-07', finding: 'No abnormality identified in the thyroid bed.' },
      },
    ],
    overallAssessment: 'No disease recorded at this review.',
  },
]
