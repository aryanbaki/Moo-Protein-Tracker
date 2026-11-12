# Moo design foundation

## Direction and current assets
A calm, friendly iPhone tracker: warm cream background, green accents, readable
intake totals, and a cow companion. The existing 🐮 emoji is the setup placeholder,
not final mascot artwork. No additional illustration or animation package is needed.
Only the centered home placeholder is implemented; the rules below guide future UI.

## Existing tokens (src/theme/index.ts)
| Category | Values |
| --- | --- |
| Colors | background #FFF9EE, surface #FFFFFF, text #242B23, textSecondary #52604F, primary #426B3A, border #DDE3D7 |
| Spacing | xs 4, sm 8, md 16, lg 24, xl 32 |
| Type sizes | caption 14, body 18, heading 28, title 48, mascot 72 |
| Weights | regular 400, medium 500, bold 700 |

Use system typography and shared tokens. Large title/mascot sizes are appropriate
for the current empty home screen, not every form. Use body text for inputs and
labels, heading for sections, and caption only for secondary details. Avoid fixed
height text containers; allow wrapping and system text scaling. Test large Dynamic
Type and VoiceOver on a physical iPhone before declaring accessibility verified.

## Accessibility and layout
- Keep SafeAreaProvider at the root and safe-area-aware routes; account for keyboard,
  bottom home indicator, landscape restrictions, and smaller iPhone displays.
- Maintain at least 4.5:1 contrast for ordinary text and 3:1 for large text and
  meaningful controls. Verify each actual foreground/background pairing; light
  border is decorative and must not be the only input or focus indicator.
- Give controls clear labels, values, roles, logical focus order, and at least
  44-by-44-point targets. Show grams explicitly. Never communicate status by color
  or the cow expression alone. Totals and progress need readable text equivalents.
- Respect Reduce Motion. Future cow reactions should become static changes when
  reduced motion is enabled. Avoid flashing, looping distraction, or motion needed
  to understand success. Haptics, if later selected, must remain optional.

## Required future UI states
- Loading: brief descriptive state while local data loads; prevent duplicate saves.
- Empty: explain no entries yet and provide one clear logging action.
- Error: retain entered values, explain invalid positive/finite gram amounts or
  storage failure in plain language, and offer retry. Never silently drop records.
- Success: saved amount and updated total are visible and accessible; confirm
  destructive changes and provide a recovery strategy appropriate to the feature.
- Unset goal: invite the user to choose a goal; no invented target or percentage.
- Goal met/exceeded: show the true total without shaming or medical judgments.

## Cow scope
Launch scope is a small number of static cow states tied to explicit progress,
with at most a brief optional celebration. Final illustration, elaborate animation,
sounds, skins, streak pressure, and gamification are deferred. Validate whether the
mascot helps users understand progress before expanding it. Device checks for
contrast, scaling, safe areas, reduced motion, and screen-reader behavior remain
pending; documentation is not evidence of a tested interface.
