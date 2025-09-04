import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  RefreshControl,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Meal } from "../../../types/types";
import { useTheme } from "../../../context/ThemeContext";
import { dietaryFilterOptionsEnhanced, cuisineFilterOptionsEnhanced } from "../../../constants/dietaryOptions";
import { useRouter } from "expo-router";  // Import Expo Router hook
import BottomNav from "components/bottomNav";
import { supabase } from "utils/supabase";
import { cachedDataService } from "utils/cachedDataService";
import { isSmallScreen, responsiveFontSizes } from "../../../utils/responsiveUtils";

interface MyMealsProps {
  onCreateMeal: () => void;
}

const MyMeals: React.FC<MyMealsProps> = React.memo(({ onCreateMeal}) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [filteredMealsReady, setFilteredMealsReady] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filters, setFilters] = useState<{ type: string; greaterThan: string; lessThan: string }[]>([
    { type: "calories", greaterThan: "", lessThan: "" },
    { type: "fat", greaterThan: "", lessThan: "" },
    { type: "protein", greaterThan: "", lessThan: "" },
    { type: "carbohydrates", greaterThan: "", lessThan: "" },
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isCreateMealModalVisible, setIsCreateMealModalVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<{ type: string; greaterThan: string; lessThan: string }[]>([
    { type: "calories", greaterThan: "", lessThan: "" },
    { type: "fat", greaterThan: "", lessThan: "" },
    { type: "protein", greaterThan: "", lessThan: "" },
    { type: "carbohydrates", greaterThan: "", lessThan: "" },
  ]);
  const [dietaryRestrictionFilter, setDietaryRestrictionFilter] = useState<string>("");
  const [aiFilter, setAiFilter] = useState<string>("");
  const [tempDietaryRestrictionFilter, setTempDietaryRestrictionFilter] = useState<string>(dietaryRestrictionFilter);
  const [tempAiFilter, setTempAiFilter] = useState<string>(aiFilter);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [cuisineFilter, setCuisineFilter] = useState<string>("");
  const [tempCuisineFilter, setTempCuisineFilter] = useState<string>(cuisineFilter);
  const [favoriteLoading, setFavoriteLoading] = useState<{ [key: string]: boolean }>({});
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [isFilterModalLoading, setIsFilterModalLoading] = useState(false);
  const [isFilterButtonLoading, setIsFilterButtonLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMoreMeals, setHasMoreMeals] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const MEALS_PER_PAGE = 20; // Load 20 meals at a time

  // Animation values for fast modal transitions
  const modalOpacity = useState(new Animated.Value(0))[0];
  const modalScale = useState(new Animated.Value(0.8))[0];
  const filterModalOpacity = useState(new Animated.Value(0))[0];
  const filterModalTranslateY = useState(new Animated.Value(300))[0];

  const isFilterActive =
    aiFilter !== "" ||
    dietaryRestrictionFilter !== "" ||
    cuisineFilter !== "" ||
    filters.some(f => f.greaterThan !== "" || f.lessThan !== "");

  const { theme } = useTheme();
  const router = useRouter(); // Initialize router

  const getCurrentUserId = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw new Error("Authentication required. Please log in again.");
      }
      return data.user.id;
    } catch (error: any) {
      console.error("Error getting user ID:", error);
      setError(error.message || "Authentication error");
      return null;
    }
  }, []);

  // Optimized modal handlers with smooth fast animations
  const openCreateMealModal = useCallback(() => {
    setIsCreateMealModalVisible(true);
    // Start animation immediately after state update
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200, // Smooth and responsive
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 300, // Balanced for smooth motion
          friction: 10, // Smooth damping
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [modalOpacity, modalScale]);

  const closeCreateMealModal = useCallback(() => {
    // Fast but smooth animation for closing
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150, // Quick but not jarring
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsCreateMealModalVisible(false);
    });
  }, [modalOpacity, modalScale]);

  // Fast filter modal handlers
  const openFilterModal = useCallback(() => {
    setIsFilterButtonLoading(true);
    setIsFilterModalLoading(true);
    
    // Pre-set temp filters immediately to avoid delay
    setTempAiFilter(aiFilter);
    setTempDietaryRestrictionFilter(dietaryRestrictionFilter);
    setTempCuisineFilter(cuisineFilter);
    
    // Use immediate modal visibility with pre-animated state
    setIsFilterModalVisible(true);
    setIsFilterModalLoading(false);
    setIsFilterButtonLoading(false);
    
    // Start animation immediately - no requestAnimationFrame delay
    Animated.parallel([
      Animated.timing(filterModalOpacity, {
        toValue: 1,
        duration: 150, // Faster animation
        useNativeDriver: true,
      }),
      Animated.spring(filterModalTranslateY, {
        toValue: 0,
        tension: 300, // Faster spring
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [aiFilter, dietaryRestrictionFilter, cuisineFilter, filterModalOpacity, filterModalTranslateY]);

  const closeFilterModal = useCallback(() => {
    // Smooth slide down animation
    Animated.parallel([
      Animated.timing(filterModalOpacity, {
        toValue: 0,
        duration: 200, // Smooth close
        useNativeDriver: true,
      }),
      Animated.timing(filterModalTranslateY, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsFilterModalVisible(false);
      setIsFilterButtonLoading(false);
      setIsFilterModalLoading(false);
    });
  }, [filterModalOpacity, filterModalTranslateY]);

  const navigateToManualCreate = useCallback(() => {
    closeCreateMealModal();
    router.push("/my-meals/create");
  }, [router, closeCreateMealModal]);

  const navigateToAICreate = useCallback(() => {
    closeCreateMealModal();
    router.push("../AI/AICreateMeal");
  }, [router, closeCreateMealModal]);

  const navigateToURLCreate = useCallback(() => {
    closeCreateMealModal();
    router.push("./url-create");
  }, [router, closeCreateMealModal]);

  // Memoized modal header for better performance
  const modalHeader = useMemo(() => (
    <View style={styles.modalHeader}>
      <Text style={[styles.modalTitle, { color: theme.text }]}>Create New Meal</Text>
      <Pressable
        style={({ pressed }) => [
          styles.modalCloseButton,
          { opacity: pressed ? 0.6 : 1 }
        ]}
        onPress={closeCreateMealModal}
      >
        <Ionicons name="close" size={24} color={theme.subtext} />
      </Pressable>
    </View>
  ), [theme.text, theme.subtext, closeCreateMealModal]);

  // Memoized modal content for better performance
  const modalButtons = useMemo(() => (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.modalButton, 
          { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
        ]}
        onPress={navigateToManualCreate}
      >
        <Ionicons name="create-outline" size={24} color={theme.buttonText} />
        <View style={styles.modalButtonContent}>
          <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>Manual Entry</Text>
          <Text style={[styles.modalButtonSubtext, { color: theme.buttonText, opacity: 0.8 }]}>
            Enter meal details yourself
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.buttonText} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.modalButton, 
          { backgroundColor: theme.aiAccent, opacity: pressed ? 0.8 : 1 }
        ]}
        onPress={navigateToAICreate}
      >
        <Ionicons name="sparkles" size={24} color={theme.buttonText} />
        <View style={styles.modalButtonContent}>
          <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>AI Generated</Text>
          <Text style={[styles.modalButtonSubtext, { color: theme.buttonText, opacity: 0.8 }]}>
            Let AI create a meal for you
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.buttonText} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.modalButton, 
          { backgroundColor: theme.info, opacity: pressed ? 0.8 : 1 }
        ]}
        onPress={navigateToURLCreate}
      >
        <Ionicons name="link-outline" size={24} color={theme.buttonText} />
        <View style={styles.modalButtonContent}>
          <Text style={[styles.modalButtonText, { color: theme.buttonText }]}>From URL</Text>
          <Text style={[styles.modalButtonSubtext, { color: theme.buttonText, opacity: 0.8 }]}>
            Import from recipe website
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.buttonText} />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.cancelButton, 
          { 
            backgroundColor: theme.background, 
            borderColor: theme.border,
            opacity: pressed ? 0.8 : 1 
          }
        ]}
        onPress={closeCreateMealModal}
      >
        <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
      </Pressable>
    </>
  ), [theme, navigateToManualCreate, navigateToAICreate, navigateToURLCreate, closeCreateMealModal]);

  const toggleFavorite = async (mealId: number | string) => {
    if (favoriteLoading[mealId]) return; // Prevent multiple toggles
    
    // Skip toggle for macro meals (they don't have favorite status in database)
    if (typeof mealId === 'string' && mealId.startsWith('macro_')) {
      return;
    }
    
    try {
      setFavoriteLoading(prev => ({ ...prev, [mealId]: true }));
      setError(null);
      
      // Find current meal
      const currentMeal = meals.find(meal => meal.id === mealId);
      if (!currentMeal) {
        throw new Error("Meal not found");
      }
      
      const newFavoriteStatus = !currentMeal.favorite;
      
      // Optimistic update
      const updatedMeals = meals.map(meal => 
        meal.id === mealId 
          ? { ...meal, favorite: newFavoriteStatus }
          : meal
      );
      setMeals(updatedMeals);
      
      const { error } = await supabase
        .from("meals")
        .update({ favorite: newFavoriteStatus })
        .eq("id", mealId);

      if (error) {
        // Revert optimistic update on error
        const revertedMeals = meals.map(meal => 
          meal.id === mealId 
            ? { ...meal, favorite: currentMeal.favorite }
            : meal
        );
        setMeals(revertedMeals);
        throw new Error(error.message || "Failed to update favorite status");
      }
    } catch (error: any) {
      console.error("Error toggling favorite status:", error);
      const errorMessage = error.message || "Failed to update favorite status. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [mealId]: false }));
    }
  };

  const restoreFiltersAndFetchMeals = useCallback(async () => {
    try {
      setError(null);
      
      // Restore filters from AsyncStorage - optimized for navigation speed
      const user = await supabase.auth.getUser();
      const userId = user.data?.user?.id;
      if (!userId) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Parallel AsyncStorage reads with timeout for faster navigation
      const storagePromises = [
        AsyncStorage.getItem(`filters_MyMeals_${userId}`),
        AsyncStorage.getItem(`searchQuery_MyMeals_${userId}`),
        AsyncStorage.getItem(`dietaryRestrictionFilter_MyMeals_${userId}`),
        AsyncStorage.getItem(`aiFilter_MyMeals_${userId}`),
        AsyncStorage.getItem(`cuisineFilter_MyMeals_${userId}`)
      ];

      // Race condition: Don't wait more than 200ms for filter restoration
      const storageResults = await Promise.race([
        Promise.all(storagePromises),
        new Promise<string[]>(resolve => setTimeout(() => resolve(['', '', '', '', '']), 200))
      ]);

      const [savedFilters, savedSearchQuery, savedDietary, savedAi, savedCuisine] = storageResults;

      // Apply restored filters quickly
      if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters);
          setFilters(parsedFilters);
          setTempFilters(parsedFilters);
        } catch (parseError) {
          console.warn('Filter parsing failed, using defaults');
        }
      }
      if (savedSearchQuery) setSearchQuery(savedSearchQuery);
      if (savedDietary !== null) setDietaryRestrictionFilter(savedDietary);
      if (savedAi !== null) setAiFilter(savedAi);
      if (savedCuisine !== null) setCuisineFilter(savedCuisine);

      setFiltersLoaded(true);
      // Reset filtered meals ready state when filters change
      setFilteredMealsReady(false);
    } catch (error: any) {
      console.error("Error restoring filters:", error);
      const errorMessage = error.message || "Failed to restore filters";
      setError(errorMessage);
      setFiltersLoaded(true); // Still allow the component to proceed
    }
  }, []);

  useEffect(() => {
    // Optimize navigation speed by deferring heavy operations
    const timer = setTimeout(() => {
      restoreFiltersAndFetchMeals();
    }, 50); // Reduced from 100ms to 50ms
    
    return () => clearTimeout(timer);
  }, [restoreFiltersAndFetchMeals]);

  // Initialize animation values for optimal performance
  useEffect(() => {
    modalOpacity.setValue(0);
    modalScale.setValue(0.8);
    filterModalOpacity.setValue(0);
    filterModalTranslateY.setValue(300);
  }, [modalOpacity, modalScale, filterModalOpacity, filterModalTranslateY]);

  const fetchMyMeals = useCallback(async (isRefresh = false, loadMore = false) => {
    if (!filtersLoaded) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
        setCurrentPage(0);
        setHasMoreMeals(true);
      } else if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }
      
      if (!loadMore) {
        setFilteredMealsReady(false);
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("Authentication required. Please log in again.");
      }

      // Use cached data service for initial load, Supabase for filtered/paginated loads
      let useCache = !loadMore && !dietaryRestrictionFilter && !aiFilter && !cuisineFilter;
      const pageToLoad = loadMore ? currentPage + 1 : 0;
      
      let newMeals = [];
      
      if (useCache) {
        // Try to get cached meals first
        try {
          newMeals = await cachedDataService.getUserMeals(userId);
          console.log(`📱 Loaded ${newMeals.length} meals from cache`);
        } catch (error) {
          console.log('Cache failed, falling back to Supabase');
          useCache = false;
        }
      }
      
      if (!useCache || newMeals.length === 0) {
        // Fallback to Supabase for filtered queries or if cache is empty
        const offset = pageToLoad * MEALS_PER_PAGE;

        let query = supabase
          .from("meals")
          .select("*")
          .eq("user_id", userId)
          .order("favorite", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + MEALS_PER_PAGE - 1);

        if (dietaryRestrictionFilter) query = query.eq("dietary_restrictions", dietaryRestrictionFilter);
        if (aiFilter === "ai") query = query.eq("created_by_ai", true);
        if (aiFilter === "not_ai") query = query.eq("created_by_ai", false);
        if (cuisineFilter) query = query.eq("cuisine", cuisineFilter);

        const { data, error } = await query;

        if (error) {
          throw new Error(error.message || "Failed to fetch meals");
        }

        newMeals = data || [];
        console.log(`🌐 Loaded ${newMeals.length} meals from Supabase`);
      }
      
      if (loadMore) {
        setMeals(prevMeals => [...prevMeals, ...newMeals]);
        setCurrentPage(pageToLoad);
      } else {
        setMeals(newMeals);
        setCurrentPage(0);
      }
      
      // Check if we have more meals to load
      setHasMoreMeals(newMeals.length === MEALS_PER_PAGE);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error: any) {
      console.error("Error fetching meals:", error);
      const errorMessage = error.message || "Failed to fetch meals. Please try again later.";
      setError(errorMessage);
      
      // Auto-retry with exponential backoff for network errors
      if (retryCount < 3 && !error.message?.includes("Authentication")) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchMyMeals(isRefresh, loadMore);
        }, delay);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filtersLoaded, dietaryRestrictionFilter, aiFilter, cuisineFilter, getCurrentUserId, retryCount, currentPage]);

  const handleRefresh = useCallback(() => {
    setRetryCount(0);
    fetchMyMeals(true);
  }, [fetchMyMeals]);

  const loadMoreMeals = useCallback(() => {
    if (!loadingMore && hasMoreMeals && filteredMealsReady) {
      fetchMyMeals(false, true);
    }
  }, [loadingMore, hasMoreMeals, filteredMealsReady, fetchMyMeals]);

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(0);
    setHasMoreMeals(true);
    fetchMyMeals();
  }, [filtersLoaded, dietaryRestrictionFilter, aiFilter, cuisineFilter]);

  useEffect(() => {
    const filtered = meals.filter((meal) => {
      const passesFilters = filters.every((filter) => {
        const greaterThanValue = parseFloat(filter.greaterThan);
        const lessThanValue = parseFloat(filter.lessThan);
  
        if (filter.type in meal) {
          const mealValue = parseFloat(meal[filter.type as keyof Meal] as unknown as string);
  
          if (!isNaN(greaterThanValue) && mealValue <= greaterThanValue) {
            return false;
          }
  
          if (!isNaN(lessThanValue) && mealValue >= lessThanValue) {
            return false;
          }
        }
  
        return true;
      });
  
      const passesSearch =
        !searchQuery ||
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.description.toLowerCase().includes(searchQuery.toLowerCase());
  
      return passesFilters && passesSearch;
    });
  
    setFilteredMeals(filtered);
    // Only set filteredMealsReady to true if we're not in initial loading state
    if (!loading || meals.length > 0) {
      setFilteredMealsReady(true);
    }
    
    // Auto-load more if we have few visible results and more data is available
    if (filtered.length < 10 && hasMoreMeals && !loadingMore && meals.length > 0) {
      setTimeout(() => loadMoreMeals(), 100); // Small delay to avoid rapid calls
    }
  }, [searchQuery, filters, meals, hasMoreMeals, loadingMore, loadMoreMeals, loading]);

  const onMealSelect = (meal: Meal) => {
    router.push(`/my-meals/${meal.id}/info`); // Navigate to the meal details screen
  };

  const handleSearchChange = useCallback(async (text: string) => {
    setSearchQuery(text);
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        await AsyncStorage.setItem(`searchQuery_MyMeals_${userId}`, text);
      }
    } catch (error: any) {
      console.error("Error saving search query:", error);
      // Don't show error to user for this non-critical operation
    }
  }, [getCurrentUserId]);



  const clearFilters = useCallback(async () => {
    try {
      setError(null);
      setIsFilterModalLoading(true);
      
      const defaultFilters = [
        { type: "calories", greaterThan: "", lessThan: "" },
        { type: "fat", greaterThan: "", lessThan: "" },
        { type: "protein", greaterThan: "", lessThan: "" },
        { type: "carbohydrates", greaterThan: "", lessThan: "" },
      ];
      
      // Clear immediately for UI responsiveness
      setFilters(defaultFilters);
      setTempFilters(defaultFilters);
      setAiFilter("");
      setTempAiFilter("");
      setDietaryRestrictionFilter("");
      setTempDietaryRestrictionFilter("");
      setCuisineFilter("");
      setTempCuisineFilter("");
      setSearchQuery("");

      // Close modal immediately
      closeFilterModal();
      
      // Save to storage in background
      const userId = await getCurrentUserId();
      if (userId) {
        Promise.all([
          AsyncStorage.removeItem(`filters_MyMeals_${userId}`),
          AsyncStorage.removeItem(`searchQuery_MyMeals_${userId}`),
          AsyncStorage.removeItem(`dietaryRestrictionFilter_MyMeals_${userId}`),
          AsyncStorage.removeItem(`aiFilter_MyMeals_${userId}`),
          AsyncStorage.removeItem(`cuisineFilter_MyMeals_${userId}`)
        ]).catch(error => console.warn('Failed to clear storage:', error));
      }
      
    } catch (error: any) {
      console.error("Error clearing filters:", error);
      const errorMessage = error.message || "Failed to clear filters";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsFilterModalLoading(false);
      setIsFilterButtonLoading(false);
    }
  }, [getCurrentUserId, closeFilterModal]);

