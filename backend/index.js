// backend/index.js

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// API route to fetch recipes
app.get('/recipes', async (req, res) => {
  const ingredients = req.query.ingredients; // Get ingredients from query
  const apiKey = process.env.SPOONACULAR_API_KEY;

  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients`, {
      params: {
        ingredients: ingredients,
        number: 5, // Number of recipes to fetch
        apiKey: apiKey
      }
    });

    res.json(response.data); // Send the recipe data back to the frontend
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching recipes');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
