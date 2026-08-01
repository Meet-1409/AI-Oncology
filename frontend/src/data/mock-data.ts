import type {
  AppNotification,
  DigitalTwinSnapshot,
  Note,
  Oncologist,
  PatientIntelligence,
  PatientRecord,
  PatientTask,
  Report,
  TimelineEvent,
} from '@/types'

// ---------------------------------------------------------------------------
// Oncologist
// ---------------------------------------------------------------------------

export const oncologist: Oncologist = {
  id: 'onc1',
  role: 'oncologist',
  name: 'Dr. Ananya Rao',
  email: 'ananya.rao@sunrisecancer.example',
  mobile: '+91 98200 11223',
  avatarColor: '#1c4d66',
  specialization: 'Medical Oncology',
  qualification: 'MD, DM (Medical Oncology)',
  hospital: 'Sunrise Cancer Institute',
  patientIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
}

// ---------------------------------------------------------------------------
// Patients
// ---------------------------------------------------------------------------

export const patients: PatientRecord[] = [
  {
    id: 'p1',
    role: 'patient',
    name: 'Meera Kulkarni',
    email: 'meera.kulkarni@example.com',
    mobile: '+91 98765 43210',
    avatarColor: '#b3435c',
    patientCode: 'AOP-10231',
    dob: '1978-04-12',
    gender: 'Female',
    bloodGroup: 'B+',
    heightCm: 160,
    weightKg: 62,
    treatingOncologistId: 'onc1',
    primaryCancer: 'Invasive Ductal Carcinoma (Breast)',
    primarySite: 'Left Breast',
    stage: 'Stage IIB',
    diagnosisDate: '2026-03-10',
    treatmentStatus: 'active-treatment',
    currentTreatment: 'Neoadjuvant Chemotherapy (AC-T protocol) — Cycle 5 of 8',
    allergies: ['Penicillin'],
    currentMedications: ['Ondansetron 8mg', 'Filgrastim injection', 'Folic acid'],
    previousTreatments: [],
    pastSurgeries: ['Core needle biopsy — Left breast (05 Mar 2026)'],
    familyHistory: 'Mother diagnosed with breast cancer at age 55.',
    smokingHistory: 'Never smoked',
    alcoholHistory: 'Occasional social drinking',
    comorbidities: ['Hypothyroidism (controlled)'],
  },
  {
    id: 'p2',
    role: 'patient',
    name: 'Rajesh Iyer',
    email: 'rajesh.iyer@example.com',
    mobile: '+91 90210 55678',
    avatarColor: '#1f607c',
    patientCode: 'AOP-10187',
    dob: '1965-11-02',
    gender: 'Male',
    bloodGroup: 'O+',
    heightCm: 172,
    weightKg: 74,
    treatingOncologistId: 'onc1',
    primaryCancer: 'Non-Small Cell Lung Carcinoma',
    primarySite: 'Right Lung (Upper Lobe)',
    stage: 'Stage IIIA',
    diagnosisDate: '2026-01-18',
    treatmentStatus: 'active-treatment',
    currentTreatment: 'Concurrent Chemoradiation — Week 4 of 6',
    allergies: [],
    currentMedications: ['Cisplatin + Etoposide (chemo)', 'Pantoprazole 40mg', 'Ondansetron 8mg'],
    previousTreatments: [],
    pastSurgeries: ['Diagnostic bronchoscopy (20 Jan 2026)'],
    familyHistory: 'Father diagnosed with lung cancer at age 68.',
    smokingHistory: 'Ex-smoker, ~30 pack-years, quit January 2026',
    alcoholHistory: 'None',
    comorbidities: ['Hypertension', 'Type 2 Diabetes Mellitus'],
  },
  {
    id: 'p3',
    role: 'patient',
    name: 'Sunita Verma',
    email: 'sunita.verma@example.com',
    mobile: '+91 98111 22334',
    avatarColor: '#17803f',
    patientCode: 'AOP-09876',
    dob: '1970-06-25',
    gender: 'Female',
    bloodGroup: 'A+',
    heightCm: 158,
    weightKg: 68,
    treatingOncologistId: 'onc1',
    primaryCancer: 'Colorectal Adenocarcinoma',
    primarySite: 'Sigmoid Colon',
    stage: 'Stage IIA',
    diagnosisDate: '2025-10-02',
    treatmentStatus: 'follow-up',
    currentTreatment: 'Post-surgical surveillance — adjuvant chemotherapy completed',
    allergies: [],
    currentMedications: ['Multivitamin'],
    previousTreatments: ['Adjuvant FOLFOX chemotherapy (completed Apr 2026)'],
    pastSurgeries: ['Laparoscopic sigmoid colectomy (08 Nov 2025)'],
    familyHistory: 'No significant family history.',
    smokingHistory: 'Never smoked',
    alcoholHistory: 'None',
    comorbidities: ['Osteoarthritis'],
  },
  {
    id: 'p4',
    role: 'patient',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@example.com',
    mobile: '+91 99887 65432',
    avatarColor: '#a3620a',
    patientCode: 'AOP-10305',
    dob: '1958-02-14',
    gender: 'Male',
    bloodGroup: 'B-',
    heightCm: 175,
    weightKg: 80,
    treatingOncologistId: 'onc1',
    primaryCancer: 'Prostate Adenocarcinoma',
    primarySite: 'Prostate',
    stage: 'Stage I',
    diagnosisDate: '2026-07-05',
    treatmentStatus: 'newly-diagnosed',
    currentTreatment: 'Treatment planning — active surveillance vs. surgery under discussion',
    allergies: ['Sulfa drugs'],
    currentMedications: ['Tamsulosin 0.4mg'],
    previousTreatments: [],
    pastSurgeries: ['TRUS-guided prostate biopsy (08 Jul 2026)'],
    familyHistory: 'Brother diagnosed with prostate cancer at age 65.',
    smokingHistory: 'Never smoked',
    alcoholHistory: 'Occasional',
    comorbidities: ['Benign Prostatic Hyperplasia', 'Hyperlipidemia'],
  },
  {
    id: 'p5',
    role: 'patient',
    name: 'Kavita Nair',
    email: 'kavita.nair@example.com',
    mobile: '+91 97654 32109',
    avatarColor: '#7c3f9e',
    patientCode: 'AOP-10042',
    dob: '1985-09-30',
    gender: 'Female',
    bloodGroup: 'AB+',
    heightCm: 162,
    weightKg: 58,
    treatingOncologistId: 'onc1',
    primaryCancer: 'Non-Hodgkin Lymphoma (Diffuse Large B-Cell)',
    primarySite: 'Cervical Lymph Nodes',
    stage: 'Stage III',
    diagnosisDate: '2026-02-20',
    treatmentStatus: 'active-treatment',
    currentTreatment: 'R-CHOP Chemotherapy — Cycle 4 of 6',
    allergies: [],
    currentMedications: ['Rituximab infusion', 'Prednisone taper'],
    previousTreatments: [],
    pastSurgeries: ['Excisional lymph node biopsy — neck (15 Feb 2026)'],
    familyHistory: 'No significant family history.',
    smokingHistory: 'Never smoked',
    alcoholHistory: 'None',
    comorbidities: [],
  },
]

