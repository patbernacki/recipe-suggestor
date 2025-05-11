// src/components/RecipeResults.jsx
const RecipeResults = ({ recipes }) => {
  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Recipe Results</h3>
      {recipes.length === 0 ? (
        <p className="text-gray-500">No recipes to display yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white shadow rounded p-4 hover:shadow-lg transition"
            >
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-40 object-cover rounded mb-2"
              />
              <h4 className="text-lg font-medium">{recipe.title}</h4>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeResults;
