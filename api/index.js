const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase } = require('../backend/config/database');
const authRoutes = require('../backend/routes/auth');
const eventRoutes = require('../backend/routes/events');
const userRoutes = require('../backend/routes/users');
const promoRoutes = require('../backend/routes/promos');
const adminRoutes = require('../backend/routes/admin');

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
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));
app.use('/admin', express.static(path.join(__dirname, '../backend/public/admin')));
app.use(express.static(path.join(__dirname, '..'))); // Serve main IKOOT frontend from parent directory
app.use(express.static(path.join(__dirname, '../backend'))); // Serve files from backend directory

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin', adminRoutes);

// Add admin route aliases for events, users, promos
app.use('/api/admin/events', eventRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/promos', promoRoutes);

// Main website route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Admin panel route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/admin/index.html'));
});

// Camera test page route
app.get('/camera-test', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/camera-test.html'));
});

app.get('/camera-test.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/camera-test.html'));
});

// QR Debug page route
app.get('/qr-debug', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/qr-debug.html'));
});

app.get('/qr-debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/qr-debug.html'));
});

// QR Test Debug page route
app.get('/qr-test-debug', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/qr-test-debug.html'));
});

app.get('/qr-test-debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../backend/public/qr-test-debug.html'));
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
        const { getQuery } = require('../backend/config/database');
        
        const totalEvents = await getQuery('SELECT COUNT(*) as count FROM events');
        const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users WHERE role = "user"');
        const totalBookings = await getQuery('SELECT COUNT(*) as count FROM bookings').catch(() => ({ count: 0 }));
        const totalRevenue = await getQuery('SELECT COALESCE(SUM(price), 0) as total FROM events').catch(() => ({ total: 0 }));
        
        const recentEvents = await require('../backend/config/database').getAllQuery(`
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
        const { getQuery } = require('../backend/config/database');
        
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

// Test deployment endpoint (embedded)
app.all('/api/test-deployment', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Deployment test successful! 🎉',
        timestamp: new Date().toISOString(),
        method: req.method,
        environment: 'Vercel Serverless (Express)',
        node_version: process.version,
        available_modules: {
            fs: typeof require('fs') !== 'undefined',
            path: typeof require('path') !== 'undefined',
            crypto: typeof require('crypto') !== 'undefined'
        }
    });
});

// File-based event initialization endpoint (Vercel-compatible, embedded)
app.post('/api/init-events', async (req, res) => {
    try {
        const fs = require('fs').promises;
        
        // Event data to seed
        const eventData = [
            {
                id: 1,
                title: "Jakarta Music Festival 2024",
                location: "GBK Senayan, Jakarta",
                status: "live",
                qr_code: "IKOOT_EVENT:1"
            },
            {
                id: 2,
                title: "Tech Summit Jakarta",
                location: "Jakarta Convention Center",
                status: "live",
                qr_code: "IKOOT_EVENT:2"
            },
            {
                id: 3,
                title: "Food & Culture Festival",
                location: "Monas Park, Central Jakarta",
                status: "upcoming",
                qr_code: "IKOOT_EVENT:3"
            },
            {
                id: 4,
                title: "Sports & Wellness Expo",
                location: "Jakarta International Expo",
                status: "live",
                qr_code: "IKOOT_EVENT:4"
            },
            {
                id: 5,
                title: "Gaming Championship",
                location: "Senayan City Mall",
                status: "upcoming",
                qr_code: "IKOOT_EVENT:5"
            }
        ];
        
        // Store in /tmp for serverless
        await fs.writeFile('/tmp/events.json', JSON.stringify(eventData, null, 2));
        await fs.writeFile('/tmp/users.json', JSON.stringify([], null, 2));
        await fs.writeFile('/tmp/checkins.json', JSON.stringify([], null, 2));
        
        console.log('✅ Event data initialized in /tmp');
        
        res.status(200).json({
            success: true,
            message: 'Event data initialized successfully! 🎉',
            storage: 'File-based storage in /tmp (Vercel compatible)',
            events: eventData.map(event => ({
                id: event.id,
                title: event.title,
                status: event.status,
                qr_format: `IKOOT_EVENT:${event.id}`,
                location: event.location
            })),
            testInstructions: {
                qrCodes: eventData.map(event => ({
                    eventId: event.id,
                    title: event.title,
                    qrData: `IKOOT_EVENT:${event.id}`,
                    testUrl: `Generate QR code with data: IKOOT_EVENT:${event.id}`,
                    checkInUrl: `/api/events/${event.id}/checkin-v2`
                }))
            },
            nextSteps: [
                "1. Generate QR codes using the formats above",
                "2. Test QR scanner in the IKOOT app", 
                "3. Scan QR codes to test event check-in",
                "4. Verify loyalty points are awarded"
            ]
        });
        
    } catch (error) {
        console.error('❌ Init events error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize event data',
            error: error.message
        });
    }
});

// File-based event check-in endpoint (Vercel-compatible, embedded)
app.post('/api/events/:id/checkin-v2', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const bcrypt = require('bcryptjs');
        const eventId = parseInt(req.params.id);
        const { user_email } = req.body;

        console.log(`🎯 Check-in attempt: Event ${eventId}, User: ${user_email}`);
        
        if (!user_email) {
            return res.status(400).json({
                success: false,
                message: 'User email is required'
            });
        }
        
        // Read events data
        let events, users, checkins;
        try {
            events = JSON.parse(await fs.readFile('/tmp/events.json', 'utf8'));
            users = JSON.parse(await fs.readFile('/tmp/users.json', 'utf8'));
            checkins = JSON.parse(await fs.readFile('/tmp/checkins.json', 'utf8'));
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Event data not initialized. Please call /api/init-events first.'
            });
        }
        
        // Find the event
        const event = events.find(e => e.id === eventId);
        if (!event) {
            console.log(`❌ Event ${eventId} not found`);
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        console.log(`✅ Found event: ${event.title}`);
        
        // Find or create user
        let user = users.find(u => u.email === user_email);
        if (!user) {
            const hashedPassword = await bcrypt.hash('temp123', 10);
            user = {
                id: users.length + 1,
                name: user_email.split('@')[0],
                email: user_email,
                password: hashedPassword,
                role: 'user',
                points: 0,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            users.push(user);
            await fs.writeFile('/tmp/users.json', JSON.stringify(users, null, 2));
            console.log(`✅ Created new user: ${user_email}`);
        }
        
        // Check if user already checked in to this event
        if (checkins.some(c => c.user_id === user.id && c.event_id === eventId)) {
            console.log(`⚠️ User ${user.email} already checked in to event ${eventId}`);
            return res.status(400).json({
                success: false,
                message: 'You have already checked in to this event',
                user_points: user.points
            });
        }
        
        // Award points (5 points per event check-in)
        const pointsEarned = 5;
        
        // Create check-in record
        const checkIn = {
            id: checkins.length + 1,
            user_id: user.id,
            event_id: eventId,
            event_title: event.title,
            points_earned: pointsEarned,
            checked_in_at: new Date().toISOString()
        };
        
        checkins.push(checkIn);
        await fs.writeFile('/tmp/checkins.json', JSON.stringify(checkins, null, 2));
        
        // Update user points
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex].points = (users[userIndex].points || 0) + pointsEarned;
        users[userIndex].updated_at = new Date().toISOString();
        await fs.writeFile('/tmp/users.json', JSON.stringify(users, null, 2));
        
        const updatedUser = users[userIndex];
        
        console.log(`🎉 Check-in successful: ${user.email} got ${pointsEarned} points for ${event.title}`);
        
        res.json({
            success: true,
            message: `Check-in successful! You earned ${pointsEarned} points!`,
            points_earned: pointsEarned,
            total_points: updatedUser.points,
            event: {
                id: event.id,
                title: event.title,
                location: event.location
            },
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                points: updatedUser.points
            },
            storage_info: {
                method: 'File-based storage (/tmp)',
                vercel_compatible: true
            }
        });
        
    } catch (error) {
        console.error('❌ Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message
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

// Initialize database for Vercel
(async function initializeForVercel() {
    try {
        await initDatabase();
        console.log('✅ Database initialized for Vercel');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
    }
})();

// Export for Vercel serverless function
module.exports = app;
