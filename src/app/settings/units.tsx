import { View } from 'react-native';

import { OptionCard } from '../../components';
import { SettingsScreen } from '../../features/settings/ui';
import { useProfile } from '../../state/profile';
import { spacing } from '../../theme';

export default function UnitsSettings() {
  const units = useProfile((s) => s.units);
  const setUnits = useProfile((s) => s.setUnits);
  return (
    <SettingsScreen title="Units">
      <View accessibilityRole="radiogroup" style={{ gap: spacing.sm }}>
        <OptionCard title="Imperial" subtitle="lb · ft" emoji="🇺🇸" selected={units === 'imperial'} onPress={() => setUnits('imperial')} />
        <OptionCard title="Metric" subtitle="kg · cm" emoji="🌍" selected={units === 'metric'} onPress={() => setUnits('metric')} />
      </View>
    </SettingsScreen>
  );
}
