/**
 * Mascot contract. BASE STUB: emoji placeholders with the final prop API.
 * The mascot work replaces these with the real SVG cow; keep names and props.
 */
import { Text, View } from 'react-native';

export type CowPose = 'idle' | 'wave' | 'chew' | 'flex' | 'shocked' | 'shrug' | 'dance' | 'sweat' | 'crown' | 'abducted';

export interface CowProps {
  /** Rendered width in points; height follows the artwork's aspect ratio. */
  size?: number;
  pose?: CowPose;
  /**
   * When set (0..1+), the cow can show its see-through "fill" view.
   * `showFill` controls which view is visible; the cross-fade is animated.
   */
  progress?: number;
  showFill?: boolean;
  fillColor?: string;
  /** Head-only crop (used for splash / icon-like spots). */
  headOnly?: boolean;
  accessibilityLabel?: string;
}

export function Cow({ size = 240, accessibilityLabel }: CowProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel ?? 'Moo the cow'} style={{ width: size, height: size * 0.8, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.5 }}>🐮</Text>
    </View>
  );
}

export interface UfoSceneProps {
  size?: number;
  /** When true the beam is on and the cow is lifted and slowly spinning. */
  active?: boolean;
}

/** UFO abducting the cow: used on the setup/loading screen. */
export function UfoScene({ size = 280 }: UfoSceneProps) {
  return (
    <View style={{ width: size, height: size * 1.3, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.3 }}>🛸</Text>
      <Text style={{ fontSize: size * 0.3 }}>🐮</Text>
    </View>
  );
}

export interface SpeechBubbleProps {
  text: string;
}

export function SpeechBubble({ text }: SpeechBubbleProps) {
  return <Text style={{ fontSize: 24, fontWeight: '800' }}>{text}</Text>;
}

export interface ConfettiProps {
  /** Change this value to fire a burst. */
  fireKey: number | string;
}

export function Confetti(_props: ConfettiProps) {
  return null;
}
