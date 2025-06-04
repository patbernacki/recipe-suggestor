import { useState } from 'react';


function IngredientInput({ ingredients, setIngredients }) {
  const [ingredient, setIngredient] = useState('');
  
  const handleAddIngredient = () => {
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients([...ingredients, ingredient.trim()]);
      setIngredient('');
    }
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
        handleAddIngredient();
    }
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Add an ingredient"
        value={ingredient}
        onChange={(e) => setIngredient(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border rounded px-3 py-2 w-full"
      />
      <button
        onClick={handleAddIngredient}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Add
      </button>
    </div>
  );
}

export default IngredientInput;
