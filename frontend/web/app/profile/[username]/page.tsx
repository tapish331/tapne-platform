export const metadata = {
  title: 'Profile — Tapne',
  description: 'User profile with visibility controls and follow',
  // T22: Auth-gated page should not be indexed
  robots: { index: false, follow: false },
};

// No JSX; plain-return composition for unit tests
import { getProfileByUsername } from '../../../lib/server/profile.mutations';

export type ProfileComposition = {
  kind: 'page';
  page: 'profile';
  protected: true;
  username: string;
  profile?: ReturnType<typeof getProfileByUsername>;
  ownerView: boolean;
};

export default function ProfilePage(props: { username: string; userId?: string | null }) {
  const username = String(props.username || '').trim();
  const userId = props.userId ? String(props.userId) : null;
  const profile = getProfileByUsername(username);
  const ownerView = Boolean(userId && username && userId === username);
  const out: ProfileComposition = {
    kind: 'page',
    page: 'profile',
    protected: true,
    username,
    profile,
    ownerView,
  };
  return out;
}
