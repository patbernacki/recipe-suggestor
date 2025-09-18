const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { COMMON_INGREDIENTS, getCategories, searchIngredients } = require('../data/common-ingredients');

router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.status(400).json({ message: 'Query must be at least 2 characters long.' });
  }

  try {
    const response = await axios.get('https://api.spoonacular.com/food/ingredients/autocomplete', {
      params: {
        query,
        number: 15,
        apiKey: process.env.SPOONACULAR_API_KEY
      }
    });

    // Fix: wrap results and reduce unnecessary fields
    const formatted = response.data.map(item => ({
      name: item.name,
    }));

    res.json({ results: formatted });

  } catch (error) {
    console.error('Error fetching ingredient suggestions:', error.message);
    res.status(500).json({ message: 'Failed to fetch ingredient suggestions' });
  }
});

// Get user's saved ingredients
router.get('/saved', auth, async (req, res) => {
  try {
    const savedIngredients = await db('saved_ingredients')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .select('ingredient_name', 'created_at');

    res.json({ 
      ingredients: savedIngredients.map(item => item.ingredient_name),
      count: savedIngredients.length 
    });
  } catch (error) {
    console.error('Error fetching saved ingredients:', error.message);
    res.status(500).json({ message: 'Failed to fetch saved ingredients' });
  }
});

// Save ingredient to user's preferences
router.post('/save', auth, async (req, res) => {
  try {
    const { ingredientName } = req.body;
    
    if (!ingredientName || typeof ingredientName !== 'string') {
      return res.status(400).json({ message: 'Ingredient name is required' });
    }

    // Check if ingredient already exists for this user
    const existing = await db('saved_ingredients')
      .where({ user_id: req.user.id, ingredient_name: ingredientName })
      .first();

    if (existing) {
      return res.status(409).json({ message: 'Ingredient already saved' });
    }

    // Save new ingredient
    await db('saved_ingredients').insert({
      user_id: req.user.id,
      ingredient_name: ingredientName
    });

    res.status(201).json({ message: 'Ingredient saved successfully' });
  } catch (error) {
    console.error('Error saving ingredient:', error.message);
    res.status(500).json({ message: 'Failed to save ingredient' });
  }
});

// Remove ingredient from user's preferences
router.delete('/remove', auth, async (req, res) => {
  try {
    const { ingredientName } = req.body;
    
    if (!ingredientName || typeof ingredientName !== 'string') {
      return res.status(400).json({ message: 'Ingredient name is required' });
    }

    const deleted = await db('saved_ingredients')
      .where({ user_id: req.user.id, ingredient_name: ingredientName })
      .del();

    if (deleted === 0) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }

    res.json({ message: 'Ingredient removed successfully' });
  } catch (error) {
    console.error('Error removing ingredient:', error.message);
    res.status(500).json({ message: 'Failed to remove ingredient' });
  }
});

// Save multiple ingredients at once
router.post('/save-multiple', auth, async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ message: 'Ingredients must be an array' });
    }

    if (ingredients.length === 0) {
      return res.status(400).json({ message: 'At least one ingredient is required' });
    }

    // Get existing ingredients for this user to avoid duplicates
    const existing = await db('saved_ingredients')
      .where('user_id', req.user.id)
      .whereIn('ingredient_name', ingredients)
      .pluck('ingredient_name');

    // Filter out existing ingredients
    const newIngredients = ingredients.filter(name => !existing.includes(name));

    if (newIngredients.length === 0) {
      return res.json({ message: 'All ingredients already saved' });
    }

    // Insert new ingredients
    const ingredientsToInsert = newIngredients.map(name => ({
      user_id: req.user.id,
      ingredient_name: name
    }));

    await db('saved_ingredients').insert(ingredientsToInsert);

    res.status(201).json({ 
      message: `${newIngredients.length} ingredient(s) saved successfully`,
      saved: newIngredients,
      alreadyExists: existing
    });
  } catch (error) {
    console.error('Error saving multiple ingredients:', error.message);
    res.status(500).json({ message: 'Failed to save ingredients' });
  }
});

// Get common ingredients organized by categories
router.get('/common', (req, res) => {
  try {
    res.json({
      categories: getCategories(),
      ingredients: COMMON_INGREDIENTS
    });
  } catch (error) {
    console.error('Error fetching common ingredients:', error.message);
    res.status(500).json({ message: 'Failed to fetch common ingredients' });
  }
});

// Search common ingredients
router.get('/common/search', (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 1) {
      return res.status(400).json({ message: 'Query is required' });
    }
    
    const results = searchIngredients(query);
    res.json({ results });
  } catch (error) {
    console.error('Error searching common ingredients:', error.message);
    res.status(500).json({ message: 'Failed to search common ingredients' });
  }
});

module.exports = router;
