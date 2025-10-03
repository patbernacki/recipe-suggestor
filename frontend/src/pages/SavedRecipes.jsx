import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';

const SavedRecipes = () => {
  const { user, savedRecipes, loading } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [fetchingRecipes, setFetchingRecipes] = useState(false);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (user && savedRecipes.length > 0) {
      fetchSavedRecipeDetails();
    } else {
      setRecipes([]);
    }
  }, [user, savedRecipes]);

  const fetchSavedRecipeDetails = async () => {
    setFetchingRecipes(true);
    setError(null);

    try {
      // Fetch recipe details for each saved recipe
      const recipePromises = savedRecipes.map(async (savedRecipe) => {
        try {
          const response = await fetch(`${baseUrl}/recipes/${savedRecipe.recipe_id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch recipe ${savedRecipe.recipe_id}`);
          }
          const recipeData = await response.json();
          
          // Add the saved recipe ID to the recipe data for reference
          return {
            ...recipeData,
            savedRecipeId: savedRecipe.id
          };
        } catch (error) {
          console.error(`Error fetching recipe ${savedRecipe.recipe_id}:`, error);
          return null;
        }
      });

      const recipeResults = await Promise.all(recipePromises);
      const validRecipes = recipeResults.filter(recipe => recipe !== null);
      setRecipes(validRecipes);
    } catch (error) {
      console.error('Error fetching saved recipe details:', error);
      setError('Failed to load saved recipes');
    } finally {
      setFetchingRecipes(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Saved Recipes</h1>
          <p className="text-gray-600 mb-6">Please log in to view your saved recipes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="sm:text-3xl text-xl font-bold text-gray-900">Your Saved Recipes</h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="sm:hidden">Back</span>
            <span className="hidden sm:inline">Back to Recipes</span>          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="mt-2 text-sm text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {fetchingRecipes ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved recipes yet</h2>
            <p className="text-gray-600 mb-6">Start exploring recipes and save your favorites!</p>
            <a 
              href="/" 
              className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Browse Recipes
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} isSaved={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedRecipes; 