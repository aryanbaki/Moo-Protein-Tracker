# Moo design

## Direction
Playful, rounded, and warm: a cream background, green accents, Nunito type, big
pill buttons, generous spacing, and a cow with personality at the centre of the
app. Protein is the number that matters; everything else is quieter. This replaces
the earlier "calm tracker with a static placeholder cow" direction.

What this document describes is the intended design. Whether a given screen is
built, and whether anything has been checked on a real iPhone, is recorded in
[status.md](status.md), not here.

## References (patterns only, never artwork)
Looked up on Mobbin:
- **Waterllama**: mascot-led onboarding and the "fill the animal" home screen.
  Borrowed: the feel of a character that fills with progress, rounded type,
  bottom-sheet questions, a celebration on reaching the goal.
- **Cal AI**: onboarding question flow and home layout. Borrowed: one question per
  screen with a progress bar, the comparison chart idea, macro tiles, a
  recent-meals list, and a `+` scan button.

These are inspiration for interaction patterns and layout. Do not copy, trace, or
imitate their illustrations, characters, icons, palettes, screenshots, or copy.
The cow, the colours, and the words are Moo's own.

## Tokens (src/theme/index.ts)
The theme file is the source of truth; update this table when it changes.

| Category | Values |
| --- | --- |
| Base colours | background #FFF9EE, surface #FFFFFF, surfaceAlt #F4EEDF, text #242B23, textSecondary #52604F, textOnPrimary #FFFFFF, primary #426B3A, primaryDark #2F4F29, primarySoft #DCEBD3, border #DDE3D7 |
| Cow colours | cowWhite #FFFFFF, cowSpot #2B2B2B, cowPink #F7B6C2, cowOutline #242B23, cowGhost #E9E6DC |
| Progress and data colours | fill #6FB85C, fillDeep #4C9A3D, good #3E9B4F, bad #D9534F, warning #E8A33D, calories #F08A4B, carbs #E3B341, fat #5B8DEF, creatine #8E6FD8 |
| Scene colours | ufo #8E9AAF, beam #C9F27B, overlay rgba(36,43,35,0.45) |
| Spacing | xs 4, sm 8, md 16, lg 24, xl 32, xxl 48 |
| Radius | sm 10, md 16, lg 24, pill 999 |
| Fonts | regular Nunito_400Regular, medium Nunito_600SemiBold, bold Nunito_800ExtraBold, black Nunito_900Black |
| Type sizes | small 12, caption 14, label 16, body 18, heading 28, title 48, display 64, mascot 72 |
| Weights (legacy) | regular 400, medium 500, bold 700 |
| Shadow | card: black at 6% opacity, radius 12, offset 0/4, elevation 2 |

Notes:
- With Nunito, choose weight through the `fonts` family names, not `fontWeight`.
  The numeric `weights` remain from the foundation and are not used by `AppText`.
- `AppText` variants (src/components/index.tsx): display (black, 64), title
  (black, 34), heading (bold, 28), body (regular, 18), label (bold, 16), caption
  (semi-bold, 14, secondary colour), small (semi-bold, 12, secondary colour).
  The `title` variant uses 34, not the 48 `title` token.
- Use tokens and the shared components. Do not hard-code a colour where a token
  exists; if a token is missing, add it to the theme rather than inlining a hex.

## Typography
Nunito, loaded in the root layout through `@expo-google-fonts/nunito` and
`expo-font`; the splash screen stays up until fonts load or fail. Use body for
inputs and paragraph text, label for control text, heading for sections, display
for the hero protein number, and caption/small only for secondary detail. Do not
put text in fixed-height containers; allow wrapping and system text scaling.

## Components and patterns
- **Pill buttons** (`Button`): minimum height 58, fully rounded, upper-case
  Nunito Black label. Variants: primary (green), dark, secondary (soft green),
  ghost, danger. One primary action per screen, pinned at the bottom through
  `Screen`'s `footer`.
- **Option cards** (`OptionCard`): single-choice rows at least 68 high for
  onboarding questions and settings; the selected row turns green with white text.
- **Cards** (`Card`): white, radius 24, soft shadow, on the cream background.
- **Progress bar** (`ProgressBar`): thin bar for onboarding progress.
- **Bottom sheets**: used for the `+` menu (Scan food / Scan barcode / Search or
  type it / Quick add grams), scan results, pickers, and short questions. A sheet
  has a dimmed `overlay` backdrop, a rounded top, a clear title, a visible close
  control, and can be dismissed without losing typed values.
- **Onboarding screen**: progress bar on top, the cow reacting, one question,
  one pill button at the bottom.
- **Macro tiles**: three small tiles (calories, carbs, fat) showing eaten / goal
  in text, with the data colour as an accent only.

