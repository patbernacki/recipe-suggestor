import { useState, useEffect } from 'react';
import IngredientSelector from '../components/IngredientSelector';
import RecipeResults from '../components/RecipeResults';

const Home = () => {
  const [ingredients, setIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const fetchRecipes = async (isLoadMore = false) => {
    setLoading(true);
    setError(null);

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const query = ingredients.length > 0 ? ingredients.join(',') : '';
      const url = `${baseUrl}/recipes?${query ? `ingredients=${encodeURIComponent(query)}&` : ''}limit=${limit}&offset=${currentOffset}`;
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
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <main className="container mx-auto p-4 h-screen flex">
        {/* Left: Ingredient Selection */}
        <div className="w-full max-w-md pr-4 flex flex-col h-full">
          <div className="bg-white rounded-lg shadow-sm p-6 flex-1 overflow-y-auto">
            <IngredientSelector ingredients={ingredients} setIngredients={setIngredients} />
            <button
              className={`mt-4 w-full px-4 py-2 text-white rounded transition-colors ${
                ingredients.length > 0 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={() => fetchRecipes(false)}
              disabled={ingredients.length === 0}
            >
              {loading ? 'Searching...' : 'Search with Ingredients'}
            </button>
            {error && <p className="text-red-600 mt-4">{error}</p>}
          </div>
        </div>

        {/* Right: Results */}
        <div className="flex-1 pl-4 flex flex-col h-full">
          <div className="bg-white rounded-lg shadow-sm p-6 flex-1 overflow-y-auto">
            <div className="space-y-4">
              <RecipeResults recipes={recipes} />
              {hasMore && (
                <div className="mt-8 pb-4">
                  <button
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
      </main>
    </div>
  );
};

export default Home;
