import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAuth } from '../src/features/auth/AuthProvider';
import {
  addShoppingListItem,
  deleteShoppingListItem,
  listShoppingListItems,
  setShoppingListItemChecked,
  type ShoppingListItem,
} from '../src/features/shopping-list/api';
import { i18n } from '../src/i18n';

export default function ShoppingListScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState('');

  const { data: items } = useQuery({
    queryKey: ['shopping-list', userId],
    queryFn: () => listShoppingListItems(userId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shopping-list', userId] });

  const addMutation = useMutation({
    mutationFn: (name: string) => addShoppingListItem(userId, name),
    onSuccess: ({ added }) => {
      setNewItemName('');
      if (!added) {
        Alert.alert(i18n.t('shoppingList.alreadyPresent'));
      }
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isChecked }: { id: string; isChecked: boolean }) =>
      setShoppingListItemChecked(id, isChecked),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteShoppingListItem(id),
    onSuccess: invalidate,
  });

  const handleAdd = () => {
    const name = newItemName.trim();
    if (!name) return;
    addMutation.mutate(name);
  };

  return (
    <View style={styles.container}>
      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder={i18n.t('shoppingList.addPlaceholder')}
          value={newItemName}
          onChangeText={setNewItemName}
          onSubmitEditing={handleAdd}
        />
        <Pressable style={styles.addButton} onPress={handleAdd} hitSlop={8}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>
      <FlatList
        data={items ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{i18n.t('shoppingList.empty')}</Text>}
        renderItem={({ item }) => (
          <ShoppingListRow
            item={item}
            onToggle={() => toggleMutation.mutate({ id: item.id, isChecked: !item.is_checked })}
            onDelete={() => deleteMutation.mutate(item.id)}
          />
        )}
      />
    </View>
  );
}

function ShoppingListRow({
  item,
  onToggle,
  onDelete,
}: {
  item: ShoppingListItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable style={styles.checkboxRow} onPress={onToggle}>
        <Ionicons
          name={item.is_checked ? 'checkbox' : 'square-outline'}
          size={22}
          color="#2e7d32"
        />
        <Text style={[styles.rowText, item.is_checked && styles.rowTextChecked]}>{item.name}</Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={20} color="#c62828" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, gap: 8 },
  empty: { textAlign: 'center', color: '#666', marginTop: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  rowText: { flex: 1 },
  rowTextChecked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});