## Mascot
The cow is original artwork drawn in code as SVG (`react-native-svg`) and animated
with Reanimated. It is exposed from `src/mascot` as `Cow`, `UfoScene`,
`SpeechBubble`, and `Confetti`. No emoji, stock art, or third-party character
stands in for it in a shipped build.

- **Construction**: one SVG with named groups (body, spots, head, ears, eyes,
  tail, legs, udder), so each part can be moved independently. White body, near
  black spots, pink udder and nose, dark outline.
- **Poses** (`CowPose`): idle, wave, chew, flex, shocked, shrug, dance, sweat,
  crown, abducted. Idle includes small life signs (blink, tail swish, ear flick,
  occasional chew). Poses carry meaning in context: wave on welcome, sweat past
  the safe pace, shocked on the reality check, shrug on "no creatine", flex on
  the creatine check-off, crown on the paywall, dance on reaching the goal.
- **Fill effect**: on tap or after logging, the illustrated cow cross-fades to a
  see-through outline (`cowGhost`) and a green fill with a wavy surface rises
  inside the outline to the current percentage, holds, then fades back. The same
  effect shows the week's total in the weekly view. Fill never exceeds the outline;
  going over the goal is shown in text.
- **UFO loading scene**: on the onboarding setup screen a comic UFO flies in, its
  beam lifts the cow, and the cow turns slowly while setup steps tick off. The
  steps are also shown as text.
- **Celebration**: reaching the goal fires one short confetti burst and a dance.
  It does not loop.

## Accessibility and layout
- Keep `SafeAreaProvider` at the root and safe-area-aware screens; account for
  the keyboard, the bottom home indicator, and smaller iPhone displays.
- Maintain at least 4.5:1 contrast for ordinary text and 3:1 for large text and
  meaningful controls. Verify each actual foreground/background pairing.
  Calculated pairings for the current tokens:
  - Pass for body text: text on background (13.9:1), textSecondary on background
    (6.4:1) and on surface (6.7:1), white on primary (6.2:1), primaryDark on
    primarySoft (7.4:1), primarySoft on primary (5.0:1), primary on background
    (5.9:1).
  - Large text or graphics only (3:1 to 4.5:1): white on bad (4.0:1), bad on
    background (3.8:1), good and fillDeep on background (3.3:1), fat (3.2:1) and
    creatine (3.9:1) on surface.
  - Not for text or as the only indicator (below 3:1): fill, warning, calories,
    and carbs on light backgrounds, and border on background (1.3:1). Use these
    as fills and accents next to dark text. The light border is decorative and
    must not be the only input or focus indicator.
- Give controls clear labels, values, roles, a logical focus order, and at least
  44-by-44-point targets. Show units ("g", "kcal") explicitly.
- Never communicate status by colour, fill level, or the cow's pose alone. Every
  visual progress state needs a text equivalent: the fill view is always paired
  with "86 g of 150 g", charts with their numbers, the creatine chip with a
  checked/unchecked state, and the cow with an accessibility label that states
  the progress.
- Respect Reduce Motion (`useReducedMotion` from Reanimated). With it on: poses
  become static swaps, the fill jumps to its level, the UFO scene and chart
  appear in their end state, and confetti is skipped. No flashing, no endless
  attention-seeking loops, and no motion that is needed to understand an outcome.
- Haptics are an accent only and must never be the sole feedback.
- Web (react-native-web) is used to check the app in cloud sessions, so screens
  must render there; native-only features need a sensible fallback.

## Required UI states
- **Loading**: a short descriptive state while fonts and local data load, and
  while a photo is analysed; prevent duplicate saves.
- **Empty**: say there are no entries yet and offer one clear logging action.
- **Error**: keep entered values, explain invalid amounts (positive, finite) or a
  storage/network failure in plain language, and offer retry. Never silently drop
  a record.
- **Scan failures**: no food found, offline, and out of free scans each get their
  own message and a way forward (retake, type it in, or see premium).
- **Estimate**: scan results always carry a visible "estimate" note and editable
  values.
- **Blocked goal**: show the entered value, the recommended range, and a "Use
  recommended" action; do not accept or change the value silently.
- **Success**: the saved amount and updated total are visible and announced;
  destructive actions (delete entry, delete account) are confirmed.
- **Goal met or exceeded**: show the true total without shaming or medical
  judgement.
- **Signed out / not configured**: the app still works locally; account, sync,
  and purchase controls explain what is unavailable instead of failing.
- **Permission denied** (camera, photos, notifications): explain what is
  unavailable and how to turn it on; the manual path still works.

## Not verified
Contrast figures above are calculated from token values, not measured on a
device. Dynamic Type at large sizes, VoiceOver order and labels, Reduce Motion
behaviour, safe areas, and animation performance need a build on a physical
iPhone. Documentation is not evidence of a tested interface.
