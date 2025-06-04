const express = require('express');
const axios = require('axios');
const router = express.Router();

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

module.exports = router;
