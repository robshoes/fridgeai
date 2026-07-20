import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

type Props = {
  icon: ComponentProps<typeof Ionicons>['name'];
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Shared look for every "nothing here yet" case (PRD Fase 6: empty
// states consistent across screens) — inventory, recipes, shopping list.
export function EmptyState({ icon, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.borderStrong} />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Pressable style={styles.button} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    gap: spacing.md,
  },
  message: {
    textAlign: 'center',
    color: colors.textMuted,
  },
  button: {
    marginTop: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
