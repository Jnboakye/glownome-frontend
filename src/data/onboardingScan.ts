/**
 * The four cards dealt on the second onboarding screen.
 *
 * VERIFIED, NOT GUESSED. Every product below is a real SKU and every `property`
 * chip is a label-level fact taken from the product's own name or its published
 * INCI list — not an opinion about how the product performs. Checked 2 Sep 2026:
 *
 * - CeraVe Foaming Cleanser (EU name; "Foaming Facial Cleanser" in the US) —
 *   normal-to-oily gel-to-foam cleanser with ceramides, hyaluronic acid and
 *   niacinamide. "Foaming" is the product's own descriptor.
 *   https://incidecoder.com/products/cerave-foaming-cleanser-for-normal-to-oily-skin-eu
 *
 * - The Ordinary Niacinamide 10% + Zinc 1% — the brand's official product name
 *   is "Niacinamide 10% + Zinc 1% Oil Control Serum", so "Oil control" is
 *   Deciem's own wording.
 *   https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html
 *
 * - Nivea Creme (blue tin) — INCI opens Aqua, Paraffinum Liquidum, Cera
 *   Microcristallina, Glycerin, Lanolin Alcohol. Mineral oil, microcrystalline
 *   wax and lanolin are occlusives, so "Occlusive" is a fact about the formula.
 *   https://incidecoder.com/products/nivea-creme-in-tin-packaging
 *
 * - Weleda Edelweiss Sunscreen Lotion SPF 30 — titanium dioxide only, no
 *   organic filters. Chip is "Mineral filter", NOT "broad spectrum": titanium
 *   dioxide alone covers UVB and UVA II well but is weaker in UVA I, so
 *   "broad spectrum" would have been an overclaim.
 *   https://incidecoder.com/products/weleda-edelweiss-sunscreen-lotion-spf-30
 *
 * The MATCH SCORES AND VERDICTS ARE ILLUSTRATIVE — they describe fit against a
 * fictional dehydrated-combination skin profile, not a judgement on the product.
 * Replace them with real analysis output, or switch to unbranded examples,
 * before this screen goes in front of the public.
 */

export type RoutineStep = 'cleanser' | 'serum' | 'moisturiser' | 'spf';

/** When the product is used. Rendered as sun / moon icons, not "AM & PM". */
export type RoutineTiming = 'morning' | 'night' | 'both';

/** Which column the product sorts into. Explicit, not derived from the score —
 *  the real analysis decides this, and the threshold is its business, not the
 *  UI's. */
export type ShelfVerdict = 'keep' | 'rethink';

export interface ScanDemoCard {
  id: string;
  step: RoutineStep;
  stepLabel: string;
  brand: string;
  product: string;
  /** 0–100 fit against the user's scanned skin. Drives the ring and its colour. */
  match: number;
  /** A label-level fact about the formula. Never an opinion. */
  property: string;
  timing: RoutineTiming;
  shelf: ShelfVerdict;
  /** The personalised part — this is what the AI would actually be producing. */
  verdict: string;
}

export const SCAN_DEMO_CARDS: ScanDemoCard[] = [
  {
    id: 'cleanser',
    step: 'cleanser',
    stepLabel: 'Cleanser',
    brand: 'CeraVe',
    product: 'Foaming Cleanser',
    match: 38,
    property: 'Foaming',
    timing: 'both',
    shelf: 'rethink',
    verdict: 'Built for oily skin. Too stripping for your barrier right now.',
  },
  {
    id: 'serum',
    step: 'serum',
    stepLabel: 'Serum',
    brand: 'The Ordinary',
    product: 'Niacinamide 10% + Zinc 1%',
    match: 71,
    property: 'Oil control',
    timing: 'night',
    shelf: 'keep',
    verdict: 'Right idea for shine. Start twice a week, not nightly.',
  },
  {
    id: 'moisturiser',
    step: 'moisturiser',
    stepLabel: 'Moisturiser',
    brand: 'Nivea',
    product: 'Creme',
    match: 24,
    property: 'Occlusive',
    timing: 'night',
    shelf: 'rethink',
    verdict: 'Seals water in, but far too heavy for your T-zone.',
  },
  {
    id: 'spf',
    step: 'spf',
    stepLabel: 'SPF',
    brand: 'Weleda',
    product: 'Edelweiss Sunscreen Lotion SPF 30',
    match: 94,
    property: 'Mineral filter',
    timing: 'morning',
    shelf: 'keep',
    verdict: 'Keep this one. Daily SPF is doing the most work here.',
  },
];
