/**
 * Native storage driver: SQLite. The web build resolves `driver.web.ts`
 * instead, so expo-sqlite is never bundled or loaded on web.
 */
import * as SQLite from 'expo-sqlite';

import { createSqliteRepository, type SqlDb } from './sqliteRepository';
import type { LogRepository } from './types';

export const DATABASE_NAME = 'moo.db';

export function createDefaultRepository(): LogRepository {
  return createSqliteRepository(async () => (await SQLite.openDatabaseAsync(DATABASE_NAME)) as unknown as SqlDb);
}