const applyFilters = useCallback(async () => {
  try {
    setError(null);
    setIsFilterModalLoading(true);
    
    const isValid = tempFilters.every(
      (filter) =>
        (!filter.greaterThan || !isNaN(parseFloat(filter.greaterThan))) &&
        (!filter.lessThan || !isNaN(parseFloat(filter.lessThan)))
    );

    if (!isValid) {
      Alert.alert("Invalid Filters", "Please enter valid numeric values for the filters.");
      setIsFilterModalLoading(false);
      return;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("Authentication required. Please log in again.");
    }

    // Apply immediately for UI responsiveness
    setFilters(tempFilters);
    setDietaryRestrictionFilter(tempDietaryRestrictionFilter);
    setAiFilter(tempAiFilter);
    setCuisineFilter(tempCuisineFilter);

    // Close modal immediately
    closeFilterModal();

    // Save to storage in background
    Promise.all([
      AsyncStorage.setItem(`filters_MyMeals_${userId}`, JSON.stringify(tempFilters)),
      AsyncStorage.setItem(`aiFilter_MyMeals_${userId}`, tempAiFilter),
      AsyncStorage.setItem(`dietaryRestrictionFilter_MyMeals_${userId}`, tempDietaryRestrictionFilter),
      AsyncStorage.setItem(`cuisineFilter_MyMeals_${userId}`, tempCuisineFilter)
    ]).catch(error => console.warn('Failed to save filters:', error));

  } catch (error: any) {
    console.error("Error saving filters:", error);
    const errorMessage = error.message || "Failed to apply filters";
    setError(errorMessage);
    Alert.alert("Error", errorMessage);
  } finally {
    setIsFilterModalLoading(false);
    setIsFilterButtonLoading(false);
  }
}, [tempFilters, tempDietaryRestrictionFilter, tempAiFilter, tempCuisineFilter, getCurrentUserId, closeFilterModal]);

  if (loading || !filtersLoaded || !filteredMealsReady) {
    return (
      <View 
        style={[styles.container, { backgroundColor: theme.background }]}
        // Prevent gesture interference
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => false}
      >
        <View style={styles.centerContent}>
          <View style={[styles.loadingCard, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading your meals...
            </Text>
          </View>
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: theme.card, borderColor: theme.danger }]}>
              <Ionicons name="warning-outline" size={32} color={theme.danger} />
              <Text style={[styles.errorTitle, { color: theme.danger }]}>
                Error Loading Meals
              </Text>
              <Text style={[styles.errorText, { color: theme.text }]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: theme.primary }]}
                onPress={handleRefresh}
              >
                <Ionicons name="refresh-outline" size={20} color={theme.buttonText} style={{ marginRight: 8 }} />
                <Text style={[styles.retryButtonText, { color: theme.buttonText }]}>
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <BottomNav />
      </View>
    );
  }

  return (
    <View 
      style={[styles.container, { backgroundColor: theme.background }]}
      // Prevent gesture interference
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => false}
    >
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.card, borderColor: theme.danger }]}>
          <Ionicons name="warning" size={20} color={theme.danger} />
          <Text style={[styles.errorBannerText, { color: theme.danger }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.errorBannerButton, { backgroundColor: theme.danger }]}
            onPress={handleRefresh}
          >
            <Text style={[styles.errorBannerButtonText, { color: theme.buttonText }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.searchBarContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchBar, { color: theme.text }]}
            placeholder="Search meals..."
            placeholderTextColor={theme.placeholder}
            value={searchQuery}
            onChangeText={handleSearchChange} 
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { 
              backgroundColor: isFilterActive ? theme.primary : theme.card,
              borderColor: theme.border,
              opacity: (isFilterModalLoading || isFilterButtonLoading) ? 0.7 : 1
            }
          ]}
          onPress={openFilterModal}
          disabled={isFilterModalLoading || isFilterButtonLoading}
        >
          {(isFilterModalLoading || isFilterButtonLoading) ? (
            <ActivityIndicator size="small" color={isFilterActive ? theme.buttonText : theme.text} />
          ) : (
            <Ionicons 
              name="filter" 
              size={20} 
              color={isFilterActive ? theme.buttonText : theme.text} 
            />
          )}
          <Text style={[
            styles.filterButtonText, 
            { color: isFilterActive ? theme.buttonText : theme.text }
          ]}>
            {(isFilterModalLoading || isFilterButtonLoading) ? "Loading..." : "Filter"}
          </Text>
          {isFilterActive && !isFilterModalLoading && !isFilterButtonLoading && (
            <View style={[styles.filterActiveDot, { backgroundColor: theme.warning }]} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.createMealButton, { backgroundColor: theme.primary }]}
        onPress={openCreateMealModal}
      >
        <Ionicons name="add-circle-outline" size={24} color={theme.buttonText} style={{ marginRight: 8 }} />
        <Text style={[styles.createMealButtonText, { color: theme.buttonText }]}>Create New Meal</Text>
      </TouchableOpacity>

      {loading && meals.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={[styles.loadingCard, { backgroundColor: theme.card }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.text }]}>
              Loading your meals...
            </Text>
          </View>
        </View>
      ) : filteredMeals.length === 0 && filteredMealsReady && !loading ? (
        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateCard, { backgroundColor: theme.card }]}>
            <Ionicons name="restaurant-outline" size={64} color={theme.subtext} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>
              No Meals Found
            </Text>
            <Text style={[styles.emptyStateText, { color: theme.subtext }]}>
              {searchQuery || isFilterActive 
                ? "Try adjusting your search or filters to find meals."
                : "Create your first meal to get started with meal planning!"
              }
            </Text>
            {!searchQuery && !isFilterActive && (
              <TouchableOpacity
                style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
                onPress={openCreateMealModal}
              >
                <Ionicons name="add" size={20} color={theme.buttonText} style={{ marginRight: 8 }} />
                <Text style={[styles.emptyStateButtonText, { color: theme.buttonText }]}>
                  Create Your First Meal
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredMeals}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.mealItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => onMealSelect(item)}
              activeOpacity={0.7}
            >
              {/* Favorite Star */}
              <TouchableOpacity
                style={styles.favoriteIcon}
                onPress={() => toggleFavorite(item.id)}
                disabled={favoriteLoading[item.id]}
              >
                {favoriteLoading[item.id] ? (
                  <ActivityIndicator size="small" color={theme.warning} />
                ) : (
                  <Ionicons
                    name={item.favorite ? "star" : "star-outline"}
                    size={24}
                    color={item.favorite ? theme.warning : theme.subtext}
                  />
                )}
              </TouchableOpacity>

              {/* AI Tag */}
              {item.created_by_ai === true && (
                <View style={[styles.aiTag, { backgroundColor: theme.aiAccent }]}>
                  <Ionicons name="sparkles" size={12} color={theme.buttonText} />
                  <Text style={[styles.aiTagText, { color: theme.buttonText }]}>AI</Text>
                </View>
              )}

              {/* Meal Image */}
              {item.picture && typeof item.picture === "string" ? (
                <Image 
                  source={{ 
                    uri: item.picture.startsWith('\\x') 
                      ? item.picture.slice(2).match(/.{2}/g)?.map((hex: string) => String.fromCharCode(parseInt(hex, 16))).join('') || ''
                      : item.picture
                  }} 
                  style={styles.mealPicture}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.mealPicturePlaceholder, { backgroundColor: theme.cardSecondary }]}>
                  <Ionicons name="image-outline" size={32} color={theme.subtext} />
                  <Text style={[styles.mealPicturePlaceholderText, { color: theme.subtext }]}>
                    No Image
                  </Text>
                </View>
              )}

              {/* Meal Info */}
              <View style={styles.mealInfo}>
                <Text style={[styles.mealName, { color: theme.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.mealDescription, { color: theme.subtext }]} numberOfLines={3}>
                  {item.description.length > 80
                    ? `${item.description.slice(0, 80)}...`
                    : item.description}
                </Text>
                
                {/* Nutrition Preview */}
                <View style={styles.nutritionPreview}>
                  <View style={styles.nutritionItem}>
                    <Ionicons name="flame-outline" size={14} color={theme.warning} />
                    <Text style={[styles.nutritionText, { color: theme.subtext }]}>
                      {item.calories}
                    </Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Ionicons name="barbell-outline" size={14} color={theme.protein} />
                    <Text style={[styles.nutritionText, { color: theme.subtext }]}>
                      {item.protein}g
                    </Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Ionicons name="analytics-outline" size={14} color={theme.carbs} />
                    <Text style={[styles.nutritionText, { color: theme.subtext }]}>
                      {item.carbohydrates}g
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          onEndReached={loadMoreMeals}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() => (
            loadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingMoreText, { color: theme.subtext }]}>
                  Loading more meals...
                </Text>
              </View>
            ) : !hasMoreMeals && filteredMeals.length > 0 ? (
              <View style={styles.endOfListContainer}>
                <Text style={[styles.endOfListText, { color: theme.subtext }]}>
                  You&apos;ve reached the end of your meals!
                </Text>
              </View>
            ) : null
          )}
          contentContainerStyle={styles.mealsGrid}
        />
      )}

      <Modal 
        visible={isCreateMealModalVisible} 
        transparent 
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
      >
        {isCreateMealModalVisible && (
          <Animated.View 
            style={[styles.modalContainer, { opacity: modalOpacity }]}
          >
          <Pressable 
            style={StyleSheet.absoluteFillObject}
            onPress={closeCreateMealModal}
          />
          <Animated.View 
            style={[
              styles.modalContent, 
              { 
                backgroundColor: theme.card,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {modalHeader}
              
              <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>
                Choose how you&apos;d like to create your meal
              </Text>

              {modalButtons}
            </Pressable>
          </Animated.View>
        </Animated.View>
        )}
      </Modal>

      <Modal 
        visible={isFilterModalVisible} 
        transparent 
        animationType="none"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
      >
        {isFilterModalVisible && (
          <Animated.View 
            style={[
              styles.modalContainer, 
              { opacity: filterModalOpacity }
            ]}
          >
            <Pressable 
              style={StyleSheet.absoluteFillObject}
              onPress={closeFilterModal}
            />
            <Animated.View 
              style={[
                styles.filterModalContent, 
                { 
                  backgroundColor: theme.card, 
                  shadowColor: theme.shadow,
                  transform: [{ translateY: filterModalTranslateY }]
                },
                isSmallScreen && {
                  maxHeight: '90%',
                  borderRadius: 12,
                  margin: 10,
                }
              ]}
            >
              <Pressable onPress={(e) => e.stopPropagation()}>
              <ScrollView 
                style={[
                  styles.filterModalScrollView,
                  isSmallScreen && { maxHeight: '75%' }
                ]} 
                showsVerticalScrollIndicator={false}
                bounces={true}
                scrollEventThrottle={16}
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
              {/* Modal Header */}
              <View style={[
                styles.filterModalHeader,
                isSmallScreen && { padding: 16, paddingBottom: 12 }
              ]}>
                <View style={styles.filterModalHeaderContent}>
                  <Ionicons name="filter" size={isSmallScreen ? 24 : 28} color={theme.primary} />
                  <Text style={[
                    styles.filterModalTitle, 
                    { color: theme.text },
                    isSmallScreen && { fontSize: responsiveFontSizes.h4 }
                  ]}>
                    Filter Meals
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.filterModalCloseButton, 
                    { backgroundColor: theme.background },
                    isSmallScreen && { padding: 6 }
                  ]}
                  onPress={closeFilterModal}
                >
                  <Ionicons 
                    name="close" 
                    size={isSmallScreen ? 18 : 20} 
                    color={theme.subtext} 
                  />
                </TouchableOpacity>
              </View>

              <Text style={[
                styles.filterModalSubtitle, 
                { color: theme.subtext },
                isSmallScreen && { 
                  fontSize: responsiveFontSizes.bodySmall,
                  paddingHorizontal: 16,
                  marginBottom: 16
                }
              ]}>
                Refine your meal search with these filters
              </Text>

              {/* Quick Filter Chips */}
              <View style={[
                styles.quickFiltersSection,
                isSmallScreen && { paddingHorizontal: 16 }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { color: theme.text },
                  isSmallScreen && { fontSize: responsiveFontSizes.h6 }
                ]}>
                  <Ionicons 
                    name="flash" 
                    size={isSmallScreen ? 16 : 18} 
                    color={theme.primary} 
                  /> Quick Filters
                </Text>
                <View style={styles.quickFiltersContainer}>
                  <TouchableOpacity
                    style={[
                      styles.quickFilterChip,
                      { 
                        backgroundColor: tempAiFilter === "ai" ? theme.aiAccent : theme.background,
                        borderColor: tempAiFilter === "ai" ? theme.aiAccent : theme.border
                      }
                    ]}
                    onPress={() => setTempAiFilter(tempAiFilter === "ai" ? "" : "ai")}
                  >
                    <Ionicons 
                      name="sparkles" 
                      size={16} 
                      color={tempAiFilter === "ai" ? theme.buttonText : theme.text} 
                    />
                    <Text style={[
                      styles.quickFilterChipText, 
                      { color: tempAiFilter === "ai" ? theme.buttonText : theme.text }
                    ]}>
                      AI Generated
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.quickFilterChip,
                      { 
                        backgroundColor: tempAiFilter === "not_ai" ? theme.success : theme.background,
                        borderColor: tempAiFilter === "not_ai" ? theme.success : theme.border
                      }
                    ]}
                    onPress={() => setTempAiFilter(tempAiFilter === "not_ai" ? "" : "not_ai")}
                  >
                    <Ionicons 
                      name="person" 
                      size={16} 
                      color={tempAiFilter === "not_ai" ? theme.buttonText : theme.text} 
                    />
                    <Text style={[
                      styles.quickFilterChipText, 
                      { color: tempAiFilter === "not_ai" ? theme.buttonText : theme.text }
                    ]}>
                      Manual
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Nutrition Filters */}
              <View style={[
                styles.filterSection, 
                { borderBottomColor: theme.border },
                isSmallScreen && { paddingHorizontal: 16, paddingVertical: 12 }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { color: theme.text },
                  isSmallScreen && { fontSize: responsiveFontSizes.h6 }
                ]}>
                  <Ionicons 
                    name="nutrition" 
                    size={isSmallScreen ? 16 : 18} 
                    color={theme.primary} 
                  /> Nutrition Ranges
                </Text>
                {tempFilters.map((filter, index) => (
                  <View key={index} style={styles.nutritionRow}>
                    <Text style={[styles.nutritionLabel, { color: theme.text }]}>
                      {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}
                    </Text>
                    <View style={styles.rangeInputs}>
                      <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                        <Text style={[styles.inputLabel, { color: theme.subtext }]}>Min</Text>
                        <TextInput
                          style={[styles.rangeInput, { color: theme.text }]}
                          placeholder="0"
                          placeholderTextColor={theme.placeholder}
                          value={filter.greaterThan}
                          onChangeText={(text) => {
                            const updatedFilters = [...tempFilters];
                            updatedFilters[index].greaterThan = text;
                            setTempFilters(updatedFilters);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.inputContainer, { borderColor: theme.border }]}>
                        <Text style={[styles.inputLabel, { color: theme.subtext }]}>Max</Text>
                        <TextInput
                          style={[styles.rangeInput, { color: theme.text }]}
                          placeholder="999"
                          placeholderTextColor={theme.placeholder}
                          value={filter.lessThan}
                          onChangeText={(text) => {
                            const updatedFilters = [...tempFilters];
                            updatedFilters[index].lessThan = text;
                            setTempFilters(updatedFilters);
                          }}
                          keyboardType="numeric"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              {/* Dietary Restrictions */}
              <View style={[
                styles.filterSection, 
                { borderBottomColor: theme.border },
                isSmallScreen && { paddingHorizontal: 16, paddingVertical: 12 }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { color: theme.text },
                  isSmallScreen && { fontSize: responsiveFontSizes.h6 }
                ]}>
                  <Ionicons 
                    name="leaf" 
                    size={isSmallScreen ? 16 : 18} 
                    color={theme.success} 
                  /> Dietary Restrictions
                </Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.background }]}
                  onPress={() => {
                    setIsFilterModalVisible(false);
                    setTimeout(() => setShowDietaryModal(true), 10);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerText, { 
                    color: tempDietaryRestrictionFilter ? theme.text : theme.placeholder 
                  }]}>
                    {tempDietaryRestrictionFilter ? 
                      (dietaryFilterOptionsEnhanced.find(option => option.value === tempDietaryRestrictionFilter)?.label || tempDietaryRestrictionFilter)
                      : "All Dietary Restrictions"
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.text} style={styles.pickerIcon} />
                </TouchableOpacity>
              </View>

              {/* Cuisine */}
              <View style={[
                styles.filterSection, 
                { borderBottomWidth: 0 },
                isSmallScreen && { paddingHorizontal: 16, paddingVertical: 12 }
              ]}>
                <Text style={[
                  styles.sectionTitle, 
                  { color: theme.text },
                  isSmallScreen && { fontSize: responsiveFontSizes.h6 }
                ]}>
                  <Ionicons 
                    name="globe" 
                    size={isSmallScreen ? 16 : 18} 
                    color={theme.warning} 
                  /> Cuisine Type
                </Text>
                <TouchableOpacity
                  style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.background }]}
                  onPress={() => {
                    setIsFilterModalVisible(false);
                    setTimeout(() => setShowCuisineModal(true), 10);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pickerText, { 
                    color: tempCuisineFilter ? theme.text : theme.placeholder 
                  }]}>
                    {tempCuisineFilter ? 
                      (cuisineFilterOptionsEnhanced.find(option => option.value === tempCuisineFilter)?.label || tempCuisineFilter)
                      : "All Cuisines"
                    }
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.text} style={styles.pickerIcon} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={[
              styles.filterModalActions,
              isSmallScreen && { padding: 14, gap: 8 }
            ]}>
              <TouchableOpacity 
                style={[
                  styles.filterModalButton, 
                  styles.clearFilterButton, 
                  { backgroundColor: theme.button, borderColor: theme.border },
                  isSmallScreen && { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
                  isFilterModalLoading && { opacity: 0.6 }
                ]} 
                onPress={clearFilters}
                disabled={isFilterModalLoading}
              >
                {isFilterModalLoading ? (
                  <ActivityIndicator 
                    size="small" 
                    color={theme.text} 
                  />
                ) : (
                  <Ionicons 
                    name="refresh" 
                    size={isSmallScreen ? 14 : 18} 
                    color={theme.text} 
                  />
                )}
                <Text style={[
                  styles.filterModalButtonText, 
                  { color: theme.text },
                  isSmallScreen && { fontSize: responsiveFontSizes.buttonSmall }
                ]}>
                  {isFilterModalLoading ? "Clearing..." : "Clear All"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.filterModalButton, 
                  styles.applyFilterButton, 
                  { backgroundColor: theme.primary },
                  isSmallScreen && { paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
                  isFilterModalLoading && { opacity: 0.6 }
                ]} 
                onPress={applyFilters}
                disabled={isFilterModalLoading}
              >
                {isFilterModalLoading ? (
                  <ActivityIndicator 
                    size="small" 
                    color={theme.buttonText} 
                  />
                ) : (
                  <Ionicons 
                    name="checkmark" 
                    size={isSmallScreen ? 14 : 18} 
                    color={theme.buttonText} 
                  />
                )}
                <Text style={[
                  styles.filterModalButtonText, 
                  { color: theme.buttonText },
                  isSmallScreen && { fontSize: responsiveFontSizes.buttonSmall }
                ]}>
                  {isFilterModalLoading ? "Applying..." : "Apply Filters"}
                </Text>
              </TouchableOpacity>
            </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
        )}
      </Modal>

      {/* Dietary Restrictions Modal */}
      <Modal
        visible={showDietaryModal}
        transparent={true}
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={() => {
          setShowDietaryModal(false);
          setTimeout(() => setIsFilterModalVisible(true), 50);
        }}
      >
        {showDietaryModal && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '80%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                <Ionicons name="leaf" size={20} color={theme.success} /> Select Dietary Restrictions
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowDietaryModal(false);
                  setTimeout(() => setIsFilterModalVisible(true), 50);
                }}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={[styles.optionsList, { maxHeight: 400 }]} showsVerticalScrollIndicator={false}>
              {dietaryFilterOptionsEnhanced.length > 0 ? (
                dietaryFilterOptionsEnhanced.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: theme.border },
                      tempDietaryRestrictionFilter === option.value && { backgroundColor: theme.primary + '15' }
                    ]}
                    onPress={() => {
                      setTempDietaryRestrictionFilter(option.value);
                      setShowDietaryModal(false);
                      setTimeout(() => setIsFilterModalVisible(true), 10);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      <Ionicons name={option.icon as any} size={24} color={theme.primary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                      <Text style={[styles.optionDescription, { color: theme.subtext }]}>{option.description}</Text>
                    </View>
                    {tempDietaryRestrictionFilter === option.value && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={[{ color: theme.text }]}>No dietary options available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        )}
      </Modal>

      {/* Cuisine Modal */}
      <Modal
        visible={showCuisineModal}
        transparent={true}
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        hardwareAccelerated
        onRequestClose={() => {
          setShowCuisineModal(false);
          setTimeout(() => setIsFilterModalVisible(true), 50);
        }}
      >
        {showCuisineModal && (
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { backgroundColor: theme.card, maxHeight: '80%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                <Ionicons name="globe" size={20} color={theme.warning} /> Select Cuisine Type
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => {
                  setShowCuisineModal(false);
                  setTimeout(() => setIsFilterModalVisible(true), 50);
                }}
              >
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={[styles.optionsList, { maxHeight: 400 }]} showsVerticalScrollIndicator={false}>
              {cuisineFilterOptionsEnhanced.length > 0 ? (
                cuisineFilterOptionsEnhanced.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionItem,
                      { borderBottomColor: theme.border },
                      tempCuisineFilter === option.value && { backgroundColor: theme.primary + '15' }
                    ]}
                    onPress={() => {
                      setTempCuisineFilter(option.value);
                      setShowCuisineModal(false);
                      setTimeout(() => setIsFilterModalVisible(true), 10);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      <Ionicons name={option.icon as any} size={24} color={theme.primary} />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[styles.optionLabel, { color: theme.text }]}>{option.label}</Text>
                      <Text style={[styles.optionDescription, { color: theme.subtext }]}>{option.description}</Text>
                    </View>
                    {tempCuisineFilter === option.value && (
                      <Ionicons name="checkmark" size={20} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={[{ color: theme.text }]}>No cuisine options available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
        )}
      </Modal>
      
      <BottomNav /> 
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 45, // Add top padding to avoid status bar overlap
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Enhanced Loading Card
  loadingCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    maxWidth: '90%',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Enhanced Error Styles
  errorContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: '90%',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorBannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorBannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Enhanced Search Bar
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginHorizontal: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchBar: {
    flex: 1,
    height: 48,
    fontSize: 16,
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Enhanced Create Button
  createMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  createMealButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Enhanced Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateCard: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    maxWidth: '100%',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyStateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Enhanced Meal Cards
  mealItem: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    maxWidth: '46%',
  },
  favoriteIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiTag: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  aiTagText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealPicture: {
    width: "100%",
    height: 140,
    resizeMode: 'cover',
  },
  mealPicturePlaceholder: {
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  mealPicturePlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mealInfo: {
    padding: 16,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 22,
  },
  mealDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
  },
  nutritionPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  nutritionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nutritionText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Enhanced Modals
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonContent: {
    flex: 1,
    marginLeft: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalButtonSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Enhanced Filter Modal Styles
  filterModalContent: {
    width: "100%",
    maxHeight: "85%",
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  filterModalScrollView: {
    maxHeight: "80%",
    paddingBottom: 10,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  filterModalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  filterModalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  filterModalSubtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  // Quick Filters Section
  quickFiltersSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  quickFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Filter Section Styles
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },

  // Nutrition Filter Styles
  nutritionRow: {
    marginBottom: 12,
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  rangeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  rangeInput: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    fontSize: 16,
    minHeight: 20,
  },

  // Picker Styles
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    minHeight: 56,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 12,
  },
  pickerInput: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    paddingRight: 40,
    minHeight: 56,
    width: '100%',
  },
  pickerIcon: {
    marginLeft: 8,
  },

  // Filter Modal Actions
  filterModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  filterModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 6,
  },
  filterModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearFilterButton: {
    borderWidth: 1,
  },
  applyFilterButton: {
    // Primary button styling applied via backgroundColor
  },

  // Filter Modal Styles
  filterRow: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 8,
  },
  applyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  clearButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 4,
    borderWidth: 1,
  },
  clearButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },

  // Grid Layout
  mealsGrid: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },

  // Usage Info Styles
  usageInfoContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  usageInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  usageInfoContent: {
    gap: 8,
  },
  usageInfoText: {
    fontSize: 14,
    fontWeight: '600',
  },
  usageProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  usageProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  usageRemainingText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },

  // Legacy compatibility
  noMealsText: {
    fontSize: 16,
    textAlign: "center",
  },

  // Additional modal styles for picker modals
  optionsList: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  // Pagination styles
  loadingMoreContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  endOfListContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfListText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default MyMeals;
