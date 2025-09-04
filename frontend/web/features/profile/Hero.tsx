// Profile Hero view model (T20)
// No JSX; pure functions for tests.

import { getCounts, toggleFollow } from '../../lib/server/profile.mutations';
import { prepareAndUpload } from '../media/UploadImage';
import { canBlockUser } from '../moderation/BlockButton';

export type HeroModel = {
  username: string;
  isOwner: boolean;
  canFollow: boolean;
  followerCount: number;
  followingCount: number;
};

export function makeHero(viewerId: string | null | undefined, username: string): HeroModel {
  const uname = String(username || '').trim();
  const vid = viewerId ? String(viewerId) : null;
  const counts = getCounts(uname);
  const isOwner = Boolean(vid && vid === uname);
  return {
    username: uname,
    isOwner,
    canFollow: !isOwner,
    followerCount: counts.followers,
    followingCount: counts.following,
  };
}

export function toggleFollowFromHero(viewerId: string, username: string) {
  return toggleFollow(viewerId, username);
}

// T21 integration: allow owner to update profile photo using upload helpers
export async function updateProfilePhoto(
  ownerUsername: string,
  file: Blob & { name?: string; type?: string },
  client?: any
) {
  const uname = String(ownerUsername || '').trim();
  if (!uname) return { ok: false as const, error: 'username required' };
  const uploaded = await prepareAndUpload(file, client);
  return { ok: true as const, photoUrl: uploaded.url, thumbnailUrl: uploaded.thumbnailUrl };
}

// T23: Attach moderation capabilities (block) to hero model
export function attachModerationToHero(
  hero: HeroModel,
  viewerId: string | null | undefined
): HeroModel & { canBlock: boolean } {
  const canBlock = canBlockUser(viewerId, hero.username);
  return { ...hero, canBlock };
}
