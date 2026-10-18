import mongoose, { Schema, Document as MongooseDocument, Model } from 'mongoose'

export interface IDocFile {
  originalName: string
  filename: string
  size: number
  mimeType: string
  url: string
  uploadedAt: Date
  dataUrl?: string
  driveFileId?: string
  driveViewUrl?: string
}

export interface IDocVersion {
  version: string // 'V0' | 'Rev.01' | 'Rev.02' | 'FINAL'
  file: IDocFile
  notes?: string
  uploadedBy: string
  uploadedAt: Date
  isFinal: boolean
  fileType: 'initial' | 'revision' | 'supporting' | 'final' | 'legal_draft' | 'legal_approval' | 'bod_signed'
}

export interface IDocDecision {
  type: 'renew' | 'terminate' | 'amendment'
  justification: string
  considerations: string[]
  decidedAt: Date
  decidedBy?: string
}

export interface IReminderConfig {
  h60: boolean
  h30: boolean
  h15: boolean
  h7: boolean
  h1: boolean
  customNotes?: string
  lastSentMilestone?: string
}

export interface IDocHistory {
  stage: number
  action: string
  actor: string
  notes?: string
  versionTag?: string
  timestamp: Date
}

export interface IDocumentRecord extends MongooseDocument {
  docNumber: string
  name: string
  category: string
  division: string
  priority: 'Normal' | 'Urgent' | 'Critical'
  confidentiality: 'Internal' | 'Confidential' | 'Restricted'
  contractStart?: Date | null
  contractEnd?: Date | null
  noDuration: boolean
  notes?: string
  stage: number // 0: Submitted, 1: Review, 2: Legal Drafting, 3: Legal Approval, 4: BOD Approval / Signed, 5: Archived, 6: Expired / Renewal
  stageStatus: 'waiting' | 'active' | 'completed' | 'revision' | 'rejected'
  statusLabel?: string
  pic: string
  picEmail?: string
  revisionRequested: boolean
  rejected: boolean
  files: IDocFile[]
  initialDocument?: IDocFile | null
  revisionDocuments: IDocVersion[]
  supportingDocuments: IDocFile[]
  finalDocument?: IDocFile | null
  versions: IDocVersion[]
  decision?: IDocDecision | null
  reminders?: IReminderConfig | null
  history: IDocHistory[]
  driveFolderId?: string
  driveFolderUrl?: string
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

const DocFileSchema = new Schema<IDocFile>(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    url: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
    dataUrl: { type: String, default: '' },
    driveFileId: { type: String, default: '' },
    driveViewUrl: { type: String, default: '' },
  },
  { _id: false }
)

const DocVersionSchema = new Schema<IDocVersion>(
  {
    version: { type: String, required: true },
    file: { type: DocFileSchema, required: true },
    notes: { type: String, default: '' },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    isFinal: { type: Boolean, default: false },
    fileType: {
      type: String,
      enum: ['initial', 'revision', 'supporting', 'final', 'legal_draft', 'legal_approval', 'bod_signed'],
      default: 'initial',
    },
  },
  { _id: false }
)

const DocDecisionSchema = new Schema<IDocDecision>(
  {
    type: { type: String, enum: ['renew', 'terminate', 'amendment'], required: true },
    justification: { type: String, required: true },
    considerations: [{ type: String }],
    decidedAt: { type: Date, default: Date.now },
    decidedBy: { type: String },
  },
  { _id: false }
)

const ReminderConfigSchema = new Schema<IReminderConfig>(
  {
    h60: { type: Boolean, default: true },
    h30: { type: Boolean, default: true },
    h15: { type: Boolean, default: true },
    h7: { type: Boolean, default: true },
    h1: { type: Boolean, default: true },
    customNotes: { type: String, default: '' },
    lastSentMilestone: { type: String, default: '' },
  },
  { _id: false }
)

const DocHistorySchema = new Schema<IDocHistory>(
  {
    stage: { type: Number, required: true },
    action: { type: String, required: true },
    actor: { type: String, required: true },
    notes: { type: String, default: '' },
    versionTag: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
)

const DocumentSchema = new Schema<IDocumentRecord>(
  {
    docNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    division: { type: String, default: 'Direktorat Umum' },
    priority: { type: String, enum: ['Normal', 'Urgent', 'Critical'], default: 'Normal' },
    confidentiality: {
      type: String,
      enum: ['Internal', 'Confidential', 'Restricted'],
      default: 'Internal',
    },
    contractStart: { type: Date, default: null },
    contractEnd: { type: Date, default: null },
    noDuration: { type: Boolean, default: false },
    notes: { type: String, default: '' },
    stage: { type: Number, default: 0, min: 0, max: 6 },
    stageStatus: {
      type: String,
      enum: ['waiting', 'active', 'completed', 'revision', 'rejected'],
      default: 'active',
    },
    statusLabel: { type: String, default: 'Pengajuan Baru' },
    pic: { type: String, default: 'Luky P.' },
    picEmail: { type: String, default: '' },
    revisionRequested: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    files: [DocFileSchema],
    initialDocument: { type: DocFileSchema, default: null },
    revisionDocuments: [DocVersionSchema],
    supportingDocuments: [DocFileSchema],
    finalDocument: { type: DocFileSchema, default: null },
    versions: [DocVersionSchema],
    decision: { type: DocDecisionSchema, default: null },
    reminders: {
      type: ReminderConfigSchema,
      default: () => ({ h60: true, h30: true, h15: true, h7: true, h1: true }),
    },
    history: [DocHistorySchema],
    driveFolderId: { type: String, default: '' },
    driveFolderUrl: { type: String, default: '' },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true }
)

export const DocumentModel: Model<IDocumentRecord> =
  mongoose.models.DocumentRecord ||
  mongoose.model<IDocumentRecord>('DocumentRecord', DocumentSchema)
