const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { runQuery, getQuery } = require('../config/database');

const router = express.Router();

// JWT Secret (in production, this should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Register endpoint
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await getQuery('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await runQuery(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.id, email: email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: result.id,
                name,
                email
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Login endpoint
router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user
        const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await getQuery('SELECT id, name, email, role, avatar_url, phone, created_at FROM users WHERE id = ?', [decoded.userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Simple login endpoint for development (supports both hashed and plain passwords)
router.post('/simple-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('Simple login attempt:', { email, password: '***' });
        
        // Find user in database
        const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
        
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Try bcrypt comparison first, then fallback to plain text comparison
        let isPasswordValid = false;
        console.log('Checking password for user:', user.email);
        console.log('Stored password starts with:', user.password.substring(0, 10));
        
        try {
            // First check if password is likely hashed (starts with $2a, $2b, etc.)
            if (user.password.startsWith('$2')) {
                isPasswordValid = await bcrypt.compare(password, user.password);
                console.log('Bcrypt comparison result:', isPasswordValid);
            } else {
                console.log('Using plain text comparison');
                isPasswordValid = (password === user.password);
                console.log('Plain text comparison result:', isPasswordValid);
            }
        } catch (error) {
            console.log('Bcrypt failed, trying plain text comparison as fallback');
            // If bcrypt fails, try plain text comparison (for development)
            isPasswordValid = (password === user.password);
            console.log('Fallback plain text comparison result:', isPasswordValid);
        }
        
        if (!isPasswordValid) {
            console.log('Password invalid for:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Generate mock token for development
        const token = `mock-jwt-token-${user.id}`;
        
        console.log('Login successful for:', email);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                points: user.points || 0
            }
        });
        
    } catch (error) {
        console.error('Simple login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Simple auth verification for development
router.get('/simple-me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token || !token.startsWith('mock-jwt-token')) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or missing token'
            });
        }
        
        // Extract user ID from mock token
        const userId = token.replace('mock-jwt-token-', '');
        
        const user = await getQuery('SELECT id, name, email, role, points FROM users WHERE id = ?', [userId]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user
        });
        
    } catch (error) {
        console.error('Simple auth me error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
