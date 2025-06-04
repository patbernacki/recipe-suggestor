import { useEffect, useState } from 'react';

const IngredientSelector = ({ ingredients, setIngredients }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length === 0) return;

      try {
        setLoading(true);
        const res = await fetch(`${baseUrl}/ingredients/search?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch (err) {
        console.error('Error fetching ingredient suggestions:', err.message);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const addIngredient = (ingredient) => {
    if (!ingredients.includes(ingredient)) {
      setIngredients([...ingredients, ingredient]);
    }
    setQuery('');
    setSuggestions([]);
  };

  const removeIngredient = (ingredient) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
  };

  return (
    <div className="mb-6">
      <label htmlFor="ingredient" className="block text-sm font-medium text-gray-700 mb-1">
        Search for ingredients
      </label>
      <input
        id="ingredient"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. chicken, rice, tomato..."
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      {loading && <p className="text-sm text-gray-500">Searching...</p>}

      {suggestions.length > 0 && (
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
                className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full"
              >
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="mr-2"
                  onClick={() => removeIngredient(item)}
                />
                {item}
              </label>
            ))}
          </div>
        </div>
      )}

      {ingredients.length === 0 && (
        <p className="text-sm font-medium mb-2">You currently do no have any ingredients</p>
      )}
    </div>
  );
};

export default IngredientSelector;
