/**
 * The routine shown on onboarding screen three, split by time of day.
 *
 * The split is the point of the screen: the same four steps do not all happen
 * at both ends of the day, and "what do I actually do tonight?" is the question
 * people are really asking. Actives go at night, SPF only in the morning.
 *
 * Copy rule: each line says what the step DOES, in the app's voice. No first
 * person, no product names — those come from the scan.
 */
export interface RoutineStepCard {
  id: string;
  /** Verb, shown as the small accent label. */
  phase: string;
  /** What the user buys. */
  name: string;
  /** Three or four words. Long enough to justify the step, short enough for a column. */
  why: string;
  morning: boolean;
  night: boolean;
}

export const ROUTINE_STEPS: RoutineStepCard[] = [
  {
    id: 'cleanse',
    phase: 'Cleanse',
    name: 'Gentle cleanser',
    why: 'without stripping',
    morning: true,
    night: true,
  },
  {
    id: 'treat',
    phase: 'Treat',
    name: 'Active serum',
    why: 'one target at a time',
    morning: false,
    night: true,
  },
  {
    id: 'moisturise',
    phase: 'Moisturise',
    name: 'Moisturiser',
    why: 'holds water in',
    morning: true,
    night: true,
  },
  {
    id: 'protect',
    phase: 'Protect',
    name: 'SPF 30–50',
    why: 'the biggest single lever',
    morning: true,
    night: false,
  },
];

/** The one thing to remember once the columns have been read. */
export const ROUTINE_RULE = 'Actives at night. SPF every morning, no exceptions.';

export const morningSteps = () => ROUTINE_STEPS.filter((s) => s.morning);
export const nightSteps = () => ROUTINE_STEPS.filter((s) => s.night);
