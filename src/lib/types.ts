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
  status: ScanStatus;
  fortressScore: number | null;
  tlsScore: number | null;
  headerScore: number | null;
  networkScore: number | null;
  emailScore: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface ScanSignal {
  check: string;
  riskValue: number;
  passed: boolean;
}

export interface ScanResult {
  id: string;
  category: 'TLS' | 'HEADERS' | 'NETWORK' | 'EMAIL';
  riskScore: number;
  asset: {
    hostname: string;
    type: string;
  };
  signals: ScanSignal[];
}

// ── Score ──

export interface OrgScore {
  fortressScore: number;
  label: string;
  tlsScore: number;
  headerScore: number;
  networkScore: number;
  emailScore: number;
  correlationBonus: number;
  lastScannedAt: string | null;
}

export interface ScoreHistoryEntry {
  scanId: string;
  fortressScore: number;
  scannedAt: string;
}

// ── Assets ──

export type AssetType = 'SUBDOMAIN' | 'IP' | 'ROOT_DOMAIN';

export interface Asset {
  id: string;
  hostname?: string;
  ipAddress?: string;
  type: AssetType;
  discoveredAt: string;
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
