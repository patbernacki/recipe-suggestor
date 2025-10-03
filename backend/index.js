const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const knex = require('./db');
const knexConfig = require('./knexfile');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// Run migrations on startup
knex.migrate.latest()
  .then(() => {
    console.log('Migrations completed');
  })
  .catch(err => {
    console.error('Migration error:', err);
  });

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://recipe-suggestor-chi.vercel.app'  // Update with your actual Vercel URL
  ],
  credentials: true
}));

// Middleware
app.use(express.json());

// Import Routes
const authRouter = require('./routes/auth');
const recipesRouter = require('./routes/recipes');
const ingredientRoutes = require('./routes/ingredients');
app.use('/auth', authRouter);
app.use('/recipes', recipesRouter);
app.use('/ingredients', ingredientRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});