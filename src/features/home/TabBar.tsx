import { router, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, shadow, spacing } from '../../theme';
import { useAddSheet } from './addSheetStore';
import { tapHaptic } from './haptics';
import { Icon, type IconName } from './icons';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const ICONS: Record<string, IconName> = { index: 'home', progress: 'chart', settings: 'gear' };
const ADD = 56;

/**
 * Icon-only tab bar with the add button inside it, so nothing floats over the list.
 * Each tab keeps its title as the screen-reader label.
 */
export function TabBar({ state, descriptors, navigateToTab, insets }: TabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const title = descriptors[route.key]?.options.title ?? route.name;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                if (!focused) navigateToTab(route.key);
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              style={styles.tab}
              testID={`tab-${route.name}`}
            >
              <View style={[styles.tabPill, focused ? styles.tabPillOn : null]}>
                <Icon name={ICONS[route.name] ?? 'home'} size={26} color={focused ? colors.primaryDark : colors.textSecondary} />
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => {
          tapHaptic();
          if (state.routes[state.index]?.name !== 'index') router.navigate('/');
          useAddSheet.getState().setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add food"
        style={({ pressed }) => [styles.add, pressed ? { transform: [{ scale: 0.94 }] } : null]}
        testID="fab"
      >
        <Icon name="plus" size={28} color={colors.textOnPrimary} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.md + 4,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabs: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  tab: { flex: 1, minHeight: ADD, alignItems: 'center', justifyContent: 'center' },
  tabPill: { width: 60, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  tabPillOn: { backgroundColor: colors.primarySoft },
  add: { width: ADD, height: ADD, borderRadius: ADD / 2, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center', ...shadow.card },
});
