import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRewardedAd } from '../../../src/features/ads/useRewardedAd';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import { useOnline } from '../../../src/features/network/NetworkProvider';
import {
  analyzeScan,
  createScan,
  getScanUsageToday,
  grantScanBonus,
  uploadScanPhoto,
} from '../../../src/features/scanner/api';
import { usePulseAnimation } from '../../../src/hooks/usePulseAnimation';
import { i18n } from '../../../src/i18n';
import { track } from '../../../src/services/analytics';
import { colors, spacing } from '../../../src/theme';
import { isNetworkError } from '../../../src/utils/network';

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { show: showRewardedAd } = useRewardedAd();
  const pulseOpacity = usePulseAnimation();
  const isOnline = useOnline();

  const { data: usage } = useQuery({
    queryKey: ['scan-usage', userId],
    queryFn: () => getScanUsageToday(userId),
  });
  const invalidateUsage = () => queryClient.invalidateQueries({ queryKey: ['scan-usage', userId] });

  // PRD: camera permission is requested here (first real use of the
  // Scanner), not during onboarding — auto-trigger the OS prompt only the
  // very first time (status undetermined); a prior denial shows our own
  // explanation + settings/gallery fallback instead of re-prompting.
  useEffect(() => {
    if (permission?.status === 'undetermined') {
      requestPermission();
    }
  }, [permission?.status, requestPermission]);

  const handlePhoto = async (localUri: string) => {
    // PRD Fase 6: no AI action allowed offline — check before spending an
    // upload attempt, instead of just letting it fail partway through.
    if (!isOnline) {
      Alert.alert(i18n.t('common.networkError'));
      return;
    }
    setIsProcessing(true);
    try {
      const imagePath = await uploadScanPhoto(userId, localUri);
      const scan = await createScan(userId, imagePath);
      await runAnalysis(scan.id);
    } catch (error) {
      if (isNetworkError(error)) {
        Alert.alert(i18n.t('common.networkError'));
      } else {
        Alert.alert(i18n.t('common.genericError'), error instanceof Error ? error.message : '');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const runAnalysis = async (scanId: string): Promise<void> => {
    const result = await analyzeScan(scanId);
    invalidateUsage();
    if ('rateLimited' in result) {
      const unlockedMore = await promptRateLimited(result.dailyLimit);
      if (unlockedMore) {
        return runAnalysis(scanId);
      }
      return;
    }
    track('scan_completed', { itemCount: result.items.length });
    router.push(`/scanner/${scanId}`);
  };

  // PRD §Monetizzazione pubblicitaria: watching a rewarded ad grants +5
  // scans (capped at 2/day, enforced by the scan_bonus_grants RLS policy
  // — grantScanBonus below simply fails once that cap is hit).
  const promptRateLimited = (dailyLimit: number): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        i18n.t('scanner.rateLimited.title'),
        i18n.t('scanner.rateLimited.message', { limit: dailyLimit }),
        [
          {
            text: i18n.t('scanner.rateLimited.tryTomorrow'),
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: i18n.t('scanner.rateLimited.watchAd'),
            onPress: async () => {
              try {
                const adResult = await showRewardedAd();
                if (!adResult.earnedReward) {
                  resolve(false);
                  return;
                }
                await grantScanBonus(userId);
                invalidateUsage();
                resolve(true);
              } catch (error) {
                if (isNetworkError(error)) {
                  Alert.alert(i18n.t('common.networkError'));
                } else {
                  Alert.alert(
                    i18n.t('common.genericError'),
                    error instanceof Error ? error.message : '',
                  );
                }
                resolve(false);
              }
            },
          },
        ],
      );
    });
  };

  const handleCapture = async () => {
    const photo = await cameraRef.current?.takePictureAsync();
    if (photo) {
      await handlePhoto(photo.uri);
    }
  };

  const handlePickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) {
      await handlePhoto(result.assets[0].uri);
    }
  };

  if (isProcessing) {
    return (
      <View style={styles.centered}>
        <AnimatedIonicons
          name="sparkles-outline"
          size={40}
          color={colors.primary}
          style={{ opacity: pulseOpacity }}
        />
        <ActivityIndicator size="large" />
        <Text style={styles.processingText}>{i18n.t('scanner.analyzing')}</Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permissionText}>{i18n.t('scanner.permissionExplanation')}</Text>
        <Pressable
          style={styles.button}
          onPress={permission.canAskAgain ? requestPermission : () => Linking.openSettings()}
        >
          <Text style={styles.buttonText}>
            {permission.canAskAgain
              ? i18n.t('scanner.grantPermission')
              : i18n.t('scanner.openSettings')}
          </Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handlePickFromGallery}>
          <Text style={styles.secondaryButtonText}>{i18n.t('scanner.pickFromGallery')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} />
      {usage && (
        <Text style={[styles.usageBadge, { top: insets.top + spacing.lg }]}>
          {i18n.t('scanner.remaining', { count: Math.max(usage.limit - usage.used, 0) })}
        </Text>
      )}
      <View style={styles.controls}>
        <Pressable style={styles.galleryButton} onPress={handlePickFromGallery}>
          <Ionicons name="images-outline" size={28} color={colors.white} />
        </Pressable>
        <Pressable style={styles.captureButton} onPress={handleCapture} />
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  camera: { flex: 1 },
  usageBadge: {
    position: 'absolute',
    top: spacing.lg,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: colors.white,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  processingText: { color: colors.textMuted },
  permissionText: { textAlign: 'center', fontSize: 16 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.white, fontWeight: '600' },
  secondaryButton: { paddingVertical: spacing.sm },
  secondaryButtonText: { color: colors.primary, fontWeight: '600' },
  controls: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    borderWidth: 4,
    borderColor: colors.borderStrong,
  },
  galleryButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: { width: 48 },
});
