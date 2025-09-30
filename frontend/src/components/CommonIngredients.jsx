import { useState, useEffect } from 'react';

const CommonIngredients = ({ ingredients, setIngredients, disabled, onAddIngredient, onRemoveIngredient }) => {
  const [commonIngredients, setCommonIngredients] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(new Set(['proteins', 'vegetables', 'grains'])); // Default expanded categories
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // Fetch common ingredients data
  useEffect(() => {
    const fetchCommonIngredients = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${baseUrl}/ingredients/common`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch common ingredients');
        }
        
        const data = await response.json();
        setCommonIngredients(data.ingredients);
        setCategories(data.categories);
      } catch (err) {
        console.error('Error fetching common ingredients:', err);
        setError('Failed to load common ingredients');
      } finally {
        setLoading(false);
      }
    };

    fetchCommonIngredients();
  }, [baseUrl]);


  const addIngredient = async (ingredient) => {
    if (!ingredients.includes(ingredient)) {
      console.log('Adding ingredient:', ingredient, 'Current ingredients:', ingredients);
      setIngredients([...ingredients, ingredient]);
      
      // If callback provided, use it (for database operations)
      if (onAddIngredient) {
        try {
          console.log('Saving ingredient to database:', ingredient);
          await onAddIngredient(ingredient);
          console.log('Successfully saved ingredient to database:', ingredient);
        } catch (error) {
          console.error('Error saving ingredient to database:', error);
          // Fallback: ingredient is already in local state
        }
      }
    }
  };

  const removeIngredient = async (ingredient) => {
    setIngredients(ingredients.filter((i) => i !== ingredient));
    
    // If callback provided, use it (for database operations)
    if (onRemoveIngredient) {
      try {
        await onRemoveIngredient(ingredient);
      } catch (error) {
        console.error('Error removing ingredient from database:', error);
        // Fallback: ingredient is already removed from local state
      }
    }
  };

  const toggleCategory = (categoryKey) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  const isIngredientSelected = (ingredient) => {
    return ingredients.includes(ingredient);
  };

  const renderIngredientButton = (ingredient) => {
    const isSelected = isIngredientSelected(ingredient);
    
    return (
      <button
        key={ingredient}
        onClick={() => isSelected ? removeIngredient(ingredient) : addIngredient(ingredient)}
        disabled={disabled}
        className={`px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
          isSelected
            ? 'bg-teal-500 text-white border border-teal-500 shadow-sm hover:bg-teal-600'
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {ingredient}
      </button>
    );
  };

  const getCategoryIcon = (categoryKey) => {
    const icons = {
      proteins: "🥩",
      vegetables: "🥬", 
      fruits: "🍎",
      grains: "🌾",
      dairy: "🥛",
      herbs_spices: "🌿",
      oils_vinegars: "🫒",
      nuts_seeds: "🥜",
      canned_packaged: "🥫",
      frozen: "🧊",
      baking: "🧁"
    };
    return icons[categoryKey] || "📦";
  };

  const renderCategory = (category) => {
    const isExpanded = expandedCategories.has(category.key);
    const categoryIngredients = commonIngredients[category.key] || [];
    
    return (
      <div key={category.key} className="mb-4">
        <button
          onClick={() => toggleCategory(category.key)}
          disabled={disabled}
          className={`w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${isExpanded ? 'border-orange-300 bg-orange-50 shadow-md' : ''}`}
        >
          <div className="flex items-center">
            <span className="text-xl mr-3">{getCategoryIcon(category.key)}</span>
            <span className="font-semibold text-gray-900">{category.name}</span>
            <span className="ml-3 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{category.count}</span>
          </div>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isExpanded && (
          <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex flex-wrap gap-2">
              {categoryIngredients.map(renderIngredientButton)}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-center py-6">
          <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Categories */}
      <div className="space-y-4">
        {categories.map(renderCategory)}
      </div>
    </div>
  );
};

export default CommonIngredients;
