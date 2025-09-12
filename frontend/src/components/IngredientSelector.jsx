import { useEffect, useState, useCallback } from 'react';

const IngredientSelector = ({ ingredients, setIngredients, disabled, onAddIngredient, onRemoveIngredient }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  const debouncedFetchSuggestions = useCallback(async (searchQuery) => {
    if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const res = await fetch(
        `${baseUrl}/ingredients/search?query=${encodeURIComponent(searchQuery)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Failed to fetch suggestions');
      
      const data = await res.json();
      setSuggestions(data.results || []);
    } catch (err) {
      console.error('Error fetching ingredient suggestions:', err.message);
      setSuggestions([]);
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
      <label htmlFor="ingredient" className="block text-sm font-medium text-gray-700 mb-1">
        Search for ingredients
      </label>
      <div className="relative">
        <input
          id="ingredient"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. chicken, rice, tomato..."
          className={`w-full p-2 border border-gray-300 rounded mb-2 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
          disabled={disabled}
        />
        {loading && (
          <div className="absolute right-3 top-2">
            <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {suggestions.length > 0 && !disabled && (
        <ul className="border border-gray-200 rounded p-2 bg-white max-h-40 overflow-y-auto">
          {suggestions.map((item) => (
            <li
              key={item.name}
              onClick={() => addIngredient(item.name)}
              className="cursor-pointer p-1 hover:bg-gray-100"
            >
              {item.name}
            </li>
          ))}
        </ul>
      )}

      {ingredients.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">Selected Ingredients:</p>
          <div className="flex flex-wrap gap-2">
            {ingredients.map((item) => (
              <label
                key={item}
                className={`flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full ${
                  disabled ? 'opacity-75' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="mr-2"
                  onClick={() => !disabled && removeIngredient(item)}
                  disabled={disabled}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      )}

      {ingredients.length === 0 && (
        <p className="text-sm text-gray-500 mb-2">No ingredients selected yet</p>
      )}
    </div>
  );
};

export default IngredientSelector;
