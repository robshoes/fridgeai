import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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
import { computeDisplayStatus, type InventoryStatus } from '../../../src/utils/expiry';
import { formatQuantity, type UnitFamily } from '../../../src/utils/units';

const STATUS_COLOR: Record<InventoryStatus, string> = {
  fresh: '#2e7d32',
  expiring_soon: '#f9a825',
  expired: '#c62828',
  consumed: '#9e9e9e',
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
    onError: (error: Error) => Alert.alert(i18n.t('common.genericError'), error.message),
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
      <View style={styles.centered}>
        <ActivityIndicator />
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
        ListEmptyComponent={<Text style={styles.empty}>{i18n.t('inventory.empty')}</Text>}
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
                <Ionicons name="trash-outline" size={20} color="#c62828" />
              </Pressable>
            </Pressable>
          );
        }}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/inventory/new')}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  search: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 96, gap: 12 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontWeight: '600' },
  rowSubtitle: { color: '#666', fontSize: 12 },
  statusBadge: { fontSize: 12, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
