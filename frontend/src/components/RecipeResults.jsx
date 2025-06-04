import RecipeCard from './RecipeCard';

const RecipeResults = ({ recipes }) => {

  if (!recipes || recipes.length === 0) {
    return <p className="text-center text-gray-500">No recipes found.</p>;
  }

  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold mb-4">Recipe Results</h2>
      <div className="space-y-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </section>
  );
};

export default RecipeResults;
