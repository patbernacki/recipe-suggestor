import RecipeCard from './RecipeCard';
import { useAuth } from '../context/AuthContext';

const RecipeResults = ({ recipes }) => {
  const { savedRecipes } = useAuth();
  const savedRecipeIds = new Set(savedRecipes.map(r => r.recipe_id));

  if (!recipes || recipes.length === 0) {
    return <p className="text-center text-gray-500">No recipes found.</p>;
  }

  return (
    <section >
      <div className="space-y-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} isSaved={savedRecipeIds.has(String(recipe.id))} />
        ))}
      </div>
    </section>
  );
};

export default RecipeResults;
