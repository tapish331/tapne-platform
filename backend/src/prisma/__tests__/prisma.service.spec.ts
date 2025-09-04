import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PrismaService } from '../prisma.service';

const ROOT = path.resolve(__dirname, '../../../..');

describe('T03: Prisma service and schema', () => {
  const schemaPath = path.join(ROOT, 'backend/prisma/schema.prisma');

  it('schema.prisma exists and contains core models', () => {
    expect(existsSync(schemaPath), 'schema.prisma missing').toBe(true);
    const schema = readFileSync(schemaPath, 'utf8');
    const models = [
      'model User',
      'model Profile',
      'model Trip',
      'model TripReview',
      'model Follow',
      'model Bookmark',
      'model Participation',
      'model Report',
      'model Block',
      'model Token',
    ];
    for (const m of models) {
      expect(schema.includes(m), `${m} not found in schema`).toBe(true);
    }
    expect(schema.includes('datasource db'), 'datasource block missing').toBe(true);
    expect(schema.includes('generator client'), 'generator block missing').toBe(true);
  });

  describe('PrismaService', () => {
    const OLD = process.env.DATABASE_URL;
    beforeEach(() => {
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/db';
    });

    it('exposes configured DATABASE_URL', () => {
      const svc = new PrismaService();
      expect(svc.url).toBe('postgresql://test:test@localhost:5432/db');
    });

    it('does not throw on lifecycle hooks', async () => {
      const svc = new PrismaService();
      await expect(svc.onModuleInit()).resolves.toBeUndefined();
      await expect(svc.enableShutdownHooks()).resolves.toBeUndefined();
    });

    // Cleanup
    afterAll(() => {
      process.env.DATABASE_URL = OLD;
    });
  });
});
