// src/pages/Home.jsx
import { useState } from 'react';
// import Header from '../components/Header';
import IngredientInput from '../components/IngredientInput';
import IngredientList from '../components/IngredientList';
import RecipeResults from '../components/RecipeResults';

const Home = () => {
  const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([
    {
        id: 1,
        title: "Spaghetti with Tomato Sauce",
        image: "https://via.placeholder.com/300x200.png?text=Spaghetti",
    },
    {
        id: 2,
        title: "Chicken Salad",
        image: "https://via.placeholder.com/300x200.png?text=Chicken+Salad",
    },
    ]);
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* <Header /> */}
      <main className="max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">What’s in your fridge?</h2>
        <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />
        <IngredientList ingredients={ingredients} setIngredients={setIngredients} />
        <button
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          onClick={() => alert('Search logic will go here')}
        >
          Find Recipes
        </button>
        <RecipeResults recipes={recipes} />
      </main>
    </div>
  );
};

export default Home;
