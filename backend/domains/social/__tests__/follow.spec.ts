import { describe, it, expect } from 'vitest';
import { FollowService } from '../follow.service';

describe('T11: Social follow/unfollow + counts', () => {
  it('follows and unfollows with correct counts; idempotent', () => {
    const svc = new FollowService();
    // initial counts
    expect(svc.getCounts('u1')).toEqual({ followers: 0, following: 0 });
    expect(svc.getCounts('u2')).toEqual({ followers: 0, following: 0 });

    // u1 follows u2
    svc.follow({ followerId: 'u1', followeeId: 'u2' });
    expect(svc.isFollowing('u1', 'u2')).toBe(true);
    expect(svc.getCounts('u1')).toEqual({ followers: 0, following: 1 });
    expect(svc.getCounts('u2')).toEqual({ followers: 1, following: 0 });

    // idempotent follow
    svc.follow({ followerId: 'u1', followeeId: 'u2' });
    expect(svc.getCounts('u1')).toEqual({ followers: 0, following: 1 });
    expect(svc.getCounts('u2')).toEqual({ followers: 1, following: 0 });

    // u3 follows u2
    svc.follow({ followerId: 'u3', followeeId: 'u2' });
    expect(svc.getCounts('u2')).toEqual({ followers: 2, following: 0 });

    // unfollow works and is idempotent
    svc.unfollow({ followerId: 'u1', followeeId: 'u2' });
    expect(svc.isFollowing('u1', 'u2')).toBe(false);
    expect(svc.getCounts('u1')).toEqual({ followers: 0, following: 0 });
    expect(svc.getCounts('u2')).toEqual({ followers: 1, following: 0 });
    svc.unfollow({ followerId: 'u1', followeeId: 'u2' });
    expect(svc.getCounts('u2')).toEqual({ followers: 1, following: 0 });
  });

  it('disallows self-follow', () => {
    const svc = new FollowService();
    expect(() => svc.follow({ followerId: 'u1', followeeId: 'u1' })).toThrow();
  });
});

