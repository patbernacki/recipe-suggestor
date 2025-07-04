import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RecipeDetails from './pages/RecipeDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import SavedRecipes from './pages/SavedRecipes';

function App() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {!isAuthPage && <Navbar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/saved-recipes" element={<SavedRecipes />} />
          <Route path="/recipes/:id" element={<RecipeDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