export const patientById = (id: string) => patients.find((p) => p.id === id)

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export const reports: Report[] = [
  // Meera Kulkarni (p1)
  {
    id: 'r1', patientId: 'p1', name: 'Core Needle Biopsy — Left Breast', type: 'Pathology',
    hospital: 'Sunrise Diagnostics', uploadDate: '2026-03-06', reportDate: '2026-03-05',
    status: 'processed', fileSizeKb: 842, fileKind: 'pdf',
    aiSummary: 'Invasive ductal carcinoma, grade 2. Receptor profile: ER positive, PR positive, HER2 negative.',
    aiConfidence: 0.94,
    keyFindings: ['ER positive (90%)', 'PR positive (70%)', 'HER2 negative', 'Ki-67 index 22%'],
  },
  {
    id: 'r2', patientId: 'p1', name: 'Bilateral Mammography & Breast Ultrasound', type: 'Other',
    hospital: 'Sunrise Diagnostics', uploadDate: '2026-03-07', reportDate: '2026-03-06',
    status: 'processed', fileSizeKb: 1320, fileKind: 'image',
    aiSummary: 'Irregular spiculated mass in the left breast upper outer quadrant, BI-RADS 5. Right breast unremarkable.',
    aiConfidence: 0.89,
    keyFindings: ['Left breast mass 1.9 cm, BI-RADS 5', 'No right breast abnormality'],
  },
  {
    id: 'r3', patientId: 'p1', name: 'Contrast-Enhanced MRI — Breast', type: 'MRI',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-03-09', reportDate: '2026-03-08',
    status: 'processed', fileSizeKb: 4210, fileKind: 'pdf',
    aiSummary: '1.8 x 1.5 cm enhancing mass, left breast upper outer quadrant, with two suspicious left axillary lymph nodes.',
    aiConfidence: 0.91,
    keyFindings: ['Primary lesion 1.8 x 1.5 cm', '2 suspicious left axillary nodes', 'No contralateral involvement'],
  },
  {
    id: 'r4', patientId: 'p1', name: 'PET-CT Whole Body', type: 'PET Scan',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-03-13', reportDate: '2026-03-12',
    status: 'processed', fileSizeKb: 5860, fileKind: 'pdf',
    aiSummary: 'FDG-avid primary lesion and axillary nodes. No evidence of distant metastatic disease.',
    aiConfidence: 0.88,
    keyFindings: ['SUVmax 8.2 at primary site', 'No distant metastasis identified'],
  },
  {
    id: 'r5', patientId: 'p1', name: 'Complete Blood Count — Baseline', type: 'Blood Test',
    hospital: 'Sunrise Diagnostics', uploadDate: '2026-03-20', reportDate: '2026-03-19',
    status: 'processed', fileSizeKb: 210, fileKind: 'pdf',
    aiSummary: 'All parameters within normal limits. Baseline recorded prior to chemotherapy initiation.',
    aiConfidence: 0.97,
    keyFindings: ['Hemoglobin 12.8 g/dL', 'WBC 6,900/µL', 'Platelets 268,000/µL'],
  },
  {
    id: 'r6', patientId: 'p1', name: 'Complete Blood Count — Cycle 3', type: 'Blood Test',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-05-16', reportDate: '2026-05-15',
    status: 'processed', fileSizeKb: 198, fileKind: 'pdf',
    aiSummary: 'Mild neutropenia consistent with chemotherapy cycle 3. No dose delay required.',
    aiConfidence: 0.9,
    keyFindings: ['ANC 1,450/µL (mild neutropenia)', 'Hemoglobin 11.2 g/dL'],
  },
  {
    id: 'r7', patientId: 'p1', name: 'Interim Response MRI — Breast', type: 'MRI',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-06-11', reportDate: '2026-06-10',
    status: 'processed', fileSizeKb: 3980, fileKind: 'pdf',
    aiSummary: 'Primary lesion reduced to 0.9 cm. Previously noted axillary nodes no longer meet size criteria. Partial response to neoadjuvant chemotherapy.',
    aiConfidence: 0.92,
    keyFindings: ['Primary lesion reduced from 1.8 cm to 0.9 cm', 'Axillary nodes regressed', 'Partial response (RECIST)'],
  },
  {
    id: 'r8', patientId: 'p1', name: 'Complete Blood Count — Cycle 5', type: 'Blood Test',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-07-29', reportDate: '2026-07-28',
    status: 'processing', fileSizeKb: 204, fileKind: 'pdf',
  },

  // Rajesh Iyer (p2)
  {
    id: 'r9', patientId: 'p2', name: 'Diagnostic Bronchoscopy with Biopsy', type: 'Pathology',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-01-21', reportDate: '2026-01-20',
    status: 'processed', fileSizeKb: 760, fileKind: 'pdf',
    aiSummary: 'Non-small cell lung carcinoma, adenocarcinoma subtype, moderately differentiated.',
    aiConfidence: 0.93,
    keyFindings: ['Adenocarcinoma, moderately differentiated', 'EGFR negative', 'ALK negative'],
  },
  {
    id: 'r10', patientId: 'p2', name: 'CT Chest with Contrast', type: 'CT Scan',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-01-22', reportDate: '2026-01-21',
    status: 'processed', fileSizeKb: 6100, fileKind: 'pdf',
    aiSummary: '4.2 cm mass in the right upper lobe with ipsilateral mediastinal lymphadenopathy.',
    aiConfidence: 0.9,
    keyFindings: ['Right upper lobe mass 4.2 cm', 'Mediastinal lymphadenopathy (station 4R, 7)'],
  },
  {
    id: 'r11', patientId: 'p2', name: 'PET-CT Whole Body', type: 'PET Scan',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-01-26', reportDate: '2026-01-25',
    status: 'processed', fileSizeKb: 5490, fileKind: 'pdf',
    aiSummary: 'FDG-avid right upper lobe mass and mediastinal nodes. No distant metastasis identified at this time.',
    aiConfidence: 0.87,
    keyFindings: ['SUVmax 11.4 at primary site', 'Nodal involvement confirmed', 'No distant metastasis'],
  },
  {
    id: 'r12', patientId: 'p2', name: 'Follow-up CT Chest', type: 'CT Scan',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-06-03', reportDate: '2026-06-02',
    status: 'processed', fileSizeKb: 6340, fileKind: 'pdf',
    aiSummary: 'Primary mass increased to 4.8 cm with a new small hypodense hepatic lesion suspicious for early metastasis.',
    aiConfidence: 0.85,
    keyFindings: ['Primary mass 4.2 cm → 4.8 cm', 'New 0.8 cm hepatic lesion (segment VI)', 'Mediastinal nodes stable'],
  },
  {
    id: 'r13', patientId: 'p2', name: 'Complete Blood Count', type: 'Blood Test',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-07-20', reportDate: '2026-07-19',
    status: 'processed', fileSizeKb: 190, fileKind: 'pdf',
    aiSummary: 'Grade 1 anemia, otherwise stable counts during concurrent chemoradiation.',
    aiConfidence: 0.91,
    keyFindings: ['Hemoglobin 10.4 g/dL', 'ANC 2,100/µL'],
  },

  // Sunita Verma (p3)
  {
    id: 'r14', patientId: 'p3', name: 'Colonoscopy with Biopsy', type: 'Pathology',
    hospital: 'Sunrise Diagnostics', uploadDate: '2025-10-04', reportDate: '2025-10-02',
    status: 'processed', fileSizeKb: 680, fileKind: 'pdf',
    aiSummary: 'Moderately differentiated adenocarcinoma of the sigmoid colon.',
    aiConfidence: 0.95,
    keyFindings: ['Sigmoid colon mass, moderately differentiated adenocarcinoma'],
  },
  {
    id: 'r15', patientId: 'p3', name: 'Post-operative Histopathology', type: 'Histopathology',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2025-11-12', reportDate: '2025-11-10',
    status: 'processed', fileSizeKb: 910, fileKind: 'pdf',
    aiSummary: 'pT3N0, 0 of 18 lymph nodes involved. Margins clear. Stage IIA confirmed.',
    aiConfidence: 0.96,
    keyFindings: ['pT3N0M0', '0/18 nodes positive', 'Resection margins clear'],
  },
  {
    id: 'r16', patientId: 'p3', name: 'Surveillance CT Abdomen & Pelvis', type: 'CT Scan',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-07-08', reportDate: '2026-07-07',
    status: 'processed', fileSizeKb: 5720, fileKind: 'pdf',
    aiSummary: 'No evidence of local recurrence or distant metastasis. Post-surgical changes unchanged from prior.',
    aiConfidence: 0.93,
    keyFindings: ['No recurrence identified', 'No metastatic disease'],
  },

  // Arjun Mehta (p4)
  {
    id: 'r17', patientId: 'p4', name: 'TRUS-Guided Prostate Biopsy', type: 'Pathology',
    hospital: 'Sunrise Diagnostics', uploadDate: '2026-07-10', reportDate: '2026-07-08',
    status: 'processed', fileSizeKb: 590, fileKind: 'pdf',
    aiSummary: 'Adenocarcinoma of the prostate, Gleason score 6 (3+3), involving 2 of 12 cores.',
    aiConfidence: 0.92,
    keyFindings: ['Gleason 6 (3+3)', '2/12 cores positive', 'PSA 6.1 ng/mL'],
  },
  {
    id: 'r18', patientId: 'p4', name: 'MRI Prostate (mpMRI)', type: 'MRI',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-07-15', reportDate: '2026-07-14',
    status: 'processing', fileSizeKb: 3340, fileKind: 'pdf',
  },

  // Kavita Nair (p5)
  {
    id: 'r19', patientId: 'p5', name: 'Excisional Lymph Node Biopsy — Neck', type: 'Pathology',
    hospital: 'Sunrise Diagnostics', uploadDate: '2026-02-17', reportDate: '2026-02-15',
    status: 'processed', fileSizeKb: 720, fileKind: 'pdf',
    aiSummary: 'Diffuse large B-cell lymphoma, germinal center subtype.',
    aiConfidence: 0.94,
    keyFindings: ['DLBCL, germinal center B-cell subtype', 'CD20 positive'],
  },
  {
    id: 'r20', patientId: 'p5', name: 'PET-CT Whole Body (Staging)', type: 'PET Scan',
    hospital: 'Sunrise Cancer Institute', uploadDate: '2026-02-24', reportDate: '2026-02-22',
    status: 'processed', fileSizeKb: 5980, fileKind: 'pdf',
    aiSummary: 'FDG-avid cervical, mediastinal, and para-aortic lymphadenopathy. Ann Arbor Stage III.',
    aiConfidence: 0.9,
    keyFindings: ['Cervical, mediastinal, para-aortic nodal involvement', 'Ann Arbor Stage III'],
  },
]

