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
  { value: 'sauce', label: 'Sauce' },
  { value: 'drink', label: 'Drink' }
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

  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
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

  const fetchRecipes = useCallback(async (isLoadMore = false) => {
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
          }
          
          setOffset(currentOffset + limit);
          setHasMore(ingredientsData.hasMore || dishTypeData.hasMore);
          
        } catch {
          throw new Error('Failed to fetch recipes');
        }
      } else {
        // Standard single search
        let url = `${baseUrl}/recipes?${query ? `ingredients=${encodeURIComponent(query)}&` : ''}limit=${limit}&offset=${currentOffset}`;
        
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
  }, [baseUrl, ingredients, selectedDishType, offset, limit]);

  // Save ingredients to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedIngredients', JSON.stringify(ingredients));
  }, [ingredients]);

  // Save dish type to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedDishType', selectedDishType);
  }, [selectedDishType]);

  // Sync ingredients from database when user logs in
  useEffect(() => {
    if (user && savedIngredients.length > 0) {
      // If user has saved ingredients in database, use those
      setIngredients(savedIngredients);
      // Also update localStorage as backup
      localStorage.setItem('selectedIngredients', JSON.stringify(savedIngredients));
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
  }, [user, savedIngredients, logoutTrigger]); // Add logoutTrigger as dependency

  // Handle user login/logout
  useEffect(() => {
    if (!user && ingredients.length === 0) {
      // If user logs out and no ingredients are selected, fetch default recipes
      fetchRecipes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Only trigger on user login/logout, not ingredient changes

  // Auto-fetch when dish type changes (but not when ingredients change)
  useEffect(() => {
    if (!isInitialMount.current) {
      fetchRecipes(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDishType]); // Only trigger on dish type changes

  // Initial search when component mounts (only if ingredients exist)
  useEffect(() => {
    if (isInitialMount.current && ingredients.length > 0) {
      fetchRecipes(false);
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients.length]); // fetchRecipes excluded to prevent infinite loop

  const handleLoadMore = () => {
    fetchRecipes(true);
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-all duration-200"
          >
            <span className="font-medium text-gray-900">Filter Options</span>
            <svg
              className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 ${
            showFilters ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">Select Your Ingredients</h2>
              <div className="space-y-4">
                <div className="mb-4">
                  <label htmlFor="dishType" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Dish Type
                  </label>
                  <select
                    id="dishType"
                    value={selectedDishType}
                    onChange={(e) => {
                      setSelectedDishType(e.target.value);
                      setOffset(0);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  >
                    {DISH_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <IngredientSelector 
                  ingredients={ingredients} 
                  setIngredients={setIngredients} 
                  disabled={loading}
                  onAddIngredient={user ? saveIngredient : undefined}
                  onRemoveIngredient={user ? removeIngredient : undefined}
                  onSearchRecipes={() => {
                    setOffset(0);
                    fetchRecipes(false);
                    // Close filters on mobile after search
                    setShowFilters(false);
                  }}
                />
                {error && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-600">{error}</p>
                    <button 
                      onClick={() => setError(null)} 
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Ingredient Selection - Desktop Only */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="p-6 pr-2 bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow h-[calc(100vh-12rem)]">
            <div className="pr-1 h-full overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">Select Your Ingredients</h2>
              <div className="mb-4">
                <label htmlFor="dishTypeDesktop" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Dish Type
                </label>
                <select
                  id="dishTypeDesktop"
                  value={selectedDishType}
                  onChange={(e) => {
                    setSelectedDishType(e.target.value);
                    setOffset(0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={loading}
                >
                  {DISH_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <IngredientSelector 
                ingredients={ingredients} 
                setIngredients={setIngredients} 
                disabled={loading}
                onAddIngredient={user ? saveIngredient : undefined}
                onRemoveIngredient={user ? removeIngredient : undefined}
                onSearchRecipes={() => {
                  setOffset(0);
                  fetchRecipes(false);
                }}
              />
              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600">{error}</p>
                  <button 
                    onClick={() => setError(null)} 
                    className="mt-2 text-sm text-red-600 hover:text-red-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow h-[calc(100vh-12rem)] flex flex-col">
            <h2 className="text-xl font-semibold mb-4 flex-shrink-0">Recipe Suggestions</h2>
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {recipes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {loading ? (
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 text-green-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p>Searching for recipes...</p>
                    </div>
                  ) : (
                    <p>Select ingredients and click "Find Recipes" to discover recipes!</p>
                  )}
                </div>
              ) : (
                <RecipeResults recipes={recipes} />
              )}
              {hasMore && (
                <div className="mt-8 pb-4 flex-shrink-0">
                  <button
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-[1.02] shadow-md relative"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    <span className={loading ? 'opacity-0' : ''}>
                      Load More
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
