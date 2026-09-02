import { ProgressEntry } from './types';
import { delay } from './client';
import { PROGRESS_ENTRIES, ROUTINE_STREAK } from '../data/progress';

export async function listProgress(): Promise<ProgressEntry[]> {
  return delay(PROGRESS_ENTRIES, 300);
}

export function getRoutineStreak(): number {
  return ROUTINE_STREAK;
}
