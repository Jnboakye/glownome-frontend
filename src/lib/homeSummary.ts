/**
 * What Home shows, computed from the scans saved on this phone.
 *
 * Pure functions, no React — so they can be tested on their own. Every value
 * comes from a real scan or a real analysis; when there isn't one, the answer
 * is null and the card hides or shows its empty state.
 */
import type { ScanRecord } from '../api/scans';
import type { IngredientPick } from '../api/types';

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "15 Sep" in the phone's locale. */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** "today" · "yesterday" · "3 days ago" · after two weeks, "on 24 Sep". */
export function whenLabel(iso: string, now: Date = new Date()): string {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / DAY);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  return `on ${shortDate(iso)}`;
}

export type WeekDay = { letter: string; isToday: boolean };

/** Monday-first week containing `now`. */
export function currentWeek(now: Date = new Date()): WeekDay[] {
  const todayIndex = (now.getDay() + 6) % 7; // Mon = 0
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => ({
    letter,
    isToday: i === todayIndex,
  }));
}

export type LastScan = {
  scan: ScanRecord;
  /** null until the scan has been analysed. */
  score: number | null;
};

/** The newest scan, whether or not it has been analysed. */
export function lastScan(scans: ScanRecord[]): LastScan | null {
  const newest = [...scans].sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  if (!newest) return null;
  return { scan: newest, score: newest.analysis ? newest.analysis.overallScore : null };
}

export type ProgressChange = {
  /** Lowercase metric label, or "overall score". */
  what: string;
  /** Latest minus previous. Positive = healthier (scores are higher-is-better). */
  delta: number;
  /** When the previous analysed scan was taken. */
  sinceIso: string;
};

/**
 * The biggest change between the two most recent analysed scans.
 *
 * Claude picks 4–8 metrics per scan, so only metrics present in both are
 * compared. With none in common, the overall score is used. Null until there
 * are two analysed scans.
 */
export function progressChange(scans: ScanRecord[]): ProgressChange | null {
  const analysed = scans
    .filter((s) => s.analysis)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  if (analysed.length < 2) return null;

  const latest = analysed[0].analysis!;
  const previous = analysed[1].analysis!;
  const sinceIso = analysed[1].capturedAt;

  const before = new Map(previous.metrics.map((m) => [m.key, m.score]));
  let best: ProgressChange | null = null;
  for (const metric of latest.metrics) {
    const old = before.get(metric.key);
    if (old === undefined) continue;
    const delta = Math.round(metric.score - old);
    if (!best || Math.abs(delta) > Math.abs(best.delta)) {
      best = { what: metric.label.toLowerCase(), delta, sinceIso };
    }
  }

  return (
    best ?? {
      what: 'overall score',
      delta: Math.round(latest.overallScore - previous.overallScore),
      sinceIso,
    }
  );
}

/** Title for the progress card: "redness improved", "pores slipped", "holding steady". */
export function progressTitle(change: ProgressChange): string {
  if (change.delta > 0) return `${change.what} improved`;
  if (change.delta < 0) return `${change.what} slipped`;
  return 'holding steady';
}

/**
 * Ingredients from the newest analysis that has them. The backend does not
 * send this field yet (proposal, R1) — until it does, this is always null and
 * the Ingredients card stays hidden.
 */
export function latestIngredients(scans: ScanRecord[]): IngredientPick[] | null {
  const withPicks = scans
    .filter((s) => s.analysis?.ingredients && s.analysis.ingredients.length > 0)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt))[0];
  return withPicks?.analysis?.ingredients ?? null;
}