export const reportsForPatient = (patientId: string, source: Report[] = reports) =>
  source.filter((r) => r.patientId === patientId)

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export const timelineEvents: TimelineEvent[] = [
  // p1
  { id: 'tl1', patientId: 'p1', date: '2026-03-05', type: 'report', title: 'Core Needle Biopsy performed', description: 'Left breast core needle biopsy performed at Sunrise Diagnostics.', relatedReportId: 'r1', visibility: 'both' },
  { id: 'tl2', patientId: 'p1', date: '2026-03-06', type: 'upload', title: 'Mammography & Ultrasound uploaded', description: 'Bilateral mammography and breast ultrasound results uploaded.', relatedReportId: 'r2', visibility: 'both' },
  { id: 'tl3', patientId: 'p1', date: '2026-03-08', type: 'report', title: 'Breast MRI performed', description: 'Contrast-enhanced MRI confirms 1.8 cm primary lesion with axillary nodal involvement.', relatedReportId: 'r3', visibility: 'both' },
  { id: 'tl4', patientId: 'p1', date: '2026-03-10', type: 'diagnosis', title: 'Diagnosis confirmed', description: 'Invasive ductal carcinoma, Stage IIB, ER+/PR+/HER2-negative confirmed by tumor board review.', visibility: 'both' },
  { id: 'tl5', patientId: 'p1', date: '2026-03-12', type: 'report', title: 'PET-CT staging complete', description: 'No evidence of distant metastasis on whole-body PET-CT.', relatedReportId: 'r4', visibility: 'both' },
  { id: 'tl6', patientId: 'p1', date: '2026-03-19', type: 'report', title: 'Baseline bloodwork recorded', description: 'Baseline complete blood count recorded prior to chemotherapy.', relatedReportId: 'r5', visibility: 'both' },
  { id: 'tl7', patientId: 'p1', date: '2026-03-22', type: 'treatment', title: 'Neoadjuvant chemotherapy initiated', description: 'Cycle 1 of AC-T protocol started.', visibility: 'both' },
  { id: 'tl8', patientId: 'p1', date: '2026-04-15', type: 'note', title: 'Note from Dr. Ananya Rao', description: 'Guidance on managing nausea during chemotherapy cycles.', relatedNoteId: 'n1', visibility: 'patient' },
  { id: 'tl9', patientId: 'p1', date: '2026-05-15', type: 'report', title: 'Cycle 3 bloodwork reviewed', description: 'Mild neutropenia noted; treatment continued as planned.', relatedReportId: 'r6', visibility: 'both' },
  { id: 'tl10', patientId: 'p1', date: '2026-06-10', type: 'report', title: 'Interim response MRI', description: 'Partial response confirmed — primary lesion reduced from 1.8 cm to 0.9 cm.', relatedReportId: 'r7', visibility: 'both' },
  { id: 'tl11', patientId: 'p1', date: '2026-06-12', type: 'task', title: 'Task completed: Upload interim MRI', description: 'Patient uploaded the requested interim response MRI report.', relatedTaskId: 'task2', visibility: 'both' },
  { id: 'tl12', patientId: 'p1', date: '2026-07-28', type: 'upload', title: 'Cycle 5 bloodwork uploaded', description: 'Latest complete blood count uploaded, AI processing in progress.', relatedReportId: 'r8', visibility: 'both' },
  { id: 'tl13', patientId: 'p1', date: '2026-07-30', type: 'task', title: 'New task assigned', description: 'Upload next PET-CT scan once completed.', relatedTaskId: 'task1', visibility: 'patient' },

  // p2
  { id: 'tl14', patientId: 'p2', date: '2026-01-20', type: 'report', title: 'Diagnostic bronchoscopy performed', description: 'Bronchoscopy with biopsy of right upper lobe mass.', relatedReportId: 'r9', visibility: 'both' },
  { id: 'tl15', patientId: 'p2', date: '2026-01-21', type: 'report', title: 'CT Chest reviewed', description: '4.2 cm right upper lobe mass with mediastinal lymphadenopathy identified.', relatedReportId: 'r10', visibility: 'both' },
  { id: 'tl16', patientId: 'p2', date: '2026-01-18', type: 'diagnosis', title: 'Diagnosis confirmed', description: 'Non-small cell lung carcinoma (adenocarcinoma), Stage IIIA.', visibility: 'both' },
  { id: 'tl17', patientId: 'p2', date: '2026-01-25', type: 'report', title: 'PET-CT staging complete', description: 'No distant metastasis identified; nodal involvement confirmed.', relatedReportId: 'r11', visibility: 'both' },
  { id: 'tl18', patientId: 'p2', date: '2026-02-02', type: 'treatment', title: 'Concurrent chemoradiation initiated', description: 'Cisplatin/etoposide chemotherapy with concurrent radiotherapy started.', visibility: 'both' },
  { id: 'tl19', patientId: 'p2', date: '2026-06-02', type: 'report', title: 'Follow-up CT Chest', description: 'Primary mass increased to 4.8 cm; new small hepatic lesion noted, suspicious for early metastasis.', relatedReportId: 'r12', visibility: 'both' },
  { id: 'tl20', patientId: 'p2', date: '2026-06-05', type: 'note', title: 'Private clinical note added', description: 'Oncologist documented plan to reassess systemic therapy given hepatic finding.', relatedNoteId: 'n3', visibility: 'oncologist' },
  { id: 'tl21', patientId: 'p2', date: '2026-07-19', type: 'report', title: 'Bloodwork during chemoradiation', description: 'Grade 1 anemia noted; treatment continuing on schedule.', relatedReportId: 'r13', visibility: 'both' },

  // p3
  { id: 'tl22', patientId: 'p3', date: '2025-10-02', type: 'report', title: 'Colonoscopy with biopsy', description: 'Sigmoid colon adenocarcinoma identified.', relatedReportId: 'r14', visibility: 'both' },
  { id: 'tl23', patientId: 'p3', date: '2025-11-08', type: 'surgery', title: 'Laparoscopic sigmoid colectomy', description: 'Curative-intent resection performed without complications.', visibility: 'both' },
  { id: 'tl24', patientId: 'p3', date: '2025-11-10', type: 'report', title: 'Post-operative histopathology', description: 'pT3N0, margins clear — Stage IIA confirmed.', relatedReportId: 'r15', visibility: 'both' },
  { id: 'tl25', patientId: 'p3', date: '2025-12-01', type: 'treatment', title: 'Adjuvant chemotherapy started', description: 'FOLFOX regimen initiated.', visibility: 'both' },
  { id: 'tl26', patientId: 'p3', date: '2026-04-20', type: 'treatment', title: 'Adjuvant chemotherapy completed', description: 'Full course of FOLFOX completed without major complications.', visibility: 'both' },
  { id: 'tl27', patientId: 'p3', date: '2026-07-07', type: 'report', title: 'Surveillance CT scan', description: 'No evidence of recurrence on routine surveillance imaging.', relatedReportId: 'r16', visibility: 'both' },

  // p4
  { id: 'tl28', patientId: 'p4', date: '2026-07-08', type: 'report', title: 'Prostate biopsy performed', description: 'TRUS-guided biopsy shows Gleason 6 adenocarcinoma in 2 of 12 cores.', relatedReportId: 'r17', visibility: 'both' },
  { id: 'tl29', patientId: 'p4', date: '2026-07-05', type: 'diagnosis', title: 'Diagnosis confirmed', description: 'Prostate adenocarcinoma, Stage I.', visibility: 'both' },
  { id: 'tl30', patientId: 'p4', date: '2026-07-14', type: 'upload', title: 'Prostate MRI uploaded', description: 'Multiparametric MRI uploaded, AI processing in progress.', relatedReportId: 'r18', visibility: 'both' },

  // p5
  { id: 'tl31', patientId: 'p5', date: '2026-02-15', type: 'report', title: 'Excisional lymph node biopsy', description: 'Diffuse large B-cell lymphoma confirmed.', relatedReportId: 'r19', visibility: 'both' },
  { id: 'tl32', patientId: 'p5', date: '2026-02-20', type: 'diagnosis', title: 'Diagnosis confirmed', description: 'Non-Hodgkin lymphoma (DLBCL), Ann Arbor Stage III.', visibility: 'both' },
  { id: 'tl33', patientId: 'p5', date: '2026-02-22', type: 'report', title: 'Staging PET-CT complete', description: 'Cervical, mediastinal, and para-aortic nodal involvement confirmed.', relatedReportId: 'r20', visibility: 'both' },
  { id: 'tl34', patientId: 'p5', date: '2026-03-01', type: 'treatment', title: 'R-CHOP chemotherapy initiated', description: 'Cycle 1 of R-CHOP started.', visibility: 'both' },
]

