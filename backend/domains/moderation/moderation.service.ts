import crypto from 'node:crypto';

export type ReportInput = {
  reporterId: string;
  targetType: 'user' | 'trip';
  targetId: string;
  reason?: string | null;
};

export type ReportRecord = {
  id: string;
  reporterId: string;
  targetType: 'user' | 'trip';
  targetId: string;
  reason: string | null;
  createdAt: number; // epoch ms
};

export class ModerationService {
  private readonly blocks = new Set<string>(); // key: blockerId:blockedId
  private readonly mutes = new Set<string>(); // key: muterId:mutedId
  private readonly reports: ReportRecord[] = [];

  private key(a: string, b: string): string {
    return `${a}:${b}`;
  }

  private ensureUserPair(a: string, b: string, labelA = 'userIdA', labelB = 'userIdB') {
    if (!a || !b) throw new Error(`${labelA} and ${labelB} are required`);
    if (a === b) throw new Error('Cannot target self');
  }

  block(blockerId: string, blockedId: string): void {
    this.ensureUserPair(blockerId, blockedId, 'blockerId', 'blockedId');
    this.blocks.add(this.key(blockerId, blockedId));
  }

  unblock(blockerId: string, blockedId: string): void {
    this.ensureUserPair(blockerId, blockedId, 'blockerId', 'blockedId');
    this.blocks.delete(this.key(blockerId, blockedId));
  }

  isBlocked(a: string, b: string): boolean {
    if (!a || !b) return false;
    return this.blocks.has(this.key(a, b));
  }

  listBlockedIdsFor(userId: string): string[] {
    if (!userId) throw new Error('userId is required');
    const prefix = `${userId}:`;
    const out: string[] = [];
    for (const k of this.blocks) {
      if (k.startsWith(prefix)) out.push(k.substring(prefix.length));
    }
    return out;
  }

  listBlockedByIds(userId: string): string[] {
    if (!userId) throw new Error('userId is required');
    const suffix = `:${userId}`;
    const out: string[] = [];
    for (const k of this.blocks) {
      if (k.endsWith(suffix)) out.push(k.substring(0, k.length - suffix.length));
    }
    return out;
  }

  mute(muterId: string, mutedId: string): void {
    this.ensureUserPair(muterId, mutedId, 'muterId', 'mutedId');
    this.mutes.add(this.key(muterId, mutedId));
  }

  unmute(muterId: string, mutedId: string): void {
    this.ensureUserPair(muterId, mutedId, 'muterId', 'mutedId');
    this.mutes.delete(this.key(muterId, mutedId));
  }

  isMuted(a: string, b: string): boolean {
    if (!a || !b) return false;
    return this.mutes.has(this.key(a, b));
  }

  createReport(input: ReportInput): ReportRecord {
    if (!input || typeof input !== 'object') throw new Error('Invalid payload');
    const { reporterId, targetType, targetId } = input;
    if (!reporterId) throw new Error('reporterId is required');
    if (targetType !== 'user' && targetType !== 'trip') throw new Error('targetType must be user|trip');
    if (!targetId) throw new Error('targetId is required');
    const rec: ReportRecord = {
      id: crypto.randomUUID(),
      reporterId,
      targetType,
      targetId,
      reason: input.reason ?? null,
      createdAt: Date.now(),
    };
    this.reports.push(rec);
    return { ...rec };
  }

  listReportsByReporter(reporterId: string): ReportRecord[] {
    if (!reporterId) throw new Error('reporterId is required');
    return this.reports.filter((r) => r.reporterId === reporterId).map((r) => ({ ...r }));
  }
}

// Minimal placeholder module for consistency with task structure
export class ModerationModule {}

