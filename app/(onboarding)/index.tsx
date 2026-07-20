import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useOnboarding } from '../../src/features/onboarding/storage';
import { i18n } from '../../src/i18n';

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
    padding: 24,
    gap: 12,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
