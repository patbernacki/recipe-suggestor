import { ThumbsUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  const maxMissingIngredientsToShow = 3;
  const displayedMissing = recipe.missedIngredients.slice(0, maxMissingIngredientsToShow);
  const hasExtraMissing = recipe.missedIngredients.length > maxMissingIngredientsToShow;

  return (
    <Link to={`/recipes/${recipe.id}`} state={{ likes: recipe.likes }} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow transition-shadow duration-200 hover:shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full md:w-48 h-auto object-cover rounded-xl"
          />

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">{recipe.title}</h3>
              <div className="flex items-center gap-1 text-green-600">
                <ThumbsUp size={18} />
                <span className="text-sm font-medium">{recipe.likes}</span>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-2">
              You have <strong>{recipe.usedIngredientCount}</strong>{' '}
              {recipe.usedIngredientCount === 1 ? 'ingredient' : 'ingredients'}.
            </p>

            {recipe.missedIngredientCount > 0 ? (
              <>
                <p className="text-sm text-red-600 mb-2">
                  Missing <strong>{recipe.missedIngredientCount}</strong>{' '}
                  {recipe.missedIngredientCount === 1 ? 'ingredient' : 'ingredients'}:
                </p>
                <ul className="text-sm list-disc list-inside text-gray-600">
                  {displayedMissing.map((ing, index) => (
                    <li key={ing.id}>
                      {ing.original}
                      {index === displayedMissing.length - 1 && hasExtraMissing && " and more..."}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-green-600 mb-2">
                🎉 You have all the ingredients!
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
