// backend/routes/recipes.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();
const knex = require('../db');
const authenticateToken = require('../middleware/auth');

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

// Get all saved recipes for the authenticated user
router.get('/saved', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    console.log('Fetching saved recipes for userId:', userId);
    const saved = await knex('saved_recipes')
      .where({ user_id: userId })
      .select('id', 'recipe_id', 'created_at');
    res.json({ saved });
  } catch (error) {
    console.error('Error fetching saved recipes:', error);
    console.error('userId:', userId);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: 'Failed to fetch saved recipes.' });
  }
});

// Save a recipe for the authenticated user
router.post('/save', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { recipe_id } = req.body;

  if (!recipe_id) {
    return res.status(400).json({ message: 'Recipe ID is required.' });
  }

  try {
    // Check if already saved
    const existing = await knex('saved_recipes')
      .where({ user_id: userId, recipe_id })
      .first();
    if (existing) {
      return res.status(200).json({ message: 'Recipe already saved.' });
    }
    // Insert new saved recipe
    await knex('saved_recipes').insert({ user_id: userId, recipe_id });
    res.status(201).json({ message: 'Recipe saved!' });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ message: 'Failed to save recipe.' });
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

// Remove a saved recipe by its saved_recipes table id
router.delete('/saved/:id', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const savedId = req.params.id;
  try {
    const deleted = await knex('saved_recipes')
      .where({ id: savedId, user_id: userId })
      .del();
    if (deleted) {
      res.json({ message: 'Saved recipe removed.' });
    } else {
      res.status(404).json({ message: 'Saved recipe not found.' });
    }
  } catch (error) {
    console.error('Error removing saved recipe:', error);
    res.status(500).json({ message: 'Failed to remove saved recipe.' });
  }
});

module.exports = router;
