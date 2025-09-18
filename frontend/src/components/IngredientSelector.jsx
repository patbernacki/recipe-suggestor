import { useEffect, useState, useCallback } from 'react';
import CommonIngredients from './CommonIngredients';

const IngredientSelector = ({ ingredients, setIngredients, disabled, onAddIngredient, onRemoveIngredient, onSearchRecipes }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [commonSuggestions, setCommonSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const debouncedFetchSuggestions = useCallback(async (searchQuery) => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setCommonSuggestions([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setLoading(true);
      setShowSearchResults(true);
      
      // Search both common ingredients and API in parallel
      const [commonResponse, apiResponse] = await Promise.allSettled([
        fetch(`${baseUrl}/ingredients/common/search?query=${encodeURIComponent(searchQuery)}`),
        fetch(`${baseUrl}/ingredients/search?query=${encodeURIComponent(searchQuery)}`)
      ]);

      // Handle common ingredients results
      if (commonResponse.status === 'fulfilled' && commonResponse.value.ok) {
        const commonData = await commonResponse.value.json();
        setCommonSuggestions(commonData.results || []);
      } else {
        setCommonSuggestions([]);
      }

      // Handle API results
      if (apiResponse.status === 'fulfilled' && apiResponse.value.ok) {
        const apiData = await apiResponse.value.json();
        setSuggestions(apiData.results || []);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error('Error fetching ingredient suggestions:', err.message);
      setSuggestions([]);
      setCommonSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!disabled) {
        debouncedFetchSuggestions(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, debouncedFetchSuggestions, disabled]);

  const addIngredient = async (ingredient) => {
    if (!ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
      
      // If callback provided, use it (for database operations)
      if (onAddIngredient) {
        try {
          await onAddIngredient(ingredient);
        } catch (error) {
          console.error('Error saving ingredient to database:', error);
          // Fallback: ingredient is already in local state
        }
      }
    }
    setQuery('');
    setSuggestions([]);
    setCommonSuggestions([]);
    setShowSearchResults(false);
  };

  const removeIngredient = async (ingredient) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
    
    // If callback provided, use it (for database operations)
    if (onRemoveIngredient) {
      try {
        await onRemoveIngredient(ingredient);
      } catch (error) {
        console.error('Error removing ingredient from database:', error);
        // Fallback: ingredient is already removed from local state
      }
    }
  };

  return (
    <div className="mb-6">
      {/* Selected Ingredients - Show at top when ingredients are selected */}
      {ingredients.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-green-800">
              Selected Ingredients ({ingredients.length})
            </h4>
            <button
              onClick={() => {
                ingredients.forEach(ingredient => removeIngredient(ingredient));
              }}
              disabled={disabled}
              className="text-xs text-green-600 hover:text-green-800 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((item) => (
              <div
                key={item}
                className={`flex items-center bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium ${
                  disabled ? 'opacity-75' : ''
                }`}
              >
                <span className="mr-2">{item}</span>
                <button
                  onClick={() => !disabled && removeIngredient(item)}
                  disabled={disabled}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Search Bar */}
      <div className="mb-6">
        <label htmlFor="ingredient" className="block text-sm font-medium text-gray-700 mb-2">
          Search for ingredients
        </label>
        <div className="relative">
          {/* Search Icon */}
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            id="ingredient"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. chicken, rice, tomato..."
            className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
            disabled={disabled}
          />
          
          {/* Right side icons */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={disabled}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
        
        {/* Helper text */}
        <p className="mt-2 text-sm text-gray-500">
          Search for specific ingredients or browse common ones below
        </p>
      </div>

      {/* Search Results */}
      {showSearchResults && (commonSuggestions.length > 0 || suggestions.length > 0) && !disabled && (
        <div className="mb-6 border border-gray-200 rounded-lg bg-white shadow-sm max-h-80 overflow-y-auto">
          {/* Common Ingredients Results */}
          {commonSuggestions.length > 0 && (
            <div className="p-4 border-b border-gray-100 bg-green-50">
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">⭐</span>
                <h4 className="text-sm font-semibold text-green-800">Common Ingredients</h4>
                <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                  {commonSuggestions.length} found
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {commonSuggestions.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => addIngredient(item.name)}
                    className="px-3 py-1.5 text-sm bg-white text-green-700 border border-green-200 rounded-full hover:bg-green-100 hover:border-green-300 transition-all shadow-sm"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* API Results */}
          {suggestions.length > 0 && (
            <div className="p-4">
              <div className="flex items-center mb-3">
                <span className="text-lg mr-2">🔍</span>
                <h4 className="text-sm font-semibold text-blue-800">Other Ingredients</h4>
                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  {suggestions.length} found
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {suggestions.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => addIngredient(item.name)}
                    className="text-left p-2 hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-200"
                  >
                    <span className="text-gray-700">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {showSearchResults && commonSuggestions.length === 0 && suggestions.length === 0 && query.trim() && !loading && (
        <div className="mb-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No ingredients found for "{query}"</p>
        </div>
      )}

      {/* Search with Ingredients Button */}
      {ingredients.length > 0 && (
        <div className="mb-6">
          <button
            className={`w-full px-4 py-3 text-white rounded-lg transition-all transform hover:scale-[1.02] relative ${
              ingredients.length > 0 && !disabled
                ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            onClick={onSearchRecipes}
            disabled={ingredients.length === 0 || disabled}
          >
            <span className={disabled ? 'opacity-0' : ''}>
              Search with Ingredients ({ingredients.length})
            </span>
            {disabled && (
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

      {/* Browse Common Ingredients */}
      {!showSearchResults && (
        <CommonIngredients
          ingredients={ingredients}
          setIngredients={setIngredients}
          disabled={disabled}
          onAddIngredient={onAddIngredient}
          onRemoveIngredient={onRemoveIngredient}
        />
      )}

      {/* Empty state when no ingredients selected and no search */}
      {ingredients.length === 0 && !showSearchResults && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🥘</div>
          <p className="text-sm">Start by searching for ingredients or browsing common ones below</p>
        </div>
      )}
    </div>
  );
};

export default IngredientSelector;
