/**
 * The one concern vocabulary.
 *
 * Shared by skin metrics, product targets, and the onboarding wizard
 * (data/onboardingQuestions.ts, minus its 'unsure' — "I don't know" is an
 * answer about the user, never a product tag).
 *
 * The backend holds the same list in app/models.py as CONCERNS, and rejects
 * anything outside it. Change both together or not at all.
 */
export type ConcernKey =
  | 'acne'
  | 'lines'
  | 'dark-spots'
  | 'oily'
  | 'dryness'
  | 'redness'
  | 'pores'
  | 'dullness'
  | 'texture'
  | 'barrier';

export interface SkinMetric {
  key: ConcernKey;
  label: string;
  /**
   * 0–100, where 100 is the healthiest reading for that metric — including
   * for negative axes: a `redness` score of 100 means no visible redness.
   */
  score: number;
  note: string;
}

/** One recommendation, with the reason it was made. */
export interface AnalysisRecommendation {
  productId: string;
  /** Short, specific: "Reduces pore size", "Lightweight for oily zones". */
  reason: string;
}

/** The exact shape POST /analyses returns. See the backend's app/models.py. */
export interface SkinAnalysis {
  id: string;
  createdAt: string;
  photoUri?: string;
  /** 0–100. Colour and interpretation both derive from this one number. */
  overallScore: number;
  /** Derived from the photo, not copied from the questionnaire. */
  skinType: string;
  headline: string;
  summary: string;
  /** Plain observations: "Enlarged pores in the T-zone". */
  findings: string[];
  metrics: SkinMetric[];
  recommendations: AnalysisRecommendation[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  body: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  /** 0–100 fit against the user's most recent analysis. */
  matchScore: number;
  blurb: string;
  description: string;
  keyIngredients: string[];
  targets: ConcernKey[];
  routineStep: 'cleanse' | 'treat' | 'moisturise' | 'protect';
  buyUrl: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  /** Hex used for the product swatch tile — keeps the catalogue image-free for the MVP. */
  swatch: string;
}
