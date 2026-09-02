/**
 * The quick profile wizard — one question on screen at a time.
 *
 * Declarative on purpose: the screen renders whatever is in this array, so
 * adding, reordering or removing a question is an edit here and nothing else.
 *
 * ⚠️ AGE AND CONSENT. This collects a date-free age, but it is still personal
 * data about a possibly-underage user. Germany sets the GDPR digital-consent
 * age at 16 (member states may choose 13–16), so decide before launch whether
 * under-16s are blocked, or routed to parental consent. `MIN_AGE` below is the
 * input floor, not a legal decision.
 */
export type QuestionId = 'gender' | 'age' | 'concern' | 'routine';

export type Choice = { value: string; label: string };

export type Question =
  | {
      id: QuestionId;
      kind: 'choice';
      prompt: string;
      hint?: string;
      /** 'wrap' flows short labels; 'stack' gives long ones a full-width row. */
      layout: 'wrap' | 'stack';
      /** Multi-select needs an explicit Continue — there is no "done" on a tap. */
      multi?: boolean;
      /** Multi-select only. Caps the answer so it stays useful to the analysis. */
      max?: number;
      options: Choice[];
    }
  | {
      id: QuestionId;
      kind: 'number';
      prompt: string;
      hint?: string;
      placeholder: string;
    };

export const MIN_AGE = 13;
export const MAX_AGE = 99;

export const QUESTIONS: Question[] = [
  {
    id: 'gender',
    kind: 'choice',
    prompt: 'How do you identify?',
    hint: 'Hormones affect skin, so this changes what we look for.',
    layout: 'wrap',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
      { value: 'intersex', label: 'Intersex' },
      { value: 'other', label: 'Other' },
      { value: 'prefer-not', label: 'Prefer not to say' },
    ],
  },
  {
    id: 'age',
    kind: 'number',
    prompt: 'How old are you?',
    hint: 'Skin needs shift by decade more than by year.',
    placeholder: 'Your age',
  },
  {
    id: 'concern',
    kind: 'choice',
    prompt: 'What bothers you most?',
    hint: 'Choose up to three. We will find the rest in your scan.',
    layout: 'wrap',
    multi: true,
    max: 3,
    options: [
      { value: 'acne', label: 'Acne' },
      { value: 'lines', label: 'Fine lines & wrinkles' },
      { value: 'dark-spots', label: 'Dark spots' },
      { value: 'oily', label: 'Oily skin' },
      { value: 'dryness', label: 'Dryness' },
      { value: 'redness', label: 'Redness' },
      { value: 'pores', label: 'Pores' },
      { value: 'dullness', label: 'Dullness' },
      { value: 'texture', label: 'Rough texture' },
      { value: 'barrier', label: 'Damaged skin barrier' },
      { value: 'unsure', label: "I don't know" },
    ],
  },
  {
    id: 'routine',
    kind: 'choice',
    prompt: 'Where are you starting from?',
    layout: 'stack',
    options: [
      { value: 'has-routine', label: 'I have a routine' },
      { value: 'some-products', label: 'Some products, no routine' },
      { value: 'fresh', label: 'Starting fresh' },
    ],
  },
];

/** Short labels for the recap at the end. */
export const RECAP_LABEL: Record<QuestionId, string> = {
  gender: 'Identity',
  age: 'Age',
  concern: 'Main concern',
  routine: 'Starting point',
};

/**
 * Written out rather than a Partial<Record>, because `concern` is multi-select
 * and the others are not — the shape should say so.
 */
export type SkinProfile = {
  gender?: string;
  age?: string;
  concern?: string[];
  routine?: string;
};

/**
 * "I don't know" cannot coexist with a specific concern. Picking it clears the
 * rest; picking anything else clears it.
 */
export const EXCLUSIVE_CONCERN = 'unsure';

/** Turns a stored value — one or many — back into the labels the user picked. */
export function labelFor(id: QuestionId, value: string | string[] | undefined): string {
  if (!value || (Array.isArray(value) && value.length === 0)) return '—';
  const question = QUESTIONS.find((q) => q.id === id);
  const toLabel = (v: string) =>
    !question || question.kind === 'number'
      ? v
      : (question.options.find((o) => o.value === v)?.label ?? v);
  return Array.isArray(value) ? value.map(toLabel).join(', ') : toLabel(value);
}
