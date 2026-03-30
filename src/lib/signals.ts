import type { SignalData, ScanCategory } from './types';

export interface Finding {
  key: string;
  label: string;
  passed: boolean;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

// ── TLS signal labels ──

const TLS_LABELS: Record<string, { label: string; severity: Finding['severity'] }> = {
  noCertificate:      { label: 'No TLS certificate',                severity: 'critical' },
  certificateExpired: { label: 'Certificate expired',               severity: 'critical' },
  selfSigned:         { label: 'Self-signed certificate',           severity: 'high'     },
  weakProtocol:       { label: 'TLS 1.0/1.1 enabled',              severity: 'high'     },
  weakCipher:         { label: 'Weak cipher suites (RC4/DES/3DES)', severity: 'high'     },
  hostnameMismatch:   { label: 'Certificate hostname mismatch',     severity: 'high'     },
  noHttpsRedirect:    { label: 'No HTTP→HTTPS redirect',            severity: 'high'     },
  untrustedCA:        { label: 'Untrusted certificate authority',   severity: 'high'     },
  weakSignature:      { label: 'Weak signature (MD2/MD5/SHA1)',     severity: 'high'     },
  longValidity:       { label: 'Certificate validity >398 days',    severity: 'low'      },
  wildcardCert:       { label: 'Wildcard certificate in use',       severity: 'low'      },
};

// ── Headers signal labels ──

const HEADERS_LABELS: Record<string, { label: string; severity: Finding['severity'] }> = {
  missingHsts:                { label: 'Missing Strict-Transport-Security',  severity: 'high'   },
  missingCsp:                 { label: 'Missing Content-Security-Policy',    severity: 'high'   },
  missingXFrameOptions:       { label: 'Missing X-Frame-Options',           severity: 'medium' },
  missingXContentTypeOptions: { label: 'Missing X-Content-Type-Options',    severity: 'medium' },
  missingXXssProtection:      { label: 'Missing X-XSS-Protection',         severity: 'medium' },
  weakHstsMaxAge:             { label: 'HSTS max-age below 6 months',      severity: 'medium' },
  weakCspPolicy:              { label: 'Weak CSP (unsafe-inline/eval)',     severity: 'medium' },
  serverHeaderLeaksVersion:   { label: 'Server header leaks version info',  severity: 'low'    },
};

// ── Network signal labels ──

const NETWORK_LABELS: Record<string, { label: string; severity: Finding['severity'] }> = {
  rdpExposed:     { label: 'RDP (3389) exposed to internet', severity: 'critical' },
  telnetOpen:     { label: 'Telnet (23) open',               severity: 'critical' },
  dbPortsExposed: { label: 'Database ports exposed',         severity: 'critical' },
  smbExposed:     { label: 'SMB (445) exposed',              severity: 'critical' },
  ftpOpen:          { label: 'FTP (21) open',                    severity: 'high'     },
  sshExposed:       { label: 'SSH (22) exposed',                 severity: 'high'     },
  multipleWebPorts: { label: 'Multiple web ports open (80/443/8080/8443)', severity: 'medium' },
};

// ── Email signal labels ──

const EMAIL_LABELS: Record<string, { label: string; severity: Finding['severity'] }> = {
  spfMissing:         { label: 'No SPF record',                            severity: 'high'    },
  spfPermissive:      { label: 'SPF allows all senders (+all)',            severity: 'critical' },
  dkimMissing:        { label: 'No DKIM record found',                    severity: 'high'     },
  dkimWeakKey:        { label: 'DKIM key size below 2048 bits',           severity: 'medium'   },
  dmarcMissing:       { label: 'No DMARC policy',                         severity: 'high'     },
  dmarcPolicyNone:    { label: 'DMARC policy set to none (not enforced)', severity: 'medium'   },
  dmarcMisconfigured: { label: 'DMARC misconfigured',                     severity: 'medium'   },
};

const LABELS_BY_CATEGORY: Record<ScanCategory, Record<string, { label: string; severity: Finding['severity'] }>> = {
  TLS:     TLS_LABELS,
  HEADERS: HEADERS_LABELS,
  NETWORK: NETWORK_LABELS,
  EMAIL:   EMAIL_LABELS,
};

/**
 * Convert raw signal data from the backend into displayable findings.
 * Boolean signals: true = failed (risk), false = passed.
 * Skips numeric/array fields (openPorts, daysUntilExpiry) — handled separately.
 */
export function parseSignals(category: ScanCategory, signals: SignalData): Finding[] {
  const labelMap = LABELS_BY_CATEGORY[category] ?? {};
  const findings: Finding[] = [];

  for (const [key, value] of Object.entries(signals)) {
    // Skip non-boolean signals (handled as special cases below)
    if (typeof value !== 'boolean') continue;

    const meta = labelMap[key];
    if (meta) {
      findings.push({
        key,
        label: meta.label,
        passed: !value,  // true in signal = risk = NOT passed
        severity: meta.severity,
      });
    }
  }

  // Sort: failed first, then by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
  findings.sort((a, b) => {
    if (a.passed !== b.passed) return a.passed ? 1 : -1;
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return findings;
}

/**
 * Extract special (non-boolean) signal info for display.
 */
export function getSpecialSignals(category: ScanCategory, signals: SignalData): string[] {
  const extras: string[] = [];

  if (category === 'TLS') {
    const days = signals.daysUntilExpiry as number | undefined;
    if (typeof days === 'number' && days > 0 && days <= 30) {
      extras.push(`Certificate expires in ${days} days`);
    }
    const keySize = signals.weakKeySize as string | null | undefined;
    if (keySize && keySize !== 'null') {
      const weak = ['rsa1024', 'dsa2048', 'ecc224'];
      if (weak.includes(keySize)) {
        extras.push(`Weak key: ${keySize.toUpperCase()}`);
      } else {
        extras.push(`Key: ${keySize.toUpperCase()}`);
      }
    }
  }

  if (category === 'NETWORK') {
    const open = signals.openPorts as number[] | undefined;
    if (Array.isArray(open) && open.length > 0) {
      extras.push(`${open.length} port${open.length !== 1 ? 's' : ''} open: ${open.join(', ')}`);
    }
    const critical = signals.criticalPortsOpen as number[] | undefined;
    if (Array.isArray(critical) && critical.length > 0) {
      extras.push(`Critical ports exposed: ${critical.join(', ')}`);
    }
    const factor = signals.exposureFactor as number | undefined;
    if (typeof factor === 'number') {
      extras.push(`Exposure factor: ${(factor * 100).toFixed(0)}%`);
    }
  }

  return extras;
}

/**
 * Severity → color mapping for dark theme.
 */
export function getSeverityColor(severity: Finding['severity']): string {
  switch (severity) {
    case 'critical': return '#ef4444';
    case 'high':     return '#f97316';
    case 'medium':   return '#eab308';
    case 'low':      return '#94a3b8';
    case 'info':     return '#06b6d4';
  }
}

export function getSeverityBg(severity: Finding['severity']): string {
  switch (severity) {
    case 'critical': return 'rgba(239,68,68,0.12)';
    case 'high':     return 'rgba(249,115,22,0.12)';
    case 'medium':   return 'rgba(234,179,8,0.12)';
    case 'low':      return 'rgba(148,163,184,0.08)';
    case 'info':     return 'rgba(6,182,212,0.08)';
  }
}
