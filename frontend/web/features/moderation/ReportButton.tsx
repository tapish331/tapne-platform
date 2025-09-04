// Moderation UI: Report button model and helpers (T23)
// Keep implementation framework-agnostic for simple unit tests.

export type ReportEntityType = 'user' | 'trip';

export type ReportRecord = {
  id: string;
  reporterId: string;
  entity: ReportEntityType;
  targetId: string;
  reason: string;
  createdAt: number;
};

const reports: ReportRecord[] = [];

function makeId() {
  const n = (makeId as any)._n || 1;
  (makeId as any)._n = n + 1;
  return `r_${n}`;
}

function now(): number {
  const n = (now as any)._t || Date.now();
  const next = n + 1;
  (now as any)._t = next;
  return next;
}

export function reportEntity(
  reporterId: string,
  entity: ReportEntityType,
  targetId: string,
  reason: string
) {
  const rid = String(reporterId || '').trim();
  const tid = String(targetId || '').trim();
  const why = String(reason || '').trim();
  if (!rid || !tid || !why) return { ok: false as const, error: 'bad input' };
  const rec: ReportRecord = {
    id: makeId(),
    reporterId: rid,
    entity,
    targetId: tid,
    reason: why,
    createdAt: now(),
  };
  reports.push(rec);
  return { ok: true as const, report: rec };
}

export function listReports() {
  return reports.slice();
}

export type ReportButtonModel = {
  kind: 'button';
  label: 'Report';
  confirm: (reason: string) => { ok: boolean; reason?: string };
};

export function makeReportButton(): ReportButtonModel {
  return {
    kind: 'button',
    label: 'Report',
    confirm(reason: string) {
      const why = String(reason || '').trim();
      if (!why) return { ok: false };
      return { ok: true, reason: why };
    },
  };
}

