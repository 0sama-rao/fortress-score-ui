import api from './api';
import type {
  AuthResponse,
  Organization,
  Scan,
  ScanResultsResponse,
  OrgScore,
  ScoreHistoryEntry,
  Asset,
} from './types';

// ── Auth ──

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', { name, email, password });
  return data;
}

// ── Organizations ──

export async function getOrganizations(): Promise<Organization[]> {
  const { data } = await api.get<{ organizations: Organization[] }>('/api/organizations');
  return data.organizations;
}

export async function createOrganization(name: string, rootDomain: string): Promise<Organization> {
  const { data } = await api.post<{ organization: Organization }>('/api/organizations', { name, rootDomain });
  return data.organization;
}

export async function deleteOrganization(id: string): Promise<void> {
  await api.delete(`/api/organizations/${id}`);
}

// ── Scans ──

export async function triggerScan(organizationId: string): Promise<Scan> {
  const { data } = await api.post<Scan>('/api/scans', { organizationId });
  return data;
}

export async function getScan(scanId: string): Promise<Scan> {
  const { data } = await api.get<Scan>(`/api/scans/${scanId}`);
  return data;
}

export async function getScanResults(scanId: string): Promise<ScanResultsResponse> {
  const { data } = await api.get<ScanResultsResponse>(`/api/scans/${scanId}/results`);
  return data;
}

export async function getOrgScans(orgId: string): Promise<Scan[]> {
  const { data } = await api.get<{ scans: Scan[] }>(`/api/organizations/${orgId}/scans`);
  return data.scans;
}

// ── Score ──

export async function getOrgScore(orgId: string): Promise<OrgScore> {
  const { data } = await api.get<OrgScore>(`/api/organizations/${orgId}/score`);
  return data;
}

export async function getScoreHistory(orgId: string): Promise<ScoreHistoryEntry[]> {
  const { data } = await api.get<{ history: ScoreHistoryEntry[] }>(
    `/api/organizations/${orgId}/score/history`
  );
  return data.history;
}

// ── Assets ──

export async function getOrgAssets(orgId: string): Promise<Asset[]> {
  const { data } = await api.get<{ assets: Asset[] }>(`/api/organizations/${orgId}/assets`);
  return data.assets;
}
