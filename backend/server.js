const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const userRoutes = require('./routes/users');
const promoRoutes = require('./routes/promos');
const adminRoutes = require('./routes/admin');
const redemptionRoutes = require('./routes/redemptions');

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting (more lenient for development)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for dev)
    message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(limiter);
app.use(helmet({
    contentSecurityPolicy: false, // Disable for development
    crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));
app.use(express.static(path.join(__dirname, '..'))); // Serve main IKOOT frontend from parent directory
app.use(express.static(__dirname)); // Serve files from backend directory

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/redemptions', redemptionRoutes);

// Add admin route aliases for events, users, promos
app.use('/api/admin/events', eventRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/promos', promoRoutes);
app.use('/api/admin/redemptions', redemptionRoutes);

// Main website route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin/index.html'));
});

// Camera test page route
app.get('/camera-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/camera-test.html'));
});

app.get('/camera-test.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/camera-test.html'));
});

// QR Debug page route
app.get('/qr-debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/qr-debug.html'));
});

app.get('/qr-debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/qr-debug.html'));
});

// QR Test Debug page route
app.get('/qr-test-debug', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/qr-test-debug.html'));
});

app.get('/qr-test-debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/qr-test-debug.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Admin stats endpoint
app.get('/api/admin/stats', async (req, res) => {
    try {
        const { getQuery } = require('./config/database');
        
        const totalEvents = await getQuery('SELECT COUNT(*) as count FROM events');
        const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const totalBookings = await getQuery('SELECT COUNT(*) as count FROM bookings').catch(() => ({ count: 0 }));
        const totalRevenue = await getQuery('SELECT COALESCE(SUM(price), 0) as total FROM events').catch(() => ({ total: 0 }));
        
        const recentEvents = await require('./config/database').getAllQuery(`
            SELECT id, title, location, start_date, status 
            FROM events 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        res.json({
            success: true,
            stats: {
                totalEvents: totalEvents.count,
                totalUsers: totalUsers.count,
                totalBookings: totalBookings.count,
                totalRevenue: totalRevenue.total
            },
            recentEvents: recentEvents || [],
            recentBookings: [] // Placeholder
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get admin stats'
        });
    }
});

// User profile endpoint for loyalty system
app.get('/api/user/profile', async (req, res) => {
    try {
        const userEmail = req.headers['x-user-email'] || 'admin@ikoot.com';
        const { getQuery } = require('./config/database');
        
        const user = await getQuery('SELECT id, name, email, points FROM users WHERE email = ?', [userEmail]);
        
        if (user) {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    points: user.points || 0
                }
            });
        } else {
            res.json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('User profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile'
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// Initialize database and start server
async function startServer() {
    try {
        await initDatabase();
        console.log('✅ Database initialized successfully');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 API available at http://localhost:${PORT}/api`);
            console.log(`⚡ Admin panel at http://localhost:${PORT}/admin`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();