import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RecipeDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [likes, setLikes] = useState(null);
  const [loading, setLoading] = useState(true);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        const res = await axios.get(`${baseUrl}/recipes/${id}`);
        setRecipe(res.data);
        setLikes(location.state?.likes ?? res.data.aggregateLikes ?? 0);
      } catch (err) {
        console.error('Failed to fetch recipe details:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [id, location.state?.likes]);

  if (loading) return <div className="p-4"></div>;
  if (!recipe) return <div className="p-4">Recipe not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 group"
        >
          <svg
            className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium">Back to Recipes</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Hero Section */}
          <div className="relative">
            <img
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-48 sm:h-64 md:h-80 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 leading-tight">
                {recipe.title}
              </h1>
              <div className="flex flex-wrap gap-2 sm:gap-4 text-white text-xs sm:text-sm">
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                  <span>👍</span>
                  <span className="font-medium">{likes} likes</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                  <span>🍽</span>
                  <span className="font-medium">{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-1 bg-white/20 px-2 py-1 sm:px-3 sm:py-1 rounded-full">
                  <span>⏱</span>
                  <span className="font-medium">{recipe.readyInMinutes} mins</span>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="mb-8">
              <div
                className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: recipe.summary }}
              />
            </div>

            {/* Ingredients Section */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🧾</span>
                Ingredients
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {recipe.extendedIngredients?.map((ing) => (
                  <div key={ing.id} className="flex items-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate">{ing.name}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 font-medium ml-2 flex-shrink-0">
                      {ing.amount} {ing.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions Section */}
            <div className="mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📝</span>
                Instructions
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {recipe.instructions ? (
                  (() => {
                    const steps = recipe.instructions
                      .split(/<\/?li>/)
                      .map((step) => step.replace(/<[^>]+>/g, '').trim())
                      .filter((line) => line.trim().length > 0);
                    
                    return steps.map((step, index) => (
                      <div key={index} className={`flex gap-3 sm:gap-4 p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-200 ${steps.length === 1 ? 'justify-center' : ''}`}>
                        {steps.length > 1 && (
                          <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
                            {index + 1}
                          </div>
                        )}
                        <p className="text-gray-800 leading-relaxed flex-1 text-sm sm:text-base">
                          {step.replace(/<[^>]+>/g, '').trim()}
                        </p>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <p className="text-sm sm:text-base">No instructions provided.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Source Link */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6">
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <span>🔗</span>
                View Full Recipe
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
