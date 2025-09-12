const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const knex = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await knex('users').where({ username }).first();

    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await knex('users').insert({
      username,
      password: hashedPassword,
    });

    res.status(201).json({ message: 'User registered' });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await knex('users').where({ username }).first();

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).send('Server error');
  }
});

// Profile Route
router.get('/profile', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const user = await knex('users').where({ id: userId }).first();
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