export const timelineForPatient = (patientId: string, source: TimelineEvent[] = timelineEvents) =>
  source.filter((e) => e.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date))

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const tasks: PatientTask[] = [
  {
    id: 'task1', patientId: 'p1', title: 'Upload next PET-CT scan',
    description: 'Please upload your PET-CT scan once it is completed at the imaging centre.',
    instructions: 'Accepted formats: PDF, JPG, PNG. Include all pages of the radiologist report.',
    assignedDate: '2026-07-30', dueDate: '2026-08-10', priority: 'high', status: 'pending',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: [],
  },
  {
    id: 'task2', patientId: 'p1', title: 'Upload interim response MRI',
    description: 'Upload the breast MRI performed after cycle 4 of chemotherapy.',
    instructions: 'Please scan or photograph all pages clearly.',
    assignedDate: '2026-06-05', dueDate: '2026-06-15', priority: 'high', status: 'completed',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: ['r7'], completedDate: '2026-06-11',
  },
  {
    id: 'task3', patientId: 'p1', title: 'Update current medication list',
    description: 'Confirm any new medications or supplements started since your last visit.',
    instructions: 'List medication name, dose, and frequency.',
    assignedDate: '2026-07-15', dueDate: '2026-08-05', priority: 'medium', status: 'in_progress',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: false, uploadedReportIds: [],
  },
  {
    id: 'task4', patientId: 'p2', title: 'Upload latest bloodwork',
    description: 'Please upload your most recent complete blood count.',
    instructions: 'Upload directly from the lab portal or a clear photo of the printed report.',
    assignedDate: '2026-07-25', dueDate: '2026-08-02', priority: 'high', status: 'pending',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: [],
  },
  {
    id: 'task5', patientId: 'p2', title: 'Upload follow-up CT chest',
    description: 'Upload the CT chest performed after week 2 of chemoradiation.',
    instructions: 'Include the full radiologist report.',
    assignedDate: '2026-05-28', dueDate: '2026-06-05', priority: 'high', status: 'completed',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: ['r12'], completedDate: '2026-06-03',
  },
  {
    id: 'task6', patientId: 'p3', title: 'Upload surveillance CT scan',
    description: 'Upload the 9-month post-surgical surveillance CT scan.',
    instructions: 'Upload the full report including radiologist notes.',
    assignedDate: '2026-06-25', dueDate: '2026-07-10', priority: 'medium', status: 'completed',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: ['r16'], completedDate: '2026-07-08',
  },
  {
    id: 'task7', patientId: 'p4', title: 'Upload prostate MRI results',
    description: 'Upload the multiparametric MRI once available from the imaging centre.',
    instructions: 'Include the PI-RADS score if mentioned in the report.',
    assignedDate: '2026-07-12', dueDate: '2026-07-20', priority: 'high', status: 'completed',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: ['r18'], completedDate: '2026-07-15',
  },
  {
    id: 'task8', patientId: 'p5', title: 'Upload cycle 4 bloodwork',
    description: 'Upload complete blood count prior to your next R-CHOP cycle.',
    instructions: 'Report should be dated within 48 hours of your next infusion.',
    assignedDate: '2026-07-28', dueDate: '2026-08-04', priority: 'medium', status: 'pending',
    assignedBy: 'Dr. Ananya Rao', requiresUpload: true, uploadedReportIds: [],
  },
]

