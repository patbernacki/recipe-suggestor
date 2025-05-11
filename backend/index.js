const express = require('express');
const dotenv = require('dotenv');
const knex = require('./db'); // using knex, not mysql2 pool

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());

// Import Routes
const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
app.use('/auth', authRouter); // All auth-related routes will now be under /auth
app.use('/recipes', recipesRouter); // Ensure this is included

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
