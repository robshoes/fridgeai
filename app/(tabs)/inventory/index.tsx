import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { EmptyState } from '../../../src/components/EmptyState';
import { Skeleton } from '../../../src/components/Skeleton';
import { AppBannerAd } from '../../../src/features/ads/AppBannerAd';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import {
  deleteInventoryItem,
  listCategories,
  listInventoryItems,
  type Category,
  type InventoryItem,
} from '../../../src/features/inventory/api';
import { CategoryIcon } from '../../../src/features/inventory/CategoryIcon';
import { i18n } from '../../../src/i18n';
import { colors, spacing } from '../../../src/theme';
import { computeDisplayStatus, type InventoryStatus } from '../../../src/utils/expiry';
import { showErrorAlert } from '../../../src/utils/network';
import { formatQuantity, type UnitFamily } from '../../../src/utils/units';

const STATUS_COLOR: Record<InventoryStatus, string> = {
  fresh: colors.primary,
  expiring_soon: colors.warning,
  expired: colors.danger,
  consumed: colors.disabled,
};

export default function InventoryListScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory', userId],
    queryFn: () => listInventoryItems(userId),
  });
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: listCategories });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', userId] }),
    onError: showErrorAlert,
  });

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const category of categories ?? []) {
      map.set(category.id, category);
    }
    return map;
  }, [categories]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, search]);

  const handleDelete = (item: InventoryItem) => {
    Alert.alert(i18n.t('inventory.deleteConfirmTitle'), i18n.t('inventory.deleteConfirmMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('inventory.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.list}>
        <InventoryRowSkeleton />
        <InventoryRowSkeleton />
        <InventoryRowSkeleton />
        <InventoryRowSkeleton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder={i18n.t('inventory.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="basket-outline"
            message={i18n.t('inventory.empty')}
            actionLabel={i18n.t('inventory.addTitle')}
            onAction={() => router.push('/inventory/new')}
          />
        }
        renderItem={({ item }) => {
          const category = item.category_id ? categoryById.get(item.category_id) : undefined;
          const status = computeDisplayStatus(item.expiry_date, item.status);
          return (
            <Pressable style={styles.row} onPress={() => router.push(`/inventory/${item.id}`)}>
              {category && <CategoryIcon icon={category.icon} />}
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSubtitle}>
                  {formatQuantity(item.quantity, item.unit_family as UnitFamily)}
                  {category ? ` · ${category.name}` : ''}
                </Text>
              </View>
              <Text style={[styles.statusBadge, { color: STATUS_COLOR[status] }]}>
                {i18n.t(`inventory.status.${status}`)}
              </Text>
              <Pressable onPress={() => handleDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </Pressable>
            </Pressable>
          );
        }}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/inventory/new')}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
      <AppBannerAd />
    </View>
  );
}

// Shown while the inventory query is loading — mirrors a real row's
// icon + two text lines instead of a bare spinner (Fase 7 design system).
function InventoryRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={20} height={20} borderRadius={10} />
      <View style={[styles.rowText, styles.skeletonLines]}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="35%" height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: {
    margin: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    padding: spacing.md,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 96, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
  },
  rowText: { flex: 1 },
  skeletonLines: { gap: 6 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: colors.textMuted, fontSize: 12 },
  statusBadge: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
