import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../../../src/features/auth/AuthProvider';
import { createInventoryItem, listCategories } from '../../../src/features/inventory/api';
import {
  InventoryItemForm,
  type InventoryItemFormValues,
} from '../../../src/features/inventory/InventoryItemForm';
import { i18n } from '../../../src/i18n';

export default function NewInventoryItemScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  const createMutation = useMutation({
    mutationFn: (values: InventoryItemFormValues) =>
      createInventoryItem({
        user_id: userId,
        name: values.name,
        category_id: values.categoryId,
        quantity: values.quantity,
        unit_family: values.unitFamily,
        expiry_date: values.expiryDate,
        expiry_source: values.expirySource,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
      router.back();
    },
  });

  if (isLoading || !categories) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <InventoryItemForm
      categories={categories}
      submitLabel={i18n.t('inventory.save')}
      isSubmitting={createMutation.isPending}
      onSubmit={(values) => createMutation.mutate(values)}
    />
  );
}
