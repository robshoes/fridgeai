import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { resetPasswordForEmail } from '../../src/features/auth/api';
import { authStyles } from '../../src/features/auth/authStyles';
import { i18n } from '../../src/i18n';
import { colors } from '../../src/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setIsSubmitting(false);
    if (error) {
      Alert.alert(i18n.t('common.genericError'), error.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={authStyles.container}>
        <Text style={authStyles.message}>{i18n.t('auth.forgotPassword.sentMessage')}</Text>
        <Link href="/login" style={authStyles.link}>
          <Text>{i18n.t('auth.forgotPassword.backToLogin')}</Text>
        </Link>
      </View>
    );
  }

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>{i18n.t('auth.forgotPassword.title')}</Text>
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.forgotPassword.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable style={authStyles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={authStyles.buttonText}>{i18n.t('auth.forgotPassword.submit')}</Text>
        )}
      </Pressable>
      <Link href="/login" style={authStyles.link}>
        <Text>{i18n.t('auth.forgotPassword.backToLogin')}</Text>
      </Link>
    </View>
  );
}
