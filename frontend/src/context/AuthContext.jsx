import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedIngredients, setSavedIngredients] = useState([]);
  const [logoutTrigger, setLogoutTrigger] = useState(0); // Add logout trigger for force refresh
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
      fetchSavedRecipes(token);
      fetchSavedIngredients(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedRecipes = async (token) => {
    try {
      const response = await axios.get(`${baseUrl}/recipes/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedRecipes(response.data.saved || []);
    } catch (error) {
      console.error('Error fetching saved recipes:', error.response?.data || error.message);
      setSavedRecipes([]);
    }
  };

  const fetchSavedIngredients = async (token) => {
    try {
      const response = await axios.get(`${baseUrl}/ingredients/saved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedIngredients(response.data.ingredients || []);
    } catch (error) {
      console.error('Error fetching saved ingredients:', error.response?.data || error.message);
      setSavedIngredients([]);
    }
  };

  const refreshSavedRecipes = () => {
    const token = localStorage.getItem('token');
    if (token) fetchSavedRecipes(token);
  };

  const saveIngredient = async (ingredientName) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      await axios.post(`${baseUrl}/ingredients/save`, 
        { ingredientName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      if (!savedIngredients.includes(ingredientName)) {
        setSavedIngredients(prev => [...prev, ingredientName]);
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to save ingredient'
      };
    }
  };

  const removeIngredient = async (ingredientName) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      await axios.delete(`${baseUrl}/ingredients/remove`, {
        data: { ingredientName },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setSavedIngredients(prev => prev.filter(name => name !== ingredientName));
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove ingredient'
      };
    }
  };

  const saveMultipleIngredients = async (ingredients) => {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await axios.post(`${baseUrl}/ingredients/save-multiple`, 
        { ingredients },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state with new ingredients
      const newIngredients = response.data.saved || [];
      setSavedIngredients(prev => {
        const existing = new Set(prev);
        newIngredients.forEach(name => existing.add(name));
        return Array.from(existing);
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to save ingredients'
      };
    }
  };

  const syncLocalStorageIngredients = async () => {
    try {
      // Get ingredients from localStorage
      const localIngredients = localStorage.getItem('selectedIngredients');
      if (!localIngredients) return; // No local ingredients to sync
      
      const ingredients = JSON.parse(localIngredients);
      if (!Array.isArray(ingredients) || ingredients.length === 0) return;
      
      // Get current server ingredients to avoid duplicates
      const serverIngredients = new Set(savedIngredients);
      
      // Filter out ingredients that are already on the server
      const ingredientsToSync = ingredients.filter(ingredient => !serverIngredients.has(ingredient));
      
      if (ingredientsToSync.length === 0) {
        console.log('All localStorage ingredients already exist on server');
        return;
      }
      
      console.log(`Syncing ${ingredientsToSync.length} ingredients from localStorage to server:`, ingredientsToSync);
      
      // Sync ingredients to server
      const result = await saveMultipleIngredients(ingredientsToSync);
      
      if (result.success) {
        console.log('Successfully synced localStorage ingredients to server');
        // Clear localStorage ingredients after successful sync
        localStorage.removeItem('selectedIngredients');
      } else {
        console.error('Failed to sync localStorage ingredients:', result.error);
      }
    } catch (error) {
      console.error('Error syncing localStorage ingredients:', error);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${baseUrl}/auth/login`, {
        username,
        password
      });
      const { token } = response.data;
      localStorage.setItem('token', token);
      await fetchUserProfile(token);
      await fetchSavedRecipes(token);
      await fetchSavedIngredients(token);
      
      // Auto-sync localStorage ingredients to server
      await syncLocalStorageIngredients();
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (username, password) => {
    try {
      await axios.post(`${baseUrl}/auth/register`, {
        username,
        password
      });
      
      // After successful registration, automatically log the user in
      const loginResult = await login(username, password);
      return loginResult;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedIngredients'); // Clear localStorage ingredients on logout
    setUser(null);
    setSavedRecipes([]);
    setSavedIngredients([]);
    setLogoutTrigger(prev => prev + 1); // Trigger re-render
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    savedRecipes,
    refreshSavedRecipes,
    savedIngredients,
    saveIngredient,
    removeIngredient,
    saveMultipleIngredients,
    logoutTrigger // Expose logout trigger for components that need to react to logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 