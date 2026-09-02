/**
 * The closing onboarding screen: three commitments, each with the concrete
 * reason it is true.
 *
 * ⚠️  THESE ARE PROMISES THE PRODUCT HAS TO KEEP. Two of them are business and
 * legal commitments, not marketing copy — confirm both before shipping:
 *
 *   • "No brand pays to be here" forecloses sponsored placement AND affiliate
 *     revenue. If the catalogue ever earns a commission, this line is false and
 *     the Product Details disclaimer ("Glownome does not take a cut") with it.
 *   • "Used to produce your analysis and nothing else" forecloses training
 *     models on user photos, and commits to deletion on request. If the backend
 *     retains images for model improvement, rewrite this before launch.
 *
 * Say less rather than promise something the product will not honour.
 */
export interface OnboardingPromise {
  id: string;
  /** MaterialCommunityIcons name. */
  icon: string;
  claim: string;
  proof: string;
}

export const PROMISES: OnboardingPromise[] = [
  {
    id: 'personal',
    icon: 'target-variant',
    claim: 'Built around your scan',
    proof: 'Every suggestion traces back to your own reading, not to a bestseller list.',
  },
  {
    id: 'independent',
    icon: 'scale-balance',
    claim: 'No brand pays to be here',
    proof: 'Nothing in the catalogue is sponsored, and we take no cut when you buy.',
  },
  {
    id: 'private',
    icon: 'lock-outline',
    claim: 'Your photos stay yours',
    proof: 'Used to produce your analysis and nothing else. Delete them whenever you like.',
  },
];

/** Placeholder destinations — point these at the real pages before launch. */
export const LEGAL_LINKS = {
  terms: 'https://glownome.app/terms',
  privacy: 'https://glownome.app/privacy',
};
