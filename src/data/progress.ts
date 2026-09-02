import { ProgressEntry } from '../api/types';

export const PROGRESS_ENTRIES: ProgressEntry[] = [
  { id: 'w1', weekLabel: 'Week 1', date: '4 Aug', overallScore: 58, note: 'Baseline scan. Barrier compromised, high water loss.' },
  { id: 'w2', weekLabel: 'Week 2', date: '11 Aug', overallScore: 61, note: 'Added the hyaluronic serum. Less tightness in the morning.' },
  { id: 'w3', weekLabel: 'Week 3', date: '18 Aug', overallScore: 66, note: 'Redness around the nose easing. Kept the routine to three steps.' },
  { id: 'w4', weekLabel: 'Week 4', date: '25 Aug', overallScore: 69, note: 'Daily SPF now consistent. Post-blemish marks fading.' },
  { id: 'w5', weekLabel: 'Week 5', date: '1 Sep', overallScore: 72, note: 'Hydration up 14 points from baseline. Texture holding steady.' },
];

export const ROUTINE_STREAK = 23;
