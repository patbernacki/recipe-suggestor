const IngredientList = ({ ingredients, setIngredients }) => {
  const handleRemoveIngredient = (ingredient) => {
    setIngredients(ingredients.filter((item) => item !== ingredient));
  };

  return (
    <div className="mt-4">
      {ingredients.length > 0 ? (
        <ul className="space-y-2">
          {ingredients.map((ingredient, index) => (
            <li key={index} className="flex justify-between items-center bg-gray-200 p-2 rounded-md">
              <span>{ingredient}</span>
              <button
                onClick={() => handleRemoveIngredient(ingredient)}
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Add some ingredients to get started!</p>
      )}
    </div>
  );
};

export default IngredientList;
