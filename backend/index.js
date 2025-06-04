const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();

app.use(cors());

// Middleware
app.use(express.json());

// Import Routes
const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
const ingredientRoutes = require('./routes/ingredients');
app.use('/auth', authRouter); // All auth-related routes will now be under /auth
app.use('/recipes', recipesRouter); // Ensure this is included
app.use('/ingredients', ingredientRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
