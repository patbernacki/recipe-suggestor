// backend/routes/recipes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

router.get('/', async (req, res) => {
  const { ingredients, limit = 20, offset = 0, type } = req.query;

  try {
    // Always use complexSearch endpoint with different parameters based on whether ingredients are provided
    const params = {
      apiKey: process.env.SPOONACULAR_API_KEY,
      number: parseInt(limit),
      offset: parseInt(offset),
      addRecipeInformation: true,
      fillIngredients: true
    };

    // Add type filter if provided
    if (type) {
      params.type = type;
    }

    // If ingredients are provided, use them to filter recipes
    if (ingredients) {
      params.includeIngredients = ingredients;
      params.sort = 'min-missing-ingredients'; // Sort to prioritize recipes with more matching ingredients
      params.ranking = 2;
    }

    const response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
      params
    });

    const results = response.data.results.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      image: recipe.image,
      imageType: recipe.imageType,
      usedIngredientCount: recipe.usedIngredientCount || 0,
      missedIngredientCount: recipe.missedIngredientCount || 0,
      missedIngredients: recipe.missedIngredients || [],
      usedIngredients: recipe.usedIngredients || [],
      unusedIngredients: recipe.unusedIngredients || [],
      likes: recipe.aggregateLikes || 0
    }));

    res.json({
      recipes: results,
      total: response.data.totalResults,
      hasMore: (parseInt(offset) + results.length) < response.data.totalResults
    });
  } catch (error) {
    console.error('Error fetching recipes:', error.message);
    res.status(500).json({ message: 'Failed to fetch recipes' });
  }
});

// Get recipe details by ID
router.get('/:id', async (req, res) => {
  try {
    const response = await axios.get(`https://api.spoonacular.com/recipes/${req.params.id}/information`, {
      params: {
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recipe details:', error.message);
    res.status(500).json({ message: 'Failed to fetch recipe details' });
  }
});

module.exports = router;
