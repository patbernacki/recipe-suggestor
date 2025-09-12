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

  if (loading) return <div className="p-4">Loading...</div>;
  if (!recipe) return <div className="p-4">Recipe not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
      >
        <svg
          className="w-5 h-5 mr-2"
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
        Back to Recipes
      </button>

      <div className="sm-bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:space-x-6">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full md:w-1/2 rounded-lg object-cover mb-4 md:mb-0"
          />
          <div className="md:w-1/2 space-y-4">
            <h1 className="text-4xl font-bold">{recipe.title}</h1>
            <div className="flex space-x-6 text-gray-600 text-sm">
              <p><strong>👍 Likes:</strong> {likes}</p>
              <p><strong>🍽 Servings:</strong> {recipe.servings}</p>
              <p><strong>⏱ Ready in:</strong> {recipe.readyInMinutes} mins</p>
            </div>
            <div
              className="text-gray-700 text-sm"
              dangerouslySetInnerHTML={{ __html: recipe.summary }}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">🧾 Ingredients</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-800">
            {recipe.extendedIngredients?.map((ing) => (
              <li key={ing.id}>
                {ing.amount} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">📝 Instructions</h2>
          <div className="space-y-2 text-gray-800">
            {recipe.instructions ? (
              recipe.instructions
                .split(/<\/?li>/)
                .map((step) => step.replace(/<[^>]+>/g, '').trim())
                .filter((line) => line.trim().length > 0)
                .map((step, index) => (
                  <p key={index} className="pl-4 border-l-4 border-blue-500">
                    {step.replace(/<[^>]+>/g, '').trim()}
                  </p>
                ))
            ) : (
              <p>No instructions provided.</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            🔗 View Full Recipe
          </a>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetails;
