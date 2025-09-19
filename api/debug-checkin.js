// Debug API to test check-in functionality on Vercel
let db;
let runQuery, getAllQuery, getQuery;

// Initialize database connection for Vercel
function initVercelDatabase() {
    const Database = require('better-sqlite3');
    const path = require('path');
    
    try {
        // In Vercel, the database file should be in /tmp for persistence across requests
        const dbPath = process.env.VERCEL ? '/tmp/ikoot.db' : path.join(process.cwd(), 'backend', 'database.db');
        db = new Database(dbPath);
        
        console.log('Connected to SQLite database at:', dbPath);
        
        // Helper functions
        runQuery = function(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    const stmt = db.prepare(sql);
                    const result = stmt.run(...params);
                    resolve({ id: result.lastInsertRowid, changes: result.changes });
                } catch (err) {
                    reject(err);
                }
            });
        };
        
        getAllQuery = function(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    const stmt = db.prepare(sql);
                    const rows = stmt.all(...params);
                    resolve(rows);
                } catch (err) {
                    reject(err);
                }
            });
        };
        
        getQuery = function(sql, params = []) {
            return new Promise((resolve, reject) => {
                try {
                    const stmt = db.prepare(sql);
                    const row = stmt.get(...params);
                    resolve(row);
                } catch (err) {
                    reject(err);
                }
            });
        };
        
        return true;
    } catch (error) {
        console.error('Database initialization error:', error);
        return false;
    }
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('🔍 Debug Check-in API called');
        console.log('Method:', req.method);
        console.log('Query:', req.query);
        console.log('Body:', req.body);
        
        // Initialize database
        const dbInitialized = initVercelDatabase();
        if (!dbInitialized) {
            return res.status(500).json({
                success: false,
                message: 'Database initialization failed',
                error: 'Cannot connect to database'
            });
        }
        
        if (req.method === 'GET') {
            // GET: Debug information
            const eventId = req.query.eventId || '1';
            const userEmail = req.query.userEmail || 'test@example.com';
            
            console.log(`🔍 Debugging check-in for Event ${eventId}, User: ${userEmail}`);
            
            // Check if event exists
            const event = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);
            console.log('Event found:', event ? 'Yes' : 'No');
            
            // Check if user exists
            const user = await getQuery('SELECT * FROM users WHERE email = ?', [userEmail]);
            console.log('User found:', user ? 'Yes' : 'No');
            
            // Check existing check-ins
            const existingCheckins = await getAllQuery(`
                SELECT * FROM user_check_ins WHERE user_id = ? OR event_id = ?
            `, [user?.id || 0, eventId]);
            
            // Get all tables
            const tables = await getAllQuery(`
                SELECT name FROM sqlite_master WHERE type='table'
            `);
            
            return res.status(200).json({
                success: true,
                debug: {
                    eventId,
                    userEmail,
                    event: event ? { id: event.id, title: event.title } : null,
                    user: user ? { id: user.id, name: user.name, email: user.email, points: user.points } : null,
                    existingCheckins: existingCheckins.length,
                    tables: tables.map(t => t.name),
                    timestamp: new Date().toISOString()
                },
                testUrls: {
                    performCheckin: `/api/debug-checkin?action=checkin&eventId=${eventId}&userEmail=${userEmail}`,
                    createUser: `/api/debug-checkin?action=createuser&userEmail=${userEmail}`
                }
            });
        }
        
        if (req.method === 'POST' || req.query.action) {
            // POST or action query: Perform actual check-in or other actions
            const action = req.query.action || 'checkin';
            const eventId = parseInt(req.query.eventId || req.body?.eventId || '1');
            const userEmail = req.query.userEmail || req.body?.user_email || 'test@example.com';
            
            console.log(`🎯 Action: ${action}, Event: ${eventId}, User: ${userEmail}`);
            
            if (action === 'createuser') {
                // Create test user
                try {
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = await bcrypt.hash('test123', 10);
                    
                    const result = await runQuery(`
                        INSERT OR IGNORE INTO users (name, email, password, role, points, status)
                        VALUES (?, ?, ?, 'user', 0, 'active')
                    `, [userEmail.split('@')[0], userEmail, hashedPassword]);
                    
                    return res.status(200).json({
                        success: true,
                        message: 'Test user created',
                        userId: result.id,
                        userEmail
                    });
                } catch (error) {
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to create user',
                        error: error.message
                    });
                }
            }
            
            if (action === 'checkin') {
                // Perform check-in
                console.log(`Check-in attempt: Event ${eventId}, User: ${userEmail}`);
                
                // Find the event
                const event = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);
                if (!event) {
                    return res.status(404).json({
                        success: false,
                        message: 'Event not found',
                        eventId
                    });
                }
                
                // Find or create user
                let user = await getQuery('SELECT * FROM users WHERE email = ?', [userEmail]);
                if (!user) {
                    // Create new user if not exists
                    const bcrypt = require('bcryptjs');
                    const hashedPassword = await bcrypt.hash('temp123', 10);
                    
                    const result = await runQuery(`
                        INSERT INTO users (name, email, password, role, points, status)
                        VALUES (?, ?, ?, 'user', 0, 'active')
                    `, [userEmail.split('@')[0], userEmail, hashedPassword]);
                    
                    user = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
                    console.log('Created new user:', user.id);
                }
                
                if (!user) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid user information'
                    });
                }
                
                // Check if user already checked in to this event
                const existingCheckIn = await getQuery(`
                    SELECT id FROM user_check_ins WHERE user_id = ? AND event_id = ?
                `, [user.id, eventId]);
                
                if (existingCheckIn) {
                    return res.status(400).json({
                        success: false,
                        message: 'You have already checked in to this event',
                        user_points: user.points
                    });
                }
                
                // Award points (5 points per event check-in)
                const pointsEarned = 5;
                
                // Add check-in record
                await runQuery(`
                    INSERT INTO user_check_ins (user_id, event_id, event_title, points_earned)
                    VALUES (?, ?, ?, ?)
                `, [user.id, eventId, event.title, pointsEarned]);
                
                // Update user points
                await runQuery('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, user.id]);
                
                // Get updated user
                const updatedUser = await getQuery('SELECT id, name, email, points FROM users WHERE id = ?', [user.id]);
                
                console.log(`Check-in successful: ${user.email} got ${pointsEarned} points for ${event.title}`);
                
                return res.status(200).json({
                    success: true,
                    message: `Check-in successful! You earned ${pointsEarned} points!`,
                    points_earned: pointsEarned,
                    total_points: updatedUser.points,
                    event: {
                        id: event.id,
                        title: event.title,
                        location: event.location
                    },
                    user: updatedUser
                });
            }
        }
        
        return res.status(400).json({
            success: false,
            message: 'Invalid request. Use GET for debug info or POST for check-in'
        });
        
    } catch (error) {
        console.error('Debug API error:', error);
        res.status(500).json({
            success: false,
            message: 'Debug API failed',
            error: error.message,
            stack: error.stack
        });
    }
};