export type RoadClassification = '第1種第1級' | '第3種第2級' | '第3種第3級' | '第4種第1級';

export interface IPPoint {
  id: string;
  name: string;
  x: number; // Local coordinates in meters
  y: number;
  elevation: number;
  R: number; // Curve Radius in meters
  A1: number; // Clothoid Parameter Entrance
  A2: number; // Clothoid Parameter Exit
  kp: number; // Kilopost / Station (m)
}

export interface AlignmentSegment {
  id: string;
  type: 'straight' | 'clothoid_in' | 'curve' | 'clothoid_out';
  startKp: number;
  endKp: number;
  length: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  radius: number;
  clothoidA?: number;
}

export interface VerticalIP {
  id: string;
  kp: number;
  elevation: number;
  vclRadius: number; // Vertical Curve Radius (m)
  gradientIn: number; // %
  gradientOut: number; // %
}

export interface CrossSectionPoint {
  kp: number;
  groundElevation: number;
  designElevation: number;
  cutArea: number; // m²
  fillArea: number; // m²
  leftSlope: string; // "1:1.5"
  rightSlope: string; // "1:1.5"
  roadWidth: number; // m
}

export interface EarthworkSummary {
  totalCutVolume: number; // m³
  totalFillVolume: number; // m³
  balanceRatio: number; // Cut / Fill
  netVolume: number; // Cut - Fill
}

export interface PlateauBuilding {
  id: string;
  name: string;
  usage: string;
  height: number;
  floors: number;
  x: number;
  y: number;
  width: number;
  length: number;
  severity: 'minor' | 'major' | 'critical';
  clashDetected?: boolean;
  clashDistance?: number;
  lat?: number;
  lon?: number;
  gmlId?: string;
  cityCode?: string;
  address?: string;
}

export interface PlateauFeature {
  id: string;
  name: string;
  category: 'bldg' | 'tran' | 'wtr' | 'rwy';
  categoryLabel: string; // "建物 (bldg)", "道路 (tran)", "水路 (wtr)", "鉄道 (rwy)"
  lod: 'LOD1' | 'LOD2' | 'LOD3';
  x: number;
  y: number;
  z?: number; // Elevation or Depth (m)
  width: number;
  length: number;
  height: number;
  shapePoints?: Array<{ x: number; y: number; z?: number }>;
  color?: string;
  severity?: 'minor' | 'major' | 'critical';
  clashDetected?: boolean;
  details?: string;
  lat?: number;
  lon?: number;
  gmlId?: string;
  cityCode?: string;
  address?: string;
}

export interface ClashItem {
  id: string;
  kp: number;
  objectName: string;
  clashType: 'building' | 'railway' | 'existing_road' | 'dem_mesh';
  severity: 'minor' | 'major' | 'critical';
  location: { x: number; y: number; z: number };
  description: string;
}

export interface AgentProposal {
  id: string;
  agentId: string;
  agentName: string;
  priority: number; // 1 (highest) to 5
  title: string;
  description: string;
  suggestedAction: string;
  dashedAnnotation?: {
    type: 'circle' | 'line' | 'box' | 'arrow';
    coordinates: Array<{ x: number; y: number; z?: number }>;
    color: string;
    label: string;
  };
  confidence: number;
  status: 'pending' | 'accepted' | 'dismissed';
}

export interface CivilSkill {
  id: string;
  command: string;
  name: string;
  category: '線形' | '縦断' | '土工' | '法令RAG' | 'PLATEAU' | '構造物' | '3Dメッシュ' | 'GIS';
  description: string;
  shortcut?: string;
  parameters?: Record<string, any>;
}

export interface TestInvariantResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  currentValue: string | number;
  thresholdValue: string | number;
  statusMessage: string;
  level: 'error' | 'warning' | 'info';
  associatedAgent: string;
}

export type AgentStatusType = 'idle' | 'analyzing' | 'proposing' | 'resolving' | 'verifying' | 'active';

export interface AgentInfo {
  id: string;
  number: number;
  name: string;
  role: string;
  status: AgentStatusType;
  autoRun: boolean;
  lastRunTime: string;
  activityCount: number;
  latestThought: string;
  confidence: number;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'info' | 'proposal' | 'conflict' | 'fix' | 'rag';
  message: string;
}

export interface AlignmentProject {
  id: string;
  name: string;
  roadClassification: RoadClassification;
  designSpeedKmh: number;
  ipPoints: IPPoint[];
  verticalIPs: VerticalIP[];
  crossSections: CrossSectionPoint[];
  plateauBuildings: PlateauBuilding[];
  plateauFeatures?: PlateauFeature[];
  selectedKp: number;
  vramBudgetMB: number;
  currentKernel: 'precision_occt' | 'intuitive_halfedge';
}
