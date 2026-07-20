import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../../src/components/EmptyState';
import { Skeleton } from '../../src/components/Skeleton';
import { AppBannerAd } from '../../src/features/ads/AppBannerAd';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { CategoryIcon } from '../../src/features/inventory/CategoryIcon';
import { listCategories, listInventoryItems } from '../../src/features/inventory/api';
import { getProfile } from '../../src/features/profile/api';
import { generateRecipes } from '../../src/features/recipes/api';
import { getLastScan } from '../../src/features/scanner/api';
import { i18n } from '../../src/i18n';
import { colors, spacing } from '../../src/theme';
import { computeDisplayStatus } from '../../src/utils/expiry';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session!.user.id;

  const { data: profile } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
  });
  const { data: lastScan } = useQuery({
    queryKey: ['last-scan', userId],
    queryFn: () => getLastScan(userId),
  });
  const { data: inventory } = useQuery({
    queryKey: ['inventory', userId],
    queryFn: () => listInventoryItems(userId),
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const { data: recipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['recipes', userId],
    queryFn: generateRecipes,
  });

  const categoryById = useMemo(() => {
    const map = new Map((categories ?? []).map((category) => [category.id, category]));
    return map;
  }, [categories]);

  const expiringItems = useMemo(() => {
    return (inventory ?? []).filter((item) => {
      const status = computeDisplayStatus(item.expiry_date, item.status);
      return status === 'expiring_soon' || status === 'expired';
    });
  }, [inventory]);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <Text style={styles.greeting}>
        {profile?.full_name
          ? i18n.t('home.greeting', { name: profile.full_name })
          : i18n.t('home.greetingFallback')}
      </Text>

      <Pressable style={styles.scanButton} onPress={() => router.push('/scanner')}>
        <Ionicons name="camera-outline" size={22} color={colors.white} />
        <Text style={styles.scanButtonText}>{i18n.t('home.scanButton')}</Text>
      </Pressable>

      <View style={styles.quickLinks}>
        <QuickLink
          icon="basket-outline"
          label={i18n.t('tabs.inventory')}
          onPress={() => router.push('/inventory')}
        />
        <QuickLink
          icon="restaurant-outline"
          label={i18n.t('tabs.recipes')}
          onPress={() => router.push('/recipes')}
        />
        <QuickLink
          icon="cart-outline"
          label={i18n.t('shoppingList.title')}
          onPress={() => router.push('/shopping-list')}
        />
      </View>

      <Section title={i18n.t('home.lastScan')}>
        {lastScan ? (
          <Text style={styles.sectionText}>
            {new Date(lastScan.created_at).toLocaleString('it-IT')} ·{' '}
            {i18n.t(`home.scanStatus.${lastScan.status}`)}
          </Text>
        ) : (
          <Text style={styles.sectionText}>{i18n.t('home.noScansYet')}</Text>
        )}
      </Section>

      <Section title={i18n.t('home.expiringSoon')} onViewAll={() => router.push('/inventory')}>
        {expiringItems.length === 0 ? (
          <Text style={styles.sectionText}>{i18n.t('home.noExpiring')}</Text>
        ) : (
          expiringItems.slice(0, 5).map((item) => {
            const category = item.category_id ? categoryById.get(item.category_id) : undefined;
            return (
              <View key={item.id} style={styles.row}>
                {category && <CategoryIcon icon={category.icon} color={colors.warning} size={18} />}
                <Text style={styles.rowText}>{item.name}</Text>
              </View>
            );
          })
        )}
      </Section>

      <Section title={i18n.t('home.recommendedRecipes')} onViewAll={() => router.push('/recipes')}>
        {isLoadingRecipes ? (
          <View style={styles.skeletonLines}>
            <Skeleton width="80%" height={14} />
            <Skeleton width="60%" height={14} />
          </View>
        ) : !recipes || recipes.length === 0 ? (
          <EmptyState icon="restaurant-outline" message={i18n.t('recipes.empty')} />
        ) : (
          recipes.slice(0, 3).map((recipe) => (
            <Pressable
              key={recipe.title}
              style={styles.row}
              onPress={() => router.push('/recipes')}
            >
              <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
              <Text style={styles.rowText}>{recipe.title}</Text>
            </Pressable>
          ))
        )}
      </Section>

      <AppBannerAd />
    </ScrollView>
  );
}

function QuickLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.quickLink} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={styles.quickLinkText}>{label}</Text>
    </Pressable>
  );
}

function Section({
  title,
  onViewAll,
  children,
}: {
  title: string;
  onViewAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onViewAll && (
          <Pressable onPress={onViewAll}>
            <Text style={styles.viewAll}>{i18n.t('home.viewAll')}</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.lg },
  greeting: { fontSize: 24, fontWeight: '700' },
  scanButton: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
  },
  scanButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  quickLinks: { flexDirection: 'row', justifyContent: 'space-between' },
  quickLink: { alignItems: 'center', gap: 4 },
  quickLinkText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionText: { color: colors.textMuted },
  viewAll: { color: colors.primary, fontWeight: '600', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  rowText: { flex: 1 },
  skeletonLines: { gap: 6 },
});
