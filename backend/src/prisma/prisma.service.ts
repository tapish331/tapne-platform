// Minimal PrismaService for T03
// This is a lightweight service that exposes the configured DATABASE_URL
// and no-op connect/disconnect hooks. It avoids requiring @prisma/client
// to keep unit tests fast and DB-agnostic.

export class PrismaService {
  private readonly databaseUrl: string | undefined;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    this.databaseUrl = env.DATABASE_URL;
  }

  get url(): string | undefined {
    return this.databaseUrl;
  }

  // Nest-like lifecycle hooks (no-ops here)
  async onModuleInit(): Promise<void> {
    // Intentionally empty; real app would connect PrismaClient here
  }

  async enableShutdownHooks(): Promise<void> {
    // Intentionally empty; real app would handle prisma.$disconnect
  }
}

