import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
      fetchSavedRecipes(token);
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

  const refreshSavedRecipes = () => {
    const token = localStorage.getItem('token');
    if (token) fetchSavedRecipes(token);
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
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSavedRecipes([]);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    savedRecipes,
    refreshSavedRecipes
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