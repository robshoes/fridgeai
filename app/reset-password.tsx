import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';

import { authStyles } from '../src/features/auth/authStyles';
import { i18n } from '../src/i18n';
import { supabase } from '../src/services/supabase/client';
import { colors } from '../src/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  // expo-router already parsed the incoming `fridgeai://reset-password?...`
  // link to land here, so its query params are read straight from the route
  // instead of re-subscribing to the Linking 'url' event: that event fires
  // once (to navigate here) before this screen mounts, so a listener added
  // in an effect here always misses it.
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }>();
  // A missing/errored/incomplete link is a plain function of the route
  // params, derived during render rather than synced into state via an
  // effect. A link with only one of the two tokens is just as unusable as
  // one with neither — both must be present to attempt setSession.
  const hasValidTokens = Boolean(params.access_token && params.refresh_token);
  const linkIsInvalid = Boolean(params.error) || !hasValidTokens;

  const [sessionStatus, setSessionStatus] = useState<'pending' | 'ready' | 'failed'>('pending');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!hasValidTokens) {
      return;
    }
    supabase.auth
      .setSession({ access_token: params.access_token!, refresh_token: params.refresh_token! })
      .then(({ error }) => setSessionStatus(error ? 'failed' : 'ready'))
      .catch(() => setSessionStatus('failed'));
  }, [hasValidTokens, params.access_token, params.refresh_token]);

  const status = linkIsInvalid || sessionStatus === 'failed' ? 'invalid' : sessionStatus === 'ready' ? 'ready' : 'verifying';

  const handleSubmit = async () => {
    if (password.length < 6) {
      Alert.alert(i18n.t('common.genericError'), i18n.t('auth.resetPassword.tooShort'));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(i18n.t('common.genericError'), i18n.t('auth.resetPassword.mismatch'));
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);
    if (error) {
      Alert.alert(i18n.t('common.genericError'), error.message);
      return;
    }
    router.replace('/home');
  };

  if (status === 'verifying') {
    return (
      <View style={authStyles.container}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (status === 'invalid') {
    return (
      <View style={authStyles.container}>
        <Text style={authStyles.message}>{i18n.t('auth.resetPassword.invalidLink')}</Text>
        <Pressable style={authStyles.button} onPress={() => router.replace('/forgot-password')}>
          <Text style={authStyles.buttonText}>{i18n.t('auth.resetPassword.requestNewLink')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>{i18n.t('auth.resetPassword.title')}</Text>
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.resetPassword.newPassword')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={authStyles.input}
        placeholder={i18n.t('auth.resetPassword.confirmPassword')}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <Pressable style={authStyles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={authStyles.buttonText}>{i18n.t('auth.resetPassword.submit')}</Text>
        )}
      </Pressable>
    </View>
  );
}
