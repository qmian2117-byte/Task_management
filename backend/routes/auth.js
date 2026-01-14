const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('../config/passport');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

// Validation rules for registration
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Validation rules for login
const loginValidation = [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', registerValidation, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        // Check if username already exists
        const existingUser = await db('users')
            .where({ username })
            .orWhere({ email })
            .first();

        if (existingUser) {
            return res.status(400).json({
                error: 'Username or email already exists'
            });
        }

        // Hash the password
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const [userId] = await db('users').insert({
            username,
            email,
            password_hash
        });

        // Get the created user (without password)
        const newUser = await db('users')
            .where({ id: userId })
            .select('id', 'username', 'email', 'created_at')
            .first();

        // Auto-login after registration
        req.login(newUser, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Registration successful but login failed' });
            }
            res.status(201).json({
                message: 'Registration successful',
                user: newUser
            });
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
router.post('/login', loginValidation, (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ error: 'Server error during login' });
        }

        if (!user) {
            return res.status(401).json({ error: info.message || 'Invalid credentials' });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Login failed' });
            }

            res.json({
                message: 'Login successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });
        });
    })(req, res, next);
});

// Logout user
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Session destruction failed' });
            }
            res.json({ message: 'Logout successful' });
        });
    });
});

// Get current user info
router.get('/me', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

module.exports = router;
