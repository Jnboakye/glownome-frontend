export type ConcernKey =
  | 'hydration'
  | 'oiliness'
  | 'texture'
  | 'redness'
  | 'pores'
  | 'darkSpots';

export interface SkinMetric {
  key: ConcernKey;
  label: string;
  /** 0–100, where 100 is the healthiest reading for that metric. */
  score: number;
  note: string;
}

export interface SkinAnalysis {
  id: string;
  createdAt: string;
  photoUri?: string;
  overallScore: number;
  skinType: string;
  headline: string;
  summary: string;
  metrics: SkinMetric[];
  recommendedProductIds: string[];
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

export interface ProgressEntry {
  id: string;
  weekLabel: string;
  date: string;
  photoUri?: string;
  overallScore: number;
  note: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  skinType: string;
  memberSince: string;
  scanCount: number;
}
