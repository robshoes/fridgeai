import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EmptyState } from '../../../src/components/EmptyState';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import {
  listCategories,
  createInventoryItem,
  type Category,
} from '../../../src/features/inventory/api';
import { CategoryIcon } from '../../../src/features/inventory/CategoryIcon';
import {
  listScanItems,
  updateScanItemStatus,
  type ScanItem,
} from '../../../src/features/scanner/api';
import { i18n } from '../../../src/i18n';
import { track } from '../../../src/services/analytics';
import { colors, spacing } from '../../../src/theme';
import { estimateExpiryDate, toDateString } from '../../../src/utils/expiry';
import { showErrorAlert } from '../../../src/utils/network';
import { formatQuantity, type UnitFamily } from '../../../src/utils/units';

type Row = {
  scanItemId: string;
  name: string;
  categoryId: string | null;
  quantity: number;
  unitFamily: UnitFamily;
  confidence: number;
  included: boolean;
  edited: boolean;
};

export default function ScanResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();

  const { data: scanItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['scan-items', scanId],
    queryFn: () => listScanItems(scanId),
  });
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  if (isLoadingItems || isLoadingCategories || !scanItems || !categories) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (scanItems.length === 0) {
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="search-outline"
          message={i18n.t('scanner.results.noItemsFound')}
          actionLabel={i18n.t('scanner.results.retry')}
          onAction={() => router.replace('/scanner')}
        />
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/inventory/new')}>
          <Text style={styles.secondaryButtonText}>{i18n.t('scanner.results.addManually')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ResultsList
      scanId={scanId}
      userId={userId}
      scanItems={scanItems}
      categories={categories}
      onDone={() => {
        queryClient.invalidateQueries({ queryKey: ['inventory', userId] });
        queryClient.invalidateQueries({ queryKey: ['recipes', userId] });
        router.replace('/inventory');
      }}
    />
  );
}

function ResultsList({
  scanId,
  userId,
  scanItems,
  categories,
  onDone,
}: {
  scanId: string;
  userId: string;
  scanItems: ScanItem[];
  categories: Category[];
  onDone: () => void;
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    scanItems.map((item) => ({
      scanItemId: item.id,
      name: item.detected_name,
      categoryId: item.category_id,
      quantity: item.quantity_estimate,
      unitFamily: item.unit_family as UnitFamily,
      confidence: item.confidence,
      included: true,
      edited: false,
    })),
  );

  const confirmMutation = useMutation({
    mutationFn: async () => {
      for (const row of rows) {
        if (!row.included) {
          await updateScanItemStatus(row.scanItemId, 'rejected');
          continue;
        }

        const category = categories.find((c) => c.id === row.categoryId) ?? null;
        const estimated = category ? estimateExpiryDate(category.default_shelf_life_days) : null;

        await createInventoryItem({
          user_id: userId,
          name: row.name,
          category_id: row.categoryId,
          quantity: row.quantity,
          unit_family: row.unitFamily,
          expiry_date: estimated ? toDateString(estimated) : null,
          expiry_source: estimated ? 'category_estimate' : 'none',
          source_scan_id: scanId,
        });
        track('inventory_item_confirmed', { source: 'scan' });
        await updateScanItemStatus(row.scanItemId, row.edited ? 'edited' : 'confirmed');
      }
    },
    onSuccess: onDone,
    onError: showErrorAlert,
  });

  const includedCount = rows.filter((row) => row.included).length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.list}>
        {rows.map((row, index) => {
          const category = categories.find((c) => c.id === row.categoryId);
          const isLowConfidence = row.confidence < 0.7;
          return (
            <View
              key={row.scanItemId}
              style={[
                styles.card,
                isLowConfidence && styles.cardLowConfidence,
                !row.included && styles.cardExcluded,
              ]}
            >
              <View style={styles.cardHeader}>
                {category && <CategoryIcon icon={category.icon} />}
                <TextInput
                  style={styles.nameInput}
                  value={row.name}
                  editable={row.included}
                  onChangeText={(text) =>
                    setRows((prev) =>
                      prev.map((r, i) => (i === index ? { ...r, name: text, edited: true } : r)),
                    )
                  }
                />
                <Pressable
                  onPress={() =>
                    setRows((prev) =>
                      prev.map((r, i) => (i === index ? { ...r, included: !r.included } : r)),
                    )
                  }
                  hitSlop={8}
                >
                  <Ionicons
                    name={row.included ? 'close-circle-outline' : 'add-circle-outline'}
                    size={22}
                    color={row.included ? colors.danger : colors.primary}
                  />
                </Pressable>
              </View>
              <Text style={styles.quantityText}>
                {formatQuantity(row.quantity, row.unitFamily)}
                {category ? ` · ${category.name}` : ''}
              </Text>
              {isLowConfidence && (
                <Text style={styles.lowConfidenceBadge}>
                  {i18n.t('scanner.results.lowConfidence')}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
      <Pressable
        style={styles.confirmButton}
        onPress={() => confirmMutation.mutate()}
        disabled={confirmMutation.isPending || includedCount === 0}
      >
        {confirmMutation.isPending ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.confirmButtonText}>{i18n.t('scanner.results.confirm')}</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  secondaryButton: { paddingVertical: spacing.sm },
  secondaryButtonText: { color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  cardLowConfidence: { borderColor: colors.warning },
  cardExcluded: { opacity: 0.4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  nameInput: { flex: 1, fontWeight: '600' },
  quantityText: { color: colors.textMuted, fontSize: 12 },
  lowConfidenceBadge: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.lg,
    alignItems: 'center',
    margin: spacing.lg,
  },
  confirmButtonText: { color: colors.white, fontWeight: '600', fontSize: 16 },
});
