import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { signIn } from '../../src/features/auth/api';
import { authStyles } from '../../src/features/auth/authStyles';
import { i18n } from '../../src/i18n';
import { colors } from '../../src/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setIsSubmitting(false);
    if (error) {
      Alert.alert(i18n.t('common.genericError'), error.message);
    }
    // On success the root layout's auth guard redirects to (tabs) automatically.
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>{i18n.t('auth.login.title')}</Text>
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.login.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.login.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={authStyles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={authStyles.buttonText}>{i18n.t('auth.login.submit')}</Text>
        )}
      </Pressable>
      <Link href="/register" style={authStyles.link}>
        <Text>{i18n.t('auth.login.noAccount')}</Text>
      </Link>
      <Link href="/forgot-password" style={authStyles.link}>
        <Text>{i18n.t('auth.login.forgotPassword')}</Text>
      </Link>
    </View>
  );
}
