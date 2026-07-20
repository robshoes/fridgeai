import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboarding } from '../../src/features/onboarding/storage';
import { i18n } from '../../src/i18n';
import { colors, spacing, typography } from '../../src/theme';

export default function OnboardingScreen() {
  const { markSeen } = useOnboarding();

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>{i18n.t('common.appName')}</Text>
      <Text style={styles.description}>{i18n.t('onboarding.description')}</Text>
      <Pressable style={styles.button} onPress={markSeen}>
        <Text style={styles.buttonText}>{i18n.t('onboarding.start')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    fontSize: 28,
  },
  description: {
    textAlign: 'center',
    ...typography.body,
    marginBottom: spacing.xl,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxl,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
});