export const tasksForPatient = (patientId: string, source: PatientTask[] = tasks) =>
  source.filter((t) => t.patientId === patientId)

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const notes: Note[] = [
  {
    id: 'n1', patientId: 'p1', type: 'patient', title: 'Managing nausea during chemotherapy',
    message: 'It is normal to feel nauseous for 1-2 days after your infusion. Take the prescribed Ondansetron as directed, eat small frequent meals, and stay hydrated. Contact the clinic if vomiting persists beyond 24 hours.',
    createdBy: 'Dr. Ananya Rao', createdDate: '2026-04-15',
  },
  {
    id: 'n2', patientId: 'p1', type: 'patient', title: 'Great progress on interim scan',
    message: 'Your recent MRI shows the tumor has responded well to treatment — good news heading into the next cycles. Keep following the same medication schedule and let us know about any new symptoms.',
    createdBy: 'Dr. Ananya Rao', createdDate: '2026-06-11',
  },
  {
    id: 'n3', patientId: 'p2', type: 'private', title: 'Reassess systemic therapy',
    message: 'New 0.8 cm hepatic lesion on follow-up CT is concerning for early metastatic spread despite ongoing chemoradiation. Plan to discuss at next tumor board; consider early transition to systemic therapy and repeat imaging in 6 weeks.',
    createdBy: 'Dr. Ananya Rao', createdDate: '2026-06-05',
  },
  {
    id: 'n4', patientId: 'p2', type: 'patient', title: 'Managing radiotherapy side effects',
    message: 'Mild throat irritation and fatigue are expected during radiotherapy. Continue the prescribed throat gel, eat soft foods, and rest as needed. Call the clinic if swallowing becomes very difficult.',
    createdBy: 'Dr. Ananya Rao', createdDate: '2026-05-10',
  },
  {
    id: 'n5', patientId: 'p3', type: 'patient', title: 'Surveillance results are reassuring',
    message: 'Your latest scan shows no signs of recurrence. Continue routine follow-up visits every 3 months as scheduled.',
    createdBy: 'Dr. Ananya Rao', createdDate: '2026-07-08',
  },
  {
    id: 'n6', patientId: 'p1', type: 'private', title: 'Tolerating AC-T well',
    message: 'Patient tolerating cycles with manageable grade 1 nausea and mild fatigue. No dose reductions required so far. Continue monitoring CBC before each cycle.',
    createdBy: 'Dr. Ananya Rao', createdDate: '2026-05-16',
  },
]

