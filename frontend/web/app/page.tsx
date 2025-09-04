export const metadata = {
  title: 'Home — Tapne',
  description: 'Discover trending and personalized trips on Tapne',
};

// Keep this file free of JSX so tests don't require React runtime
import { fetchPublicHome, fetchPersonalizedHome } from '../lib/server/home.queries';

export type HomeComposition = {
  kind: 'page';
  page: 'home';
  sections: {
    public: Awaited<ReturnType<typeof fetchPublicHome>>;
    personalized?: Awaited<ReturnType<typeof fetchPersonalizedHome>>;
  };
};

export default function HomePage(props?: { userId?: string | null }) {
  const publicData = fetchPublicHome();
  const personalized = props?.userId ? fetchPersonalizedHome(props.userId) : undefined;
  const out: HomeComposition = {
    kind: 'page',
    page: 'home',
    sections: { public: publicData, personalized },
  };
  return out;
}
