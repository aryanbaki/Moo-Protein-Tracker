/** Storage layer: repository contract plus its SQLite (native) and JSON (web) implementations. */
export { createDefaultRepository } from './driver';
export { createJsonRepository, createMemoryStore, JSON_STORAGE_KEY } from './jsonRepository';
export { applyRows, isNewer, rowsToApply } from './merge';
export { LATEST_SCHEMA_VERSION, MIGRATIONS, runMigrations } from './migrations';
export type { Migration, MigrationDb } from './migrations';
export { createSqliteRepository } from './sqliteRepository';
export type { SqlDb } from './sqliteRepository';
export { emptyRows } from './types';
export type { CreatineRow, FoodEntryRow, KeyValueStore, LogRepository, LogRows, WeightRow } from './types';
