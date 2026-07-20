import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { signUp } from '../../src/features/auth/api';
import { authStyles } from '../../src/features/auth/authStyles';
import { i18n } from '../../src/i18n';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const { data, error } = await signUp(email.trim(), password, fullName.trim());
    setIsSubmitting(false);
    if (error) {
      Alert.alert(i18n.t('common.genericError'), error.message);
      return;
    }
    if (!data.session) {
      // Email confirmation required before the session becomes active.
      setConfirmationSent(true);
    }
    // Otherwise the root layout's auth guard redirects to (tabs) automatically.
  };

  if (confirmationSent) {
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
      <Text style={authStyles.title}>{i18n.t('auth.register.title')}</Text>
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.register.fullName')}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.register.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.register.password')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={authStyles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={authStyles.buttonText}>{i18n.t('auth.register.submit')}</Text>
        )}
      </Pressable>
      <Link href="/login" style={authStyles.link}>
        <Text>{i18n.t('auth.register.haveAccount')}</Text>
      </Link>
    </View>
  );
}
