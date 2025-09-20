import React, { useState, useEffect } from 'react';
import CommonIngredients from './CommonIngredients';

const IngredientTabs = ({ 
  ingredients, 
  setIngredients, 
  disabled, 
  onAddIngredient, 
  onRemoveIngredient 
}) => {
  const [activeTab, setActiveTab] = useState('browse');

  const removeIngredient = async (ingredient) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
    
    if (onRemoveIngredient) {
      try {
        await onRemoveIngredient(ingredient);
      } catch (error) {
        console.error('Error removing ingredient from database:', error);
      }
    }
  };

  const clearAllIngredients = async () => {
    // Clear all ingredients from state immediately
    setIngredients([]);
    
    // If callback provided, remove all ingredients from database
    if (onRemoveIngredient) {
      try {
        // Remove all ingredients from database in parallel
        await Promise.all(ingredients.map(ingredient => onRemoveIngredient(ingredient)));
      } catch (error) {
        console.error('Error removing ingredients from database:', error);
        // Fallback: ingredients are already cleared from local state
      }
    }
  };

  return (
    <div className="mb-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('browse')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'browse'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Browse & Search
        </button>
        <button
          onClick={() => setActiveTab('selected')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors relative ${
            activeTab === 'selected'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Selected ({ingredients.length})
          {ingredients.length > 0 && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full"></span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'browse' && (
        <div>
          <BrowseTab
            ingredients={ingredients}
            setIngredients={setIngredients}
            disabled={disabled}
            onAddIngredient={onAddIngredient}
            onRemoveIngredient={onRemoveIngredient}
          />
        </div>
      )}

      {activeTab === 'selected' && (
        <div>
          <SelectedTab
            ingredients={ingredients}
            removeIngredient={removeIngredient}
            clearAllIngredients={clearAllIngredients}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

// Browse Tab Component
const BrowseTab = ({ 
  ingredients, 
  setIngredients, 
  disabled, 
  onAddIngredient, 
  onRemoveIngredient 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [commonSuggestions, setCommonSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const debouncedFetchSuggestions = async (searchQuery) => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setCommonSuggestions([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setLoading(true);
      setShowSearchResults(true);
      
      const [commonResponse, apiResponse] = await Promise.allSettled([
        fetch(`${baseUrl}/ingredients/common/search?query=${encodeURIComponent(searchQuery)}`),
        fetch(`${baseUrl}/ingredients/search?query=${encodeURIComponent(searchQuery)}`)
      ]);

      if (commonResponse.status === 'fulfilled' && commonResponse.value.ok) {
        const commonData = await commonResponse.value.json();
        setCommonSuggestions(commonData.results || []);
      } else {
        setCommonSuggestions([]);
      }

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
  };

  const addIngredient = async (ingredient) => {
    if (!ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
      
      if (onAddIngredient) {
        try {
          await onAddIngredient(ingredient);
        } catch (error) {
          console.error('Error saving ingredient to database:', error);
        }
      }
    }
    setQuery('');
    setSuggestions([]);
    setCommonSuggestions([]);
    setShowSearchResults(false);
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!disabled) {
        debouncedFetchSuggestions(query);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, disabled]);

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredients..."
            className={`w-full pl-9 pr-8 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm sm:text-base ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            }`}
            disabled={disabled}
          />
          
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={disabled}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {showSearchResults && (commonSuggestions.length > 0 || suggestions.length > 0) && !disabled && (
        <div className="mb-4 border border-gray-200 rounded-lg bg-white max-h-64 overflow-y-auto">
          <div className="p-3 pb-4">
            <div className="flex flex-wrap gap-1.5">
              {commonSuggestions.map((item) => (
                <button
                  key={item.name}
                  onClick={() => addIngredient(item.name)}
                  className="px-2 sm:px-2.5 py-1 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  {item.name}
                </button>
              ))}
              {suggestions.map((item) => (
                <button
                  key={item.name}
                  onClick={() => addIngredient(item.name)}
                  className="px-2 sm:px-2.5 py-1 text-xs sm:text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {showSearchResults && commonSuggestions.length === 0 && suggestions.length === 0 && query.trim() && !loading && (
        <div className="mb-4 p-2 text-sm text-gray-500 text-center">
          No ingredients found for "{query}"
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
    </div>
  );
};

// Selected Tab Component
const SelectedTab = ({ 
  ingredients, 
  removeIngredient, 
  clearAllIngredients, 
  disabled 
}) => {
  if (ingredients.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🥘</div>
        <p className="text-sm">No ingredients selected yet</p>
        <p className="text-xs text-gray-400 mt-1">Switch to the Browse tab to add ingredients</p>
      </div>
    );
  }

  return (
    <div>
      {/* Selected Ingredients List */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">
            {ingredients.length} ingredient{ingredients.length !== 1 ? 's' : ''} selected
          </h4>
          <button
            onClick={clearAllIngredients}
            disabled={disabled}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        </div>
        
        <div className="space-y-2 pb-4">
          {ingredients.map((item) => (
            <div
              key={item}
              className={`flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border ${
                disabled ? 'opacity-75' : ''
              }`}
            >
              <span className="text-gray-700 text-sm sm:text-base">{item}</span>
              <button
                onClick={() => !disabled && removeIngredient(item)}
                disabled={disabled}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-update notice */}
      <div className="text-center py-3 text-sm text-gray-500 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-center">
          <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recipes update automatically when you change ingredients
        </div>
      </div>
    </div>
  );
};

export default IngredientTabs;
