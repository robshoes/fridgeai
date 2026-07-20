import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppBannerAd } from '../../src/features/ads/AppBannerAd';
import { useAuth } from '../../src/features/auth/AuthProvider';
import {
  addFavorite,
  generateRecipes,
  listFavorites,
  removeFavorite,
  type Recipe,
  type RecipeCategory,
  type RecipeDifficulty,
} from '../../src/features/recipes/api';
import { addIngredientsToShoppingList } from '../../src/features/shopping-list/api';
import { i18n } from '../../src/i18n';

const CATEGORY_ICONS: Record<RecipeCategory, React.ComponentProps<typeof Ionicons>['name']> = {
  primo: 'restaurant-outline',
  secondo: 'fast-food-outline',
  contorno: 'leaf-outline',
  insalata: 'nutrition-outline',
  zuppa: 'water-outline',
  dolce: 'ice-cream-outline',
  colazione: 'cafe-outline',
  altro: 'help-circle-outline',
};

const DIFFICULTY_ORDER: RecipeDifficulty[] = ['facile', 'media', 'difficile'];
const TIME_FILTERS = [15, 30, 60];

type ViewMode = 'all' | 'favorites';

export default function RecipesScreen() {
  const { session } = useAuth();
  const userId = session!.user.id;
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>('all');
  const [maxTime, setMaxTime] = useState<number | null>(null);
  const [maxDifficulty, setMaxDifficulty] = useState<RecipeDifficulty | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const {
    data: recipes,
    isLoading: isLoadingRecipes,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['recipes', userId],
    queryFn: generateRecipes,
  });
  const { data: favorites } = useQuery({
    queryKey: ['recipe-favorites', userId],
    queryFn: () => listFavorites(userId),
  });

  const invalidateFavorites = () =>
    queryClient.invalidateQueries({ queryKey: ['recipe-favorites', userId] });

  const addFavoriteMutation = useMutation({
    mutationFn: (recipe: Recipe) => addFavorite(userId, recipe),
    onSuccess: invalidateFavorites,
  });
  const removeFavoriteMutation = useMutation({
    mutationFn: (id: string) => removeFavorite(id),
    onSuccess: invalidateFavorites,
  });

  const favoriteRow = (title: string) =>
    (favorites ?? []).find((favorite) => (favorite.recipe_snapshot as Recipe).title === title);

  const toggleFavorite = (recipe: Recipe) => {
    const existing = favoriteRow(recipe.title);
    if (existing) {
      removeFavoriteMutation.mutate(existing.id);
    } else {
      addFavoriteMutation.mutate(recipe);
    }
  };

  const addMissingMutation = useMutation({
    mutationFn: (recipe: Recipe) => {
      const missingNames = recipe.ingredients
        .filter((ingredient) => !ingredient.have)
        .map((ingredient) => ingredient.name);
      return addIngredientsToShoppingList(userId, missingNames, 'auto_from_recipe');
    },
    onSuccess: ({ addedCount, skippedCount }) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', userId] });
      Alert.alert(
        skippedCount > 0
          ? i18n.t('recipes.addedToShoppingListPartial', {
              added: addedCount,
              skipped: skippedCount,
            })
          : i18n.t('recipes.addedToShoppingList'),
      );
    },
    onError: (error: Error) => Alert.alert(i18n.t('common.genericError'), error.message),
  });

  const filteredRecipes = useMemo(() => {
    if (view === 'favorites') {
      return (favorites ?? []).map((favorite) => favorite.recipe_snapshot as Recipe);
    }
    return (recipes ?? []).filter((recipe) => {
      if (maxTime && recipe.prep_time_minutes > maxTime) return false;
      if (
        maxDifficulty &&
        DIFFICULTY_ORDER.indexOf(recipe.difficulty) > DIFFICULTY_ORDER.indexOf(maxDifficulty)
      ) {
        return false;
      }
      return true;
    });
  }, [view, recipes, favorites, maxTime, maxDifficulty]);

  return (
    <View style={styles.container}>
      <View style={styles.viewToggle}>
        <Pressable
          style={[styles.toggleChip, view === 'all' && styles.toggleChipActive]}
          onPress={() => setView('all')}
        >
          <Text style={[styles.toggleText, view === 'all' && styles.toggleTextActive]}>
            {i18n.t('recipes.all')}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleChip, view === 'favorites' && styles.toggleChipActive]}
          onPress={() => setView('favorites')}
        >
          <Text style={[styles.toggleText, view === 'favorites' && styles.toggleTextActive]}>
            {i18n.t('recipes.favorites')}
          </Text>
        </Pressable>
      </View>

      {view === 'all' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {TIME_FILTERS.map((minutes) => (
            <Pressable
              key={minutes}
              style={[styles.filterChip, maxTime === minutes && styles.filterChipActive]}
              onPress={() => setMaxTime(maxTime === minutes ? null : minutes)}
            >
              <Text style={maxTime === minutes ? styles.filterTextActive : styles.filterText}>
                {i18n.t('recipes.minutes', { count: minutes })}
              </Text>
            </Pressable>
          ))}
          {DIFFICULTY_ORDER.map((difficulty) => (
            <Pressable
              key={difficulty}
              style={[styles.filterChip, maxDifficulty === difficulty && styles.filterChipActive]}
              onPress={() => setMaxDifficulty(maxDifficulty === difficulty ? null : difficulty)}
            >
              <Text
                style={maxDifficulty === difficulty ? styles.filterTextActive : styles.filterText}
              >
                {i18n.t(`recipes.difficulty.${difficulty}`)}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.filterChip} onPress={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.filterText}>{i18n.t('recipes.refresh')}</Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      {view === 'all' && isLoadingRecipes ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(recipe, index) => `${recipe.title}-${index}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {view === 'favorites' ? i18n.t('recipes.favoritesEmpty') : i18n.t('recipes.empty')}
            </Text>
          }
          renderItem={({ item }) => {
            const missingCount = item.ingredients.filter((ingredient) => !ingredient.have).length;
            return (
              <Pressable style={styles.card} onPress={() => setSelectedRecipe(item)}>
                <Ionicons name={CATEGORY_ICONS[item.category]} size={28} color="#2e7d32" />
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>
                    {i18n.t('recipes.minutes', { count: item.prep_time_minutes })} ·{' '}
                    {i18n.t(`recipes.difficulty.${item.difficulty}`)}
                    {missingCount > 0
                      ? ` · ${missingCount} ${i18n.t('recipes.missingIngredients').toLowerCase()}`
                      : ''}
                  </Text>
                </View>
                <Pressable onPress={() => toggleFavorite(item)} hitSlop={8}>
                  <Ionicons
                    name={favoriteRow(item.title) ? 'heart' : 'heart-outline'}
                    size={22}
                    color="#c62828"
                  />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}

      <AppBannerAd />

      <Modal
        visible={selectedRecipe !== null}
        animationType="slide"
        onRequestClose={() => setSelectedRecipe(null)}
      >
        {selectedRecipe && (
          <RecipeDetail
            recipe={selectedRecipe}
            isFavorite={Boolean(favoriteRow(selectedRecipe.title))}
            onToggleFavorite={() => toggleFavorite(selectedRecipe)}
            onAddMissing={() => addMissingMutation.mutate(selectedRecipe)}
            isAddingMissing={addMissingMutation.isPending}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </Modal>
    </View>
  );
}

function RecipeDetail({
  recipe,
  isFavorite,
  onToggleFavorite,
  onAddMissing,
  isAddingMissing,
  onClose,
}: {
  recipe: Recipe;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddMissing: () => void;
  isAddingMissing: boolean;
  onClose: () => void;
}) {
  const missing = recipe.ingredients.filter((ingredient) => !ingredient.have);

  return (
    <ScrollView contentContainerStyle={styles.detailContainer}>
      <Pressable style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} />
      </Pressable>
      <Ionicons name={CATEGORY_ICONS[recipe.category]} size={40} color="#2e7d32" />
      <Text style={styles.detailTitle}>{recipe.title}</Text>
      <Text style={styles.detailSubtitle}>
        {i18n.t('recipes.minutes', { count: recipe.prep_time_minutes })} ·{' '}
        {i18n.t(`recipes.difficulty.${recipe.difficulty}`)}
      </Text>

      <Pressable style={styles.favoriteButton} onPress={onToggleFavorite}>
        <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={20} color="#c62828" />
        <Text style={styles.favoriteButtonText}>
          {isFavorite ? i18n.t('recipes.unsave') : i18n.t('recipes.save')}
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>{i18n.t('recipes.ingredients')}</Text>
      {recipe.ingredients.map((ingredient) => (
        <Text key={ingredient.name} style={styles.ingredientRow}>
          {ingredient.have ? '✓' : '✗'} {ingredient.name}
          {ingredient.note ? ` (${ingredient.note})` : ''}
        </Text>
      ))}

      {missing.length > 0 && (
        <Pressable
          style={styles.addMissingButton}
          onPress={onAddMissing}
          disabled={isAddingMissing}
        >
          {isAddingMissing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addMissingButtonText}>
              {i18n.t('recipes.addMissingToShoppingList')}
            </Text>
          )}
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>{i18n.t('recipes.steps')}</Text>
      {recipe.steps.map((step, index) => (
        <Text key={index} style={styles.stepRow}>
          {index + 1}. {step}
        </Text>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  viewToggle: { flexDirection: 'row', gap: 8, padding: 16 },
  toggleChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e7d32',
  },
  toggleChipActive: { backgroundColor: '#2e7d32' },
  toggleText: { color: '#2e7d32', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  filterRow: { paddingHorizontal: 16, marginBottom: 8, flexGrow: 0 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: '#e8f5e9', borderColor: '#2e7d32' },
  filterText: { color: '#666' },
  filterTextActive: { color: '#2e7d32', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: '#666', marginTop: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 12,
  },
  cardText: { flex: 1 },
  cardTitle: { fontWeight: '600' },
  cardSubtitle: { color: '#666', fontSize: 12 },
  detailContainer: { padding: 24, alignItems: 'center', gap: 8 },
  closeButton: { position: 'absolute', top: 16, right: 16 },
  detailTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  detailSubtitle: { color: '#666' },
  favoriteButton: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 12 },
  favoriteButtonText: { color: '#c62828', fontWeight: '600' },
  sectionTitle: { alignSelf: 'flex-start', fontWeight: '700', fontSize: 16, marginTop: 16 },
  ingredientRow: { alignSelf: 'flex-start' },
  stepRow: { alignSelf: 'flex-start', marginTop: 4 },
  addMissingButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  addMissingButtonText: { color: '#fff', fontWeight: '600' },
});
