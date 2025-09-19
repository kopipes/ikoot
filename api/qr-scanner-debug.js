// Enhanced QR Scanner Debug API for Vercel
const QRCode = require('qrcode');
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

// Generate test QR code
async function generateTestQRCode(eventId) {
    try {
        const qrData = `IKOOT_EVENT:${eventId}`;
        console.log(`Generating TEST QR with data: ${qrData}`);
        const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            type: 'image/png',
            width: 300,
            margin: 2,
            color: {
                dark: '#2E7D32',  // Green for events
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'M'
        });
        return qrCodeDataUrl;
    } catch (error) {
        console.error('Error generating test QR code:', error);
        return null;
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
        console.log('🔍 QR Scanner Debug API called');
        
        // Initialize database
        const dbInitialized = initVercelDatabase();
        if (!dbInitialized) {
            return res.status(500).json({
                success: false,
                message: 'Database initialization failed'
            });
        }
        
        const action = req.query.action || 'status';
        
        if (action === 'seed-minimal') {
            // Create minimal test events
            console.log('🌱 Creating minimal test events...');
            
            // Clear existing
            await runQuery('DELETE FROM user_check_ins');
            await runQuery('DELETE FROM events WHERE id <= 5');
            
            const testEvents = [
                {
                    title: 'QR Test Event 1',
                    description: 'Test event for QR scanning',
                    short_description: 'QR Test 1',
                    start_date: '2024-04-15T18:00:00.000Z',
                    end_date: '2024-04-15T22:00:00.000Z',
                    location: 'Test Location 1',
                    venue_details: 'Test Venue',
                    price: 50000,
                    max_capacity: 100,
                    category: 'Test',
                    status: 'live',
                    featured: 1,
                    image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                },
                {
                    title: 'QR Test Event 2',
                    description: 'Second test event for QR scanning',
                    short_description: 'QR Test 2',
                    start_date: '2024-04-16T18:00:00.000Z',
                    end_date: '2024-04-16T22:00:00.000Z',
                    location: 'Test Location 2',
                    venue_details: 'Test Venue',
                    price: 75000,
                    max_capacity: 150,
                    category: 'Test',
                    status: 'live',
                    featured: 1,
                    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                }
            ];
            
            const createdEvents = [];
            
            for (const event of testEvents) {
                const result = await runQuery(`
                    INSERT INTO events (
                        title, description, short_description, start_date, end_date,
                        location, venue_details, price, max_capacity, category,
                        status, featured, image_url, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
                `, [
                    event.title, event.description, event.short_description, 
                    event.start_date, event.end_date, event.location, event.venue_details,
                    event.price, event.max_capacity, event.category,
                    event.status, event.featured, event.image_url
                ]);

                const eventId = result.id;
                console.log(`📅 Created event ${eventId}: ${event.title}`);
                
                // Generate QR code
                const qrCode = await generateTestQRCode(eventId);
                if (qrCode) {
                    await runQuery('UPDATE events SET qr_code = ? WHERE id = ?', [qrCode, eventId]);
                    console.log(`✅ Event ${eventId} QR code generated`);
                }
                
                createdEvents.push({
                    id: eventId,
                    title: event.title,
                    qr_format: `IKOOT_EVENT:${eventId}`,
                    test_url: `Generate QR with: IKOOT_EVENT:${eventId}`
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Minimal test events created',
                events: createdEvents,
                instructions: {
                    step1: 'Generate QR codes using provided formats',
                    step2: 'Test QR scanner in IKOOT app',
                    step3: 'Check for immediate detection (not 3-second delay)',
                    step4: 'Verify check-in awards points'
                }
            });
        }
        
        if (action === 'test-checkin') {
            // Test check-in directly
            const eventId = parseInt(req.query.eventId || '1');
            const userEmail = req.query.userEmail || 'qrtest@example.com';
            
            console.log(`🎯 Testing check-in: Event ${eventId}, User: ${userEmail}`);
            
            // Check if event exists
            const event = await getQuery('SELECT * FROM events WHERE id = ?', [eventId]);
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: `Event ${eventId} not found`,
                    suggestion: 'Run ?action=seed-minimal first'
                });
            }
            
            // Find or create user
            let user = await getQuery('SELECT * FROM users WHERE email = ?', [userEmail]);
            if (!user) {
                const bcrypt = require('bcryptjs');
                const hashedPassword = await bcrypt.hash('test123', 10);
                
                const result = await runQuery(`
                    INSERT INTO users (name, email, password, role, points, status)
                    VALUES (?, ?, ?, 'user', 0, 'active')
                `, [userEmail.split('@')[0], userEmail, hashedPassword]);
                
                user = await getQuery('SELECT * FROM users WHERE id = ?', [result.id]);
                console.log(`👤 Created user: ${user.email}`);
            }
            
            // Check existing check-in
            const existingCheckIn = await getQuery(`
                SELECT id FROM user_check_ins WHERE user_id = ? AND event_id = ?
            `, [user.id, eventId]);
            
            if (existingCheckIn) {
                return res.status(400).json({
                    success: false,
                    message: 'Already checked in to this event',
                    user_points: user.points
                });
            }
            
            // Perform check-in
            const pointsEarned = 5;
            await runQuery(`
                INSERT INTO user_check_ins (user_id, event_id, event_title, points_earned)
                VALUES (?, ?, ?, ?)
            `, [user.id, eventId, event.title, pointsEarned]);
            
            await runQuery('UPDATE users SET points = points + ? WHERE id = ?', [pointsEarned, user.id]);
            
            const updatedUser = await getQuery('SELECT * FROM users WHERE id = ?', [user.id]);
            
            return res.status(200).json({
                success: true,
                message: 'Check-in successful!',
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
                }
            });
        }
        
        // Default: Show status
        const events = await getAllQuery('SELECT id, title, qr_code FROM events ORDER BY id LIMIT 10');
        const users = await getAllQuery('SELECT id, name, email, points FROM users ORDER BY id LIMIT 5');
        const checkins = await getAllQuery('SELECT * FROM user_check_ins ORDER BY id DESC LIMIT 5');
        
        // Generate test QR codes for existing events
        const testQRCodes = [];
        for (const event of events.slice(0, 3)) {
            testQRCodes.push({
                eventId: event.id,
                title: event.title,
                qr_data: `IKOOT_EVENT:${event.id}`,
                has_stored_qr: !!event.qr_code,
                online_generator: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=IKOOT_EVENT%3A${event.id}`
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'QR Scanner Debug Status',
            database: {
                events_count: events.length,
                users_count: users.length,
                checkins_count: checkins.length
            },
            events: events.map(e => ({
                id: e.id,
                title: e.title,
                has_qr: !!e.qr_code
            })),
            test_qr_codes: testQRCodes,
            recent_checkins: checkins,
            actions: {
                seed_minimal: '?action=seed-minimal',
                test_checkin: '?action=test-checkin&eventId=1&userEmail=test@example.com',
                status: '?action=status'
            },
            testing_instructions: [
                '1. Use action=seed-minimal to create test events',
                '2. Generate QR codes using provided online generators',
                '3. Test QR scanner in IKOOT app',
                '4. Use action=test-checkin to verify API works',
                '5. Check for real QR detection (immediate, not delayed)'
            ]
        });
        
    } catch (error) {
        console.error('QR Scanner Debug error:', error);
        res.status(500).json({
            success: false,
            message: 'QR Scanner Debug failed',
            error: error.message
        });
    }
};