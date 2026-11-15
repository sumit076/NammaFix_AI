export const CATEGORIES = ['Pothole', 'Garbage', 'Streetlight', 'Waterlogging'] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ['Reported', 'Assigned', 'In Progress', 'Resolved'] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITY_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export const DEPARTMENTS = [
  'Road Maintenance Department',
  'Solid Waste Management',
  'Street Lighting (BESCOM)',
  'Storm Water Drain Department',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

/** Every agent returns this envelope: structured output + a short explanation. */
export interface AgentResult<T> {
  agent: string;
  stage: number;
  /** All agents in this prototype are rule-based simulations – never a live model. */
  mode: 'simulated-rule-based';
  output: T;
  explanation: string;
}

export interface ImageMeta {
  name: string;
  type: string;
  sizeKB: number;
  width: number;
  height: number;
}

export interface ClassificationOutput {
  category: Category | null;
  citizenCategory: Category | '';
  confidence: number; // 0-100 heuristic match score, NOT a model probability
  matchedKeywords: string[];
  imageSignal: string;
  agreesWithCitizen: boolean;
  needsReview: boolean;
}

export interface DuplicateMatch {
  id: string;
  rootId: string;
  distanceM: number;
  ageDays: number;
  textSimilarity: number; // 0-100
}

export interface DuplicateOutput {
  isDuplicate: boolean;
  radiusM: number;
  windowDays: number;
  matches: DuplicateMatch[];
  mergedRootIds: string[];
  incidentPrimaryId: string | null;
}

export interface SeverityFactor {
  key: 'safety' | 'importance' | 'population' | 'duration';
  label: string;
  weight: number; // 0-1
  value: number; // 0-100
  contribution: number;
  reason: string;
}

export interface SeverityOutput {
  score: number;
  level: PriorityLevel;
  factors: SeverityFactor[];
  reportCount: number;
  ageDays: number;
  riskSignals: string[];
}

export interface RoutingOutput {
  department: Department;
  zone: string;
  office: string;
}

export interface ActionOutput {
  urgency: string;
  slaHours: number;
  headline: string;
  steps: string[];
}

export interface Analysis {
  classification: AgentResult<ClassificationOutput>;
  duplicate: AgentResult<DuplicateOutput>;
  severity: AgentResult<SeverityOutput>;
  routing: AgentResult<RoutingOutput>;
  action: AgentResult<ActionOutput>;
}

export interface HistoryEvent {
  at: string;
  actor: string;
  text: string;
}

export interface StoredImage {
  dataUrl: string;
  meta: ImageMeta;
}

export interface Complaint {
  id: string;
  source: 'demo' | 'citizen';
  reporterName: string;
  category: Category;
  citizenCategory: Category | '';
  description: string;
  locality: string;
  landmarkId: string;
  address: string;
  lat: number;
  lng: number;
  image?: StoredImage;
  reportedAt: string;
  resolvedAt?: string;
  status: Status;
  /** Set on duplicate reports: the id of the primary complaint of the incident. */
  duplicateOf?: string;
  /** Set on a primary complaint: ids of every consolidated duplicate report. */
  duplicateIds: string[];
  analysis: Analysis;
  assignedDepartment?: Department;
  approvedBy?: string;
  approvedAt?: string;
  history: HistoryEvent[];
}

export interface Officer {
  id: string;
  name: string;
  title: string;
  departments: Department[];
}

export interface DraftComplaint {
  reporterName: string;
  citizenCategory: Category | '';
  description: string;
  locality: string;
  landmarkId: string;
  address: string;
  image?: StoredImage;
}
