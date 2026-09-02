# Glownome — frontend

AI-powered skincare app. Scan your skin, get a read on it, get products matched
to what it actually needs, and watch it change week to week.

React Native (Expo SDK 54) · TypeScript · NativeWind (Tailwind) · React Native Paper · React Navigation 7

## Running it

```bash
npm install
npx expo start
```

Then press `i` for the iOS simulator, `a` for Android, or scan the QR code with
Expo Go on your phone. Camera and photo-library access are requested at the
point of use on the Scan screen.

### Why SDK 54 and not the latest

Expo stopped publishing new Expo Go builds to the App Store after SDK 54 — 55,
56 and 57 were never released there. Staying on 54 is what lets this project run
in the Expo Go app you can actually install. Moving to a newer SDK means moving
to a development build (`npx expo run:ios`) or `eas go`, which is Expo's
recommended path once the project is past the prototype stage.

`react` and `react-native` are pinned through `overrides` in package.json,
because NativeWind's peer ranges otherwise let npm install a second, newer copy
of each alongside them.

## Structure

```
App.tsx                     Font loading, PaperProvider, SafeAreaProvider
global.css                  Tailwind directives — imported once by App.tsx
tailwind.config.js          Reads src/theme/tokens.js; scales are replaced, not extended
src/
  theme/
    tokens.js               THE source of truth. Read by tailwind.config.js AND paperTheme
    tokens.d.ts             Types for the above
    colors.ts               palette + gradients + toneForScore, for non-class contexts
    typography.ts           Font families, for Paper props that take style objects
    layout.ts               The card shadow (a native prop, not a class)
    paperTheme.ts           MD3 theme, built from the same tokens
    paperInterop.ts         Registers Paper components with NativeWind
  components/               Shared building blocks
    GlowBackground          The signature gradient ('glow' and 'mist' variants)
    PrimaryButton           The ink pill button + its outline variant
    TextLink, ScreenHeader, SectionTitle
    MetricBar, ScoreDial, ProductCard
  navigation/
    RootNavigator.tsx       Stack: Onboarding → Main, plus Results, ProductDetail
    MainTabs.tsx            Bottom tabs: Scan, Progress, Profile
    types.ts                Typed route params (global ReactNavigation augmentation)
  screens/                  The six screens
  api/                      Service layer — the only place that knows about data
  data/                     Mock catalogue, analysis and progress fixtures
  hooks/                    Onboarding persistence (AsyncStorage)
```

## Styling contract

Three rules, and they cover every case:

1. **Layout, colour, type, spacing → `className`.** `px-gutter`, `text-ink-soft`,
   `font-display`, `rounded-pill`. The Tailwind scales are *replaced* by the
   tokens, not extended, so there is no `p-4` to reach for by habit where the
   design calls for the 26pt gutter.
2. **Paper internals → props and the theme.** A `Button`'s label and ripple, a
   `List.Item`'s title, a `Switch`'s track, `TextInput` focus and error colours —
   no class name reaches these. They come from `labelStyle`, `titleStyle`,
   `buttonColor`, or `paperTheme`.
3. **Data-driven and native values → inline style.** A bar's width, a tone
   colour picked at runtime, a shadow, an insets-derived padding.

`src/theme/tokens.js` is read by both `tailwind.config.js` and `paperTheme.ts`,
so a colour is declared once and can never drift between the two systems.

New Paper components need one line in `src/theme/paperInterop.ts` before
`className` works on them.


## Navigation map

```
Onboarding  ──Get started──▶  Main (tabs)
                               ├── Scan ──Scan your skin──▶ Results ──▶ Product Details
                               ├── Progress
                               └── Profile ──Replay intro / Log out──▶ Onboarding
```

Onboarding is shown once; the flag lives in AsyncStorage under
`glownome.onboarded.v1` and is cleared by "Replay the intro" in Profile.

## Swapping in the real backend

Every screen reads through `src/api/`. Nothing imports `src/data/` directly.

1. Set `API_BASE_URL` in `src/api/client.ts`.
2. Replace the mock body of `analyseSkin()` in `src/api/analysis.ts` with a
   `request()` call that POSTs the image; the backend calls the Claude vision
   API and returns a `SkinAnalysis`.
3. Do the same for `listProducts()` and `listProgress()`.

The `SkinAnalysis`, `Product` and `ProgressEntry` types in `src/api/types.ts`
are the contract the UI is written against — keep them stable and no screen
needs to change.

## Design notes

The onboarding layout is deliberate: a full-bleed diagonal gradient, a
left-aligned lowercase display headline sitting just above centre, and a
full-width ink pill pinned to the bottom with an underlined text link beneath
it. Everything else in the app inherits from that — same gutter (26pt), same
pill, same ink, same Poppins scale.

The palette is near-monochrome on purpose. Cool off-white greys, a true
near-black (`#131316`), and a single electric lilac (`#7C5CFF`) that carries
every piece of emphasis in the app. The only other colour is semantic: the
three score bands in `toneForScore()`. Skin photography is the most saturated
thing on any screen, so the interface around it stays almost colourless.

Weights come from the font file, not a `font-weight` — so the family classes are
`font-body` / `font-ui` / `font-title` / `font-display` rather than
`font-normal` / `font-bold`, which also avoids colliding with Tailwind's own
weight scale.

Product images are colour swatch tiles rather than photography, so the MVP
carries no image assets and no broken remote URLs. Swap `Product.swatch` for an
`imageUrl` when the scraped catalogue has usable images.
# glownome-frontend
