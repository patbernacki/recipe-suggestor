import { useState, useEffect, useCallback, useRef } from 'react';
import IngredientSelector from '../components/IngredientSelector';
import RecipeResults from '../components/RecipeResults';
import { useAuth } from '../context/AuthContext';

const DISH_TYPES = [
  { value: '', label: 'All Dishes' },
  { value: 'main course', label: 'Main Course' },
  { value: 'side dish', label: 'Side Dish' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'appetizer', label: 'Appetizer' },
  { value: 'salad', label: 'Salad' },
  { value: 'bread', label: 'Bread' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'soup', label: 'Soup' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'sauce', label: 'Sauce' }
];

const Home = () => {
  const { user, savedIngredients, saveIngredient, removeIngredient, logoutTrigger } = useAuth();
  
  const [ingredients, setIngredients] = useState(() => {
    // Load saved ingredients from localStorage on component mount
    const saved = localStorage.getItem('selectedIngredients');
    return saved ? JSON.parse(saved) : [];
  });
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cache, setCache] = useState(() => {
    // Load cache from localStorage on component mount
    const savedCache = localStorage.getItem('recipeCache');
    if (savedCache) {
      try {
        const parsedCache = JSON.parse(savedCache);
        // Check for expired cache entries (older than 1 hour)
        const now = Date.now();
        const filteredCache = {};
        Object.keys(parsedCache).forEach(key => {
          if (parsedCache[key].timestamp && (now - parsedCache[key].timestamp) < 3600000) { // 1 hour in milliseconds
            filteredCache[key] = parsedCache[key];
          }
        });
        return filteredCache;
      } catch (error) {
        console.error('Error parsing cache from localStorage:', error);
        return {};
      }
    }
    return {};
  }); // Cache for recipe results
  const [scrollPosition, setScrollPosition] = useState(() => {
    // Load scroll position from localStorage on component mount
    const savedScroll = localStorage.getItem('recipeScrollPosition');
    return savedScroll ? parseInt(savedScroll) : 0;
  }); // Track scroll position
  const [hadExpandedResults, setHadExpandedResults] = useState(() => {
    // Check if user had expanded results (loaded more recipes)
    const saved = localStorage.getItem('hadExpandedResults');
    return saved === 'true';
  }); // Track if user had loaded more recipes
  const [savedRecipeList, setSavedRecipeList] = useState(() => {
    // Load saved recipe list from localStorage
    const saved = localStorage.getItem('savedRecipeList');
    return saved ? JSON.parse(saved) : null;
  }); // Store complete recipe list when user loads more

  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFilters]);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDishType, setSelectedDishType] = useState(() => {
    // Load saved dish type from localStorage on component mount
    const saved = localStorage.getItem('selectedDishType');
    return saved || '';
  });
  const limit = 20;
  const isInitialMount = useRef(true);
  const lastIngredientsRef = useRef(ingredients);

  // Function to save cache to localStorage
  const saveCacheToStorage = (newCache) => {
    try {
      localStorage.setItem('recipeCache', JSON.stringify(newCache));
    } catch (error) {
      console.error('Error saving cache to localStorage:', error);
    }
  };

  // Save scroll position when navigating away (only when clicking on a recipe)
  const saveScrollPosition = () => {
    const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
    if (scrollContainer) {
      const currentScroll = scrollContainer.scrollTop;
      console.log('Saving scroll position:', currentScroll);
      setScrollPosition(currentScroll);
      // Also save to localStorage for persistence
      localStorage.setItem('recipeScrollPosition', currentScroll.toString());
    }
  };




  const fetchRecipes = useCallback(async (isLoadMore = false) => {
    console.log('fetchRecipes called with ingredients:', ingredients, 'isLoadMore:', isLoadMore);
    
    // Create cache key
    const cacheKey = `${ingredients.join(',')}-${selectedDishType}`;
    console.log('Cache key:', cacheKey);
    console.log('Current cache:', cache);
    
    // Check if we have a saved complete recipe list (from load more scenario)
    // Only restore if we're not doing a new search and we have a non-zero offset
    if (!isLoadMore && savedRecipeList && hadExpandedResults && offset > 0) {
      console.log('Restoring saved recipe list with expanded results');
      setRecipes(savedRecipeList.recipes);
      setOffset(savedRecipeList.offset);
      setHasMore(savedRecipeList.hasMore);
      setLoading(false);
      // Don't clear the saved data yet - keep it for subsequent navigations
      // Only clear scroll position after restoring
      setTimeout(() => {
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
        if (scrollContainer && scrollPosition > 0) {
          console.log('Restoring scroll position:', scrollPosition);
          scrollContainer.scrollTop = scrollPosition;
          setScrollPosition(0);
          localStorage.removeItem('recipeScrollPosition');
        }
      }, 200);
      return;
    }
    
    // Check cache first (only for initial loads, not load more)
    // Skip cache if user had expanded results (loaded more recipes)
    if (!isLoadMore && cache[cacheKey] && !hadExpandedResults) {
      const cachedData = cache[cacheKey];
      // Check if cache is still valid (less than 1 hour old)
      const now = Date.now();
      if (cachedData.timestamp && (now - cachedData.timestamp) < 3600000) {
        console.log('Using cached results for:', cacheKey);
        setRecipes(cachedData.recipes);
        setOffset(cachedData.offset);
        setHasMore(cachedData.hasMore);
        setLoading(false);
        // Restore scroll position after a brief delay to ensure DOM is ready
        setTimeout(() => {
          const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
          if (scrollContainer && scrollPosition > 0) {
            console.log('Restoring scroll position:', scrollPosition);
            scrollContainer.scrollTop = scrollPosition;
            // Clear the saved position after restoring to prevent re-restoration
            setScrollPosition(0);
            localStorage.removeItem('recipeScrollPosition');
          }
        }, 200);
        return;
      } else {
        console.log('Cache expired for:', cacheKey);
        // Remove expired cache entry
        const newCache = { ...cache };
        delete newCache[cacheKey];
        setCache(newCache);
        saveCacheToStorage(newCache);
      }
    } else if (hadExpandedResults) {
      console.log('Skipping cache because user had expanded results');
      // Don't clear the expanded results flag here - keep it for saved recipe list restoration
    }
    
    console.log('Cache miss, fetching fresh data');

    setLoading(true);
    setError(null);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const query = ingredients.length > 0 ? ingredients.join(',') : '';
      
      // If we have both ingredients and dish type, do combined search
      if (ingredients.length > 0 && selectedDishType) {
        // First search: ingredients + dish type
        const ingredientsUrl = `${baseUrl}/recipes?ingredients=${encodeURIComponent(query)}&type=${encodeURIComponent(selectedDishType)}&limit=${limit}&offset=${currentOffset}`;
        
        // Second search: dish type only (for fallback results)
        const dishTypeUrl = `${baseUrl}/recipes?type=${encodeURIComponent(selectedDishType)}&limit=${limit}&offset=${currentOffset}`;
        
        try {
          // Make both requests in parallel
          const [ingredientsResponse, dishTypeResponse] = await Promise.all([
            fetch(ingredientsUrl),
            fetch(dishTypeUrl)
          ]);
          
          if (!ingredientsResponse.ok || !dishTypeResponse.ok) {
            throw new Error('Failed to fetch recipes');
          }
          
          const [ingredientsData, dishTypeData] = await Promise.all([
            ingredientsResponse.json(),
            dishTypeResponse.json()
          ]);
          
          // Combine results: ingredient matches first, then dish type matches
          const ingredientMatches = ingredientsData.recipes || [];
          const dishTypeMatches = (dishTypeData.recipes || []).filter(recipe => 
            !ingredientMatches.some(ingredientRecipe => ingredientRecipe.id === recipe.id)
          );
          
          const combinedRecipes = [...ingredientMatches, ...dishTypeMatches];
          
          if (isLoadMore) {
            setRecipes(prev => [...prev, ...combinedRecipes]);
          } else {
            setRecipes(combinedRecipes);
            // Cache the results
            const cacheData = {
              recipes: combinedRecipes,
              offset: currentOffset + limit,
              hasMore: ingredientsData.hasMore || dishTypeData.hasMore,
              timestamp: Date.now()
            };
            console.log('Caching results for key:', cacheKey, cacheData);
            const newCache = {
              ...cache,
              [cacheKey]: cacheData
            };
            setCache(newCache);
            saveCacheToStorage(newCache);
          }
          
          setOffset(currentOffset + limit);
          setHasMore(ingredientsData.hasMore || dishTypeData.hasMore);
          
        } catch {
          throw new Error('Failed to fetch recipes');
        }
      } else {
        // Standard single search
        let url = `${baseUrl}/recipes?limit=${limit}&offset=${currentOffset}`;
        
        if (query) {
          url += `&ingredients=${encodeURIComponent(query)}`;
        }
        
        if (selectedDishType) {
          url += `&type=${encodeURIComponent(selectedDishType)}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(response.status === 504 ? 'Request timed out. Please try again.' : 'Failed to fetch recipes');
          }

          const data = await response.json();

          if (isLoadMore) {
            setRecipes(prev => [...prev, ...data.recipes]);
          } else {
            setRecipes(data.recipes);
            // Cache the results
            const cacheData = {
              recipes: data.recipes,
              offset: currentOffset + limit,
              hasMore: data.hasMore,
              timestamp: Date.now()
            };
            console.log('Caching results for key:', cacheKey, cacheData);
            const newCache = {
              ...cache,
              [cacheKey]: cacheData
            };
            setCache(newCache);
            saveCacheToStorage(newCache);
          }

          setOffset(currentOffset + limit);
          setHasMore(data.hasMore);
        } catch (err) {
          if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          throw err;
        }
      }
    } catch (err) {
      setError(err.message);
      setRecipes(prev => isLoadMore ? prev : []); // Keep existing recipes on load more failure
    } finally {
      setLoading(false);
    }
  }, [baseUrl, ingredients, selectedDishType, offset, limit, cache, scrollPosition, hadExpandedResults, savedRecipeList]); // Include all dependencies for proper tracking

  // Save ingredients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedIngredients', JSON.stringify(ingredients));
  }, [ingredients]);

  // Save dish type to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedDishType', selectedDishType);
  }, [selectedDishType]);

  // Sync ingredients from database when user logs in (only on login, not on every savedIngredients change)
  useEffect(() => {
    if (user && savedIngredients.length > 0) {
      // Only sync if we don't already have ingredients (first login)
      if (ingredients.length === 0) {
        setIngredients(savedIngredients);
        localStorage.setItem('selectedIngredients', JSON.stringify(savedIngredients));
      }
    } else if (user && savedIngredients.length === 0) {
      // If user is logged in but has no saved ingredients, keep current ingredients
      // Don't clear them as user might be in the middle of building a list
    } else if (!user) {
      // If user is not logged in, load from localStorage (guest mode)
      const localIngredients = localStorage.getItem('selectedIngredients');
      if (localIngredients) {
        setIngredients(JSON.parse(localIngredients));
      } else {
        setIngredients([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, logoutTrigger]); // Only depend on user and logoutTrigger to prevent conflicts


  // Auto-fetch when dish type changes (but not when ingredients change)
  useEffect(() => {
    if (!isInitialMount.current) {
      setScrollPosition(0); // Reset scroll position for new dish type
      setOffset(0); // Reset offset for new search
      clearSavedData(); // Clear all saved data for new search
      localStorage.removeItem('recipeScrollPosition'); // Clear saved scroll position
      
      // Scroll to top of recipe list when dish type changes
      const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
      }
      
      fetchRecipes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDishType]); // Remove fetchRecipes to prevent circular dependency

  // Initial search when component mounts
  useEffect(() => {
    if (isInitialMount.current) {
      // Always fetch initial recipes on mount
      fetchRecipes(false);
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Auto-update recipes when ingredients change (with consistent 2-second debouncing)
  useEffect(() => {
    // Skip auto-update on initial mount
    if (isInitialMount.current) {
      lastIngredientsRef.current = ingredients;
      return;
    }

    // Check if ingredients actually changed
    const ingredientsChanged = JSON.stringify(ingredients) !== JSON.stringify(lastIngredientsRef.current);
    if (!ingredientsChanged) {
      return;
    }

    // Debug logging
    console.log('Ingredients changed, setting up debounced recipe fetch:', ingredients);

    // Update the ref to track current ingredients
    lastIngredientsRef.current = ingredients;

    // Set up debounced auto-update with consistent 2-second delay for ALL users
    const timeoutId = setTimeout(() => {
      setOffset(0); // Reset offset for new search
      setScrollPosition(0); // Reset scroll position for new search
      clearSavedData(); // Clear all saved data for new search
      localStorage.removeItem('recipeScrollPosition'); // Clear saved scroll position
      fetchRecipes(false);
    }, 2000); // Consistent 2 second delay for all users

    // Cleanup timeout if ingredients change again before delay
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients]); // Remove fetchRecipes to prevent circular dependency

  // Restore scroll position when recipes are loaded (only if we have a saved position)
  useEffect(() => {
    if (recipes.length > 0 && scrollPosition > 0) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
        if (scrollContainer) {
          console.log('Restoring scroll position after recipes loaded:', scrollPosition);
          scrollContainer.scrollTop = scrollPosition;
          // Clear the saved position after restoring to prevent re-restoration
          setScrollPosition(0);
          localStorage.removeItem('recipeScrollPosition');
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [recipes.length, scrollPosition]);


  const handleLoadMore = () => {
    // Mark that user has expanded results (loaded more recipes)
    setHadExpandedResults(true);
    localStorage.setItem('hadExpandedResults', 'true');
    fetchRecipes(true);
  };

  // Save complete recipe list whenever it changes (for all load more scenarios)
  useEffect(() => {
    if (recipes.length > 0 && hadExpandedResults) {
      const recipeListData = {
        recipes: recipes,
        offset: offset,
        hasMore: hasMore,
        timestamp: Date.now()
      };
      setSavedRecipeList(recipeListData);
      localStorage.setItem('savedRecipeList', JSON.stringify(recipeListData));
    }
  }, [recipes, offset, hasMore, hadExpandedResults]);

  // Clear saved recipe list only when starting a completely new search
  const clearSavedData = () => {
    setSavedRecipeList(null);
    setHadExpandedResults(false);
    localStorage.removeItem('savedRecipeList');
    localStorage.removeItem('hadExpandedResults');
  };

  // Save scroll position before navigation
  const handleRecipeClick = () => {
    saveScrollPosition();
  };


  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Mobile Ingredient Selector Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowFilters(true)}
          className="w-full p-4 bg-white rounded-lg shadow-md border border-orange-200 flex items-center justify-between hover:bg-orange-50 transition-all duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <svg className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium text-gray-900">Select Ingredients</span>
            </div>
            {ingredients.length > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
                {ingredients.length}
              </span>
            )}
          </div>
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Mobile Full-Screen Modal */}
      {showFilters && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white animate-in fade-in duration-200">
          <div className="flex flex-col h-full">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold text-gray-900">Select Your Ingredients</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <IngredientSelector 
                ingredients={ingredients} 
                setIngredients={setIngredients} 
                disabled={false}
                onAddIngredient={user ? saveIngredient : undefined}
                onRemoveIngredient={user ? removeIngredient : undefined}
              />
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowFilters(false)}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Done ({ingredients.length} ingredients selected)
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        {/* Left: Ingredient Selection - Desktop Only */}
        <div className="hidden lg:block lg:col-span-4">
            <div className="p-6 pr-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow h-[calc(100vh-12rem)] border border-orange-100">
            <div className="pr-1 h-full overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Select Your Ingredients</h2>
              <IngredientSelector 
                ingredients={ingredients} 
                setIngredients={setIngredients} 
                disabled={false}
                onAddIngredient={user ? saveIngredient : undefined}
                onRemoveIngredient={user ? removeIngredient : undefined}
              />
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 hover:shadow-lg transition-shadow h-[calc(100vh-8rem)] sm:h-[calc(100vh-12rem)] flex flex-col border border-orange-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 flex-shrink-0 gap-3 sm:gap-0">
              <h2 className="text-xl font-semibold text-gray-900">Recipe Suggestions</h2>
              <div className="flex items-center space-x-3">
                <label htmlFor="dishTypeResults" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter:
                </label>
                <select
                  id="dishTypeResults"
                  value={selectedDishType}
                  onChange={(e) => {
                    setSelectedDishType(e.target.value);
                    setOffset(0);
                  }}
                  className="px-4 py-2 text-sm border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white min-w-0 flex-1 sm:flex-none shadow-sm hover:border-orange-400 transition-colors"
                  disabled={loading}
                >
                  {DISH_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200 flex-shrink-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm text-red-600">{error}</p>
                    <div className="mt-2">
                      <button 
                        onClick={() => setError(null)} 
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {recipes.length === 0 ? (
                <div className="text-center py-12">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-10 w-10 text-orange-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-lg font-medium text-gray-700">Searching for recipes...</p>
                      <p className="text-sm text-gray-500 mt-1">Finding the best matches for your ingredients</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-6xl mb-4 animate-bounce">🍽️</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to discover recipes?</h3>
                      <p className="text-gray-600 max-w-md">
                        Select some ingredients from the left panel to get personalized recipe suggestions!
                      </p>
                      <div className="mt-4 flex space-x-2">
                        <span className="text-2xl">🥕</span>
                        <span className="text-2xl">🍅</span>
                        <span className="text-2xl">🧄</span>
                        <span className="text-2xl">🥔</span>
                        <span className="text-2xl">🧅</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <RecipeResults recipes={recipes} onRecipeClick={handleRecipeClick} />
              )}
              {hasMore && (
                <div className="mt-8 pb-4 flex-shrink-0">
                  <button
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl relative font-medium"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    <span className={loading ? 'opacity-0' : ''}>
                      Load More Recipes
                    </span>
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
