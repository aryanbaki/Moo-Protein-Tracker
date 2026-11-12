/** Web storage driver: one JSON document in AsyncStorage (localStorage). */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createJsonRepository } from './jsonRepository';
import type { LogRepository } from './types';

export function createDefaultRepository(): LogRepository {
  return createJsonRepository(AsyncStorage);
}