export const patientNotesFor = (patientId: string, source: Note[] = notes) =>
  source.filter((n) => n.patientId === patientId && n.type === 'patient')
export const privateNotesFor = (patientId: string, source: Note[] = notes) =>
  source.filter((n) => n.patientId === patientId && n.type === 'private')

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notifications: AppNotification[] = [
  { id: 'notif1', userId: 'p1', category: 'task-assigned', title: 'New task assigned', message: 'Upload next PET-CT scan once completed.', date: '2026-07-30', read: false, link: '/patient/tasks' },
  { id: 'notif2', userId: 'p1', category: 'ai-processed', title: 'Report processing complete', message: 'AI analysis for your interim response MRI is ready.', date: '2026-06-11', read: true, link: '/patient/reports' },
  { id: 'notif3', userId: 'p1', category: 'note-added', title: 'New note from Dr. Ananya Rao', message: 'Great progress on interim scan.', date: '2026-06-11', read: true, link: '/patient/notes' },
  { id: 'notif4', userId: 'p1', category: 'report-uploaded', title: 'Upload successful', message: 'Cycle 5 bloodwork uploaded successfully and is being processed.', date: '2026-07-29', read: false, link: '/patient/reports' },

  { id: 'notif5', userId: 'onc1', category: 'report-uploaded', title: 'Meera Kulkarni uploaded a report', message: 'Complete Blood Count — Cycle 5 uploaded.', date: '2026-07-29', read: false, link: '/oncologist/patients/p1' },
  { id: 'notif6', userId: 'onc1', category: 'task-completed', title: 'Arjun Mehta completed a task', message: 'Prostate MRI results uploaded.', date: '2026-07-15', read: false, link: '/oncologist/patients/p4' },
  { id: 'notif7', userId: 'onc1', category: 'ai-processed', title: 'AI processing complete', message: 'Interim response MRI analysis ready for Meera Kulkarni.', date: '2026-06-11', read: true, link: '/oncologist/patients/p1' },
  { id: 'notif8', userId: 'onc1', category: 'system', title: 'Weekly summary available', message: '5 patients under active management this week.', date: '2026-07-27', read: true },
  { id: 'notif9', userId: 'onc1', category: 'task-completed', title: 'Sunita Verma completed a task', message: 'Surveillance CT scan uploaded.', date: '2026-07-08', read: true, link: '/oncologist/patients/p3' },
]

