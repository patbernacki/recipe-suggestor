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
      setIngredients([...ingredients, ingredient]);
      
      // If callback provided, use it (for database operations)
      if (onAddIngredient) {
        try {
          await onAddIngredient(ingredient);
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
        className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 ${
          isSelected
            ? 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
            : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200 hover:border-gray-300'
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
      <div key={category.key} className="mb-3">
        <button
          onClick={() => toggleCategory(category.key)}
          disabled={disabled}
          className={`w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          } ${isExpanded ? 'border-green-300 bg-green-50' : ''}`}
        >
          <div className="flex items-center">
            <span className="text-2xl mr-3">{getCategoryIcon(category.key)}</span>
            <div>
              <span className="font-medium text-gray-900">{category.name}</span>
              <span className="ml-2 text-sm text-gray-500">({category.count})</span>
            </div>
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
          <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Common Ingredients</h3>
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-2 text-gray-600">Loading common ingredients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Common Ingredients</h3>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const expandAllCategories = () => {
    const allCategoryKeys = categories.map(cat => cat.key);
    setExpandedCategories(new Set(allCategoryKeys));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const allExpanded = categories.length > 0 && categories.every(cat => expandedCategories.has(cat.key));
  const someExpanded = Array.from(expandedCategories).length > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Browse Common Ingredients</h3>
        <div className="flex gap-2">
          <button
            onClick={expandAllCategories}
            disabled={disabled || allExpanded}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              allExpanded || disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Expand All
          </button>
          <button
            onClick={collapseAllCategories}
            disabled={disabled || !someExpanded}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              !someExpanded || disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Collapse All
          </button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="space-y-3">
        {categories.map(renderCategory)}
      </div>
    </div>
  );
};

export default CommonIngredients;
