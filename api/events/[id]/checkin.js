// Vercel serverless function for event check-in API
let db;
let runQuery, getAllQuery, getQuery;

// Initialize database connection for Vercel
function initVercelDatabase() {
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    
    return new Promise((resolve, reject) => {
        try {
            // In Vercel, the database file should be in /tmp for persistence across requests
            const dbPath = process.env.VERCEL ? '/tmp/ikoot.db' : path.join(process.cwd(), 'backend', 'database.db');
            db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    reject(err);
                    return;
                }
                
                console.log('Connected to SQLite database at:', dbPath);
                
                // Helper functions
                runQuery = function(sql, params = []) {
                    return new Promise((resolve, reject) => {
                        db.run(sql, params, function(err) {
                            if (err) {
                                reject(err);
                            } else {
                                resolve({ id: this.lastID, changes: this.changes });
                            }
                        });
                    });
                };
                
                getAllQuery = function(sql, params = []) {
                    return new Promise((resolve, reject) => {
                        db.all(sql, params, (err, rows) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(rows);
                            }
                        });
                    });
                };
                
                getQuery = function(sql, params = []) {
                    return new Promise((resolve, reject) => {
                        db.get(sql, params, (err, row) => {
                            if (err) {
                                reject(err);
                            } else {
                                resolve(row);
                            }
                        });
                    });
                };
                
                resolve();
            });
        } catch (error) {
            console.error('Database initialization error:', error);
            reject(error);
        }
    });
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Use POST for check-in.'
        });
    }
    
    try {
        // Get event ID from URL parameter
        const eventId = parseInt(req.query.id);
        const { user_id, user_email } = req.body;

        console.log(`Check-in attempt: Event ${eventId}, User: ${user_email || user_id}`);
        
        // Initialize database
        await initVercelDatabase();

        // Find the event
        const event = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Find or create user
        let user = await getQuery('SELECT * FROM users WHERE id = ? OR email = ?', [user_id, user_email]);
        if (!user && user_email) {
            // Create new user if not exists
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('temp123', 10);
            
            const result = await runQuery(`
                INSERT INTO users (name, email, password, role, points, status)
                VALUES (?, ?, ?, 'user', 0, 'active')
            `, [user_email.split('@')[0], user_email, hashedPassword]);
            
            user = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
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
            user: updatedUser
        });

    } catch (error) {
        console.error('Check-in error:', error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message
        });
    }
};