export const notificationsForUser = (userId: string, source: AppNotification[] = notifications) =>
  source.filter((n) => n.userId === userId).sort((a, b) => b.date.localeCompare(a.date))

// ---------------------------------------------------------------------------
// Digital Twin
// ---------------------------------------------------------------------------

export const digitalTwinSnapshots: DigitalTwinSnapshot[] = [
  // Meera Kulkarni — breast cancer responding to treatment (regression story)
  {
    id: 'dt1', patientId: 'p1', date: '2026-03-10', label: 'Diagnosis',
    overallAssessment: 'Primary lesion in left breast with axillary nodal involvement. No distant spread identified.',
    organStatuses: [
      { organId: 'left-breast', severity: 4, note: '1.8 x 1.5 cm primary lesion', evidence: { reportId: 'r3', reportName: 'Contrast-Enhanced MRI — Breast', reportDate: '2026-03-08', finding: 'Primary lesion 1.8 x 1.5 cm' } },
      { organId: 'lymph-nodes', severity: 2, note: '2 suspicious left axillary nodes', evidence: { reportId: 'r3', reportName: 'Contrast-Enhanced MRI — Breast', reportDate: '2026-03-08', finding: '2 suspicious left axillary nodes' } },
    ],
  },
  {
    id: 'dt2', patientId: 'p1', date: '2026-06-10', label: 'Interim Response',
    overallAssessment: 'Partial response to neoadjuvant chemotherapy. Primary lesion and nodal involvement both reduced.',
    organStatuses: [
      { organId: 'left-breast', severity: 2, note: 'Lesion reduced to 0.9 cm', evidence: { reportId: 'r7', reportName: 'Interim Response MRI — Breast', reportDate: '2026-06-10', finding: 'Primary lesion reduced to 0.9 cm' } },
      { organId: 'lymph-nodes', severity: 0, note: 'Nodes no longer meet size criteria', evidence: { reportId: 'r7', reportName: 'Interim Response MRI — Breast', reportDate: '2026-06-10', finding: 'Axillary nodes regressed' } },
    ],
  },
  {
    id: 'dt3', patientId: 'p1', date: '2026-07-28', label: 'Current',
    overallAssessment: 'Continued clinical improvement on cycle 5 of neoadjuvant chemotherapy. Full restaging imaging pending.',
    organStatuses: [
      { organId: 'left-breast', severity: 1, note: 'Ongoing response, imaging pending confirmation' },
      { organId: 'lymph-nodes', severity: 0, note: 'No involvement noted on last imaging' },
    ],
  },

  // Rajesh Iyer — lung cancer with early progression (progression story)
  {
    id: 'dt4', patientId: 'p2', date: '2026-01-20', label: 'Diagnosis',
    overallAssessment: 'Right upper lobe mass with mediastinal nodal involvement. No distant metastasis on staging PET-CT.',
    organStatuses: [
      { organId: 'right-lung', severity: 3, note: '4.2 cm right upper lobe mass', evidence: { reportId: 'r10', reportName: 'CT Chest with Contrast', reportDate: '2026-01-21', finding: 'Right upper lobe mass 4.2 cm' } },
      { organId: 'lymph-nodes', severity: 2, note: 'Mediastinal lymphadenopathy', evidence: { reportId: 'r11', reportName: 'PET-CT Whole Body', reportDate: '2026-01-25', finding: 'Nodal involvement confirmed' } },
    ],
  },
  {
    id: 'dt5', patientId: 'p2', date: '2026-06-02', label: 'Follow-up',
    overallAssessment: 'Disease progression noted despite concurrent chemoradiation. New hepatic lesion suspicious for early metastasis.',
    organStatuses: [
      { organId: 'right-lung', severity: 4, note: 'Mass increased to 4.8 cm', evidence: { reportId: 'r12', reportName: 'Follow-up CT Chest', reportDate: '2026-06-02', finding: 'Primary mass 4.2 cm → 4.8 cm' } },
      { organId: 'lymph-nodes', severity: 2, note: 'Mediastinal nodes stable' },
      { organId: 'liver', severity: 1, note: 'New 0.8 cm hepatic lesion, segment VI', evidence: { reportId: 'r12', reportName: 'Follow-up CT Chest', reportDate: '2026-06-02', finding: 'New 0.8 cm hepatic lesion (segment VI)' } },
    ],
  },

  // Sunita Verma — post-surgical, no evidence of disease
  {
    id: 'dt6', patientId: 'p3', date: '2026-07-07', label: 'Surveillance',
    overallAssessment: 'No evidence of local recurrence or distant metastasis on routine surveillance imaging.',
    organStatuses: [
      { organId: 'colon', severity: 0, note: 'Post-surgical changes, no recurrence', evidence: { reportId: 'r16', reportName: 'Surveillance CT Abdomen & Pelvis', reportDate: '2026-07-07', finding: 'No recurrence identified' } },
    ],
  },

  // Arjun Mehta — newly diagnosed, localized
  {
    id: 'dt7', patientId: 'p4', date: '2026-07-08', label: 'Diagnosis',
    overallAssessment: 'Localized low-grade prostate adenocarcinoma. Treatment planning in progress.',
    organStatuses: [
      { organId: 'prostate', severity: 1, note: 'Gleason 6, 2/12 cores positive', evidence: { reportId: 'r17', reportName: 'TRUS-Guided Prostate Biopsy', reportDate: '2026-07-08', finding: 'Gleason 6 (3+3), 2/12 cores positive' } },
    ],
  },

  // Kavita Nair — lymphoma, multi-nodal
  {
    id: 'dt8', patientId: 'p5', date: '2026-02-22', label: 'Staging',
    overallAssessment: 'Multi-nodal lymphomatous involvement across cervical, mediastinal, and para-aortic regions. Ann Arbor Stage III.',
    organStatuses: [
      { organId: 'lymph-nodes', severity: 3, note: 'Cervical, mediastinal, para-aortic nodal involvement', evidence: { reportId: 'r20', reportName: 'PET-CT Whole Body (Staging)', reportDate: '2026-02-22', finding: 'Ann Arbor Stage III' } },
    ],
  },
]

