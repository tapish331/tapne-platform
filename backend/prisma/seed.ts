// T25 — Seed script for demo data
// This file is designed to be light and test-friendly. It exports demo data and
// a `seed` function that can operate against a minimal Prisma-like interface
// (only `upsert` methods are used). Real DB connectivity is not required for
// unit/e2e tests in this kata.

import { uniqueSlug, basicSlugify } from '../src/utils/slug';

export type DemoUser = {
  email: string;
  password: string;
  username: string;
  bio?: string;
};

export type DemoTrip = {
  title: string;
  ownerEmail: string; // references DemoUser.email
  isPrivate?: boolean;
};

export const demoUsers: DemoUser[] = [
  {
    email: 'alex@example.com',
    password: 'alexPass123',
    username: 'alex',
    bio: 'Explorer of cozy towns and cafes.',
  },
  {
    email: 'bianca@example.com',
    password: 'biancaPass123',
    username: 'bianca',
    bio: 'Mountains in the summer, deserts in the winter.',
  },
  {
    email: 'chris@example.com',
    password: 'chrisPass123',
    username: 'chris',
    bio: 'Street food and night markets enthusiast.',
  },
];

export const demoTrips: DemoTrip[] = [
  {
    title: 'Kyoto Autumn Leaves Walk',
    ownerEmail: 'alex@example.com',
  },
  {
    title: 'Sahara Desert Stargazing',
    ownerEmail: 'bianca@example.com',
    isPrivate: false,
  },
  {
    title: 'Bangkok Night Market Crawl',
    ownerEmail: 'chris@example.com',
  },
];

export function buildDatabaseUrlFromEnv(env: NodeJS.ProcessEnv = process.env): string {
  return (
    env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/tapne?schema=public'
  );
}

// Super-simple password hash placeholder for seed data. Replace with a real hash
// when connecting to a DB-backed auth subsystem.
export function hashPassword(pw: string): string {
  return `hash:${basicSlugify(pw)}`;
}

type MinimalUpsertArgs<TCreate> = {
  where: Record<string, any>;
  create: TCreate;
  update: Partial<TCreate>;
};

type MinimalPrisma = {
  user?: { upsert: (args: MinimalUpsertArgs<any>) => Promise<any> | any };
  profile?: { upsert: (args: MinimalUpsertArgs<any>) => Promise<any> | any };
  trip?: { upsert: (args: MinimalUpsertArgs<any>) => Promise<any> | any };
};

export async function seed(prisma?: MinimalPrisma) {
  const createdUsers: any[] = [];
  const createdProfiles: any[] = [];
  const createdTrips: any[] = [];

  // Users + Profiles
  for (const u of demoUsers) {
    const userRecord = {
      email: u.email,
      passwordHash: hashPassword(u.password),
    };
    const profileRecord = {
      username: u.username,
      bio: u.bio || '',
      userEmail: u.email,
    };

    if (prisma?.user?.upsert) {
      await prisma.user.upsert({
        where: { email: u.email },
        create: userRecord,
        update: {},
      });
    }
    if (prisma?.profile?.upsert) {
      await prisma.profile.upsert({
        where: { username: u.username.toLowerCase() },
        create: profileRecord,
        update: {},
      });
    }

    createdUsers.push(userRecord);
    createdProfiles.push(profileRecord);
  }

  // Trips
  const taken = new Set<string>();
  const isTaken = (slug: string) => taken.has(slug);

  for (const t of demoTrips) {
    const slug = uniqueSlug(t.title, isTaken);
    taken.add(slug);
    const tripRecord = {
      title: t.title,
      ownerEmail: t.ownerEmail,
      isPrivate: Boolean(t.isPrivate),
      slug,
    };
    if (prisma?.trip?.upsert) {
      await prisma.trip.upsert({
        where: { slug },
        create: tripRecord,
        update: {},
      });
    }
    createdTrips.push(tripRecord);
  }

  return {
    ok: true,
    users: createdUsers,
    profiles: createdProfiles,
    trips: createdTrips,
    counts: {
      users: createdUsers.length,
      profiles: createdProfiles.length,
      trips: createdTrips.length,
    },
  } as const;
}

// Allow running this file directly via ts-node or tsx
if (require.main === module) {
  // eslint-disable-next-line no-console
  seed()
    .then((r) => console.log('Seed summary:', r.counts))
    .catch((e) => {
      console.error('Seed failed:', e);
      process.exit(1);
    });
}

