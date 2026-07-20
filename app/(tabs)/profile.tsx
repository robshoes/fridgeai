import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { signOut } from '../../src/features/auth/api';
import { useAuth } from '../../src/features/auth/AuthProvider';
import {
  getProfile,
  updateEmail,
  updateFullName,
  type Profile,
} from '../../src/features/profile/api';
import { i18n } from '../../src/i18n';
import { showErrorAlert } from '../../src/utils/network';

export default function ProfileScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
  });

  const handleLogout = () => {
    signOut();
    // The root layout's auth guard redirects to (auth) automatically.
  };

  if (isLoading || !profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t('profile.title')}</Text>
      <ProfileForm
        key={profile.id}
        userId={userId}
        profile={profile}
        authEmail={session!.user.email}
      />
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>{i18n.t('profile.logout')}</Text>
      </Pressable>
    </View>
  );
}

type ProfileFormProps = {
  userId: string;
  profile: Profile;
  authEmail: string | undefined;
};

function ProfileForm({ userId, profile, authEmail }: ProfileFormProps) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [email, setEmail] = useState(authEmail ?? profile.email);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (fullName !== profile.full_name) {
        await updateFullName(userId, fullName);
      }
      if (authEmail && email !== authEmail) {
        await updateEmail(email);
        return { emailChangeRequested: true };
      }
      return { emailChangeRequested: false };
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      Alert.alert(
        result.emailChangeRequested ? i18n.t('profile.emailChangeSent') : i18n.t('profile.saved'),
      );
    },
    onError: showErrorAlert,
  });

  return (
    <>
      <TextInput
        style={styles.input}
        placeholder={i18n.t('profile.fullName')}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder={i18n.t('profile.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <Pressable
        style={styles.button}
        onPress={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
      >
        {saveMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{i18n.t('profile.save')}</Text>
        )}
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#c62828',
    fontWeight: '600',
  },
});