export const digitalTwinForPatient = (patientId: string) =>
  digitalTwinSnapshots.filter((s) => s.patientId === patientId).sort((a, b) => a.date.localeCompare(b.date))

// ---------------------------------------------------------------------------
// Patient Intelligence
// ---------------------------------------------------------------------------

export const patientIntelligence: PatientIntelligence[] = [
  {
    patientId: 'p1', generatedDate: '2026-07-29',
    clinicalSummary: 'Meera Kulkarni is a 48-year-old female undergoing neoadjuvant chemotherapy for Stage IIB invasive ductal carcinoma of the left breast (ER+/PR+/HER2-negative). Interim imaging confirms a partial response, with both the primary lesion and axillary nodal involvement showing significant regression. She is currently on cycle 5 of an 8-cycle AC-T protocol.',
    currentDiseaseStatus: 'Partial response to neoadjuvant chemotherapy',
    affectedOrgans: ['Left Breast', 'Left Axillary Lymph Nodes'],
    diseaseSeverity: 'Moderate',
    recentChanges: [
      { label: 'Primary lesion size', type: 'regression', description: 'Reduced from 1.8 cm to 0.9 cm between diagnosis and interim MRI.' },
      { label: 'Axillary nodal involvement', type: 'regression', description: 'Previously suspicious nodes no longer meet size criteria for involvement.' },
      { label: 'Blood counts', type: 'stable', description: 'Mild, self-limited neutropenia during cycle 3; no dose delays required.' },
    ],
    treatmentOverview: {
      current: 'AC-T neoadjuvant chemotherapy protocol, cycle 5 of 8',
      previous: [],
      recentChange: 'No regimen changes; continuing per protocol given favorable interim response.',
    },
    supportingEvidence: [
      { reportId: 'r7', reportName: 'Interim Response MRI — Breast', reportDate: '2026-06-10', finding: 'Primary lesion reduced to 0.9 cm; nodal regression confirmed.' },
      { reportId: 'r6', reportName: 'Complete Blood Count — Cycle 3', reportDate: '2026-05-15', finding: 'Mild neutropenia, ANC 1,450/µL.' },
    ],
    confidence: 0.91,
  },
  {
    patientId: 'p2', generatedDate: '2026-07-20',
    clinicalSummary: 'Rajesh Iyer is a 60-year-old male with Stage IIIA non-small cell lung carcinoma of the right upper lobe, currently receiving concurrent chemoradiation. Follow-up imaging shows an increase in primary tumor size and a new small hepatic lesion suspicious for early metastatic spread, indicating disease progression despite ongoing treatment.',
    currentDiseaseStatus: 'Disease progression on concurrent chemoradiation',
    affectedOrgans: ['Right Lung (Upper Lobe)', 'Mediastinal Lymph Nodes', 'Liver (new finding)'],
    diseaseSeverity: 'Severe',
    recentChanges: [
      { label: 'Primary lung mass', type: 'progression', description: 'Increased in size from 4.2 cm to 4.8 cm over 4 months.' },
      { label: 'Hepatic involvement', type: 'progression', description: 'New 0.8 cm lesion in liver segment VI, suspicious for early metastasis.' },
      { label: 'Mediastinal nodes', type: 'stable', description: 'No significant change in nodal size since staging.' },
    ],
    treatmentOverview: {
      current: 'Concurrent chemoradiation (cisplatin + etoposide), week 4 of 6',
      previous: [],
      recentChange: 'Systemic therapy reassessment planned given new hepatic finding; to be discussed at tumor board.',
    },
    supportingEvidence: [
      { reportId: 'r12', reportName: 'Follow-up CT Chest', reportDate: '2026-06-02', finding: 'Primary mass increased to 4.8 cm; new 0.8 cm hepatic lesion.' },
    ],
    confidence: 0.85,
  },
  {
    patientId: 'p3', generatedDate: '2026-07-08',
    clinicalSummary: 'Sunita Verma is a 56-year-old female, post-curative resection for Stage IIA sigmoid colon adenocarcinoma, having completed adjuvant FOLFOX chemotherapy. Most recent surveillance CT shows no evidence of local recurrence or distant metastasis.',
    currentDiseaseStatus: 'No evidence of disease',
    affectedOrgans: [],
    diseaseSeverity: 'Mild',
    recentChanges: [
      { label: 'Surveillance imaging', type: 'stable', description: 'No recurrence identified on latest CT abdomen and pelvis.' },
    ],
    treatmentOverview: {
      current: 'Routine surveillance, no active treatment',
      previous: ['Laparoscopic sigmoid colectomy', 'Adjuvant FOLFOX chemotherapy'],
      recentChange: 'Transitioned to surveillance-only follow-up after completing adjuvant therapy.',
    },
    supportingEvidence: [
      { reportId: 'r16', reportName: 'Surveillance CT Abdomen & Pelvis', reportDate: '2026-07-07', finding: 'No evidence of recurrence or metastasis.' },
    ],
    confidence: 0.93,
  },
]

export const intelligenceForPatient = (patientId: string) => patientIntelligence.find((p) => p.patientId === patientId)
