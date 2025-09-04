import crypto from 'node:crypto';
import { uniqueSlug, basicSlugify } from '../../src/utils/slug';

export type TripInput = {
  ownerId: string;
  title: string;
  isPrivate?: boolean;
};

export type TripUpdate = {
  id: string;
  title?: string;
  isPrivate?: boolean;
};

export type TripRecord = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  isPrivate: boolean;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

export type TripListParams = {
  page?: number; // 1-based
  pageSize?: number; // default 10
  sort?: 'createdAt' | 'title';
  order?: 'asc' | 'desc';
  ownerId?: string; // filter by owner
  includePrivateForOwnerId?: string; // include private trips owned by this user
  // T13 Moderation: exclude trips where the owner is blocked with respect to this user
  excludeBlockedForUserId?: string;
};

export type TripListResult = {
  items: TripRecord[];
  total: number;
  page: number;
  pageSize: number;
};

// Minimal contract to avoid hard dependency on ModerationService
export interface BlockProvider {
  isBlocked(a: string, b: string): boolean;
}

export class TripService {
  private byId = new Map<string, TripRecord>();
  private bySlug = new Map<string, TripRecord>();
  private blockProvider?: BlockProvider;
  private lastTs = 0;

  constructor(blockProvider?: BlockProvider) {
    this.blockProvider = blockProvider;
  }

  // Allow late wiring
  setBlockProvider(provider?: BlockProvider) {
    this.blockProvider = provider;
  }

  create(input: TripInput): TripRecord {
    if (!input || typeof input !== 'object') throw new Error('Invalid payload');
    const { ownerId, title } = input;
    if (!ownerId || typeof ownerId !== 'string') throw new Error('ownerId is required');
    if (!title || typeof title !== 'string' || title.trim().length < 3) throw new Error('title is required');

    const slug = uniqueSlug(title, (s) => this.bySlug.has(s));
    let now = Date.now();
    if (now <= this.lastTs) now = this.lastTs + 1;
    this.lastTs = now;
    const rec: TripRecord = {
      id: crypto.randomUUID(),
      ownerId,
      title,
      slug,
      isPrivate: Boolean(input.isPrivate),
      createdAt: now,
      updatedAt: now,
    };
    this.byId.set(rec.id, rec);
    this.bySlug.set(rec.slug, rec);
    return { ...rec };
  }

  update(input: TripUpdate): TripRecord {
    if (!input || typeof input !== 'object') throw new Error('Invalid payload');
    const rec = this.byId.get(input.id);
    if (!rec) throw new Error('Trip not found');

    if (typeof input.title === 'string' && input.title.trim().length >= 3 && input.title !== rec.title) {
      // re-slug on title change
      const oldSlug = rec.slug;
      const oldBase = basicSlugify(rec.title);
      const newSlug = uniqueSlug(input.title, (s) => this.bySlug.has(s) && this.bySlug.get(s)?.id !== rec.id);
      // swap slug indices for the updated record
      this.bySlug.delete(oldSlug);
      rec.title = input.title;
      rec.slug = newSlug;
      this.bySlug.set(rec.slug, rec);
      // if the old base was freed, rebalance that group so the lowest-suffix occupant takes the base
      this.rebalanceSlugGroup(oldBase);
    }

    if (typeof input.isPrivate === 'boolean') {
      rec.isPrivate = input.isPrivate;
    }
    rec.updatedAt = Date.now();
    return { ...rec };
  }

  getBySlug(slug: string): TripRecord | undefined {
    const r = this.bySlug.get(slug);
    return r ? { ...r } : undefined;
  }

  getById(id: string): TripRecord | undefined {
    const r = this.byId.get(id);
    return r ? { ...r } : undefined;
  }

  list(params: TripListParams = {}): TripListResult {
    const page = Math.max(1, Math.floor(params.page || 1));
    const pageSize = Math.max(1, Math.min(50, Math.floor(params.pageSize || 10)));
    const sort = params.sort || 'createdAt';
    const order = params.order || 'desc';

    let items = Array.from(this.byId.values());

    if (params.ownerId) {
      items = items.filter((t) => t.ownerId === params.ownerId);
    }

    // Privacy: by default exclude private; include if owner matches the special param
    items = items.filter((t) => {
      if (!t.isPrivate) return true;
      if (params.includePrivateForOwnerId && t.ownerId === params.includePrivateForOwnerId) return true;
      return false;
    });

    // Moderation (T13): exclude trips where the owner is blocked relative to the viewer
    if (params.excludeBlockedForUserId && this.blockProvider) {
      const viewer = params.excludeBlockedForUserId;
      items = items.filter(
        (t) => !this.blockProvider!.isBlocked(viewer, t.ownerId) && !this.blockProvider!.isBlocked(t.ownerId, viewer)
      );
    }

    items.sort((a, b) => {
      let cmp = 0;
      if (sort === 'createdAt') cmp = a.createdAt - b.createdAt;
      else if (sort === 'title') cmp = a.title.localeCompare(b.title);
      return order === 'asc' ? cmp : -cmp;
    });

    const total = items.length;
    const start = (page - 1) * pageSize;
    const pageItems = items.slice(start, start + pageSize).map((i) => ({ ...i }));
    return { items: pageItems, total, page, pageSize };
  }

  private rebalanceSlugGroup(base: string) {
    const members: { suffix: number; rec: TripRecord }[] = [];
    // Collect all members that match base or base-N (N>=2)
    for (const [slug, rec] of this.bySlug.entries()) {
      if (slug === base) {
        members.push({ suffix: 1, rec });
        continue;
      }
      if (slug.startsWith(base + '-')) {
        const tail = slug.slice(base.length + 1);
        if (/^\d+$/.test(tail)) {
          const n = parseInt(tail, 10);
          if (n >= 2) members.push({ suffix: n, rec });
        }
      }
    }
    if (!members.length) return;
    members.sort((a, b) => a.suffix - b.suffix);
    // Reassign slugs to contiguous sequence base, base-2, base-3, ...
    for (let i = 0; i < members.length; i++) {
      const desired = i === 0 ? base : `${base}-${i + 1}`;
      const m = members[i];
      if (m.rec.slug !== desired) {
        // update mapping
        this.bySlug.delete(m.rec.slug);
        m.rec.slug = desired;
        this.bySlug.set(desired, m.rec);
      }
    }
  }
}
