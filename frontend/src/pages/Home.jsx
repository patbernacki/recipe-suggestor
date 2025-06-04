import { useState, useEffect } from 'react';
import IngredientSelector from '../components/IngredientSelector';
import RecipeResults from '../components/RecipeResults';

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
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedDishType, setSelectedDishType] = useState('');
  const limit = 20;

  const fetchRecipes = async (isLoadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const query = ingredients.length > 0 ? ingredients.join(',') : '';
      let url = `${baseUrl}/recipes?${query ? `ingredients=${encodeURIComponent(query)}&` : ''}limit=${limit}&offset=${currentOffset}`;
      
      if (selectedDishType) {
        url += `&type=${encodeURIComponent(selectedDishType)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to fetch recipes');

      if (isLoadMore) {
        setRecipes(prev => [...prev, ...data.recipes]);
      } else {
        setRecipes(data.recipes);
      }

      setOffset(currentOffset + limit);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch recipes on initial load
  useEffect(() => {
    fetchRecipes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Ingredient Selection */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Select Your Ingredients</h2>
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
                    fetchRecipes(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {DISH_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <IngredientSelector ingredients={ingredients} setIngredients={setIngredients} />
              <button
                className={`w-full px-4 py-3 text-white rounded-lg transition-all transform hover:scale-[1.02] ${
                  ingredients.length > 0 
                    ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 shadow-md' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={() => fetchRecipes(false)}
                disabled={ingredients.length === 0}
              >
                {loading ? 'Searching...' : 'Search with Ingredients'}
              </button>
              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-4">Recipe Suggestions</h2>
            <div className="space-y-6">
              {recipes.length === 0 && !loading ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Select ingredients and search to discover recipes!</p>
                </div>
              ) : (
                <RecipeResults recipes={recipes} />
              )}
              {hasMore && (
                <div className="mt-8 pb-4">
                  <button
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:scale-[1.02] shadow-md"
                    onClick={() => fetchRecipes(true)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
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
