// ── Auth ──

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ── Organizations ──

export interface Organization {
  id: string;
  name: string;
  rootDomain: string;
  createdAt: string;
}

// ── Scans ──

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED';

export interface Scan {
  id: string;
  organizationId: string;
  status: ScanStatus;
  fortressScore: number | null;
  tlsScore: number | null;
  headersScore: number | null;
  networkScore: number | null;
  emailScore: number | null;
  startedAt: string;
  completedAt: string | null;
}

export type ScanCategory = 'TLS' | 'HEADERS' | 'NETWORK' | 'EMAIL';

// Signals are category-specific objects from the backend scanners
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SignalData = Record<string, boolean | number | number[] | string | any>;

export interface ScanResult {
  id: string;
  assetId: string;
  assetValue: string;
  category: ScanCategory;
  riskScore: number;
  signals: SignalData;
  scannedAt: string;
}

// ── Intelligence ──

export interface TakeoverResult {
  hostname: string;
  vulnerable: boolean;
  cname: string | null;
  service: string | null;
}

export interface CloudBucketResult {
  url: string;
  provider: string;
  exposed: boolean;
  listable: boolean;
}

export interface ThreatIntelResult {
  hostname: string;
  ip: string | null;
  inDnsBlocklist: boolean;
  blocklists: string[];
  reverseRecordMismatch: boolean;
}

export interface KEVFinding {
  cveId: string;
  vendor: string;
  product: string;
  description: string;
  dateAdded: string;
  dueDate: string;
  ransomwareUse: boolean;
}

export interface VulnIntelResult {
  totalKEVMatches: number;
  kevFindings: KEVFinding[];
  servicesChecked: string[];
}

export interface ASNInfo {
  ip: string;
  asn: string;
  org: string;
  isp: string;
  country: string;
}

export interface IntelligenceSignals {
  subdomainTakeover: TakeoverResult[];
  cloudExposure: CloudBucketResult[];
  threatIntel: ThreatIntelResult[];
  vulnIntel: VulnIntelResult;
  asnInfo: Record<string, ASNInfo>;
}

export interface BusinessImpact {
  finding: string;
  impact: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
}

// ── Score ──

export interface IntelSummary {
  takeoverRisks: number;
  exposedBuckets: number;
  blocklistedIPs: number;
  kevMatches: number;
  criticalImpacts: number;
  highImpacts: number;
}

export interface OrgScore {
  organizationId: string;
  fortressScore: number | null;
  breakdown: {
    tls:     { score: number | null; weight: number };
    headers: { score: number | null; weight: number };
    network: { score: number | null; weight: number };
    email:   { score: number | null; weight: number };
  };
  riskVelocity: number | null;
  intelSummary?: IntelSummary;
  scanId: string;
  scannedAt: string | null;
}

export interface ScoreHistoryEntry {
  scanId: string;
  fortressScore: number | null;
  tlsScore: number | null;
  headersScore: number | null;
  networkScore: number | null;
  emailScore: number | null;
  riskVelocity: number | null;
  scannedAt: string;
}

// ── Executive Summary ──

export interface ExecutiveSummary {
  company: string;
  domain: string;
  fortressScore: number;
  posture: string;
  keyIssues: string[];
  recommendedFixes: string[];
}

export interface ScanResultsResponse {
  scanId: string;
  status: ScanStatus;
  fortressScore: number | null;
  executiveSummary?: ExecutiveSummary;
  intelligenceData?: IntelligenceSignals;
  businessImpactData?: BusinessImpact[];
  results: ScanResult[];
}

// ── Assets ──

export type AssetType = 'DOMAIN' | 'SUBDOMAIN' | 'IP';

export interface Asset {
  id: string;
  type: AssetType;
  value: string;
  discoveredAt: string;
}

// ── Domain validation ──

const DOMAIN_RE = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export function validateDomain(input: string): string | null {
  const cleaned = input.trim().toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:.*$/, '');

  if (!cleaned) return 'Domain is required';
  if (!DOMAIN_RE.test(cleaned)) return 'Enter a valid domain (e.g. github.com)';
  return null;
}

export function cleanDomain(input: string): string {
  return input.trim().toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:.*$/, '');
}

// ── Score utilities ──

export function getScoreColor(score: number): string {
  if (score <= 20) return '#22c55e';
  if (score <= 40) return '#14b8a6';
  if (score <= 60) return '#eab308';
  if (score <= 80) return '#f97316';
  return '#ef4444';
}

export function getScoreLabel(score: number): string {
  if (score <= 20) return 'Excellent';
  if (score <= 40) return 'Good';
  if (score <= 60) return 'Moderate';
  if (score <= 80) return 'High Risk';
  return 'Critical';
}
