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

// ── Score ──

export interface OrgScore {
  organizationId: string;
  fortressScore: number;
  breakdown: {
    tls:     { score: number; weight: number };
    headers: { score: number; weight: number };
    network: { score: number; weight: number };
    email:   { score: number; weight: number };
  };
  correlationBonus: number;
  scanId: string;
  scannedAt: string;
}

export interface ScoreHistoryEntry {
  scanId: string;
  fortressScore: number;
  scannedAt: string;
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
