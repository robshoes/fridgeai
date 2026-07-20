import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../../src/features/auth/AuthProvider';
import {
  deleteInventoryItem,
  getInventoryItem,
  listCategories,
  updateInventoryItem,
} from '../../../src/features/inventory/api';
import {
  InventoryItemForm,
  type InventoryItemFormValues,
} from '../../../src/features/inventory/InventoryItemForm';
import { i18n } from '../../../src/i18n';
import { colors } from '../../../src/theme';
import { showErrorAlert } from '../../../src/utils/network';
import type { UnitFamily } from '../../../src/utils/units';

export default function EditInventoryItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();

  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['inventory-item', id],
    queryFn: () => getInventoryItem(id),
  });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const updateMutation = useMutation({
    mutationFn: (values: InventoryItemFormValues) =>
      updateInventoryItem(id, {
        name: values.name,
        category_id: values.categoryId,
        quantity: values.quantity,
        unit_family: values.unitFamily,
        expiry_date: values.expiryDate,
        expiry_source: values.expirySource,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      await queryClient.invalidateQueries({ queryKey: ['recipes', userId] });
      router.back();
    },
    onError: showErrorAlert,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInventoryItem(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      await queryClient.invalidateQueries({ queryKey: ['recipes', userId] });
      router.back();
    },
    onError: showErrorAlert,
  });

  const handleDelete = () => {
    Alert.alert(i18n.t('inventory.deleteConfirmTitle'), i18n.t('inventory.deleteConfirmMessage'), [
      { text: i18n.t('common.cancel'), style: 'cancel' },
      {
        text: i18n.t('inventory.delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(),
      },
    ]);
  };

  if (isLoadingItem || isLoadingCategories || !item || !categories) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <InventoryItemForm
        key={item.id}
        categories={categories}
        initial={{
          name: item.name,
          categoryId: item.category_id,
          quantity: item.quantity,
          unitFamily: item.unit_family as UnitFamily,
          expiryDate: item.expiry_date,
        }}
        submitLabel={i18n.t('inventory.save')}
        isSubmitting={updateMutation.isPending}
        onSubmit={(values) => updateMutation.mutate(values)}
      />
      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>{i18n.t('inventory.delete')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deleteButton: { alignItems: 'center', paddingVertical: 16 },
  deleteText: { color: colors.danger, fontWeight: '600' },
});
