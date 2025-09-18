// Common ingredients organized by categories for quick selection
// This data can be served to the frontend for easy ingredient selection

const COMMON_INGREDIENTS = {
  proteins: [
    'chicken breast', 'chicken thighs', 'ground beef', 'ground turkey', 'ground pork',
    'salmon', 'tuna', 'shrimp', 'eggs', 'tofu', 'tempeh', 'black beans', 'chickpeas',
    'lentils', 'kidney beans', 'pinto beans', 'bacon', 'sausage', 'ham', 'turkey',
    'beef steak', 'pork chops', 'lamb', 'crab', 'lobster', 'mussels', 'scallops'
  ],
  
  vegetables: [
    'onion', 'garlic', 'tomato', 'bell pepper', 'carrot', 'celery', 'potato',
    'sweet potato', 'broccoli', 'cauliflower', 'spinach', 'lettuce', 'cucumber',
    'zucchini', 'eggplant', 'mushrooms', 'corn', 'green beans', 'asparagus',
    'cabbage', 'kale', 'arugula', 'radish', 'beet', 'turnip', 'leek', 'shallot',
    'ginger', 'jalapeño', 'avocado', 'artichoke', 'brussels sprouts', 'squash'
  ],
  
  fruits: [
    'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry',
    'raspberry', 'blackberry', 'grape', 'peach', 'pear', 'plum', 'cherry',
    'pineapple', 'mango', 'kiwi', 'coconut', 'pomegranate', 'cranberry',
    'fig', 'date', 'apricot', 'nectarine', 'watermelon', 'cantaloupe'
  ],
  
  grains: [
    'rice', 'brown rice', 'quinoa', 'oats', 'barley', 'bulgur', 'couscous',
    'pasta', 'spaghetti', 'penne', 'macaroni', 'bread', 'whole wheat bread',
    'bagel', 'tortilla', 'pita bread', 'naan', 'crackers', 'cereal',
    'flour', 'breadcrumbs', 'cornmeal', 'polenta', 'wild rice', 'farro'
  ],
  
  dairy: [
    'milk', 'butter', 'cheese', 'cheddar cheese', 'mozzarella', 'parmesan',
    'cream cheese', 'yogurt', 'greek yogurt', 'sour cream', 'heavy cream',
    'half and half', 'buttermilk', 'ricotta', 'cottage cheese', 'feta',
    'goat cheese', 'swiss cheese', 'provolone', 'blue cheese', 'brie'
  ],
  
  herbs_spices: [
    'salt', 'black pepper', 'garlic powder', 'onion powder', 'paprika',
    'cumin', 'oregano', 'basil', 'thyme', 'rosemary', 'parsley', 'cilantro',
    'dill', 'bay leaves', 'red pepper flakes', 'cayenne pepper', 'chili powder',
    'cinnamon', 'nutmeg', 'ginger powder', 'turmeric', 'curry powder',
    'italian seasoning', 'herbes de provence', 'sage', 'tarragon', 'mint'
  ],
  
  oils_vinegars: [
    'olive oil', 'vegetable oil', 'canola oil', 'coconut oil', 'sesame oil',
    'balsamic vinegar', 'white vinegar', 'apple cider vinegar', 'red wine vinegar',
    'rice vinegar', 'soy sauce', 'worcestershire sauce', 'hot sauce', 'sriracha'
  ],
  
  nuts_seeds: [
    'almonds', 'walnuts', 'pecans', 'cashews', 'pistachios', 'peanuts',
    'sunflower seeds', 'pumpkin seeds', 'chia seeds', 'flax seeds', 'sesame seeds',
    'hazelnuts', 'macadamia nuts', 'pine nuts', 'brazil nuts', 'hemp seeds'
  ],
  
  canned_packaged: [
    'tomato sauce', 'tomato paste', 'diced tomatoes', 'crushed tomatoes',
    'coconut milk', 'chicken broth', 'beef broth', 'vegetable broth',
    'canned beans', 'canned corn', 'canned tuna', 'canned salmon',
    'pasta sauce', 'salsa', 'olives', 'capers', 'anchovies', 'sun-dried tomatoes'
  ],
  
  frozen: [
    'frozen vegetables', 'frozen fruit', 'frozen berries', 'frozen peas',
    'frozen corn', 'frozen spinach', 'frozen shrimp', 'frozen fish',
    'ice cream', 'frozen yogurt', 'frozen waffles', 'frozen pizza'
  ],
  
  baking: [
    'sugar', 'brown sugar', 'powdered sugar', 'honey', 'maple syrup',
    'vanilla extract', 'baking powder', 'baking soda', 'yeast', 'cocoa powder',
    'chocolate chips', 'dark chocolate', 'milk chocolate', 'white chocolate',
    'coconut flakes', 'raisins', 'dried cranberries', 'almond extract'
  ]
};

// Get all ingredients as a flat array
const getAllIngredients = () => {
  return Object.values(COMMON_INGREDIENTS).flat();
};

// Get ingredients by category
const getIngredientsByCategory = (category) => {
  return COMMON_INGREDIENTS[category] || [];
};

// Get all categories
const getCategories = () => {
  return Object.keys(COMMON_INGREDIENTS).map(key => ({
    key,
    name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    count: COMMON_INGREDIENTS[key].length
  }));
};

// Search ingredients across all categories
const searchIngredients = (query) => {
  const searchTerm = query.toLowerCase();
  const results = [];
  
  Object.entries(COMMON_INGREDIENTS).forEach(([category, ingredients]) => {
    ingredients.forEach(ingredient => {
      if (ingredient.toLowerCase().includes(searchTerm)) {
        results.push({
          name: ingredient,
          category: category
        });
      }
    });
  });
  
  return results;
};

module.exports = {
  COMMON_INGREDIENTS,
  getAllIngredients,
  getIngredientsByCategory,
  getCategories,
  searchIngredients
};
