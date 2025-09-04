export type FollowPair = {
  followerId: string;
  followeeId: string;
};

export type FollowCounts = {
  followers: number; // how many follow this user
  following: number; // how many this user follows
};

export class FollowService {
  private readonly pairs = new Set<string>(); // key: followerId:followeeId
  private readonly followers = new Map<string, Set<string>>(); // userId -> set of followerIds
  private readonly following = new Map<string, Set<string>>(); // userId -> set of followeeIds

  private key(followerId: string, followeeId: string): string {
    return `${followerId}:${followeeId}`;
  }

  private ensureValid({ followerId, followeeId }: FollowPair): void {
    if (!followerId || !followeeId) throw new Error('followerId and followeeId are required');
    if (followerId === followeeId) throw new Error('Cannot follow self');
  }

  follow(input: FollowPair): void {
    this.ensureValid(input);
    const k = this.key(input.followerId, input.followeeId);
    if (this.pairs.has(k)) return; // idempotent
    this.pairs.add(k);
    // update following map (for follower)
    const fset = this.following.get(input.followerId) || new Set<string>();
    fset.add(input.followeeId);
    this.following.set(input.followerId, fset);
    // update followers map (for followee)
    const rset = this.followers.get(input.followeeId) || new Set<string>();
    rset.add(input.followerId);
    this.followers.set(input.followeeId, rset);
  }

  unfollow(input: FollowPair): void {
    this.ensureValid(input);
    const k = this.key(input.followerId, input.followeeId);
    if (!this.pairs.has(k)) return; // idempotent
    this.pairs.delete(k);
    // update following
    const fset = this.following.get(input.followerId);
    if (fset) {
      fset.delete(input.followeeId);
      if (fset.size === 0) this.following.delete(input.followerId);
    }
    // update followers
    const rset = this.followers.get(input.followeeId);
    if (rset) {
      rset.delete(input.followerId);
      if (rset.size === 0) this.followers.delete(input.followeeId);
    }
  }

  isFollowing(followerId: string, followeeId: string): boolean {
    const k = this.key(followerId, followeeId);
    return this.pairs.has(k);
  }

  getCounts(userId: string): FollowCounts {
    if (!userId) throw new Error('userId is required');
    const followers = this.followers.get(userId)?.size ?? 0;
    const following = this.following.get(userId)?.size ?? 0;
    return { followers, following };
  }
}

