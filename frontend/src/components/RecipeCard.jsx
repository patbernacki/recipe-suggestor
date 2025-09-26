import { ThumbsUp, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const RecipeCard = ({ recipe, isSaved, onRecipeClick }) => {
  const maxMissingIngredientsToShow = 3;
  const displayedMissing = recipe.missedIngredients?.slice(0, maxMissingIngredientsToShow) || [];
  const hasExtraMissing = (recipe.missedIngredients?.length || 0) > maxMissingIngredientsToShow;
  const { user, savedRecipes, refreshSavedRecipes } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [showLoginMessage, setShowLoginMessage] = useState(false);

  // Keep local saved state in sync with prop
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  // Find the saved entry for this recipe (if any)
  const savedEntry = savedRecipes.find(r => String(r.recipe_id) === String(recipe.id));

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If user is not logged in, show login message
    if (!user) {
      setShowLoginMessage(true);
      // Hide message after 3 seconds
      setTimeout(() => setShowLoginMessage(false), 3000);
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      if (!saved) {
        // Save recipe
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recipes/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ recipe_id: recipe.id }),
        });
        if (res.ok) {
          setSaved(true);
          refreshSavedRecipes();
        }
      } else if (savedEntry) {
        // Unsave recipe
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/recipes/saved/${savedEntry.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          setSaved(false);
          refreshSavedRecipes();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Link 
      to={`/recipes/${recipe.id}`} 
      state={{ likes: recipe.likes }} 
      className="block"
      onClick={onRecipeClick}
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-xl relative group">
        {/* Login Required Message */}
        {showLoginMessage && (
          <div className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-10 animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Sign in to save recipes</span>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-4 p-4">
          <div className="relative">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full lg:w-48 h-40 sm:h-48 lg:h-auto object-cover rounded-lg"
            />
            {/* Likes overlay */}
            <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-medium">
              <ThumbsUp fill="currentColor" color="currentColor" size={14} />
              <span>{recipe.likes || recipe.aggregateLikes || 0}</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-3 gap-2">
              <h3 className="text-lg sm:text-xl font-semibold leading-tight text-gray-900">{recipe.title}</h3>
              <button
                type="button"
                className={`p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 ${
                  saved ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-green-600'
                }`}
                onClick={handleSave}
                disabled={saving}
                title={user ? (saved ? 'Unsave recipe' : 'Save recipe') : 'Login to save'}
              >
                <Star fill={saved ? '#22c55e' : 'none'} color={saved ? '#22c55e' : '#9ca3af'} size={20} />
              </button>
            </div>

            {recipe.usedIngredientCount !== undefined ? (
              <>
                <p className="text-sm text-gray-700 mb-3">
                  You have <strong className="text-blue-600">{recipe.usedIngredientCount}</strong>{' '}
                  {recipe.usedIngredientCount === 1 ? 'ingredient' : 'ingredients'}.
                </p>

                {recipe.missedIngredientCount > 0 ? (
                  <>
                    <p className="text-sm text-red-600 mb-2 font-medium">
                      Missing <strong>{recipe.missedIngredientCount}</strong>{' '}
                      {recipe.missedIngredientCount === 1 ? 'ingredient' : 'ingredients'}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {displayedMissing.map((ing, index) => (
                        <span key={ing.id} className="text-xs bg-red-50 text-red-700 px-2.5 py-1.5 rounded-md border border-red-200 font-medium">
                          {ing.name}
                          {index === displayedMissing.length - 1 && hasExtraMissing && " +more"}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200 w-fit">
                    <span>🎉</span>
                    <span className="font-medium">You have all the ingredients!</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600">
                Click to view recipe details and ingredients.
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
