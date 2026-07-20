import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { i18n } from '../../i18n';
import { estimateExpiryDate, toDateString } from '../../utils/expiry';
import { baseToDefaultInput, INPUT_UNITS, toBaseUnit, type UnitFamily } from '../../utils/units';
import { CategoryIcon } from './CategoryIcon';
import type { Category } from './api';

export type InventoryItemFormValues = {
  name: string;
  categoryId: string;
  quantity: number;
  unitFamily: UnitFamily;
  expiryDate: string | null;
  expirySource: 'manual' | 'category_estimate' | 'none';
};

export type InventoryItemFormInitial = {
  name: string;
  categoryId: string | null;
  quantity: number;
  unitFamily: UnitFamily;
  expiryDate: string | null;
};

type Props = {
  categories: Category[];
  initial?: InventoryItemFormInitial;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: InventoryItemFormValues) => void;
};

export function InventoryItemForm({
  categories,
  initial,
  submitLabel,
  isSubmitting,
  onSubmit,
}: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const initialInput =
    initial && initial.categoryId ? baseToDefaultInput(initial.quantity, initial.unitFamily) : null;
  const [quantityText, setQuantityText] = useState(initialInput ? String(initialInput.value) : '');
  const [quantityUnit, setQuantityUnit] = useState(initialInput?.unit ?? '');
  const [expiryDateText, setExpiryDateText] = useState(initial?.expiryDate ?? '');
  const [expiryManuallyEdited, setExpiryManuallyEdited] = useState(Boolean(initial?.expiryDate));

  const selectedCategory = categories.find((category) => category.id === categoryId) ?? null;

  const handleSelectCategory = (category: Category) => {
    setCategoryId(category.id);
    const family = category.unit_family as UnitFamily;
    setQuantityUnit(INPUT_UNITS[family][0].value);
    if (!expiryManuallyEdited) {
      const estimated = estimateExpiryDate(category.default_shelf_life_days);
      setExpiryDateText(estimated ? toDateString(estimated) : '');
    }
  };

  const handleSubmit = () => {
    const quantityNumber = Number.parseFloat(quantityText.replace(',', '.'));
    if (!name.trim() || !selectedCategory || Number.isNaN(quantityNumber)) {
      Alert.alert(i18n.t('inventory.validationError'));
      return;
    }
    const family = selectedCategory.unit_family as UnitFamily;
    const quantity = toBaseUnit(quantityNumber, quantityUnit, family);
    const expirySource: InventoryItemFormValues['expirySource'] = expiryDateText
      ? expiryManuallyEdited
        ? 'manual'
        : 'category_estimate'
      : 'none';

    onSubmit({
      name: name.trim(),
      categoryId: selectedCategory.id,
      quantity,
      unitFamily: family,
      expiryDate: expiryDateText || null,
      expirySource,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{i18n.t('inventory.name')}</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>{i18n.t('inventory.category')}</Text>
      <View style={styles.chipRow}>
        {categories.map((category) => (
          <Pressable
            key={category.id}
            style={[styles.chip, category.id === categoryId && styles.chipSelected]}
            onPress={() => handleSelectCategory(category)}
          >
            <CategoryIcon
              icon={category.icon}
              color={category.id === categoryId ? '#fff' : '#2e7d32'}
            />
            <Text style={[styles.chipText, category.id === categoryId && styles.chipTextSelected]}>
              {category.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{i18n.t('inventory.quantity')}</Text>
      <View style={styles.quantityRow}>
        <TextInput
          style={[styles.input, styles.quantityInput]}
          keyboardType="decimal-pad"
          value={quantityText}
          onChangeText={setQuantityText}
          editable={Boolean(selectedCategory)}
        />
        <View style={styles.chipRow}>
          {selectedCategory &&
            INPUT_UNITS[selectedCategory.unit_family as UnitFamily].map((unit) => (
              <Pressable
                key={unit.value}
                style={[styles.chip, unit.value === quantityUnit && styles.chipSelected]}
                onPress={() => setQuantityUnit(unit.value)}
              >
                <Text
                  style={[styles.chipText, unit.value === quantityUnit && styles.chipTextSelected]}
                >
                  {unit.label}
                </Text>
              </Pressable>
            ))}
        </View>
      </View>

      <Text style={styles.label}>{i18n.t('inventory.expiryDate')}</Text>
      <TextInput
        style={styles.input}
        placeholder="AAAA-MM-GG"
        value={expiryDateText}
        onChangeText={(text) => {
          setExpiryDateText(text);
          setExpiryManuallyEdited(true);
        }}
      />

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 8,
  },
  label: {
    fontWeight: '600',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#2e7d32',
  },
  chipText: {
    color: '#2e7d32',
  },
  chipTextSelected: {
    color: '#fff',
  },
  quantityRow: {
    gap: 8,
  },
  quantityInput: {
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
