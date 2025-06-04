// backend/routes/recipes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

router.get('/', async (req, res) => {
  const { ingredients, limit = 20, offset = 0 } = req.query;

  try {
    let response;
    if (ingredients) {
      // Search by ingredients
      response = await axios.get('https://api.spoonacular.com/recipes/findByIngredients', {
        params: {
          ingredients,
          number: 60,
          apiKey: process.env.SPOONACULAR_API_KEY
        }
      });
    } else {
      // Get random recipes when no ingredients provided
      response = await axios.get('https://api.spoonacular.com/recipes/complexSearch', {
        params: {
          number: 60,
          addRecipeInformation: true,
          fillIngredients: true,
          apiKey: process.env.SPOONACULAR_API_KEY
        }
      });
      // Transform the response to match the format of findByIngredients
      response.data = response.data.results.map(recipe => ({
        ...recipe,
        missedIngredients: [],
        missedIngredientCount: 0,
        usedIngredients: [],
        usedIngredientCount: 0,
        likes: recipe.aggregateLikes || 0
      }));
    }

    const allResults = ingredients ? response.data : response.data;
    const paginatedResults = allResults.slice(offset, parseInt(offset) + parseInt(limit));

    res.json({
      recipes: paginatedResults,
      total: allResults.length,
      hasMore: parseInt(offset) + parseInt(limit) < allResults.length
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
