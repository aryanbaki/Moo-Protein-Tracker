/** Dev-only gallery: every mascot pose and effect on one scrollable page (/dev/gallery). */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen } from '../../components';
import { ALL_POSES, Confetti, Cow, SpeechBubble, UfoScene } from '../../mascot';
import { colors, spacing } from '../../theme';

const LEVELS = [0, 0.25, 0.6, 1.2];

export default function Gallery() {
  const [progress, setProgress] = useState(0.5);
  const [showFill, setShowFill] = useState(true);
  const [beam, setBeam] = useState(true);
  const [fire, setFire] = useState(0);
  const [bubble, setBubble] = useState(0);
  const [still, setStill] = useState(false);

  const step = (d: number) => setProgress((p) => Math.round(Math.max(0, Math.min(1.2, p + d)) * 100) / 100);
  const words = ['MOO!', 'Got protein?', 'Mooore!'];

  return (
    <View style={styles.root}>
      <Screen scroll style={styles.content}>
        <AppText variant="title">Moo gallery</AppText>
        <AppText variant="caption">Every pose and effect of the mascot. Dev only.</AppText>

        <AppText variant="heading" style={styles.h}>
          Poses
        </AppText>
        <Button title={still ? 'Static poses (Reduce Motion look): on' : 'Static poses (Reduce Motion look): off'} variant="secondary" onPress={() => setStill((s) => !s)} />
        <View style={styles.grid}>
          {ALL_POSES.map((pose) => (
            <View key={pose} style={styles.cell} testID={`pose-${pose}`}>
              <Cow size={168} pose={pose} still={still} accessibilityLabel={`Moo, ${pose} pose`} />
              <AppText variant="label" center>
                {pose}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="heading" style={styles.h}>
          Fill
        </AppText>
        <Card style={styles.center}>
          <View testID="fill-main">
            <Cow size={300} progress={progress} showFill={showFill} still={still} />
          </View>
          <AppText variant="heading" center accessibilityLiveRegion="polite">
            {Math.round(progress * 100)}%
          </AppText>
          <View style={styles.row}>
            <Button title="−10%" variant="secondary" onPress={() => step(-0.1)} accessibilityLabel="Lower the fill by 10 percent" style={styles.flex} />
            <Button title="+10%" variant="secondary" onPress={() => step(0.1)} accessibilityLabel="Raise the fill by 10 percent" style={styles.flex} />
          </View>
          <Button title={showFill ? 'Show the illustrated cow' : 'Show the fill'} onPress={() => setShowFill((s) => !s)} style={styles.wide} />
        </Card>
        <View style={styles.grid}>
          {LEVELS.map((p) => (
            <View key={p} style={styles.cell}>
              <Cow size={168} progress={p} showFill still={still} />
              <AppText variant="label" center>
                {Math.round(p * 100)}%
              </AppText>
            </View>
          ))}
          <View style={styles.cell}>
            <Cow size={168} progress={0.7} showFill fillColor={colors.creatine} still={still} />
            <AppText variant="label" center>
              70%, custom colour
            </AppText>
          </View>
          <View style={styles.cell}>
            <Cow size={130} headOnly progress={0.5} showFill still={still} />
            <AppText variant="label" center>
              head, 50%
            </AppText>
          </View>
        </View>

        <AppText variant="heading" style={styles.h}>
          Head only
        </AppText>
        <View style={styles.grid}>
          {(['idle', 'chew', 'shocked', 'crown'] as const).map((pose) => (
            <View key={pose} style={styles.cell}>
              <Cow size={130} headOnly pose={pose} still={still} />
              <AppText variant="label" center>
                {pose}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="heading" style={styles.h}>
          Speech bubble
        </AppText>
        <View style={styles.speech} testID="speech">
          <View style={styles.bubbleSpot}>
            <SpeechBubble text={words[bubble % words.length] as string} />
          </View>
          <Cow size={150} headOnly />
        </View>
        <Button title="Say something else" variant="secondary" onPress={() => setBubble((b) => b + 1)} />

        <AppText variant="heading" style={styles.h}>
          UFO
        </AppText>
        <View style={styles.center} testID="ufo">
          <UfoScene size={280} active={beam} />
        </View>
        <Button title={beam ? 'Beam off' : 'Beam on'} variant="secondary" onPress={() => setBeam((b) => !b)} />

        <AppText variant="heading" style={styles.h}>
          Confetti
        </AppText>
        <Button title="Fire confetti" onPress={() => setFire((f) => f + 1)} />
        <View style={{ height: spacing.xxl }} />
      </Screen>
      <Confetti fireKey={fire} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md },
  h: { marginTop: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: spacing.lg },
  cell: { alignItems: 'center', gap: spacing.xs, minWidth: 168 },
  center: { alignItems: 'center', gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  flex: { flex: 1 },
  wide: { alignSelf: 'stretch' },
  speech: { alignItems: 'center', paddingTop: 64 },
  bubbleSpot: { position: 'absolute', top: 0, left: '52%' },
});
